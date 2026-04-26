import React, { useState, useContext, useEffect } from 'react';
import { UserContext, axiosInstance } from '../App';
import { useNavigate } from 'react-router-dom';

const ProcurementStatusModal = ({ ticket, show, onClose }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageInputs, setMessageInputs] = useState({});
  const [deletingRequest, setDeletingRequest] = useState(null);
  const [messageSent, setMessageSent] = useState(false);
  const { user, theme } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (show && ticket) {
      fetchProcurementRequests();
    }
  }, [show, ticket]);

  const fetchProcurementRequests = async () => {
    try {
      const response = await axiosInstance.get(`/api/tickets/${ticket.ticket_id}/procurement-requests`);
      if (response.data.success) {
        console.log('Fetched procurement requests:', response.data.requests);
        setRequests(response.data.requests);
        
        const initialMessageInputs = {};
        response.data.requests.forEach(request => {
          initialMessageInputs[request._id] = '';
        });
        setMessageInputs(initialMessageInputs);
      }
    } catch (error) {
      console.error('Failed to fetch procurement requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Send message and redirect to dashboard after success
  const handleSendMessage = async (requestId) => {
    const messageText = messageInputs[requestId];
    if (!messageText || !messageText.trim()) return;

    console.log('Sending message for request:', requestId, 'Message:', messageText);

    setSendingMessage(true);
    try {
      const response = await axiosInstance.post(`/api/procurement-requests/${requestId}/messages`, {
        message: messageText,
        sender_id: user.id,
        sender_name: user.name,
        sender_role: user.role
      });

      if (response.data.success) {
        // Show success message
        setMessageSent(true);
        
        // Determine where to redirect based on user role
        const dashboardPath = user.role === 'admin' || user.role === 'senior' 
          ? '/senior-dashboard' 
          : '/user-dashboard';
        
        // Redirect after 1.5 seconds
        setTimeout(() => {
          onClose();
          navigate(dashboardPath);
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message: ' + (error.response?.data?.message || error.message));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteRequest = async (requestId, requestName) => {
    if (!window.confirm(`Are you sure you want to delete the procurement request for "${requestName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingRequest(requestId);
    try {
      await axiosInstance.delete(`/api/procurement-requests/${requestId}/messages`);
      const response = await axiosInstance.delete(`/api/procurement-requests/${requestId}`);
      
      if (response.data.success) {
        setRequests(prev => prev.filter(request => request._id !== requestId));
        alert('✅ Procurement request deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete procurement request:', error);
      alert('❌ Failed to delete procurement request: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeletingRequest(null);
    }
  };

  const handleMessageInputChange = (requestId, value) => {
    setMessageInputs(prev => ({
      ...prev,
      [requestId]: value
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { class: 'bg-warning text-dark', icon: '⏳' },
      'approved': { class: 'bg-success', icon: '✅' },
      'rejected': { class: 'bg-danger', icon: '❌' },
      'ordered': { class: 'bg-info', icon: '📦' },
      'delivered': { class: 'bg-primary', icon: '🎁' },
      'cancelled': { class: 'bg-secondary', icon: '🚫' }
    };
    
    const config = statusConfig[status] || { class: 'bg-secondary', icon: '❓' };
    return <span className={`badge ${config.class}`}>{config.icon} {status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  const getUrgencyBadge = (urgency) => {
    const urgencyConfig = {
      'Low': 'bg-success',
      'Medium': 'bg-warning text-dark',
      'High': 'bg-danger',
      'Critical': 'bg-danger'
    };
    return <span className={`badge ${urgencyConfig[urgency]}`}>{urgency}</span>;
  };

  const canDeleteRequest = (request) => {
    const isAdmin = user.role === 'admin';
    const isCreator = request.requested_by === user.id;
    const canDeleteStatus = !['delivered', 'ordered'].includes(request.status);
    return (isAdmin || isCreator) && canDeleteStatus;
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className={`modal-dialog modal-xl ${theme === 'dark' ? 'modal-dark' : ''}`}>
        <div className={`modal-content ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
          <div className={`modal-header ${theme === 'dark' ? 'bg-secondary text-light' : ''}`}>
            <h5 className="modal-title">
              📦 Procurement Requests - Ticket #{ticket.ticket_id}
            </h5>
            <button 
              type="button" 
              className={`btn-close ${theme === 'dark' ? 'btn-close-white' : ''}`} 
              onClick={onClose}
            ></button>
          </div>
          
          <div className="modal-body">
            {/* Success Message Banner with Redirect info */}
            {messageSent && (
              <div className="alert alert-success alert-dismissible fade show mb-3" role="alert">
                <div className="d-flex align-items-center">
                  <i className="fas fa-check-circle me-2 fs-4"></i>
                  <div>
                    <strong>✅ Message Sent Successfully!</strong>
                    <p className="mb-0">Redirecting to dashboard in 1.5 seconds...</p>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary"></div>
                <p className="mt-2">Loading procurement requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-muted mb-3">
                  <i className="fas fa-box-open fa-3x"></i>
                </div>
                <h5>No Procurement Requests</h5>
                <p className="text-muted">No equipment requests have been made for this ticket yet.</p>
              </div>
            ) : (
              <div className="row">
                {requests.map((request) => (
                  <div key={request._id || request.id} className="col-12 mb-4">
                    <div className={`card ${theme === 'dark' ? 'bg-dark border-secondary' : ''}`}>
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-0">🛒 {request.item_name}</h6>
                          <small className="text-muted">Requested by {request.requested_by_name}</small>
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                          {getUrgencyBadge(request.urgency)}
                          {getStatusBadge(request.status)}
                          
                          {canDeleteRequest(request) && (
                            <button
                              className="btn btn-outline-danger btn-sm ms-2"
                              onClick={() => handleDeleteRequest(request._id, request.item_name)}
                              disabled={deletingRequest === request._id}
                              title="Delete this procurement request"
                            >
                              {deletingRequest === request._id ? (
                                <span className="spinner-border spinner-border-sm" />
                              ) : (
                                <i className="fas fa-trash" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="row mb-3">
                          <div className="col-md-3">
                            <strong>Category:</strong> {request.category}
                          </div>
                          <div className="col-md-3">
                            <strong>Quantity:</strong> {request.quantity}
                          </div>
                          <div className="col-md-3">
                            <strong>Estimated Cost:</strong> {request.estimated_cost || 'N/A'}
                          </div>
                          <div className="col-md-3">
                            <strong>Requested:</strong> {new Date(request.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {request.specifications && (
                          <div className="mb-3">
                            <strong>Specifications:</strong>
                            <p className="mb-0">{request.specifications}</p>
                          </div>
                        )}
                        
                        {request.vendor_info && (
                          <div className="mb-3">
                            <strong>Vendor Info:</strong>
                            <p className="mb-0">{request.vendor_info}</p>
                          </div>
                        )}
                        
                        {request.notes && (
                          <div className="mb-3">
                            <strong>Notes:</strong>
                            <p className="mb-0">{request.notes}</p>
                          </div>
                        )}
                        
                        {/* Messages Section */}
                        <div className="border-top pt-3">
                          <h6>💬 Communication</h6>
                          {request.messages && request.messages.length > 0 ? (
                            <div className="message-thread" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                              {request.messages.map((message, index) => (
                                <div key={`${request._id}-message-${index}`} className={`mb-2 p-2 rounded ${theme === 'dark' ? 'bg-secondary' : 'bg-light'}`}>
                                  <div className="d-flex justify-content-between">
                                    <strong>{message.sender_name} ({message.sender_role})</strong>
                                    <small className="text-muted">
                                      {new Date(message.created_at).toLocaleString()}
                                    </small>
                                  </div>
                                  <p className="mb-0">{message.message}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted">No messages yet.</p>
                          )}
                          
                          {/* Message Input */}
                          <div className="mt-3">
                            <div className="input-group">
                              <input
                                type="text"
                                className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                                placeholder="Type your message... (Press Enter to send)"
                                value={messageInputs[request._id] || ''}
                                onChange={(e) => handleMessageInputChange(request._id, e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSendMessage(request._id);
                                  }
                                }}
                                disabled={sendingMessage || messageSent}
                              />
                              <button
                                className="btn btn-primary"
                                onClick={() => handleSendMessage(request._id)}
                                disabled={sendingMessage || !messageInputs[request._id]?.trim() || messageSent}
                              >
                                {sendingMessage ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : messageSent ? (
                                  '✓ Sent'
                                ) : (
                                  '📤 Send'
                                )}
                              </button>
                            </div>
                            <small className="text-muted mt-2 d-block">
                              After sending, you'll be redirected to your dashboard.
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcurementStatusModal;