import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import axios from 'axios';

const ProfileDropdown = ({ user, theme, onThemeChange, onProfileUpdate }) => {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone_number: user.phone_number || '',
    avatar: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('theme');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('This will permanently delete your account and all associated data. This action cannot be undone. Are you sure?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        return;
      }

      const response = await axios.delete(`http://localhost:5000/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('theme');
        alert('Account deleted successfully. You will be redirected to the register page.');
        navigate('/register');
      } else {
        setError(response.data.message || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Delete account error:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to delete account');
      }
    }
  };

  const handleProfileInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'avatar') {
      setProfileData((prev) => ({ ...prev, avatar: files[0] || null }));
    } else {
      setProfileData((prev) => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!profileData.name || !profileData.email) {
      setError('Name and email are required.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        return;
      }
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('email', profileData.email);
      formData.append('phone_number', profileData.phone_number || '');
      if (profileData.avatar) {
        formData.append('avatar', profileData.avatar);
      }
      const response = await axios.put(`http://localhost:5000/api/profile/${user.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setSuccess('Profile updated successfully.');
        setShowProfileModal(false);
        setProfileData((prev) => ({ ...prev, avatar: null }));
        setTimeout(() => setSuccess(''), 3000);
        if (onProfileUpdate) {
          onProfileUpdate(updatedUser);
        }
      } else {
        setError(response.data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (err.response?.status === 404) {
        setError('Profile not found.');
      } else if (err.response?.status === 400 && err.response.data.message.includes('Only image files')) {
        setError('Only image files (JPEG, PNG, GIF) are allowed.');
      } else if (err.response?.status === 400 && err.response.data.message.includes('File too large')) {
        setError('Image file size must be less than 5MB.');
      } else {
        setError(err.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const avatarStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
  };

  const avatarPlaceholderStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#6C788D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    marginRight: '8px',
  };

  return (
    <>
      <li className="nav-item dropdown" style={{ position: 'relative' }}>
        <a
          className="nav-link dropdown-toggle d-flex align-items-center"
          href="#"
          id="navbarDropdownMenuLink"
          role="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          style={{ cursor: 'pointer' }}
        >
          {user.avatar_path ? (
            <img
              src={`http://localhost:5000/${user.avatar_path}`}
              alt="Avatar"
              style={avatarStyle}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            style={{
              ...avatarPlaceholderStyle,
              display: user.avatar_path ? 'none' : 'flex',
            }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span>Menu</span>
        </a>
        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdownMenuLink" style={{ minWidth: '200px' }}>
          <li>
            <h6 className="dropdown-header">Logged in as {user.name}</h6>
          </li>
          <li><hr className="dropdown-divider" /></li>
          <li>
            <button className="dropdown-item" onClick={() => setShowProfileModal(true)}>
              <i className="fas fa-user-circle me-2"></i> Profile
            </button>
          </li>
          <li>
            <button className="dropdown-item" onClick={() => navigate('/change-password')}>
              <i className="fas fa-key me-2"></i> Change Password
            </button>
          </li>
          <li>
            <div className="dropdown-item d-flex align-items-center">
              <i className="fas fa-moon me-2"></i> Dark Theme
              <div className="form-check form-switch ms-auto">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="darkThemeSwitch"
                  checked={theme === 'dark'}
                  onChange={onThemeChange}
                />
              </div>
            </div>
          </li>
          <li><hr className="dropdown-divider" /></li>
          <li>
            <button className="dropdown-item text-danger" onClick={handleDeleteAccount}>
              <i className="fas fa-trash-alt me-2"></i> Delete Account
            </button>
          </li>
          <li>
            <button className="dropdown-item" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt me-2"></i> Logout
            </button>
          </li>
        </ul>
      </li>

      {/* Profile Modal */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Manage Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}
          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
            </div>
          )}
          <form onSubmit={handleProfileUpdate}>
            <div className="mb-3 text-center">
              <label className="form-label">Current Profile Image</label>
              <div className="d-flex justify-content-center align-items-center">
                {user.avatar_path ? (
                  <img
                    src={`http://localhost:5000/${user.avatar_path}`}
                    alt="Profile"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginBottom: '10px',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: '#6C788D',
                    display: user.avatar_path ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '40px',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="profile_avatar" className="form-label">Upload New Profile Image (Optional, max 5MB)</label>
              <input
                type="file"
                className="form-control"
                id="profile_avatar"
                name="avatar"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleProfileInputChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="profile_name" className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                id="profile_name"
                name="name"
                value={profileData.name}
                onChange={handleProfileInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="profile_email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="profile_email"
                name="email"
                value={profileData.email}
                onChange={handleProfileInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="profile_phone_number" className="form-label">Phone Number (Optional)</label>
              <input
                type="tel"
                className="form-control"
                id="profile_phone_number"
                name="phone_number"
                value={profileData.phone_number}
                onChange={handleProfileInputChange}
                pattern="\+?[1-9]\d{1,14}"
                title="Enter a valid phone number (e.g., +1234567890)"
              />
            </div>
            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Updating...
                  </>
                ) : (
                  'Update Profile'
                )}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ProfileDropdown;