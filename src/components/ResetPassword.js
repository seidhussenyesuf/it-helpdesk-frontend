import React, { useState, useContext } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useContext(UserContext);

  const token = searchParams.get('token');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    if (!token) {
      setError('Invalid reset link');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post('/api/auth/reset-password', {
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      if (response.data.success) {
        setMessage('Password has been reset successfully! You can now login with your new password.');
        setFormData({ newPassword: '', confirmPassword: '' });
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={`min-vh-100 d-flex justify-content-center align-items-center ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
        <div className={`card p-4 shadow-sm ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white border-0'}`} style={{ maxWidth: '400px', width: '100%' }}>
          <div className="alert alert-danger">
            Invalid or missing reset token. Please request a new password reset link.
          </div>
          <Link to="/forgot-password" className="btn btn-primary">
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-vh-100 d-flex justify-content-center align-items-center ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <div className={`card p-4 shadow-sm ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white border-0'}`} style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="card-title text-center mb-4">Reset Password</h2>
        
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="newPassword" className="form-label">New Password</label>
            <input
              type="password"
              className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Enter new password"
              disabled={isLoading}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              type="password"
              className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Confirm new password"
              disabled={isLoading}
            />
          </div>
          
          <div className="d-grid">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Resetting...
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
    </div>
  );
};

export default ResetPassword;