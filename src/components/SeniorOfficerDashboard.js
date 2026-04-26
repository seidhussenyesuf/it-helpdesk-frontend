import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext, axiosInstance, NotificationsContext } from '../App';
import ProcurementRequestModal from './ProcurementRequestModal';
import ProcurementStatusModal from './ProcurementStatusModal';

const SeniorOfficerDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [workload, setWorkload] = useState({ current: 0, max: 3, available: true });
  const [stats, setStats] = useState({ active: 0, inProgress: 0, resolved: 0, teamTotal: 0 });
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showProcurementRequestModal, setShowProcurementRequestModal] = useState(false);
  const [showProcurementStatusModal, setShowProcurementStatusModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const { notifications, unreadCount, fetchNotifications } = useContext(NotificationsContext);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { user, theme } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.dropdown')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  useEffect(() => {
    if (user && user.team_id) {
      fetchDashboardData();
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get('/api/senior-dashboard');
      
      if (response.data.success) {
        const allTickets = response.data.tickets || [];
        
        const activeTickets = allTickets.filter(t => {
          if (t.status === 'Closed') return false;
          if (t.team_id === user.team_id) return true;
          if (t.assigned_to === user.id) return true;
          return false;
        });
        
        setTickets(activeTickets);
        
        let displayTeamName = response.data.teamName;
        if (!displayTeamName || displayTeamName === 'All Teams') {
          const teamMap = {
            1: 'Hardware Support Team',
            2: 'Software Support Team',
            3: 'Network Operations Team',
            4: 'Security Team',
            5: 'Account Management Team',
            6: 'Database Administration Team',
            7: 'Configuration Management Team',
            8: 'Other Issues Team'
          };
          displayTeamName = teamMap[user.team_id] || `${user.team_name || 'Technical'} Support Team`;
        }
        setTeamName(displayTeamName);
        
        const currentTickets = activeTickets.filter(
          t => t.assigned_to === user.id && t.status === 'In Progress'
        ).length;
        
        setWorkload({
          current: currentTickets,
          max: 3,
          available: currentTickets < 3
        });

        const teamTickets = allTickets.filter(t => t.team_id === user.team_id);
        setStats({
          active: teamTickets.filter(t => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Queued').length,
          inProgress: teamTickets.filter(t => t.status === 'In Progress').length,
          resolved: teamTickets.filter(t => t.status === 'Resolved').length,
          teamTotal: teamTickets.length
        });
        
        console.log(`📊 Dashboard loaded: ${activeTickets.length} active tickets for team ${user.team_id}`);
      } else {
        setError(response.data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Fetch dashboard error:', error);
      setError(error.response?.data?.message || 'Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { markAsRead, markAllAsRead, deleteNotification } = useContext(NotificationsContext);

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    if (notification.type === 'ticket_assigned' || notification.type === 'ticket_updated') {
      fetchDashboardData();
    } else if (notification.type === 'procurement_approved') {
      setSuccess('Equipment request approved! Check procurement status.');
    }
    setShowNotifications(false);
  };

  const handleNewTicket = () => navigate('/new-ticket');
  const handleReports = () => navigate('/reports');
  const handleTeamView = () => navigate('/team-view');
  const handleSettings = () => navigate('/settings');

  const handleRequestEquipment = (ticket) => {
    setSelectedTicket(ticket);
    setShowProcurementRequestModal(true);
  };

  const handleViewProcurement = (ticket) => {
    setSelectedTicket(ticket);
    setShowProcurementStatusModal(true);
  };

  // FIXED: Proper close handler for ProcurementRequestModal
  const handleCloseProcurementRequest = () => {
    setShowProcurementRequestModal(false);
    setSelectedTicket(null);
  };

  // FIXED: Proper close handler for ProcurementStatusModal
  const handleCloseProcurementStatus = () => {
    setShowProcurementStatusModal(false);
    setSelectedTicket(null);
  };

  const handleProcurementSuccess = () => {
    setSuccess('🛒 Equipment request submitted successfully!');
    setShowProcurementRequestModal(false);
    setSelectedTicket(null);
    fetchDashboardData();
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-danger animate-pulse';
      case 'High': return 'bg-danger';
      case 'Medium': return 'bg-warning text-dark';
      case 'Low': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'Critical': return '🔥';
      case 'High': return '🔴';
      case 'Medium': return '🟡';
      case 'Low': return '🟢';
      default: return '⚪';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Open': return 'bg-primary';
      case 'In Progress': return 'bg-warning text-dark';
      case 'Resolved': return 'bg-success';
      case 'Queued': return 'bg-secondary';
      case 'Closed': return 'bg-dark';
      default: return 'bg-secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Open': return '📋';
      case 'In Progress': return '🔄';
      case 'Resolved': return '✅';
      case 'Queued': return '⏳';
      case 'Closed': return '🔒';
      default: return '❓';
    }
  };

  const getTableClass = () => {
    return theme === 'dark' 
      ? 'table table-dark table-bordered table-striped table-hover mb-0' 
      : 'table table-bordered table-striped table-hover mb-0';
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      const response = await axiosInstance.put(`/api/tickets/${ticketId}/status`, { status: newStatus });
      if (response.data.success) {
        await fetchDashboardData();
        setSuccess(`Ticket status updated to ${newStatus}!`);
      } else {
        setError('Failed to update ticket status');
      }
    } catch (error) {
      console.error('Update status error:', error);
      setError('Failed to update ticket status: ' + error.message);
    }
  };

  const handleCloseTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to close this ticket?')) return;
    try {
      const response = await axiosInstance.put(`/api/tickets/${ticketId}/close`);
      if (response.data.success) {
        await fetchDashboardData();
        setSuccess('Ticket closed successfully!');
      } else {
        setError('Failed to close ticket: ' + response.data.message);
      }
    } catch (error) {
      console.error('Close ticket error:', error);
      setError('Failed to close ticket: ' + error.message);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to DELETE this ticket?')) return;
    try {
      const response = await axiosInstance.delete(`/api/tickets/${ticketId}`);
      if (response.data.success) {
        await fetchDashboardData();
        setSuccess('Ticket deleted successfully!');
      } else {
        setError('Failed to delete ticket: ' + response.data.message);
      }
    } catch (error) {
      console.error('Delete ticket error:', error);
      setError('Failed to delete ticket: ' + error.message);
    }
  };

  const handleAssignToMe = async (ticketId) => {
    try {
      setError('');
      const response = await axiosInstance.put(`/api/tickets/${ticketId}/assign`, {
        assigned_to: user.id
      });
      if (response.data.success) {
        setSuccess(`Ticket #${ticketId} assigned to you!`);
        await fetchDashboardData();
      } else {
        setError('Failed to assign ticket: ' + response.data.message);
      }
    } catch (error) {
      console.error('Assign error:', error);
      setError('Failed to assign ticket: ' + error.response?.data?.message || error.message);
    }
  };

  const getTimeSinceCreation = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffHours = Math.floor((now - created) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const clearSuccess = () => setSuccess('');

  if (loading) {
    return (
      <div className={`d-flex justify-content-center align-items-center ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}`} style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading your dashboard...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <div className={`${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white text-dark border-light'} py-4 border-bottom`}>
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h1 className="h3 mb-2">
                <i className="fas fa-headset me-2"></i>
                {teamName ? `${teamName} Command Center` : 'Team Command Center'}
              </h1>
              <p className="mb-0">
                <i className="fas fa-user me-1"></i>
                Welcome back, {user?.name || 'Officer'}!
                {unreadCount > 0 && (
                  <span className="ms-2 text-warning">🔔 You have {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}</span>
                )}
              </p>
            </div>
            <div className="col-md-6 text-end">
              <div className="d-flex justify-content-end align-items-center gap-3">
                <div className="dropdown">
                  <button className={`btn btn-outline-primary position-relative dropdown-toggle ${showNotifications ? 'show' : ''}`} onClick={() => setShowNotifications(!showNotifications)}>
                    <i className="fas fa-bell"></i>
                    {unreadCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <div className={`dropdown-menu dropdown-menu-end p-0 ${showNotifications ? 'show' : ''} ${theme === 'dark' ? 'bg-dark text-light' : ''}`} style={{ width: '350px', maxHeight: '400px', overflowY: 'auto' }}>
                    <div className={`dropdown-header ${theme === 'dark' ? 'bg-secondary text-light' : 'bg-light'}`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <strong>🔔 Dashboard Notifications</strong>
                        {unreadCount > 0 && (
                          <button className="btn btn-sm btn-outline-primary" onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}>Mark all read</button>
                        )}
                      </div>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-3 text-center text-muted">
                        <i className="fas fa-bell-slash fa-2x mb-2"></i>
                        <p className="mb-0">No notifications</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => (
                        <div key={notification._id} className={`dropdown-item p-3 border-bottom ${!notification.read ? (theme === 'dark' ? 'bg-primary bg-opacity-10' : 'bg-light') : ''}`} style={{ cursor: 'pointer' }} onClick={() => handleNotificationClick(notification)}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-1">
                                {notification.type === 'ticket_assigned' && '👤'}
                                {notification.type === 'ticket_updated' && '🔄'}
                                {notification.type === 'ticket_resolved' && '✅'}
                                {notification.type === 'comment_added' && '💬'}
                                {notification.type === 'procurement_approved' && '🛒'}
                                {notification.type === 'system' && '⚙️'}
                                <strong className="ms-2">{notification.title}</strong>
                              </div>
                              <p className="mb-1 small">{notification.message}</p>
                              <small className="text-muted">{new Date(notification.created_at).toLocaleString()}</small>
                            </div>
                            <button className="btn btn-sm btn-outline-danger ms-2" onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }}><i className="fas fa-times"></i></button>
                          </div>
                        </div>
                      ))
                    )}
                    <div className={`dropdown-footer p-2 text-center ${theme === 'dark' ? 'bg-secondary' : 'bg-light'}`}>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowNotifications(false)}>Close</button>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="fs-2 fw-bold text-primary">{stats.active}</div>
                  <small>Team Active</small>
                </div>
                <div className="text-center">
                  <div className="fs-2 fw-bold text-warning">{stats.inProgress}</div>
                  <small>In Progress</small>
                </div>
                <div className="text-center">
                  <div className={`fs-2 fw-bold ${workload.available ? 'text-success' : 'text-warning'}`}>{workload.current}/{workload.max}</div>
                  <small>My Load</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex-grow-1 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-white text-dark'}`}>
        {error && (
          <div className="container-fluid px-4 pt-4">
            <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <div className="flex-grow-1"><strong>Alert:</strong> {error}</div>
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          </div>
        )}
        {success && (
          <div className="container-fluid px-4 pt-4">
            <div className="alert alert-success alert-dismissible fade show d-flex align-items-center" role="alert">
              <i className="fas fa-check-circle me-2"></i>
              <div className="flex-grow-1">{success}</div>
              <button type="button" className="btn-close" onClick={clearSuccess}></button>
            </div>
          </div>
        )}

        <div className="container-fluid px-4 pt-4">
          <div className="row mb-4">
            <div className="col-xl-3 col-md-6 mb-4">
              <div className={`card border-left-primary shadow h-100 py-2 ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white'}`}>
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">My Assigned Tickets</div>
                      <div className={`h5 mb-0 font-weight-bold ${theme === 'dark' ? 'text-light' : 'text-gray-800'}`}>{tickets.filter(t => t.assigned_to === user.id).length}</div>
                    </div>
                    <div className="col-auto"><i className={`fas fa-ticket-alt fa-2x ${theme === 'dark' ? 'text-secondary' : 'text-gray-300'}`}></i></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 mb-4">
              <div className={`card border-left-warning shadow h-100 py-2 ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white'}`}>
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">My In Progress</div>
                      <div className={`h5 mb-0 font-weight-bold ${theme === 'dark' ? 'text-light' : 'text-gray-800'}`}>{tickets.filter(t => t.status === 'In Progress' && t.assigned_to === user.id).length}</div>
                    </div>
                    <div className="col-auto"><i className={`fas fa-sync-alt fa-2x ${theme === 'dark' ? 'text-secondary' : 'text-gray-300'}`}></i></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 mb-4">
              <div className={`card border-left-success shadow h-100 py-2 ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white'}`}>
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-success text-uppercase mb-1">Team Active Tickets</div>
                      <div className={`h5 mb-0 font-weight-bold ${theme === 'dark' ? 'text-light' : 'text-gray-800'}`}>{stats.active}</div>
                    </div>
                    <div className="col-auto"><i className={`fas fa-users fa-2x ${theme === 'dark' ? 'text-secondary' : 'text-gray-300'}`}></i></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 mb-4">
              <div className={`card border-left-info shadow h-100 py-2 ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white'}`}>
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-info text-uppercase mb-1">Workload Capacity</div>
                      <div className={`h5 mb-0 font-weight-bold ${workload.available ? 'text-success' : 'text-warning'}`}>{workload.available ? 'Available' : 'Full'}</div>
                    </div>
                    <div className="col-auto"><i className={`fas fa-${workload.available ? 'check' : 'pause'}-circle fa-2x ${theme === 'dark' ? 'text-secondary' : 'text-gray-300'}`}></i></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`alert alert-info mb-4`}>
            <div className="d-flex align-items-center">
              <i className="fas fa-info-circle me-2 fs-4"></i>
              <div className="flex-grow-1">
                <h6 className="mb-1">Workload System & Auto-Assignment</h6>
                <div className="row small">
                  <div className="col-md-3"><i className="fas fa-check text-success me-1"></i> <strong>Available</strong> when you have less than 3 "In Progress" tickets</div>
                  <div className="col-md-3"><i className="fas fa-exclamation-triangle text-warning me-1"></i> <strong>Full</strong> when you have 3 or more "In Progress" tickets</div>
                  <div className="col-md-3"><i className="fas fa-sync-alt text-primary me-1"></i> <strong>Auto-Assign</strong> new tickets when available</div>
                  <div className="col-md-3"><i className="fas fa-clock text-secondary me-1"></i> <strong>Queued</strong> tickets wait when all officers are full</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="container-fluid px-4">
            <div className={`card text-center py-5 ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white'}`}>
              <div className="card-body">
                <i className={`fas fa-inbox fa-4x mb-3 ${theme === 'dark' ? 'text-secondary' : 'text-muted'}`}></i>
                <h4 className="card-title mb-3">No Active Tickets</h4>
                <p className={`card-text mb-4 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>
                  No tickets assigned to you or waiting in queue for your team.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-100">
            <div className={`d-flex justify-content-between align-items-center py-3 px-4 ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white text-dark border-light'} border-bottom`}>
              <h5 className="mb-0"><i className="fas fa-tasks me-2"></i>Team Tickets</h5>
              <span className={`badge ${theme === 'dark' ? 'bg-secondary' : 'bg-light text-dark'} fs-6`}>{tickets.length} ticket(s)</span>
            </div>
            <div className="table-responsive w-100">
              <table className={getTableClass()} style={{ width: '100%', tableLayout: 'fixed' }}>
                <thead className={`${theme === 'dark' ? 'bg-secondary text-light' : 'bg-light text-dark'}`}>
                  <tr>
                    <th style={{ padding: '15px', textAlign: 'center', width: '8%' }}>Ticket ID</th>
                    <th style={{ padding: '15px', textAlign: 'center', width: '10%' }}>Issue Type</th>
                    <th style={{ padding: '15px', textAlign: 'center', width: '27%' }}>Description</th>
                    <th style={{ padding: '15px', textAlign: 'center', width: '8%' }}>Priority</th>
                    <th style={{ padding: '15px', textAlign: 'center', width: '10%' }}>Status</th>
                    <th style={{ padding: '15px', textAlign: 'center', width: '10%' }}>Assigned To</th>
                    <th style={{ padding: '15px', textAlign: 'center', width: '10%' }}>Submitter</th>
                    <th style={{ padding: '15px', textAlign: 'center', width: '8%' }}>Created</th>
                    <th style={{ padding: '15px', textAlign: 'center', width: '9%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => {
                    const isAssignedToMe = ticket.assigned_to === user.id;
                    const isUnassigned = !ticket.assigned_to;
                    const isInMyTeam = ticket.team_id === user.team_id;

                    return (
                      <tr key={ticket.ticket_id} className="align-middle">
                        <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>#{ticket.ticket_id}</td>
                        <td style={{ padding: '15px', textAlign: 'center' }}><span className="badge bg-info text-dark p-2">{ticket.issue_type}</span></td>
                        <td style={{ padding: '15px', textAlign: 'center' }} title={ticket.description}>
                          <div className="fw-semibold">{ticket.description && ticket.description.length > 60 ? `${ticket.description.substring(0, 60)}...` : ticket.description || 'No description'}</div>
                          {ticket.attachment && (<div className="mt-2"><Link to={`/attachment/${ticket.ticket_id}`} className="btn btn-sm btn-outline-info"><i className="fas fa-paperclip me-1"></i>Attachment</Link></div>)}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}><span className={`badge ${getPriorityBadgeClass(ticket.priority)} p-2`}>{getPriorityIcon(ticket.priority)} {ticket.priority}</span></td>
                        <td style={{ padding: '15px', textAlign: 'center' }}><span className={`badge ${getStatusBadgeClass(ticket.status)} p-2`}>{getStatusIcon(ticket.status)} {ticket.status}</span></td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          {ticket.assigned_to_name || (ticket.assigned_to ? `Officer ${ticket.assigned_to}` : 'Unassigned')}
                          {isAssignedToMe && <span className="badge bg-success ms-1">You</span>}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <div><div className="fw-semibold">{ticket.user_name || 'Unknown'}</div>
                          <small className={theme === 'dark' ? 'text-light' : 'text-muted'}>{ticket.user_email}</small></div>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <div className="text-center"><div className={`small ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>{new Date(ticket.created_at).toLocaleDateString()}</div>
                          <div className="small">{getTimeSinceCreation(ticket.created_at)}</div></div>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <div className="d-flex flex-column gap-1">
                            <Link to={`/manage-ticket/${ticket.ticket_id}`} className="btn btn-outline-primary btn-sm"><i className="fas fa-cog me-1"></i>Manage</Link>
                            
                            {isInMyTeam && (
                              <>
                                {isAssignedToMe ? (
                                  <button className="btn btn-success btn-sm" disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                                    <i className="fas fa-check-circle me-1"></i>Assigned to me
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleAssignToMe(ticket.ticket_id)} 
                                    className="btn btn-outline-success btn-sm"
                                  >
                                    <i className="fas fa-user-check me-1"></i>Assign to Me
                                  </button>
                                )}
                              </>
                            )}
                            
                            <button onClick={() => handleRequestEquipment(ticket)} className="btn btn-outline-warning btn-sm"><i className="fas fa-shopping-cart me-1"></i>Request</button>
                            <button onClick={() => handleViewProcurement(ticket)} className="btn btn-outline-info btn-sm"><i className="fas fa-box me-1"></i>Equipment</button>
                            {ticket.status === 'In Progress' && isAssignedToMe && (
                              <button onClick={() => handleStatusUpdate(ticket.ticket_id, 'Resolved')} className="btn btn-outline-success btn-sm"><i className="fas fa-check me-1"></i>Resolve</button>
                            )}
                            {ticket.status === 'Open' && isAssignedToMe && (
                              <button onClick={() => handleStatusUpdate(ticket.ticket_id, 'In Progress')} className="btn btn-outline-warning btn-sm"><i className="fas fa-play me-1"></i>Start</button>
                            )}
                            {ticket.status === 'Resolved' && isAssignedToMe && (
                              <button onClick={() => handleCloseTicket(ticket.ticket_id)} className="btn btn-outline-dark btn-sm"><i className="fas fa-times me-1"></i>Close</button>
                            )}
                            <button onClick={() => handleDeleteTicket(ticket.ticket_id)} className="btn btn-outline-danger btn-sm"><i className="fas fa-trash me-1"></i>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <footer className={`text-center py-3 ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white text-dark border-light'} mt-auto border-top`}>
        <div className="container-fluid">
          <p className="mb-0"><i className="fas fa-shield-alt me-2"></i><strong>IT Helpdesk System</strong> - {teamName || 'Technical Support'}<span className="mx-2">•</span>&copy; {new Date().getFullYear()} Ethiopian Statistical Service</p>
        </div>
      </footer>

      {/* FIXED: Proper modal rendering with correct close handlers */}
      {selectedTicket && showProcurementRequestModal && (
        <ProcurementRequestModal 
          ticket={selectedTicket} 
          show={showProcurementRequestModal} 
          onClose={handleCloseProcurementRequest} 
          onSuccess={handleProcurementSuccess} 
        />
      )}
      
      {selectedTicket && showProcurementStatusModal && (
        <ProcurementStatusModal 
          ticket={selectedTicket} 
          show={showProcurementStatusModal} 
          onClose={handleCloseProcurementStatus} 
        />
      )}
    </div>
  );
};

export default SeniorOfficerDashboard;