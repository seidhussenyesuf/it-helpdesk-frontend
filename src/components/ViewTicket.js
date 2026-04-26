import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';

const ViewTicket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, theme } = useContext(UserContext);

  useEffect(() => {
    fetchTicketData();
  }, [id]);

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      const ticketRes = await axiosInstance.get(`/api/tickets/${id}`);
      if (ticketRes.data.success) {
        setTicket(ticketRes.data.ticket);
      } else {
        setError('Failed to fetch ticket data');
      }
    } catch (error) {
      console.error('Fetch ticket error:', error);
      setError(error.response?.data?.message || 'Failed to fetch ticket data');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High': return '🔥';
      case 'Medium': return '⚠️';
      case 'Low': return '💤';
      default: return '💤';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Open': return '🔴';
      case 'In Progress': return '🟡';
      case 'Resolved': return '🟢';
      default: return '💣';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'High': return 'text-danger';
      case 'Medium': return 'text-warning';
      case 'Low': return 'text-success';
      default: return '';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Open': return 'badge bg-danger';
      case 'In Progress': return 'badge bg-warning text-dark';
      case 'Resolved': return 'badge bg-success';
      default: return 'badge bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className={`min-vh-100 d-flex justify-content-center align-items-center ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!ticket && !loading) {
    return (
      <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
        <div className="container mt-5">
          <div className="alert alert-danger">
            Ticket not found or you don't have permission to view it.
          </div>
          <button 
            onClick={() => navigate('/user-dashboard')} 
            className="btn btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <style>
        {`
          .card {
            border-radius: 8px;
          }
          .card-header {
            padding: 1.5rem 1.5rem 0 1.5rem;
          }
          .card-body {
            padding: 0 1.5rem 1.5rem 1.5rem;
          }
          h6 {
            font-size: 0.875rem;
            font-weight: 500;
          }
          p {
            font-size: 1rem;
          }
          .ticket-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 1.5rem;
          }
          .info-card {
            padding: 1rem;
            border-radius: 8px;
            background: ${theme === 'dark' ? '#2d3748' : '#f8f9fa'};
            border: 1px solid ${theme === 'dark' ? '#4a5568' : '#dee2e6'};
          }
          ${theme === 'dark' ? `
            .bg-dark {
              background-color: #1a1a1a !important;
            }
            .border-secondary {
              border-color: #495057 !important;
            }
            .bg-secondary {
              background-color: #2d3748 !important;
            }
          ` : ''}
        `}
      </style>

      <div className="container-fluid px-4 py-4 flex-grow-1">
        <div className="mb-4">
          <button 
            onClick={() => navigate('/user-dashboard')} 
            className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-secondary'}`}
          >
            ← Back to Dashboard
          </button>
        </div>

        {error && (
          <div className={`alert alert-danger ${theme === 'dark' ? 'bg-dark border-secondary' : ''}`}>
            {error}
          </div>
        )}

        {/* Main Ticket Card */}
        <div 
          className={`card shadow-sm ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white border-0'}`} 
          style={{ maxWidth: '900px', margin: '0 auto' }}
        >
          <div className={`card-header ${theme === 'dark' ? 'bg-dark border-secondary' : 'bg-white border-0'} pb-0`}>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="card-title mb-2 fw-bold">Ticket Details #{ticket.ticket_id}</h4>
              <span className={getStatusClass(ticket.status)}>
                {getStatusIcon(ticket.status)} {ticket.status}
              </span>
            </div>
          </div>
          
          <div className="card-body">
            {/* Description */}
            <div className="mb-4">
              <h6 className={`mb-3 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>Description:</h6>
              <div className={`p-3 rounded border ${theme === 'dark' ? 'bg-secondary text-light border-secondary' : 'bg-light border'}`}>
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* Ticket Information Grid */}
            <div className="ticket-info-grid">
              {/* Submitter Info */}
              <div className="info-card">
                <h6 className={`mb-2 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>Submitter:</h6>
                <p className="mb-0 fw-semibold">{ticket.user_name || 'Unknown'}</p>
                <small className={`${theme === 'dark' ? 'text-light' : 'text-muted'}`}>
                  {ticket.user_email || ''}
                </small>
              </div>

              {/* Priority */}
              <div className="info-card">
                <h6 className={`mb-2 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>Priority:</h6>
                <p className={`mb-0 fw-semibold ${getPriorityClass(ticket.priority)}`}>
                  {getPriorityIcon(ticket.priority)} {ticket.priority}
                </p>
              </div>

              {/* Issue Type */}
              <div className="info-card">
                <h6 className={`mb-2 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>Issue Type:</h6>
                <p className="mb-0 fw-semibold">{ticket.issue_type}</p>
              </div>

              {/* Assigned Team */}
              <div className="info-card">
                <h6 className={`mb-2 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>Assigned Team:</h6>
                <p className="mb-0 fw-semibold">{ticket.team_name || 'Unassigned'}</p>
              </div>

              {/* Created Date */}
              <div className="info-card">
                <h6 className={`mb-2 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>Created:</h6>
                <p className="mb-0">
                  {new Date(ticket.created_at).toLocaleDateString()} at {' '}
                  {new Date(ticket.created_at).toLocaleTimeString()}
                </p>
              </div>

              {/* Last Updated */}
              <div className="info-card">
                <h6 className={`mb-2 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>Last Updated:</h6>
                <p className="mb-0">
                  {ticket.updated_at 
                    ? `${new Date(ticket.updated_at).toLocaleDateString()} at ${new Date(ticket.updated_at).toLocaleTimeString()}`
                    : `${new Date(ticket.created_at).toLocaleDateString()} at ${new Date(ticket.created_at).toLocaleTimeString()}`
                  }
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2 mt-4">
              {(ticket.status === 'Open' || ticket.status === 'In Progress') && (
                <button 
                  onClick={() => navigate(`/edit-ticket/${ticket.ticket_id}`)}
                  className="btn btn-primary"
                >
                  Edit Ticket
                </button>
              )}
              <button 
                onClick={() => navigate('/user-dashboard')}
                className="btn btn-secondary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <footer className={`text-center py-3 border-top mt-auto ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white text-muted'}`}>
        <p className="mb-0">
          &copy; {new Date().getFullYear()} IT Help Desk Ethiopian Statistical Service. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default ViewTicket;