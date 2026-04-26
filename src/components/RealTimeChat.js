import React, { useState, useEffect, useRef, useContext } from 'react';
import { UserContext, axiosInstance } from '../App';

const RealTimeChat = ({ ticketId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const { user, theme } = useContext(UserContext);

  // Simulate real-time updates (in real app, use WebSockets)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
      fetchOnlineUsers();
    }, 3000);

    return () => clearInterval(interval);
  }, [ticketId]);

  const fetchMessages = async () => {
    try {
      const response = await axiosInstance.get(`/api/tickets/${ticketId}/chat-messages`);
      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const response = await axiosInstance.get('/api/chat/online-users');
      if (response.data.success) {
        setOnlineUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setIsTyping(true);
      const response = await axiosInstance.post(`/api/tickets/${ticketId}/chat-messages`, {
        message: newMessage,
        type: 'text'
      });

      if (response.data.success) {
        setNewMessage('');
        fetchMessages(); // Refresh messages
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={`card ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}`}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="fas fa-comments me-2 text-primary"></i>
          Live Chat Support
        </h5>
        <div className="d-flex align-items-center">
          <span className={`badge bg-${onlineUsers.length > 0 ? 'success' : 'secondary'} me-2`}>
            <i className="fas fa-circle me-1"></i>
            {onlineUsers.length} Online
          </span>
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={fetchMessages}
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      <div className="card-body p-0">
        {/* Online Users */}
        {onlineUsers.length > 0 && (
          <div className="p-3 border-bottom">
            <small className="text-muted">
              <i className="fas fa-users me-1"></i>
              Online: {onlineUsers.map(u => u.name).join(', ')}
            </small>
          </div>
        )}

        {/* Messages Container */}
        <div 
          className="messages-container p-3" 
          style={{ maxHeight: '400px', overflowY: 'auto' }}
        >
          {messages.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="fas fa-comment-slash fa-2x mb-2"></i>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`message mb-3 ${message.sender_id === user.id ? 'text-end' : ''}`}
              >
                <div
                  className={`d-inline-block p-3 rounded ${
                    message.sender_id === user.id
                      ? 'bg-primary text-white'
                      : theme === 'dark' ? 'bg-secondary' : 'bg-light border'
                  }`}
                  style={{ maxWidth: '70%' }}
                >
                  <div className="d-flex align-items-center mb-1">
                    <small className={`fw-bold ${message.sender_id === user.id ? 'text-light' : 'text-primary'}`}>
                      {message.sender_name}
                    </small>
                    <small className="ms-2 text-muted">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </small>
                  </div>
                  <div className="message-content">
                    {message.message}
                  </div>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="message mb-3">
              <div className="d-inline-block p-2 rounded bg-light border">
                <small className="text-muted">
                  <i className="fas fa-ellipsis-h me-1"></i>
                  Typing...
                </small>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-3 border-top">
          <form onSubmit={sendMessage} className="d-flex gap-2">
            <input
              type="text"
              className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isTyping}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isTyping || !newMessage.trim()}
            >
              {isTyping ? (
                <span className="spinner-border spinner-border-sm" />
              ) : (
                <i className="fas fa-paper-plane"></i>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RealTimeChat;