import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';

const Home = () => {
  const { user, theme } = useContext(UserContext);
  const navigate = useNavigate();
  const [publicStats, setPublicStats] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // === CRITICAL: Robust login check ===
  const isLoggedIn = user && user.id && user.role;

  const isDarkMode = theme === 'dark';
  const bgClass = isDarkMode ? 'bg-dark' : 'bg-white';
  const textClass = isDarkMode ? 'text-light' : 'text-dark';
  const cardBgClass = isDarkMode ? 'bg-secondary text-light' : 'bg-white text-dark';
  const headerBgClass = isDarkMode ? 'bg-dark text-light border-secondary' : 'bg-white text-dark border-bottom';
  const sidebarBgClass = isDarkMode ? 'bg-dark text-light border-secondary' : 'bg-light text-dark border-end';
  const footerBgClass = isDarkMode ? 'bg-black text-light' : 'bg-dark text-white';

  // === AUTO-REDIRECT BASED ON ROLE ===
  useEffect(() => {
    if (isLoggedIn) {
      if (user.role === 'senior') {
        navigate('/senior-dashboard', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (user.role === 'user') {
        navigate('/user-dashboard', { replace: true });
      }
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, user, navigate]);

  // === FETCH PUBLIC STATS (ONLY FOR NON-LOGGED-IN USERS) ===
  useEffect(() => {
    if (!isLoggedIn) {
      const fetchPublicData = async () => {
        try {
          const [statsRes, annRes] = await Promise.all([
            axiosInstance.get('/api/public/stats').catch(() => ({ data: {} })),
            axiosInstance.get('/api/announcements').catch(() => ({ data: { announcements: [] } }))
          ]);

          setPublicStats(statsRes.data || {
            totalUsers: 6,
            totalTickets: 10,
            resolvedTickets: 4,
            activeTickets: 5,
            seniorOfficers: 2,
            avgResponseTime: '2.3h'
          });

          setAnnouncements(annRes.data.announcements || []);
        } catch (error) {
          console.error('Public data error:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchPublicData();
    }
  }, [isLoggedIn]);

  // === SHOW LOADING ONLY FOR PUBLIC PAGE ===
  if (loading && !isLoggedIn) {
    return (
      <div className={`d-flex justify-content-center align-items-center min-vh-100 ${bgClass} ${textClass}`}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}></div>
          <p>Loading Help Desk...</p>
        </div>
      </div>
    );
  }

  // === PUBLIC LANDING PAGE (ONLY WHEN NOT LOGGED IN) ===
  if (!isLoggedIn) {
    return (
      <div className={`min-vh-100 ${bgClass} ${textClass}`}>
        {/* Header */}
        <header className={`navbar navbar-expand-lg navbar-light ${headerBgClass} shadow-sm sticky-top`}>
  <div className="container-fluid">
    <Link className="navbar-brand fw-bold text-primary" to="/">
      <i className="fas fa-headset me-2"></i> IT Help Desk System
    </Link>
    <div className="d-flex align-items-center gap-3">
      <Link to="/help" className="btn btn-outline-primary btn-sm">
        <i className="fas fa-question-circle me-1"></i> Help & FAQ
      </Link>
      <span>Not logged in yet</span>
    </div>
  </div>
</header>

        {/* Hero Section */}
        <div className="container py-5">
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold">IT Help Desk System</h1>
            <p className="lead">Ethiopia Statistics Service Technology Support System</p>
            <hr className="my-4" />
            <p className="mb-4">A modern system serving all technology tickets and support requests</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
              <i className="fas fa-sign-in-alt me-2"></i> Login to Continue
            </button>
          </div>

          {/* Public Stats */}
          <div className="row mb-5">
            <div className="col-12">
              <h2 className="text-center mb-4">Our System Statistics</h2>
              <div className="row justify-content-center">
                {[
                  { icon: 'users', color: 'primary', label: 'Total Users', value: publicStats.totalUsers || 0 },
                  { icon: 'ticket-alt', color: 'success', label: 'Total Tickets', value: publicStats.totalTickets || 0 },
                  { icon: 'check-circle', color: 'info', label: 'Resolved', value: publicStats.resolvedTickets || 0 },
                  { icon: 'sync', color: 'warning', label: 'Active', value: publicStats.activeTickets || 0 },
                  { icon: 'user-shield', color: 'dark', label: 'Technical Staff', value: publicStats.seniorOfficers || 0 },
                  { icon: 'clock', color: 'secondary', label: 'Avg Response', value: publicStats.avgResponseTime || '0h' },
                ].map((stat, i) => (
                  <div key={i} className="col-xl-2 col-md-4 col-sm-6 mb-4">
                    <div className={`card h-100 text-center border-0 shadow-sm ${cardBgClass}`}>
                      <div className="card-body">
                        <div className={`bg-${stat.color}-subtle rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center`} style={{ width: 70, height: 70 }}>
                          <i className={`fas fa-${stat.icon} text-${stat.color} fa-2x`}></i>
                        </div>
                        <h3 className="fw-bold">{stat.value}</h3>
                        <p className="small text-muted">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="row text-center mb-5">
            <div className="col-md-4 mb-4">
              <div className={`card h-100 ${cardBgClass} border-0 shadow-sm`}>
                <div className="card-body">
                  <i className="fas fa-ticket-alt fa-3x text-primary mb-3"></i>
                  <h5>Ticket Submission</h5>
                  <p>Submit tickets for any technology issues</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className={`card h-100 ${cardBgClass} border-0 shadow-sm`}>
                <div className="card-body">
                  <i className="fas fa-robot fa-3x text-success mb-3"></i>
                  <h5>AI Support</h5>
                  <p>AI auto-categorizes and prioritizes tickets</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className={`card h-100 ${cardBgClass} border-0 shadow-sm`}>
                <div className="card-body">
                  <i className="fas fa-chart-line fa-3x text-warning mb-3"></i>
                  <h5>Performance Metrics</h5>
                  <p>Real-time reports and analytics</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={`${footerBgClass} py-4 mt-auto`}>
          <div className="container text-center">
            <p className="mb-0">&copy; {new Date().getFullYear()} Ethiopia Statistics Service. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  // === IF LOGGED IN: REDIRECT HAPPENS IN useEffect, SO NOTHING RENDERS HERE ===
  return null;
};

export default Home;