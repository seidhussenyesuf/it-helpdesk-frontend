import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';

const ManageTicket = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [teams, setTeams] = useState([]);
  const [seniorOfficers, setSeniorOfficers] = useState([]);
  const [formData, setFormData] = useState({
    status: '',
    new_team_id: '',
    assigned_to: '',
    comment_text: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, theme } = useContext(UserContext);

  useEffect(() => {
    fetchTicketData();
    fetchTeams();
    fetchSeniorOfficers();
  }, [ticketId]);

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const ticketRes = await axiosInstance.get(`/api/tickets/${ticketId}`);
      
      if (ticketRes.data.success) {
        const ticketData = ticketRes.data.ticket;
        setTicket(ticketData);
        setFormData(prev => ({
          ...prev,
          status: ticketData.status,
          new_team_id: ticketData.team_id || '',
          assigned_to: ticketData.assigned_to || ''
        }));
        
        // Fetch comments
        try {
          const commentsRes = await axiosInstance.get(`/api/tickets/${ticketId}/comments`);
          if (commentsRes.data.success) {
            setComments(commentsRes.data.comments || []);
          }
        } catch (commentError) {
          console.error('Fetch comments error:', commentError);
          setComments([]);
        }

        // Fetch logs
        try {
          const logsRes = await axiosInstance.get(`/api/tickets/${ticketId}/logs`);
          if (logsRes.data.success) {
            setLogs(logsRes.data.logs || []);
          }
        } catch (logError) {
          console.error('Fetch logs error:', logError);
          setLogs([]);
        }
      } else {
        setError('Failed to fetch ticket details');
      }
    } catch (error) {
      console.error('Fetch ticket data error:', error);
      
      if (error.response?.status === 403) {
        setError();
      } else if (error.response?.status === 404) {
        setError('Ticket not found');
      } else if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Failed to fetch ticket data: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axiosInstance.get('/api/teams');
      if (response.data.success) {
        setTeams(response.data.teams);
      }
    } catch (error) {
      console.error('Fetch teams error:', error);
    }
  };

  const fetchSeniorOfficers = async () => {
    try {
      const response = await axiosInstance.get('/api/senior-officers');
      if (response.data.success) {
        setSeniorOfficers(response.data.senior_officers);
      }
    } catch (error) {
      console.error('Fetch senior officers error:', error);
    }
  };

  const getSeniorOfficersForTeam = (teamId) => {
    return seniorOfficers.filter(officer => officer.team_id === parseInt(teamId));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear assigned_to when team changes
    if (name === 'new_team_id') {
      setFormData(prev => ({
        ...prev,
        assigned_to: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSubmitting(true);

    // Validate comment is provided
    if (!formData.comment_text.trim()) {
      setError('Please add a comment explaining the changes');
      setSubmitting(false);
      return;
    }

    try {
      // Check if there are actual changes
      const statusChanged = formData.status !== ticket.status;
      const teamChanged = formData.new_team_id !== (ticket.team_id ? ticket.team_id.toString() : '');
      const officerChanged = formData.assigned_to !== (ticket.assigned_to ? ticket.assigned_to.toString() : '');

      console.log('Changes detected:', { statusChanged, teamChanged, officerChanged });
      console.log('Current values:', { 
        status: formData.status, 
        new_team_id: formData.new_team_id, 
        assigned_to: formData.assigned_to,
        comment: formData.comment_text 
      });

      // Always send the update with the comment
      const updateData = {
        comment_text: formData.comment_text
      };

      if (statusChanged) {
        updateData.status = formData.status;
      }

      if (teamChanged) {
        updateData.new_team_id = formData.new_team_id;
      }

      if (officerChanged) {
        updateData.assigned_to = formData.assigned_to;
      }

      console.log('Sending update data:', updateData);

      // Send the update request (comment will be saved server-side)
      const response = await axiosInstance.put(`/api/tickets/${ticketId}`, updateData);

      if (response.data.success) {
        // Build success message
        let message = '';
        
        if (teamChanged && officerChanged) {
          const newTeam = teams.find(t => t.team_id === parseInt(formData.new_team_id));
          const newOfficer = seniorOfficers.find(o => o.user_id === parseInt(formData.assigned_to));
          if (newTeam && newOfficer) {
            message = `✅ Ticket reassigned to ${newTeam.team_name} and assigned to ${newOfficer.name}!`;
          } else if (newTeam) {
            message = `✅ Ticket reassigned to ${newTeam.team_name}!`;
          } else {
            message = '✅ Ticket updated successfully!';
          }
        } else if (teamChanged) {
          const newTeam = teams.find(t => t.team_id === parseInt(formData.new_team_id));
          if (newTeam) {
            message = `✅ Ticket reassigned to ${newTeam.team_name}!`;
          } else {
            message = '✅ Ticket team changed!';
          }
        } else if (officerChanged) {
          const newOfficer = seniorOfficers.find(o => o.user_id === parseInt(formData.assigned_to));
          if (newOfficer) {
            message = `✅ Ticket assigned to ${newOfficer.name}!`;
          } else {
            message = '✅ Ticket assignment updated!';
          }
        } else if (statusChanged) {
          message = `✅ Ticket status updated to ${formData.status}!`;
        } else {
          message = '✅ Comment added successfully!';
        }

        setSuccessMessage(message);
        
        // Clear comment field after successful submission
        setFormData(prev => ({ ...prev, comment_text: '' }));
        
        // Refresh ticket data to show new comment and updates
        await fetchTicketData();
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(response.data.message || 'Failed to update ticket');
      }
    } catch (error) {
      console.error('Update error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to update ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    
    try {
      setSubmitting(true);
      const response = await axiosInstance.put(`/api/tickets/${ticketId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        setSuccessMessage(`✅ Ticket status updated to ${newStatus}!`);
        await fetchTicketData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to update status: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Status update error:', error);
      setError('Failed to update status: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTicket = async () => {
    if (window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      try {
        setSubmitting(true);
        const response = await axiosInstance.delete(`/api/tickets/${ticketId}`);
        if (response.data.success) {
          setSuccessMessage('Ticket deleted successfully');
          setTimeout(() => {
            if (user.role === 'admin' || user.role === 'senior') {
              navigate('/senior-dashboard');
            } else {
              navigate('/user-dashboard');
            }
          }, 1500);
        } else {
          setError('Failed to delete ticket: ' + (response.data.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Delete error:', error);
        setError('Failed to delete ticket: ' + (error.response?.data?.message || error.message));
      } finally {
        setSubmitting(false);
      }
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High': return 'bg-danger';
      case 'Medium': return 'bg-warning text-dark';
      case 'Low': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Open': return 'bg-primary';
      case 'In Progress': return 'bg-warning text-dark';
      case 'Resolved': return 'bg-success';
      case 'Queued': return 'bg-secondary';
      case 'Closed': return 'bg-dark';
      default: return 'bg-secondary';
    }
  };

  const getTeamName = (teamId) => {
    if (!teamId) return 'Unassigned';
    const team = teams.find(t => t.team_id === parseInt(teamId));
    return team ? team.team_name : `Team ${teamId}`;
  };

  const getOfficerName = (officerId) => {
    if (!officerId) return 'Not assigned';
    const officer = seniorOfficers.find(o => o.user_id === parseInt(officerId));
    return officer ? officer.name : `Officer ${officerId}`;
  };

  if (loading && !ticket) {
    return (
      <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
        <div className="container mt-5 flex-grow-1">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading ticket data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
        <div className="container mt-5 flex-grow-1">
          <div className="alert alert-danger">
            <h4>Error Loading Ticket</h4>
            <p>{error}</p>
            <Link
              to={user?.role === 'admin' || user?.role === 'senior' ? '/senior-dashboard' : '/user-dashboard'}
              className="btn btn-secondary"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
        <div className="container mt-5 flex-grow-1">
          <div className="alert alert-danger">
            <h4>Ticket Not Found</h4>
            <p>The requested ticket could not be found.</p>
            <Link to={user.role === 'admin' || user.role === 'senior' ? '/senior-dashboard' : '/user-dashboard'} className="btn btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <style>
        {`
          .card {
            background-color: ${theme === 'dark' ? '#1a202c' : '#fff'};
            color: ${theme === 'dark' ? '#e2e8f0' : '#000'};
            border-color: ${theme === 'dark' ? '#2d3748' : '#dee2e6'};
          }
          .form-control, .form-select {
            background-color: ${theme === 'dark' ? '#2d3748' : '#fff'};
            color: ${theme === 'dark' ? '#e2e8f0' : '#000'};
            border-color: ${theme === 'dark' ? '#4a5568' : '#ced4da'};
          }
          .form-control:focus, .form-select:focus {
            background-color: ${theme === 'dark' ? '#2d3748' : '#fff'};
            color: ${theme === 'dark' ? '#e2e8f0' : '#000'};
            border-color: #667eea;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
          }
          .form-label {
            color: ${theme === 'dark' ? '#e2e8f0' : '#000'};
            font-weight: 500;
          }
          .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
          }
          .btn-primary:hover {
            background: linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%);
            transform: translateY(-1px);
          }
          .btn-primary:disabled {
            background: ${theme === 'dark' ? '#4a5568' : '#6c757d'};
          }
          .alert {
            border: 1px solid ${theme === 'dark' ? '#2d3748' : '#dee2e6'};
          }
          .alert-success {
            background-color: ${theme === 'dark' ? '#22543d' : '#d4edda'};
            color: ${theme === 'dark' ? '#9ae6b4' : '#155724'};
          }
          .alert-danger {
            background-color: ${theme === 'dark' ? '#742a2a' : '#f8d7da'};
            color: ${theme === 'dark' ? '#feb2b2' : '#721c24'};
          }
          .list-group-item {
            background-color: ${theme === 'dark' ? '#2d3748' : '#fff'};
            color: ${theme === 'dark' ? '#e2e8f0' : '#000'};
            border-color: ${theme === 'dark' ? '#4a5568' : '#dee2e6'};
          }
          .ticket-header {
            border-bottom: 2px solid ${theme === 'dark' ? '#2d3748' : '#dee2e6'};
            padding-bottom: 1rem;
            margin-bottom: 1.5rem;
          }
        `}
      </style>

      <div className="container mt-4 flex-grow-1">
        <div className="mb-3">
          <Link 
            to={user.role === 'admin' || user.role === 'senior' ? '/senior-dashboard' : '/user-dashboard'} 
            className="btn btn-secondary"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <strong>✅ Success!</strong> {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
          </div>
        )}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>❌ Error!</strong> {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        <div className="ticket-header">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h2 className="mb-1">Manage Ticket #{ticketId}</h2>
              <p className="text-muted mb-0">
                {ticket.issue_type} • Created {new Date(ticket.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <span className={`badge ${getPriorityBadgeClass(ticket.priority)} px-3 py-2`}>
                {ticket.priority} Priority
              </span>
              <span className={`badge ${getStatusBadgeClass(ticket.status)} px-3 py-2`}>
                {ticket.status}
              </span>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card mb-4 shadow-sm">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-info-circle me-2"></i>Ticket Information
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="fw-bold text-muted d-block mb-1">Submitter</label>
                  <p className="mb-1">{ticket.user_name}</p>
                  <small className="text-muted">{ticket.user_email}</small>
                </div>
                
                <div className="mb-3">
                  <label className="fw-bold text-muted d-block mb-1">Current Team</label>
                  <p className="mb-0">{getTeamName(ticket.team_id)}</p>
                </div>
                
                <div className="mb-3">
                  <label className="fw-bold text-muted d-block mb-1">Assigned Officer</label>
                  <p className="mb-0">{getOfficerName(ticket.assigned_to)}</p>
                </div>
                
                <div className="mb-3">
                  <label className="fw-bold text-muted d-block mb-1">Description</label>
                  <div className={`p-3 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`}>
                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
                  </div>
                </div>

                {ticket.attachment && (
                  <div className="mb-3">
                    <label className="fw-bold text-muted d-block mb-1">Attachment</label>
                    <Link to={`/attachment/${ticket.ticket_id}`} className="btn btn-sm btn-outline-info">
                      <i className="fas fa-paperclip me-1"></i> View Attachment
                    </Link>
                  </div>
                )}

                <hr />
                
                <div className="row">
                  <div className="col-6">
                    <label className="fw-bold text-muted d-block mb-1">Created</label>
                    <small>{new Date(ticket.created_at).toLocaleString()}</small>
                  </div>
                  <div className="col-6">
                    <label className="fw-bold text-muted d-block mb-1">Last Updated</label>
                    <small>{new Date(ticket.updated_at).toLocaleString()}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card mb-4 shadow-sm">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-edit me-2"></i>Update Ticket
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="status" className="form-label">Status</label>
                      <select 
                        name="status" 
                        id="status" 
                        className="form-select" 
                        value={formData.status}
                        onChange={handleChange}
                        required
                        disabled={!(user.role === 'admin' || user.role === 'senior') || submitting}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="new_team_id" className="form-label">Reassign Team</label>
                      <select 
                        name="new_team_id" 
                        id="new_team_id" 
                        className="form-select"
                        value={formData.new_team_id}
                        onChange={handleChange}
                        disabled={!(user.role === 'admin' || user.role === 'senior') || submitting}
                      >
                        <option value="">-- Unassigned --</option>
                        {teams.map(team => (
                          <option key={team.team_id} value={team.team_id}>
                            {team.team_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="assigned_to" className="form-label">Assign to Senior Officer</label>
                    <select 
                      name="assigned_to" 
                      id="assigned_to" 
                      className="form-select"
                      value={formData.assigned_to}
                      onChange={handleChange}
                      disabled={!(user.role === 'admin' || user.role === 'senior') || submitting || !formData.new_team_id}
                    >
                      <option value="">-- Select Officer --</option>
                      {formData.new_team_id && getSeniorOfficersForTeam(formData.new_team_id).map(officer => (
                        <option key={officer.user_id} value={officer.user_id}>
                          {officer.name} - {officer.email}
                        </option>
                      ))}
                    </select>
                    {formData.new_team_id && getSeniorOfficersForTeam(formData.new_team_id).length === 0 && (
                      <div className="form-text text-warning mt-1">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        No senior officers available for this team. The ticket will appear in queue.
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="comment_text" className="form-label">
                      Comment <span className="text-danger">*</span>
                    </label>
                    <textarea 
                      name="comment_text" 
                      id="comment_text" 
                      className="form-control" 
                      rows="4" 
                      value={formData.comment_text}
                      onChange={handleChange}
                      placeholder="Add a comment explaining the changes (required)..."
                      required
                    ></textarea>
                    <div className="form-text mt-1">
                      <i className="fas fa-info-circle me-1"></i>
                      A comment is required when updating the ticket. This comment will be visible to the receiving team.
                    </div>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    <button 
                      type="submit" 
                      className="btn btn-primary px-4"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-2"></i>
                          Update Ticket
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => navigate(user.role === 'admin' || user.role === 'senior' ? '/senior-dashboard' : '/user-dashboard')}
                      disabled={submitting}
                    >
                      <i className="fas fa-times me-2"></i>Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary" 
                      onClick={() => navigate(`/view-ticket/${ticketId}`)}
                      disabled={submitting}
                    >
                      <i className="fas fa-eye me-2"></i>View Ticket
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4 shadow-sm">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="fas fa-comments me-2"></i>Comments ({comments.length})
            </h5>
          </div>
          <div className="card-body">
            {comments.length > 0 ? (
              <div className="list-group list-group-flush">
                {comments.map(comment => (
                  <div key={comment._id || comment.comment_id} className="list-group-item px-0">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong className="d-block">{comment.author_name || 'Unknown'}</strong>
                        <small className="text-muted">
                          {comment.author_id === user.id ? '(You)' : ''}
                        </small>
                      </div>
                      <small className="text-muted">
                        {new Date(comment.created_at).toLocaleString()}
                      </small>
                    </div>
                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{comment.comment_text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="fas fa-comment-slash fa-2x text-muted mb-3"></i>
                <p className="text-muted mb-0">No comments yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="card mb-4 shadow-sm">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="fas fa-history me-2"></i>Activity Log ({logs.length})
            </h5>
          </div>
          <div className="card-body">
            {logs.length > 0 ? (
              <div className="list-group list-group-flush">
                {logs.map(log => (
                  <div key={log.log_id} className="list-group-item px-0">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <strong>{log.changed_by_name || 'System'}</strong>
                      <small className="text-muted">
                        {new Date(log.created_at).toLocaleString()}
                      </small>
                    </div>
                    <p className="mb-0 text-success">
                      <i className="fas fa-info-circle me-1"></i>
                      {log.change_description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="fas fa-history fa-2x text-muted mb-3"></i>
                <p className="text-muted mb-0">No activity recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className={`text-center py-3 ${theme === 'dark' ? 'bg-dark text-light border-top border-secondary' : 'bg-light text-dark border-top'} mt-auto`}>
        <div className="container-fluid">
          <p className="mb-0">&copy; {new Date().getFullYear()} Ethiopian Statistical Service. All rights reserved.</p>
          <small className="text-muted">Need help? Contact IT Support at <strong>it-support@ess.gov.et</strong></small>
        </div>
      </footer>
    </div>
  );
};

export default ManageTicket;