import React, { useState, useContext, useEffect } from 'react';
import { UserContext, axiosInstance } from '../App';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, setUser, theme } = useContext(UserContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    team_id: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.id) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        team_id: user.team_id || ''
      });
      // Set avatar preview from existing user data
      const avatarUrl = user.avatar_path 
        ? `http://localhost:5000/${user.avatar_path}` 
        : '/assets/default_avatar.png';
      setAvatarPreview(avatarUrl);
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setIsSubmitting(true);

    if (!formData.name || !formData.email) {
      setErrorMessage('Name and email are required');
      setIsSubmitting(false);
      return;
    }

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('email', formData.email);
    if (formData.phone_number) submitData.append('phone_number', formData.phone_number);
    if (formData.team_id && (user.role === 'admin' || user.role === 'senior')) {
      submitData.append('team_id', formData.team_id);
    }
    if (avatar) submitData.append('avatar', avatar);

    try {
      const response = await axiosInstance.put(`/api/profile/${user.id}`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('Profile update response:', response.data);

      if (response.data.success) {
        // IMPORTANT: Get the updated user from response
        const updatedUserFromServer = response.data.user;
        
        console.log('Updated user from server:', updatedUserFromServer);
        console.log('New avatar_path:', updatedUserFromServer.avatar_path);
        
        // Merge the updated user data with current user
        const updatedUser = {
          ...user,
          ...updatedUserFromServer
        };
        
        // Update context
        setUser(updatedUser);
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setSuccessMessage('Profile updated successfully! Redirecting...');

        // Wait a moment then redirect
        setTimeout(() => {
          if (user.role === 'admin') navigate('/admin-register-senior');
          else if (user.role === 'senior') navigate('/dashboard');
          else navigate('/user-dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to update profile');
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
          .alert-success { color: ${theme === 'dark' ? '#c6f6d5' : '#155724'}; }
          .alert-danger { color: ${theme === 'dark' ? '#fed7d7' : '#721c24'}; }
          .btn-primary { background-color: ${theme === 'dark' ? '#2b6cb0' : '#007bff'}; border-color: ${theme === 'dark' ? '#2b6cb0' : '#007bff'}; }
          .btn-primary:hover { background-color: ${theme === 'dark' ? '#2c5282' : '#0056b3'}; }
          .btn-close { filter: ${theme === 'dark' ? 'invert(1)' : 'none'}; }
        `}
      </style>

      <div className="container mt-5 flex-grow-1">
        <div id="flashMessageContainer">
          {successMessage && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {successMessage}
              <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
            </div>
          )}
          {errorMessage && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {errorMessage}
              <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
            </div>
          )}
        </div>

        <div className="card p-4">
          <h2 className="mb-4 text-center">Profile Management</h2>
          <form onSubmit={handleSubmit} encType="multipart/form-data" className="needs-validation" noValidate>
            <div className="mb-4 d-flex justify-content-center align-items-center flex-column">
              <img 
                src={avatarPreview} 
                alt="Profile Avatar" 
                className="avatar-preview mb-3"
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #dee2e6',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              />
              <label htmlFor="avatar" className="form-label">Update Profile Photo</label>
              <input 
                type="file" 
                name="avatar" 
                id="avatar" 
                className="form-control w-50 text-center" 
                accept="image/jpeg,image/png,image/gif"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              <small className="text-muted mt-2">Max file size: 5MB. Allowed formats: JPG, PNG, GIF</small>
            </div>

            <div className="mb-3">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input type="text" name="name" id="name" className="form-control" value={formData.name} onChange={handleChange} required disabled={isSubmitting} />
              <div className="invalid-feedback">Please provide your name.</div>
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input type="email" name="email" id="email" className="form-control" value={formData.email} onChange={handleChange} required disabled={isSubmitting} />
              <div className="invalid-feedback">Please provide a valid email.</div>
            </div>

            <div className="mb-3">
              <label htmlFor="phone_number" className="form-label">Phone Number</label>
              <input type="tel" name="phone_number" id="phone_number" className="form-control" value={formData.phone_number} onChange={handleChange} disabled={isSubmitting} />
            </div>

            <div className="mb-3">
              <label htmlFor="role" className="form-label">Role</label>
              <input type="text" id="role" className="form-control" value={user.role || ''} disabled />
            </div>

            {user.team_id && (
              <div className="mb-3">
                <label htmlFor="team" className="form-label">Team</label>
                <input type="text" id="team" className="form-control" value={`Team ID: ${user.team_id}`} disabled />
              </div>
            )}

            <div className="d-grid gap-2">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <footer className={`text-center py-3 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'} mt-auto`}>
        <p className="mb-0">&copy; {new Date().getFullYear()} Ethiopian Statistical Service. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Profile;