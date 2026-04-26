import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';
import { debounce } from 'lodash';

const EditTicket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    issue_type: '',
    description: '',
    priority: 'Medium'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [queueInfo, setQueueInfo] = useState(null);
  const { user, theme } = useContext(UserContext);

  useEffect(() => {
    fetchTicket();
    fetchQueueInfo();
  }, [id]);

  useEffect(() => {
    if (ticket) {
      if (user.role === 'user' && !['Open', 'Queued'].includes(ticket.status)) {
        setError(`You cannot edit tickets that are ${ticket.status}. Only Open or Queued tickets can be modified.`);
        setLoading(false);
      }
    }
  }, [ticket, user.role]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/tickets/${id}`);
      if (response.data.success) {
        const ticket = response.data.ticket;
        setTicket(ticket);
        setFormData({
          issue_type: ticket.issue_type,
          description: ticket.description,
          priority: ticket.priority
        });
        
        if (ticket.description) {
          analyzeDescription(ticket.description);
        }
      } else {
        setError('Failed to fetch ticket');
      }
    } catch (error) {
      console.error('Fetch ticket error:', error);
      setError(error.response?.data?.message || 'Failed to fetch ticket');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueInfo = async () => {
    try {
      const response = await axiosInstance.get('/api/queue-info');
      if (response.data.success) {
        setQueueInfo(response.data.queueInfo);
      }
    } catch (error) {
      console.error('Fetch queue info error:', error);
    }
  };

  const analyzeDescription = async (description) => {
    try {
      const response = await axiosInstance.post('/api/test-classification', {
        description: description
      });
      if (response.data.success) {
        setAiAnalysis({
          predicted_type: response.data.issue_type,
          confidence: (response.data.confidence * 100).toFixed(1),
          all_predictions: response.data.all_classifications
        });
      }
    } catch (error) {
      console.error('AI analysis error:', error);
    }
  };

  const fetchAISuggestions = useCallback(
    debounce(async (query) => {
      if (!query || query.trim().length < 2) {
        setAiSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setSuggestionLoading(true);
      try {
        const suggestionMap = {
          'computer': ['My computer is running very slowly and takes a long time to start up', 'Computer screen is flickering or showing distorted images', 'Computer making unusual noises from the fan or hard drive'],
          'laptop': ['Laptop battery is not holding charge and drains quickly', 'Laptop overheating during normal use', 'Laptop screen has dead pixels or backlight issues'],
          'printer': ['Printer is not responding when trying to print documents', 'Printer producing blank pages or poor quality prints'],
          'software': ['Software application crashes when opening specific files', 'Software update failed and now the application won\'t open'],
          'email': ['Cannot send or receive emails, getting delivery failure messages', 'Email attachments are not downloading or showing as corrupted'],
          'password': ['Forgot my password and cannot access my account', 'Password reset link is not working or has expired'],
          'internet': ['Internet connection is very slow during peak hours', 'No internet access even though WiFi shows connected'],
          'wifi': ['WiFi signal is very weak in certain areas of the office', 'Cannot connect to WiFi network, authentication failed'],
          'virus': ['Computer showing pop-up ads and redirecting to strange websites', 'Antivirus software detected malware but cannot remove it'],
          'account': ['Cannot access my user account, getting access denied', 'User profile settings reset to default after restart']
        };

        const queryLower = query.toLowerCase();
        const matches = [];
        
        Object.entries(suggestionMap).forEach(([keyword, suggestions]) => {
          if (queryLower.includes(keyword)) {
            matches.push(...suggestions);
          }
        });

        if (matches.length === 0) {
          matches.push(
            `Issue with ${query} - please describe what specific problem you're experiencing`,
            `Experiencing difficulties with ${query} - what error messages are you seeing?`,
            `Need assistance with ${query} - when did the problem start occurring?`
          );
        }

        setAiSuggestions(matches.slice(0, 5));
        setShowSuggestions(true);
      } catch (error) {
        console.error('AI suggestion error:', error);
      } finally {
        setSuggestionLoading(false);
      }
    }, 500),
    []
  );

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      description: value
    }));
    
    if (value.length >= 10) {
      analyzeDescription(value);
    }
    
    if (value.length >= 2) {
      fetchAISuggestions(value);
    } else {
      setAiSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      description: suggestion
    }));
    setShowSuggestions(false);
    setAiSuggestions([]);
    analyzeDescription(suggestion);
  };

  const applyAiSuggestion = () => {
    if (aiAnalysis && aiAnalysis.predicted_type !== formData.issue_type) {
      setFormData(prev => ({
        ...prev,
        issue_type: aiAnalysis.predicted_type
      }));
      setSuccess(`AI suggestion applied: Changed issue type to ${aiAnalysis.predicted_type}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'description') {
      handleDescriptionChange(e);
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.issue_type || !formData.description) {
      setError('Issue type and description are required');
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.put(`/api/tickets/${id}`, formData);
      
      if (response.data.success) {
        setSuccess('Ticket updated successfully! Refreshing queue information...');
        
        const queueResponse = await axiosInstance.get('/api/queue-info');
        if (queueResponse.data.success) {
          setQueueInfo(queueResponse.data.queueInfo);
        }
        
        setTimeout(() => {
          navigate('/user-dashboard');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to update ticket');
      }
    } catch (error) {
      console.error('Update ticket error:', error);
      if (error.response && error.response.data) {
        setError(error.response.data.message);
      } else {
        setError('Error updating ticket. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedWaitTime = () => {
    if (!queueInfo || !aiAnalysis) return null;
    
    const teamWorkload = queueInfo.teamWorkload?.[`${aiAnalysis.predicted_type} Support Team`] || 
                        queueInfo.teamWorkload?.[aiAnalysis.predicted_type];
    
    if (!teamWorkload) return null;
    
    const workload = teamWorkload.total || teamWorkload.assigned || 0;
    const availableOfficers = teamWorkload.availableOfficers || 0;
    
    if (availableOfficers > 0) {
      return {
        message: "🚀 Fast Resolution Expected",
        details: "Officers are available! Your ticket will be assigned immediately.",
        class: "success"
      };
    } else {
      const estimatedDays = 2 + Math.floor(workload / 3);
      return {
        message: "⏳ Queue Time Expected",
        details: `Estimated wait: ${estimatedDays} business days due to high workload`,
        class: "warning"
      };
    }
  };

  const waitTimeInfo = getEstimatedWaitTime();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open': return 'bg-primary';
      case 'In Progress': return 'bg-warning text-dark';
      case 'Resolved': return 'bg-success';
      case 'Queued': return 'bg-secondary';
      case 'Closed': return 'bg-dark';
      default: return 'bg-secondary';
    }
  };

  if (loading && !ticket) {
    return (
      <div className={`min-vh-100 d-flex justify-content-center align-items-center ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
        <div className="text-center">
          <div className="spinner-border mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading ticket information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <style>
        {`
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
          .suggestions-dropdown {
            position: absolute;
            z-index: 1000;
            width: 100%;
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid ${theme === 'dark' ? '#4a5568' : '#ddd'};
            border-radius: 4px;
            background: ${theme === 'dark' ? '#2d3748' : 'white'};
            color: ${theme === 'dark' ? '#e2e8f0' : '#000'};
          }
          .suggestion-item {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid ${theme === 'dark' ? '#4a5568' : '#eee'};
          }
          .suggestion-item:hover {
            background-color: ${theme === 'dark' ? '#4a5568' : '#f8f9fa'};
          }
          .suggestions-container {
            position: relative;
          }
          .ai-card, .form-card, .info-card {
            transition: all 0.3s ease;
            border: 1px solid ${theme === 'dark' ? '#4a5568' : '#dee2e6'};
          }
          .ai-card:hover, .form-card:hover, .info-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
          .back-button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 8px;
            transition: all 0.3s ease;
          }
          .back-button:hover {
            transform: translateX(-3px);
          }
        `}
      </style>

      <div className="container-fluid px-4 py-4 flex-grow-1">
        {/* Back Button - FULL WIDTH */}
        <div className="mb-4">
          <button 
            onClick={() => navigate('/user-dashboard')} 
            className="btn btn-secondary back-button"
          >
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </button>
        </div>

        {/* Header */}
        <div className="mb-4">
          <h2 className="mb-2">✏️ Edit Ticket #{id}</h2>
          {ticket && (
            <p className={`mb-0 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>
              Current Status: <span className={`badge ${getStatusBadge(ticket.status)}`}>{ticket.status}</span>
              {ticket.status === 'Queued' && (
                <span className="ms-2 badge bg-secondary">⏳ Position: #{ticket.queue_position || 'N/A'}</span>
              )}
            </p>
          )}
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className={`alert alert-danger mb-4 d-flex align-items-center`}>
            <i className="fas fa-exclamation-circle me-2 fs-5"></i>
            <div className="flex-grow-1">{error}</div>
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {success && (
          <div className={`alert alert-success mb-4 d-flex align-items-center`}>
            <i className="fas fa-check-circle me-2 fs-5"></i>
            <div className="flex-grow-1">{success}</div>
            <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
          </div>
        )}

        {/* HORIZONTAL SPLIT: AI Analysis (LEFT) + Edit Form (RIGHT) */}
        <div className="row g-4 mb-4">
          {/* AI Analysis Card - LEFT SIDE */}
          <div className="col-lg-5">
            <div className={`ai-card p-4 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
              <div className="d-flex align-items-center mb-3">
                <div className="bg-info bg-opacity-10 p-2 rounded me-2">
                  <i className="fas fa-robot text-info fs-4"></i>
                </div>
                <div>
                  <h5 className="mb-0">🤖 AI Analysis</h5>
                  <small className="text-muted">Intelligent ticket classification</small>
                </div>
              </div>
              
              {aiAnalysis ? (
                <>
                  <div className="mb-3">
                    <label className="form-label small text-muted">Predicted Category</label>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <span className={`badge fs-6 px-3 py-2 ${
                        aiAnalysis.predicted_type === formData.issue_type ? 'bg-success' : 'bg-warning text-dark'
                      }`}>
                        {aiAnalysis.predicted_type}
                      </span>
                      <span className="badge bg-info">Confidence: {aiAnalysis.confidence}%</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="progress" style={{ height: '8px' }}>
                      <div 
                        className="progress-bar bg-info" 
                        style={{ width: `${aiAnalysis.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {aiAnalysis.predicted_type !== formData.issue_type && (
                    <div className="mb-3">
                      <div className={`p-3 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`}>
                        <p className="mb-2 small">
                          <i className="fas fa-lightbulb text-warning me-1"></i>
                          AI suggests a different category based on your description
                        </p>
                        <button 
                          className="btn btn-sm btn-outline-primary w-100"
                          onClick={applyAiSuggestion}
                        >
                          <i className="fas fa-magic me-1"></i> Apply AI Suggestion
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Queue Information */}
                  {waitTimeInfo && (
                    <div className={`mt-3 p-3 rounded border border-${waitTimeInfo.class === 'success' ? 'success' : 'warning'}`}>
                      <div className="d-flex align-items-center">
                        <i className={`fas fa-${waitTimeInfo.class === 'success' ? 'rocket' : 'clock'} fs-3 me-3 text-${waitTimeInfo.class}`}></i>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{waitTimeInfo.message}</h6>
                          <small className="text-muted">{waitTimeInfo.details}</small>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-brain fa-3x text-muted mb-2"></i>
                  <p className="text-muted mb-0">AI analysis will appear as you type</p>
                </div>
              )}
            </div>
          </div>

          {/* Edit Form Card - RIGHT SIDE */}
          <div className="col-lg-7">
            <div className={`form-card p-4 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
              <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-10 p-2 rounded me-2">
                  <i className="fas fa-edit text-primary fs-4"></i>
                </div>
                <div>
                  <h5 className="mb-0">📝 Edit Ticket Details</h5>
                  <small className="text-muted">Modify your ticket information</small>
                </div>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Issue Type <span className="text-danger">*</span></label>
                  <select 
                    name="issue_type" 
                    className="form-select" 
                    value={formData.issue_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Issue Type</option>
                    <option value="Hardware">💻 Hardware</option>
                    <option value="Software">🖥️ Software</option>
                    <option value="Network">🌐 Network</option>
                    <option value="Security">🔒 Security</option>
                    <option value="Account">👤 Account Access</option>
                    <option value="Database">🗄️ Database</option>
                    <option value="Configuration">⚙️ Configuration</option>
                    <option value="Other">❓ Other</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Description <span className="text-danger">*</span></label>
                  <div className="suggestions-container">
                    <textarea 
                      name="description" 
                      className="form-control" 
                      rows="5" 
                      value={formData.description}
                      onChange={handleDescriptionChange}
                      required
                      placeholder="Please provide a detailed description of the issue..."
                    ></textarea>
                    {showSuggestions && (
                      <div className="suggestions-dropdown">
                        {suggestionLoading ? (
                          <div className="suggestion-item text-center">
                            <div className="spinner-border spinner-border-sm" role="status"></div>
                            <span className="ms-2">Loading AI suggestions...</span>
                          </div>
                        ) : (
                          aiSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="suggestion-item"
                              onClick={() => selectSuggestion(suggestion)}
                            >
                              <i className="fas fa-lightbulb text-warning me-2"></i>
                              <small>{suggestion}</small>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="form-text mt-2">
                    <i className="fas fa-lightbulb text-warning me-1"></i>
                    <strong>Pro Tip:</strong> Be specific! Include keywords for better AI classification.
                    {aiAnalysis && (
                      <span className="ms-2">
                        AI detected: <strong>{aiAnalysis.predicted_type}</strong> ({aiAnalysis.confidence}% confidence)
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">Priority <span className="text-danger">*</span></label>
                  <select 
                    name="priority" 
                    className="form-select" 
                    value={formData.priority}
                    onChange={handleChange}
                    required
                  >
                    <option value="Low">🟢 Low - Minor issue, no immediate impact</option>
                    <option value="Medium">🟡 Medium - Moderate impact on work</option>
                    <option value="High">🔴 High - Critical issue affecting work</option>
                  </select>
                </div>

                <div className="d-flex gap-2 flex-wrap">
                  <button 
                    type="submit" 
                    className="btn btn-primary px-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Updating...
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
                    onClick={() => navigate('/user-dashboard')}
                    disabled={loading}
                  >
                    <i className="fas fa-times me-2"></i>Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={() => navigate(`/view-ticket/${id}`)}
                    disabled={loading}
                  >
                    <i className="fas fa-eye me-2"></i>View Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Ticket Information Card - FULL WIDTH BOTTOM */}
        {ticket && (
          <div className={`info-card p-4 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
            <div className="d-flex align-items-center mb-3">
              <div className="bg-secondary bg-opacity-10 p-2 rounded me-2">
                <i className="fas fa-info-circle text-secondary fs-4"></i>
              </div>
              <div>
                <h5 className="mb-0">ℹ️ Current Ticket Information</h5>
                <small className="text-muted">Original ticket details</small>
              </div>
            </div>
            
            <div className="row g-3">
              <div className="col-md-6 col-lg-3">
                <div className={`p-2 rounded ${theme === 'dark' ? 'bg-secondary bg-opacity-10' : 'bg-light'}`}>
                  <small className="text-muted d-block">Created</small>
                  <strong>{new Date(ticket.created_at).toLocaleString()}</strong>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className={`p-2 rounded ${theme === 'dark' ? 'bg-secondary bg-opacity-10' : 'bg-light'}`}>
                  <small className="text-muted d-block">Last Updated</small>
                  <strong>{ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : 'Never'}</strong>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className={`p-2 rounded ${theme === 'dark' ? 'bg-secondary bg-opacity-10' : 'bg-light'}`}>
                  <small className="text-muted d-block">Assigned Team</small>
                  <strong>{ticket.team_name || 'Unassigned'}</strong>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className={`p-2 rounded ${theme === 'dark' ? 'bg-secondary bg-opacity-10' : 'bg-light'}`}>
                  <small className="text-muted d-block">Submitted By</small>
                  <strong>{ticket.user_name || 'Unknown'}</strong>
                </div>
              </div>
              {ticket.assigned_to && (
                <div className="col-12">
                  <div className={`p-2 rounded ${theme === 'dark' ? 'bg-secondary bg-opacity-10' : 'bg-light'}`}>
                    <small className="text-muted d-block">Assigned To</small>
                    <strong>{ticket.assigned_to_name || 'Senior Officer'}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className={`text-center py-3 ${theme === 'dark' ? 'bg-dark text-light border-top border-secondary' : 'bg-light text-dark border-top'} mt-auto`}>
        <div className="container-fluid">
          <p className="mb-0">&copy; {new Date().getFullYear()} Ethiopian Statistical Service Helpdesk System. All rights reserved.</p>
          <small className="text-muted">Need help? Contact IT Support at <strong>it-support@ess.gov.et</strong></small>
        </div>
      </footer>
    </div>
  );
};

export default EditTicket;