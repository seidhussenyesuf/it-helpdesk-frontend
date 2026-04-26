import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      // FIX: Use the correct endpoint without double /api/
      const response = await axiosInstance.post('/api/auth/forgot-password', {
  email: email
});

      if (response.data.success) {
        setMessage('Password reset instructions have been sent to your email address.');
        setEmail('');
      } else {
        setError(response.data.message || 'Failed to send reset instructions');
      }
    } catch (error) {
      // Handle different types of errors
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.code === 'ERR_NETWORK') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-vh-100 d-flex justify-content-center align-items-center ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <div className={`card p-4 shadow-sm ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white border-0'}`} style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="card-title text-center mb-4">Forgot Password</h2>
        
        {message && (
          <div className={`alert ${theme === 'dark' ? 'alert-info' : 'alert-info'}`}>
            {message}
          </div>
        )}
        {error && (
          <div className={`alert ${theme === 'dark' ? 'alert-danger' : 'alert-danger'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email address"
              disabled={isLoading}
            />
            <div className="form-text">
              Enter your email address and we'll send you instructions to reset your password.
            </div>
          </div>
          
          <div className="d-grid">
            <button 
              type="submit" 
              className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-primary'}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sending...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
          
          <p className="mt-3 text-center">
            <Link 
              to="/login" 
              className={theme === 'dark' ? 'text-light' : 'text-dark'}
            >
              ← Back to Login
            </Link>
          </p>
        </form>
      </div>

      {/* Custom Styles for Dark Mode */}
      <style>
        {`
          .form-control:disabled {
            background-color: ${theme === 'dark' ? '#2d3748' : '#e9ecef'};
            opacity: 0.7;
          }
          .form-text {
            color: ${theme === 'dark' ? '#a0aec0' : '#6c757d'};
          }
          .card {
            border-radius: 10px;
          }
          .btn:disabled {
            opacity: 0.7;
          }
        `}
      </style>
    </div>
  );
};

export default ForgotPassword;