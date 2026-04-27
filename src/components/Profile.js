import React, { useState, useContext, useEffect } from 'react';
import { UserContext, axiosInstance } from '../App';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, setUser, theme } = useContext(UserContext);
  const [formData, setFormData] = useState({ name: '', email: '', phone_number: '' });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user.user_id || user.id) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone_number: user.phone_number || ''
      });
      // Show avatar if exists
      if (user.avatar_path) {
        setAvatarPreview('https://it-helpdesk-backend-z8a1.onrender.com/' + user.avatar_path);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (event) => setAvatarPreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('email', formData.email);
    submitData.append('phone_number', formData.phone_number || '');
    if (avatar) submitData.append('avatar', avatar);

    try {
      const uid = user.user_id || user.id;
      const response = await axiosInstance.put('/api/profile/' + uid, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setSuccessMessage('✅ Profile updated!');
        setUser({ ...user, ...response.data.user });
        localStorage.setItem('user', JSON.stringify({ ...user, ...response.data.user }));
        setTimeout(() => navigate(-1), 1000);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`container mt-5 ${theme === 'dark' ? 'text-light' : ''}`}>
      <div className="card p-4" style={{ background: theme === 'dark' ? '#1a202c' : '#fff', maxWidth: 500, margin: '0 auto' }}>
        <h2 className="mb-4 text-center">Profile</h2>
        
        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="text-center mb-4">
            <img 
              src={avatarPreview || 'https://via.placeholder.com/150'} 
              alt="Avatar" 
              style={{ width: 150, height: 150, borderRadius: '50%', objectFit: 'cover', border: '3px solid #ddd' }}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
            />
            <br />
            <input type="file" accept="image/*" onChange={handleFileChange} className="mt-2" />
          </div>

          <div className="mb-3">
            <label>Name</label>
            <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label>Email</label>
            <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label>Phone</label>
            <input type="text" name="phone_number" className="form-control" value={formData.phone_number} onChange={handleChange} />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;