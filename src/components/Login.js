import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { handleLogin, theme } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailErr('');
    setPasswordErr('');
    setIsLoading(true);

    console.log('🔐 Login attempt with:', { email });

    if (!email) {
      setEmailErr('Please enter email.');
      setIsLoading(false);
      return;
    }
    if (!password) {
      setPasswordErr('Please enter password.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🌐 Sending login request to /api/login...');
      
      const response = await axiosInstance.post('/api/login', {
        email: email.trim(),
        password: password,
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('✅ Login response status:', response.status);
      console.log('✅ Login response data:', response.data);

      if (response.data.success) {
        console.log('🎉 Login successful, user data:', response.data.user);
        console.log('🔑 Token received:', response.data.token ? 'Yes' : 'No');

        // Call handleLogin to update context and localStorage
        handleLogin({
          ...response.data.user,
          token: response.data.token,
        });

        // Verify token was stored
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        console.log('💾 Token stored in localStorage:', storedToken ? 'Yes' : 'No');
        console.log('💾 User stored in localStorage:', storedUser ? 'Yes' : 'No');

        // Small delay to ensure state is updated
        setTimeout(() => {
          // Redirect based on role
          console.log('🔄 Redirecting based on role:', response.data.user.role);
          if (response.data.user.role === 'admin') {
            navigate('/admin');
          } else if (response.data.user.role === 'senior') {
            navigate('/dashboard');
          } else {
            navigate('/user-dashboard');
          }
        }, 100);
      } else {
        console.error('❌ Login failed in response:', response.data.message);
        setEmailErr(response.data.message || 'Login failed');
        setPasswordErr(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);

      if (error.response) {
        console.error('Server error response:', error.response.status, error.response.data);
        const errorMessage = error.response.data?.message || 'Login failed';
        
        if (error.response.status === 401) {
          setEmailErr('Invalid email or password');
          setPasswordErr('Invalid email or password');
        } else {
          setEmailErr(errorMessage);
          setPasswordErr(errorMessage);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        setEmailErr('Cannot connect to server. Please check if the server is running.');
        setPasswordErr('Cannot connect to server. Please check if the server is running.');
      } else {
        console.error('Error setting up request:', error.message);
        setEmailErr('An unexpected error occurred');
        setPasswordErr('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testAdminLogin = () => {
    setEmail('seidhussen0729@gmail.com');
    setPassword('Seid2986@');
  };

  return (
    <div className={theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="container d-flex justify-content-center align-items-center flex-grow-1">
        <div className={`card p-4 shadow-sm ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white border-0'}`} style={{ maxWidth: '400px', width: '100%' }}>
          <h2 className="card-title text-center mb-4">Login To Your Account</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                className={`form-control ${emailErr ? 'is-invalid' : ''} ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Enter your email"
              />
              {emailErr && <div className="invalid-feedback">{emailErr}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                name="password"
                id="password"
                className={`form-control ${passwordErr ? 'is-invalid' : ''} ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Enter your password"
              />
              {passwordErr && <div className="invalid-feedback">{passwordErr}</div>}
            </div>

            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
              
              {/* <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={testAdminLogin}
                disabled={isLoading}
              >
                Fill Test Admin Credentials
              </button> */}
            </div>

            <div className="mt-3 text-center">
              <small className="text-muted">
              </small>
            </div>


            <p className="mt-3 text-center">
              <Link to="/forgot-password" className="text-primary">Forgot Password?</Link>
            </p>
          </form>
        </div>
      </div>

      <footer className={`text-center py-3 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'} mt-auto`}>
        <p className="mb-0">&copy; {new Date().getFullYear()} Ethiopian Statistical Service. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;