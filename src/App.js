import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

// Import components
import AttachmentViewer from './components/AttachmentViewer';
import Register from './components/Register';
import HelpFAQ from './components/HelpFAQ';
import NewTicket from './components/NewTicket';
import Reports from './components/Reports';
import TeamView from './components/TeamView';
import DebugInfo from './components/DebugInfo';
import Header from './components/Header';
import Home from './components/Home';
import Login from './components/Login';
import AdminBackups from './components/AdminBackups';
import ForgotPassword from './components/ForgotPassword';
import UserDashboard from './components/UserDashboard';
import SubmitTicket from './components/SubmitTicket';
import ViewTicket from './components/ViewTicket';
import EditTicket from './components/EditTicket';
import Profile from './components/Profile';
import ChangePassword from './components/ChangePassword';
import DeleteAccount from './components/DeleteAccount';
import Admin from './components/Admin';
import ContactSeniorOfficers from './components/ContactSeniorOfficers';
import SeniorOfficerDashboard from './components/SeniorOfficerDashboard';
import ManageTicket from './components/ManageTicket';
import AdminDashboard from './components/AdminDashboard';
import AdminManageUsers from './components/AdminManageUsers';
import AdminSystemConfig from './components/AdminSystemConfig';
import AdminManageSeniorOfficers from './components/AdminManageSeniorOfficers';
import AdminReports from './components/AdminReports';

// Create Context for User State
export const UserContext = createContext();
export const NotificationsContext = createContext();

// Set up axios instance with interceptor
const axiosInstance = axios.create({
  baseURL: 'https://it-helpdesk-backend-z8a1.onrender.com',
});

// Mock data for development when APIs are not available
const mockData = {
  dashboardStats: {
    totalTickets: 156,
    openTickets: 42,
    inProgress: 23,
    resolved: 67,
    closed: 24,
    avgResponseTime: '2.3h',
    myWorkload: 5,
    totalTicketsTrend: 12,
    openTicketsTrend: 5,
    inProgressTrend: -2,
    resolvedTrend: 8,
    closedTrend: 3,
    avgResponseTimeTrend: -15
  },
  recentTickets: [
    { 
      id: 1, 
      ticketNumber: '#1045', 
      category: 'Hardware', 
      title: 'Laptop not turning on', 
      priority: 'High', 
      status: 'Open', 
      createdAt: '2024-01-15T10:30:00Z',
      assignedTo: 'John D.'
    }
  ],
  teamMembers: [
    { 
      id: 1, 
      name: 'John Doe', 
      role: 'Network Specialist', 
      department: 'IT',
      availability: 'available',
      currentWorkload: 3,
      maxWorkload: 5,
      totalTickets: 8
    }
  ],
  announcements: [
    { 
      id: 1, 
      title: 'System Maintenance', 
      content: 'Scheduled maintenance on Saturday 2:00 AM - 4:00 AM',
      createdAt: '2024-01-15T00:00:00Z'
    }
  ],
  activityFeed: [
    { 
      id: 1, 
      type: 'ticket_created', 
      message: 'New ticket #1049 created by Alex T.', 
      timestamp: '2024-01-15T14:30:00Z' 
    }
  ]
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    // For development, return mock data when APIs are not available
    const url = error.config?.url;
    if (url?.includes('/api/dashboard/stats')) {
      return Promise.resolve({ data: mockData.dashboardStats });
    }
    if (url?.includes('/api/tickets/recent')) {
      return Promise.resolve({ data: mockData.recentTickets });
    }
    if (url?.includes('/api/team/')) {
      return Promise.resolve({ data: mockData.teamMembers });
    }
    if (url?.includes('/api/announcements')) {
      return Promise.resolve({ data: mockData.announcements });
    }
    if (url?.includes('/api/activity/')) {
      return Promise.resolve({ data: mockData.activityFeed });
    }
    if (url?.includes('/api/tickets/create')) {
      return Promise.resolve({ 
        data: { 
          success: true, 
          message: 'Ticket created successfully! (Demo Mode)',
          ticketId: 'T-' + Date.now()
        } 
      });
    }
    
    return Promise.reject(error);
  }
);

// Export axios instance for use in components
export { axiosInstance };

// Reset Password Component
const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useContext(UserContext);

  const token = searchParams.get('token');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
        confirmPassword: formData.confirmPassword,
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

// Protected Route Components
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(UserContext);
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!user?.user_id || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const ProtectedAdminRoute = ({ children }) => {
  const { user } = useContext(UserContext);
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!user?.user_id || user.role !== 'admin' || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const ProtectedAdminOrSeniorRoute = ({ children }) => {
  const { user } = useContext(UserContext);
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!user?.user_id || !['admin', 'senior'].includes(user.role) || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return {};
      }
    }
    return {};
  });
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isLoading, setIsLoading] = useState(true);

  // 🔔 FIXED: Notifications State with proper structure
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔔 FIXED: Fetch notifications function
  const fetchNotifications = useCallback(async () => {
    if (!user?.user_id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    try {
      const response = await axiosInstance.get('/api/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
      // Don't set mock data - let it fail gracefully
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // 🔔 FIXED: Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await axiosInstance.put(`/api/notifications/${notificationId}/read`);
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Mark as read error:', error);
      // Update locally even if API fails
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // 🔔 FIXED: Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await axiosInstance.put('/api/notifications/mark-all-read');
      if (response.data.success) {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
      // Update locally even if API fails
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    }
  };

  // 🔔 FIXED: Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await axiosInstance.delete(`/api/notifications/${notificationId}`);
      if (response.data.success) {
        const deletedNotif = notifications.find(n => n._id === notificationId);
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        if (deletedNotif && !deletedNotif.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Delete notification error:', error);
      // Delete locally even if API fails
      const deletedNotif = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  // 🔔 FIXED: Poll for notifications
  useEffect(() => {
    if (user?.user_id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (savedUser && token) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch (error) {
          handleCleanLogout();
        }
      } else {
        handleCleanLogout();
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const handleCleanLogout = () => {
    setUser({});
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  useEffect(() => {
    if (user && user.user_id) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleLogin = (userData) => {
    if (!userData || !userData.token) {
      return;
    }

    localStorage.setItem('token', userData.token);

    const completeUserData = {
      ...userData,
      user_id: userData.user_id || userData.id,
      id: userData.id || userData.user_id,
    };

    localStorage.setItem('user', JSON.stringify(completeUserData));
    setUser(completeUserData);
  };

  const handleLogout = () => {
    setUser({});
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-light">Initializing application...</p>
        </div>
      </div>
    );
  }

  // 🔔 FIXED: Notification context value
  const notificationContextValue = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      handleLogout,
      theme,
      toggleTheme,
      handleLogin,
      axiosInstance,
      isLoading,
    }}>
      <NotificationsContext.Provider value={notificationContextValue}>
        <Router future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}>
          <div className={`App ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`} style={{ minHeight: '100vh' }}>
            {/* Header Component - Only one header */}
            <Header />

            <Routes>
              <Route path="/new-ticket" element={<NewTicket />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/team-view" element={<TeamView />} />
              
              {/* Public Routes */}
              <Route path="/attachment/:ticketId" element={<AttachmentViewer />} />
              <Route path="/register" element={<Register />} />
              <Route path="/help" element={<HelpFAQ />} />
              <Route path="/debug" element={<DebugInfo />} />
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected Routes */}
              <Route path="/user-dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
              <Route path="/submit-ticket" element={<ProtectedRoute><SubmitTicket /></ProtectedRoute>} />
              <Route path="/view-ticket/:id" element={<ProtectedRoute><ViewTicket /></ProtectedRoute>} />
              <Route path="/edit-ticket/:id" element={<ProtectedRoute><EditTicket /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
              <Route path="/delete-account" element={<ProtectedRoute><DeleteAccount /></ProtectedRoute>} />
              <Route path="/contact-senior-officers" element={<ProtectedAdminRoute><ContactSeniorOfficers /></ProtectedAdminRoute>} />
              <Route path="/admin/backups" element={<ProtectedAdminRoute><AdminBackups /></ProtectedAdminRoute>} />

              {/* Admin Only Routes */}
              <Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
              <Route path="/admin-dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
              <Route path="/admin-manage-users" element={<ProtectedAdminRoute><AdminManageUsers /></ProtectedAdminRoute>} />
              <Route path="/admin-manage-senior-officers" element={<ProtectedAdminRoute><AdminManageSeniorOfficers /></ProtectedAdminRoute>} />
              <Route path="/admin-system-config" element={<ProtectedAdminRoute><AdminSystemConfig /></ProtectedAdminRoute>} />
              <Route path="/admin-reports" element={<ProtectedAdminRoute><AdminReports /></ProtectedAdminRoute>} />
             

              {/* Admin/Senior Routes */}
              <Route path="/dashboard" element={<ProtectedAdminOrSeniorRoute><SeniorOfficerDashboard /></ProtectedAdminOrSeniorRoute>} />
<Route path="/senior-dashboard" element={<ProtectedAdminOrSeniorRoute><SeniorOfficerDashboard /></ProtectedAdminOrSeniorRoute>} />
              {/* General Protected Routes */}
              <Route path="/manage-ticket/:ticketId" element={<ProtectedRoute><ManageTicket /></ProtectedRoute>} />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </NotificationsContext.Provider>
    </UserContext.Provider>
  );
}

export default App;