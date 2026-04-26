// src/components/AdminLogin.js
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { handleLogin } = useContext(UserContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axiosInstance.post('/api/auth/login', formData);
      
      if (response.data.success) {
        const userData = response.data.user;
        
        // Check if user is admin
        if (userData.role !== 'admin') {
          setErrorMessage('Only administrators can access this portal');
          return;
        }

        // Call the login handler from context
        handleLogin({
          ...userData,
          token: response.data.token
        });
        
        // Redirect to admin dashboard
        navigate('/admin-dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg border-0">
              <div className="card-header bg-primary text-white text-center py-4">
                <h3 className="mb-0">
                  <i className="fas fa-crown me-2"></i>
                  Admin Portal
                </h3>
                <p className="mb-0 mt-2">Ethiopian Statistical Service</p>
              </div>
              <div className="card-body p-4">
                {errorMessage && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {errorMessage}
                    <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-envelope"></i>
                      </span>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="seidhussen0729@gmail.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label">Password</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-lock"></i>
                      </span>
                      <input
                        type="password"
                        name="password"
                        className="form-control"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Sign In as Admin
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <p className="mb-2">
                    <Link to="/forgot-password" className="text-decoration-none">
                      Forgot Password?
                    </Link>
                  </p>
                  <p className="mb-0">
                    <Link to="/login" className="text-decoration-none">
                      ← Back to User Login
                    </Link>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <small className="text-muted">
                &copy; {new Date().getFullYear()} Ethiopian Statistical Service. Admin Access Only.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;