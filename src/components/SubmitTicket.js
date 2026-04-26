import React, { useState, useContext, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';
import { debounce } from 'lodash';

const SubmitTicket = () => {
  const [formData, setFormData] = useState({
    description: '',
    priority: 'Medium',
    attachment: null,
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [predictedCategory, setPredictedCategory] = useState('');
  const [ticketId, setTicketId] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testResults, setTestResults] = useState([]);
  
  const [queueInfo, setQueueInfo] = useState(null);
  const [queueLoading, setQueueLoading] = useState(true);
  
  const { user, theme } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQueueInfo = async () => {
      try {
        setQueueLoading(true);
        const response = await axiosInstance.get('/api/queue-info');
        if (response.data.success) {
          setQueueInfo(response.data.queueInfo);
        }
      } catch (error) {
        console.error('Fetch queue info error:', error);
        setError('Warning: Could not load queue status. Tickets may be delayed.');
      } finally {
        setQueueLoading(false);
      }
    };
    fetchQueueInfo();
  }, []);

  const testAIClassification = async () => {
    const testCases = [
      { desc: 'My computer is very slow and takes forever to start', expected: 'Hardware' },
      { desc: 'Cannot connect to the wifi network in office', expected: 'Network' },
      { desc: 'Microsoft Word keeps crashing when I open documents', expected: 'Software' },
      { desc: 'I think my computer has a virus, it shows popups', expected: 'Security' },
      { desc: 'My account is locked and I cannot login', expected: 'Account' }
    ];

    const results = [];
    for (const testCase of testCases) {
      try {
        const response = await axiosInstance.post('/api/test-classification', { description: testCase.desc });
        results.push({
          description: testCase.desc,
          expected: testCase.expected,
          actual: response.data.issue_type,
          confidence: response.data.confidence,
          match: testCase.expected === response.data.issue_type
        });
      } catch (error) {
        results.push({
          description: testCase.desc,
          expected: testCase.expected,
          actual: 'Error',
          confidence: 0,
          match: false,
          error: error.response?.data?.message || error.message
        });
      }
    }
    setTestResults(results);
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
          matches.push(`Issue with ${query} - please describe what specific problem you're experiencing`, `Experiencing difficulties with ${query} - what error messages are you seeing?`);
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
    setFormData(prev => ({ ...prev, description: value }));
    if (value.length >= 2) {
      fetchAISuggestions(value);
    } else {
      setAiSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setFormData(prev => ({ ...prev, description: suggestion }));
    setShowSuggestions(false);
    setAiSuggestions([]);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'description') {
      handleDescriptionChange(e);
      return;
    }
    setFormData({ ...formData, [name]: files ? files[0] : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setPredictedCategory('');
    setTicketId(null);
    setLoading(true);

    if (!formData.description.trim()) {
      setError('Please describe your issue');
      setLoading(false);
      return;
    }
    if (formData.description.trim().length < 10) {
      setError('Please provide a more detailed description (at least 10 characters)');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('priority', formData.priority);
      if (formData.attachment) {
        formDataToSend.append('attachment', formData.attachment);
      }

      const response = await axiosInstance.post('/api/submit-ticket', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      if (response.data.success) {
        setSuccessMessage(response.data.message || 'Ticket submitted successfully!');
        setPredictedCategory(response.data.issue_type);
        setTicketId(response.data.ticket_id);
        setFormData({ description: '', priority: 'Medium', attachment: null });
        
        try {
          const queueResponse = await axiosInstance.get('/api/queue-info');
          if (queueResponse.data.success) {
            setQueueInfo(queueResponse.data.queueInfo);
          }
        } catch (queueError) {
          console.error('Queue refresh failed:', queueError);
        }
        
        setTimeout(() => { navigate('/user-dashboard'); }, 4000);
      } else {
        throw new Error(response.data.message || 'Failed to submit ticket');
      }
    } catch (error) {
      let errorMessage = 'Failed to submit ticket. Please try again.';
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getFormClass = () => {
    return theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark';
  };

  const getEstimatedWaitTime = () => {
    if (!queueInfo || !queueInfo.totalPendingTickets) return null;
    const pendingTickets = queueInfo.totalPendingTickets;
    if (pendingTickets === 0) return { message: "Immediate assignment expected", class: "success" };
    if (pendingTickets <= 3) return { message: "1-2 business days", class: "info" };
    if (pendingTickets <= 6) return { message: "2-3 business days", class: "warning" };
    return { message: "3+ business days", class: "danger" };
  };

  const waitTimeInfo = getEstimatedWaitTime();

  return (
    <div className={`min-vh-100 d-flex flex-column ${getFormClass()}`}>
      <style>
        {`
          .form-control { 
            background-color: ${theme === 'dark' ? '#2d3748' : '#fff'}; 
            color: ${theme === 'dark' ? '#e2e8f0' : '#000'}; 
            border-color: ${theme === 'dark' ? '#4a5568' : '#ced4da'};
          }
          .form-control:focus {
            background-color: ${theme === 'dark' ? '#2d3748' : '#fff'};
            color: ${theme === 'dark' ? '#e2e8f0' : '#000'};
            border-color: #667eea;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
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
          .test-result-success { 
            background-color: ${theme === 'dark' ? '#2f855a' : '#d4edda'}; 
            border: 1px solid ${theme === 'dark' ? '#38a169' : '#c3e6cb'};
          }
          .test-result-failure { 
            background-color: ${theme === 'dark' ? '#9b2c2c' : '#f8d7da'}; 
            border: 1px solid ${theme === 'dark' ? '#e53e3e' : '#f5c6cb'};
          }
          .status-card {
            transition: all 0.3s ease;
            border: 1px solid ${theme === 'dark' ? '#4a5568' : '#dee2e6'};
          }
          .status-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
          .debug-card, .ticket-card {
            transition: all 0.3s ease;
            border: 1px solid ${theme === 'dark' ? '#4a5568' : '#dee2e6'};
            height: 100%;
          }
          .debug-card:hover, .ticket-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
        `}
      </style>

      <div className="container-fluid px-4 py-4 flex-grow-1">
        {/* Header Section - FULL WIDTH */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-0">🎫 Submit New Ticket</h2>
            <p className={`mt-2 mb-0 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>Create a new support ticket for assistance</p>
          </div>
          <Link to="/user-dashboard" className="btn btn-outline-secondary">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Status Information - 4 CARDS IN ONE ROW FULL WIDTH */}
        <div className="row mb-4 g-3">
          <div className="col-md-3 col-sm-6">
            <div className={`status-card p-3 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-white'} text-center h-100`}>
              <div className="badge bg-primary mb-2 fs-6 px-3 py-2">📋 Open</div>
              <div className="mt-2">
                <strong>Ticket created, not yet handled</strong>
                <br />
                <small className="text-muted">Will be assigned to staff</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className={`status-card p-3 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-white'} text-center h-100`}>
              <div className="badge bg-warning text-dark mb-2 fs-6 px-3 py-2">🔄 In Progress</div>
              <div className="mt-2">
                <strong>Work is ongoing</strong>
                <br />
                <small className="text-muted">Staff is troubleshooting</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className={`status-card p-3 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-white'} text-center h-100`}>
              <div className="badge bg-success mb-2 fs-6 px-3 py-2">✅ Resolved</div>
              <div className="mt-2">
                <strong>Fix applied</strong>
                <br />
                <small className="text-muted">Awaiting confirmation</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className={`status-card p-3 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-white'} text-center h-100`}>
              <div className="badge bg-secondary mb-2 fs-6 px-3 py-2">⏳ Queued</div>
              <div className="mt-2">
                <strong>Waiting for officer</strong>
                <br />
                <small className="text-muted">Assign when free</small>
              </div>
            </div>
          </div>
        </div>

        {/* Queue Status Banner - FULL WIDTH HORIZONTAL */}
        {queueLoading ? (
          <div className={`alert alert-info mb-4 ${theme === 'dark' ? 'bg-info text-dark' : ''}`}>
            <div className="d-flex align-items-center">
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              Loading queue status...
            </div>
          </div>
        ) : queueInfo ? (
          <div className={`alert alert-${waitTimeInfo?.class || 'info'} mb-4 ${theme === 'dark' ? `bg-${waitTimeInfo?.class} text-dark` : ''}`}>
            <div className="row align-items-center">
              <div className="col-md-8">
                <h5 className="alert-heading mb-2">
                  {waitTimeInfo?.class === 'success' ? '✅ Best Time to Submit' :
                   waitTimeInfo?.class === 'warning' ? '⏳ Moderate Queue' :
                   waitTimeInfo?.class === 'danger' ? '🚨 High Queue Load' : '📊 Queue Status'}
                </h5>
                <p className="mb-1">
                  <strong>Current queue: {queueInfo.totalPendingTickets} tickets waiting</strong>
                </p>
                <p className="mb-0">
                  Estimated resolution: <strong>{waitTimeInfo?.message || 'Checking...'}</strong>
                </p>
              </div>
              <div className="col-md-4 text-center">
                <div className="d-flex align-items-center justify-content-center gap-4">
                  <div className="text-center">
                    <div className={`display-3 fw-bold text-${waitTimeInfo?.class}`}>
                      {queueInfo.totalPendingTickets}
                    </div>
                    <small>Tickets in Queue</small>
                  </div>
                  <div className="text-center">
                    <div className="display-5 fw-bold">
                      {queueInfo.totalPendingTickets > 0 ? '⏳' : '✅'}
                    </div>
                    <small>{queueInfo.totalPendingTickets > 0 ? 'Please Wait' : 'Ready'}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`alert alert-warning mb-4 ${theme === 'dark' ? 'bg-warning text-dark' : ''}`}>
            <strong>Note:</strong> Unable to load queue status. Tickets will be processed normally.
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className={`alert alert-danger mb-4 ${theme === 'dark' ? 'bg-danger text-dark' : ''}`}>
            <div className="d-flex align-items-center">
              <i className="fas fa-exclamation-circle me-2 fs-4"></i>
              <div>
                <strong>Error:</strong> {error}
              </div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className={`alert alert-success mb-4 ${theme === 'dark' ? 'bg-success text-dark' : ''}`}>
            <div className="d-flex align-items-start">
              <i className="fas fa-check-circle me-2 fs-4 mt-1"></i>
              <div className="flex-grow-1">
                <strong>{successMessage}</strong>
                {predictedCategory && (
                  <p className="mb-0 mt-2">
                    <strong>AI Predicted Category:</strong> 
                    <span className="text-success ms-2">{predictedCategory}</span> 
                    {predictedCategory !== 'Other' ? ' (Auto-assigned for faster resolution! 🎯)' : ' (Please contact admin for manual assignment)'}
                  </p>
                )}
                {ticketId && (
                  <div className="mt-3">
                    <button onClick={() => navigate(`/view-ticket/${ticketId}`)} className="btn btn-primary me-2">
                      <i className="fas fa-eye me-1"></i>View Ticket
                    </button>
                    <button onClick={() => navigate('/user-dashboard')} className="btn btn-outline-primary">
                      <i className="fas fa-arrow-left me-1"></i>Back to Dashboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* HORIZONTAL SPLIT: DEBUG TOOLS (LEFT) + TICKET DETAILS (RIGHT) */}
        <div className="row g-4">
          {/* Debug Tools - LEFT SIDE */}
          {process.env.NODE_ENV === 'development' && (
            <div className="col-md-5">
              <div className={`debug-card p-4 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-info bg-opacity-10 p-2 rounded me-2">
                    <i className="fas fa-bug text-info fs-4"></i>
                  </div>
                  <div>
                    <h5 className="mb-0">🐛 Debug Tools</h5>
                    <small className="text-muted">Test AI classification system</small>
                  </div>
                </div>
                
                <div className="mb-3">
                  <button onClick={testAIClassification} className="btn btn-info w-100" disabled={loading}>
                    <i className="fas fa-flask me-2"></i>Run AI Classification Test
                  </button>
                </div>
                
                {testResults.length > 0 && (
                  <div className="mt-3">
                    <h6 className="mb-2">Test Results:</h6>
                    <div className="test-results-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {testResults.map((result, index) => (
                        <div key={index} className={`p-2 mb-2 rounded ${result.match ? 'test-result-success' : 'test-result-failure'}`}>
                          <div className="fw-bold small">"{result.description.substring(0, 60)}..."</div>
                          <div className="d-flex justify-content-between align-items-center mt-1 flex-wrap gap-2">
                            <small>Expected: {result.expected}</small>
                            <small>Actual: {result.actual}</small>
                            <small>Confidence: {(result.confidence * 100).toFixed(1)}%</small>
                            <span className={result.match ? 'text-success' : 'text-danger'}>
                              {result.match ? '✅ PASS' : '❌ FAIL'}
                            </span>
                          </div>
                          {result.error && <small className="text-danger d-block mt-1">Error: {result.error}</small>}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-center">
                      <strong>Success Rate:</strong> {(testResults.filter(r => r.match).length / testResults.length * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ticket Details Form - RIGHT SIDE */}
          <div className={process.env.NODE_ENV === 'development' ? "col-md-7" : "col-12"}>
            <div className={`ticket-card p-4 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
              <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-10 p-2 rounded me-2">
                  <i className="fas fa-pen-alt text-primary fs-4"></i>
                </div>
                <div>
                  <h5 className="mb-0">📝 Ticket Details</h5>
                  <small className="text-muted">Fill in the information below</small>
                </div>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-bold">Description <span className="text-danger">*</span></label>
                  <div className="suggestions-container">
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                      rows="5"
                      placeholder="Describe your issue in detail (e.g., 'My computer is very slow', 'Cannot connect to WiFi', 'Email not working')..."
                      minLength="10"
                    />
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
                    <strong>Pro Tip:</strong> Be specific! Include keywords like "computer", "printer", "email", "password", "internet", "virus" for better AI classification.
                    {formData.description.length > 0 && (
                      <span className={`ms-2 badge ${formData.description.length < 10 ? 'bg-warning' : 'bg-success'}`}>
                        {formData.description.length}/10 characters
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Priority <span className="text-danger">*</span></label>
                    <select 
                      name="priority" 
                      value={formData.priority} 
                      onChange={handleChange} 
                      className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                    >
                      <option value="Low">🟢 Low - Minor issue, no immediate impact</option>
                      <option value="Medium">🟡 Medium - Moderate impact on work</option>
                      <option value="High">🔴 High - Critical issue affecting work</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Attachment (optional)</label>
                    <input 
                      type="file" 
                      name="attachment" 
                      onChange={handleChange} 
                      className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                      accept="image/*,.pdf,.doc,.docx" 
                    />
                    <div className="form-text mt-1">
                      <i className="fas fa-info-circle me-1"></i>
                      Max 5MB. Supported: images, PDF, Word
                    </div>
                  </div>
                </div>
                
                <div className="d-flex gap-3 justify-content-end">
                  <Link to="/user-dashboard" className="btn btn-secondary">
                    <i className="fas fa-arrow-left me-2"></i>Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Submit Ticket
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-4">
          <small className="text-muted">
            <i className="fas fa-robot me-1"></i>
            Your ticket will be automatically assigned to the appropriate team based on AI analysis.
          </small>
        </div>
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

export default SubmitTicket;