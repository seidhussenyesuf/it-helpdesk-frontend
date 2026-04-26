import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // ADD useNavigate
import { UserContext, axiosInstance } from '../App';

const ContactSeniorOfficers = () => {
  const [officers, setOfficers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // ADD loading state
  const { user, theme } = useContext(UserContext);
  const navigate = useNavigate(); // ADD navigate

  useEffect(() => {
    // Add admin check here
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    
    fetchSeniorOfficers();
  }, [user, navigate]); // Add dependencies

  const fetchSeniorOfficers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/senior-officers');
      if (response.data.success) {
        setOfficers(response.data.senior_officers);
      }
    } catch (error) {
      setError('Failed to fetch senior officers');
      console.error('Error fetching senior officers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add loading indicator
  if (loading) {
    return (
      <div className={`min-vh-100 d-flex justify-content-center align-items-center ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
        <div className="text-center">
          <div className={`spinner-border ${theme === 'dark' ? 'text-light' : 'text-primary'} mb-3`} style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className={`${theme === 'dark' ? 'text-light' : 'text-dark'}`}>Loading Senior Officers...</h4>
        </div>
      </div>
    );
  }

  // Rest of your component...
  const handleCall = (phoneNumber) => {
    if (phoneNumber && phoneNumber !== 'N/A') {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      alert('Phone number not available');
    }
  };

  const handleSMS = (phoneNumber) => {
    if (phoneNumber && phoneNumber !== 'N/A') {
      window.location.href = `sms:${phoneNumber}`;
    } else {
      alert('Phone number not available');
    }
  };

  return (
    <div className={theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Tabs at the very top - Only show for Admin */}
      {user.role === 'admin' && (
        <div className={theme === 'dark' ? 'bg-secondary' : 'bg-primary'}>
          <div className="container-fluid">
            <div className="d-flex gap-2 py-3">
              <button className={`btn ${theme === 'dark' ? 'btn-warning' : 'btn-light'}`}>
                <i className="fas fa-headset me-2"></i> Contact Senior Officers
              </button>
              <Link 
                to="/admin-register-senior" 
                className={`btn ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-light'}`}
              >
                <i className="fas fa-users-cog me-2"></i> Manage Senior Officers
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Separator Line */}
      <hr className="my-0" />

      <div className="container-fluid px-4 py-4 flex-grow-1">
        <h2 className={`mb-4 ${theme === 'dark' ? 'text-warning' : 'text-primary'}`}>
          <i className="fas fa-headset me-2"></i>
          Contact Senior Officers
        </h2>

        {error && <div className="alert alert-danger">{error}</div>}

        {officers.length === 0 ? (
          <div className={`alert ${theme === 'dark' ? 'alert-warning' : 'alert-info'} text-center`}>
            <i className="fas fa-info-circle me-2"></i>
            No senior officers available at the moment.
          </div>
        ) : (
          <div className="row">
            {officers.map(officer => (
              <div key={officer.email} className="col-md-6 col-lg-4 mb-4">
                <div className={`card h-100 ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}>
                  <div className="card-body d-flex flex-column">
                    <h5 className={`card-title ${theme === 'dark' ? 'text-warning' : 'text-primary'}`}>
                      <i className="fas fa-user-tie me-2"></i>
                      {officer.name}
                    </h5>
                    <div className="card-text flex-grow-1">
                      <p className="mb-2">
                        <strong><i className="fas fa-envelope me-2"></i>Email:</strong><br />
                        <a href={`mailto:${officer.email}`} className="text-decoration-none">
                          {officer.email}
                        </a>
                      </p>
                      <p className="mb-2">
                        <strong><i className="fas fa-phone me-2"></i>Phone:</strong><br />
                        {officer.phone_number || 'N/A'}
                      </p>
                      <p className="mb-3">
                        <strong><i className="fas fa-users me-2"></i>Team:</strong><br />
                        {officer.team_name}
                      </p>
                    </div>
                    <div className="d-grid gap-2">
                      <a 
                        href={`mailto:${officer.email}`} 
                        className="btn btn-primary"
                      >
                        <i className="fas fa-envelope me-2"></i>
                        Email
                      </a>
                      <button
                        onClick={() => handleSMS(officer.phone_number)}
                        className="btn btn-info text-white"
                        disabled={!officer.phone_number || officer.phone_number === 'N/A'}
                      >
                        <i className="fas fa-comment me-2"></i>
                        SMS
                      </button>
                      <button
                        onClick={() => handleCall(officer.phone_number)}
                        className="btn btn-success"
                        disabled={!officer.phone_number || officer.phone_number === 'N/A'}
                      >
                        <i className="fas fa-phone me-2"></i>
                        Call
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Footer */}
      <footer className={`text-center py-3 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'} mt-auto`}>
        <p className="mb-0">&copy; {new Date().getFullYear()} Ethiopian Statistical Service. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ContactSeniorOfficers;