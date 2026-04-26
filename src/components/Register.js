import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { theme } = useContext(UserContext);
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
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirm_password) {
      setError('Name, email, password, and confirm password are required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // FIXED: Send as FormData instead of JSON
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('confirm_password', formData.confirm_password);
      formDataToSend.append('phone_number', formData.phone_number || '');

      console.log('Sending registration data:', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
        phone_number: formData.phone_number
      });

      const response = await axiosInstance.post('/api/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-vh-100 d-flex align-items-center justify-content-center ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className={`card shadow ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white border-0'}`}>
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <h2 className="card-title fw-bold">Create Account</h2>
                  <p className="text-muted">Join our IT Help Desk system</p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success" role="alert">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="name" className="form-label">Full Name *</label>
                      <input
                        type="text"
                        className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="phone_number" className="form-label">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="+251 XXX XXX XXX"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="password" className="form-label">Password *</label>
                      <input
                        type="password"
                        className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength="6"
                        placeholder="At least 6 characters"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="confirm_password" className="form-label">Confirm Password *</label>
                      <input
                        type="password"
                        className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                        id="confirm_password"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        required
                        minLength="6"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>

                  <div className="d-grid mb-3">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </div>
                </form>

                <hr className="my-4" />

                <div className="text-center">
                  <p className="mb-0">
                    Already have an account?{' '}
                    <Link 
                      to="/login" 
                      className="text-decoration-none fw-bold"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Features Info */}
            <div className={`card mt-4 ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white border-0'}`}>
              <div className="card-body">
                <h6 className="card-title">Why Register?</h6>
                <ul className="small mb-0">
                  <li>Submit IT support tickets with AI-powered categorization</li>
                  <li>Track your ticket progress in real-time</li>
                  <li>Communicate directly with support officers</li>
                  <li>Get automated status updates and notifications</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;