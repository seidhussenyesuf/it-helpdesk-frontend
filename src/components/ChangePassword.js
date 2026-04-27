import React, { useState, useContext } from 'react';
import { UserContext, axiosInstance } from '../App';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, theme } = useContext(UserContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
      setError('All fields are required');
      setIsSubmitting(false);
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (formData.new_password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsSubmitting(false);
      return;
    }

    try {
      // FIXED: Use correct field names matching the form
      const response = await axiosInstance.put('/api/change-password', {
        user_id: user.id || user.user_id,
        current_password: formData.current_password,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password
      });

      if (response.data.success) {
        setSuccess('Password changed successfully!');
        setTimeout(() => {
          if (user.role === 'admin') {
            navigate('/admin-dashboard');
          } else if (user.role === 'senior') {
            navigate('/senior-dashboard');
          } else {
            navigate('/user-dashboard');
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Change password error:', error);
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Invalid current password');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <style>
        {`
          .card { background-color: ${theme === 'dark' ? '#1a202c' : '#fff'}; color: ${theme === 'dark' ? '#e2e8f0' : '#000'}; border-color: ${theme === 'dark' ? '#2d3748' : '#dee2e6'}; }
          .form-control { background-color: ${theme === 'dark' ? '#2d3748' : '#fff'}; color: ${theme === 'dark' ? '#e2e8f0' : '#000'}; border-color: ${theme === 'dark' ? '#4a5568' : '#ced4da'}; }
          .form-control:focus { border-color: #0d6efd; box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25); }
          .form-label { color: ${theme === 'dark' ? '#e2e8f0' : '#000'}; }
        `}
      </style>

      <div className="container mt-5 flex-grow-1">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="card p-4">
          <h2 className="mb-4">Change Password</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Current Password</label>
              <input type="password" name="current_password" className="form-control" value={formData.current_password} onChange={handleChange} required disabled={isSubmitting} />
            </div>
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input type="password" name="new_password" className="form-control" value={formData.new_password} onChange={handleChange} required disabled={isSubmitting} />
            </div>
            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <input type="password" name="confirm_password" className="form-control" value={formData.confirm_password} onChange={handleChange} required disabled={isSubmitting} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;