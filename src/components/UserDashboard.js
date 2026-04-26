import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext, axiosInstance, NotificationsContext } from '../App';
import ProcurementStatusModal from './ProcurementStatusModal';

const UserDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [filterConfig, setFilterConfig] = useState({ status: 'all', priority: 'all' });
  const [queueInfo, setQueueInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTickets, setExpandedTickets] = useState(new Set());
  const [showProcurementModal, setShowProcurementModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const { notifications, unreadCount, fetchNotifications } = useContext(NotificationsContext);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { user, theme } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user.id) {
      fetchTickets();
      fetchQueueInfo();
      fetchNotifications();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const { markAsRead, markAllAsRead, deleteNotification } = useContext(NotificationsContext);

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    switch (notification.type) {
      case 'ticket_assigned':
      case 'ticket_status':
      case 'ticket_resolved':
      case 'ticket_closed':
      case 'comment_added':
        fetchTickets();
        break;
      case 'procurement':
      case 'procurement_message':
      case 'procurement_request':
        setSuccess('Check your equipment requests for updates!');
        break;
      default:
        fetchTickets();
    }
    setShowNotifications(false);
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/user-tickets');
      if (response.data.success) {
        let filteredTickets = filterTickets(response.data.tickets, filterConfig);
        filteredTickets = searchTickets(filteredTickets, searchTerm);
        const sortedTickets = sortTickets(filteredTickets, sortConfig);
        setTickets(sortedTickets);
      }
    } catch (error) {
      console.error('Fetch tickets error:', error);
      setError('Failed to load tickets. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueInfo = async () => {
    try {
      const response = await axiosInstance.get('/api/queue-info');
      if (response.data.success) {
        setQueueInfo(response.data.queueInfo);
      }
    } catch (error) {
      console.error('Fetch queue info error:', error);
    }
  };

  const handleRefresh = () => {
    fetchTickets();
    fetchQueueInfo();
    fetchNotifications();
    setSuccess('🔄 Tickets refreshed successfully!');
  };

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    const sortedTickets = sortTickets(tickets, newSortConfig);
    setTickets(sortedTickets);
  };

  const handleFilter = (type, value) => {
    const newFilterConfig = { ...filterConfig, [type]: value };
    setFilterConfig(newFilterConfig);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const sortTickets = (ticketsToSort, config) => {
    const sortedTickets = [...ticketsToSort];
    sortedTickets.sort((a, b) => {
      if (config.key === 'ticket_id' || config.key === 'priority') {
        const aValue = config.key === 'priority' ? getPriorityValue(a[config.key]) : a[config.key];
        const bValue = config.key === 'priority' ? getPriorityValue(b[config.key]) : b[config.key];
        return config.direction === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        const aValue = a[config.key];
        const bValue = b[config.key];
        if (config.direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      }
    });
    return sortedTickets;
  };

  const filterTickets = (ticketsToFilter, config) => {
    return ticketsToFilter.filter(ticket => {
      const statusMatch = config.status === 'all' || ticket.status === config.status;
      const priorityMatch = config.priority === 'all' || ticket.priority === config.priority;
      return statusMatch && priorityMatch;
    });
  };

  const searchTickets = (ticketsToSearch, term) => {
    if (!term) return ticketsToSearch;
    const searchLower = term.toLowerCase();
    return ticketsToSearch.filter(ticket => 
      ticket.ticket_id.toString().includes(term) ||
      ticket.issue_type.toLowerCase().includes(searchLower) ||
      ticket.description.toLowerCase().includes(searchLower) ||
      ticket.status.toLowerCase().includes(searchLower)
    );
  };

  const getPriorityValue = (priority) => {
    switch (priority) {
      case 'High': return 3;
      case 'Medium': return 2;
      case 'Low': return 1;
      default: return 0;
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const toggleTicketExpansion = (ticketId) => {
    setExpandedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const handleViewProcurement = (ticket) => {
    setSelectedTicket(ticket);
    setShowProcurementModal(true);
  };

  const handleDelete = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
    setDeleteLoading(ticketId);
    try {
      const response = await axiosInstance.delete(`/api/tickets/${ticketId}`);
      if (response.data.success) {
        setTickets(tickets.filter(ticket => ticket.ticket_id !== ticketId));
        setSuccess('✅ Ticket deleted successfully!');
      } else {
        setError('Failed to delete ticket.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete ticket. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // REMOVED: handleCloseTicket function - Close button no longer needed in User Dashboard
  // The close functionality is handled by admin/senior officers

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'High': return 'text-danger fw-bold';
      case 'Medium': return 'text-warning fw-bold';
      case 'Low': return 'text-success fw-bold';
      default: return '';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Open': return 'badge bg-primary';
      case 'In Progress': return 'badge bg-warning text-dark';
      case 'Resolved': return 'badge bg-success';
      case 'Queued': return 'badge bg-secondary';
      case 'Closed': return 'badge bg-dark';
      default: return 'badge bg-secondary';
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'Open': return '📋 Ticket created, not yet handled - Will be assigned to staff';
      case 'In Progress': return '🔄 Work is ongoing - Staff is troubleshooting';
      case 'Resolved': return '✅ Fix applied, waiting for confirmation - Awaiting user/admin approval';
      case 'Queued': return '⏳ Waiting for available officer - Will be assigned when officer is free';
      case 'Closed': return '🔒 Ticket completed and closed';
      default: return 'Unknown status';
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQueueInfo = (ticket) => {
    if (ticket.status === 'Queued' && ticket.queue_position) {
      const today = new Date();
      const estimatedDays = ticket.estimated_wait_days || 2;
      const estimatedDate = new Date(today);
      estimatedDate.setDate(today.getDate() + estimatedDays);
      return {
        date: estimatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        days: estimatedDays,
        position: ticket.queue_position
      };
    }
    return null;
  };

  const canEditTicket = (ticket) => {
    if (user.role === 'user') {
      return ['Open', 'Queued'].includes(ticket.status);
    }
    return true;
  };

  const getAssignmentStatus = (ticket) => {
    switch (ticket.status) {
      case 'Closed': return { text: '🔒 Completed', class: 'text-dark', icon: '🔒' };
      case 'In Progress': return { text: '✅ Assigned to Officer', class: 'text-success', icon: '✅' };
      case 'Queued': return { text: '⏳ Waiting in Queue', class: 'text-warning', icon: '⏳' };
      case 'Resolved': return { text: '✅ Ready to Close', class: 'text-success', icon: '✅' };
      default: return { text: '🔄 Waiting', class: 'text-info', icon: '🔄' };
    }
  };

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

  const getTimelineStatus = (ticket) => {
    const timeline = [];
    timeline.push({ status: 'Created', date: ticket.created_at, active: true, icon: '📋' });
    if (ticket.status === 'Queued' || ticket.status === 'In Progress' || ticket.status === 'Resolved' || ticket.status === 'Closed') {
      timeline.push({ status: 'Queued', date: ticket.queued_at || ticket.created_at, active: ['Queued', 'In Progress', 'Resolved', 'Closed'].includes(ticket.status), icon: '⏳' });
    }
    if (ticket.status === 'In Progress' || ticket.status === 'Resolved' || ticket.status === 'Closed') {
      timeline.push({ status: 'In Progress', date: ticket.in_progress_at, active: ['In Progress', 'Resolved', 'Closed'].includes(ticket.status), icon: '🔄' });
    }
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      timeline.push({ status: 'Resolved', date: ticket.resolved_at, active: ['Resolved', 'Closed'].includes(ticket.status), icon: '✅' });
    }
    if (ticket.status === 'Closed') {
      timeline.push({ status: 'Closed', date: ticket.closed_at, active: true, icon: '🔒' });
    }
    return timeline;
  };

  const totalTickets = tickets.length;
  const queueCount = tickets.filter(t => t.status === 'Queued').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;
  const closedCount = tickets.filter(t => t.status === 'Closed').length;
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const filteredTickets = searchTickets(filterTickets(tickets, filterConfig), searchTerm);

  return (
    <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`} style={{ margin: 0, padding: 0 }}>
      <div className="container-fluid px-3 py-3 flex-grow-1" style={{ width: '100%', maxWidth: '100%', margin: 0, padding: '0 15px' }}>
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="d-flex align-items-center gap-3">
              <h2 className="mb-0">🎫 My Support Tickets</h2>
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
                      <strong>🔔 Notifications</strong>
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
              <button className="btn btn-success btn-sm" onClick={handleRefresh} disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm"></span> : '🔄 Refresh'}
              </button>
            </div>
            <p className={`mt-2 mb-0 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>
              Welcome back, <strong>{user.name || user.email}</strong>! 
              {unreadCount > 0 && <span className="text-warning ms-2">🔔 You have {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}</span>}
            </p>
          </div>
          <div className="col-md-6 text-end">
            <Link to="/submit-ticket" className="btn btn-primary btn-lg">🎫 Submit New Ticket</Link>
          </div>
        </div>

        {/* Error and Success Alerts */}
        {error && <div className={`alert alert-danger alert-dismissible fade show mb-3`} role="alert">❌ {error}<button type="button" className="btn-close" onClick={() => setError('')}></button></div>}
        {success && <div className={`alert alert-success alert-dismissible fade show mb-3`} role="alert">✅ {success}<button type="button" className="btn-close" onClick={() => setSuccess('')}></button></div>}

        {/* Queue Status Banner */}
        {queueInfo && queueInfo.totalPendingTickets > 0 && (
          <div className={`alert alert-warning mb-4`}>
            <div className="row align-items-center">
              <div className="col-md-8">
                <h5 className="alert-heading mb-2">⏳ System Queue Status</h5>
                <p className="mb-1">There are currently <strong>{queueInfo.totalPendingTickets} tickets</strong> waiting in queue.</p>
                <p className="mb-0"><strong>How it works:</strong> Tickets stay in queue until officers have capacity (less than 3 active tickets).</p>
              </div>
              <div className="col-md-4 text-center">
                <div className="display-4 fw-bold text-danger">{queueInfo.totalPendingTickets}</div>
                <small>In Queue</small>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats - HORIZONTAL LAYOUT */}
        <div className="row mb-4 g-3">
          <div className="col-lg-2 col-md-4 col-sm-6">
            <div className={`card ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white border'} h-100`}>
              <div className="card-body text-center p-3">
                <div className="text-primary mb-2" style={{fontSize: '2rem'}}>📋</div>
                <h6 className="card-title mb-1">Total Tickets</h6>
                <h3 className="text-primary mb-0">{totalTickets}</h3>
              </div>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 col-sm-6">
            <div className={`card ${unreadCount > 0 ? 'border-warning' : ''} ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white border'} h-100`}>
              <div className="card-body text-center p-3">
                <div className={`mb-2 ${unreadCount > 0 ? 'text-warning' : 'text-secondary'}`} style={{fontSize: '2rem'}}>🔔</div>
                <h6 className="card-title mb-1">Notifications</h6>
                <h3 className={unreadCount > 0 ? 'text-warning' : 'text-secondary'}>{unreadCount}</h3>
                {unreadCount > 0 && <small className="text-warning">New alerts</small>}
              </div>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 col-sm-6">
            <div className={`card ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white border'} h-100`}>
              <div className="card-body text-center p-3">
                <div className="text-warning mb-2" style={{fontSize: '2rem'}}>⏳</div>
                <h6 className="card-title mb-1">In Queue</h6>
                <h3 className="text-warning mb-0">{queueCount}</h3>
              </div>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 col-sm-6">
            <div className={`card ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white border'} h-100`}>
              <div className="card-body text-center p-3">
                <div className="text-info mb-2" style={{fontSize: '2rem'}}>🔄</div>
                <h6 className="card-title mb-1">In Progress</h6>
                <h3 className="text-info mb-0">{inProgressCount}</h3>
              </div>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 col-sm-6">
            <div className={`card ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white border'} h-100`}>
              <div className="card-body text-center p-3">
                <div className="text-success mb-2" style={{fontSize: '2rem'}}>✅</div>
                <h6 className="card-title mb-1">Resolved</h6>
                <h3 className="text-success mb-0">{resolvedCount}</h3>
              </div>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 col-sm-6">
            <div className={`card ${theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-white border'} h-100`}>
              <div className="card-body text-center p-3">
                <div className="text-dark mb-2" style={{fontSize: '2rem'}}>🔒</div>
                <h6 className="card-title mb-1">Closed</h6>
                <h3 className="text-dark mb-0">{closedCount}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Filters */}
        <div className="mb-4">
          <h4 className="mb-3">🔍 Ticket Filters</h4>
          <div className="row g-3">
            <div className="col-md-4">
              <select 
                className={`form-select ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`} 
                value={filterConfig.status} 
                onChange={(e) => handleFilter('status', e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Queued">Queued</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="col-md-4">
              <select 
                className={`form-select ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`} 
                value={filterConfig.priority} 
                onChange={(e) => handleFilter('priority', e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="col-md-4">
              <select 
                className={`form-select ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`} 
                value={sortConfig.key} 
                onChange={(e) => handleSort(e.target.value)}
              >
                <option value="created_at">Sort by Date Created</option>
                <option value="ticket_id">Sort by Ticket #</option>
                <option value="priority">Sort by Priority</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-primary btn-sm" onClick={() => {
              const sortedTickets = sortTickets(tickets, sortConfig);
              setTickets(sortedTickets);
              fetchTickets();
            }}>
              <i className="fas fa-search me-1"></i> Apply Filters
            </button>
            <button className="btn btn-secondary btn-sm ms-2" onClick={() => {
              setFilterConfig({ status: 'all', priority: 'all' });
              setSortConfig({ key: 'created_at', direction: 'desc' });
              setSearchTerm('');
              fetchTickets();
            }}>
              <i className="fas fa-undo me-1"></i> Reset Filters
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="input-group">
            <span className={`input-group-text ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}>
              <i className="fas fa-search"></i>
            </span>
            <input
              type="text"
              className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
              placeholder="Search by ticket #, description, or issue type..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tickets Table */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
            <p className="mt-2">Loading your tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-4">
              <h4 className="text-muted mb-3">🎉 No Tickets Found</h4>
              <p className="text-muted mb-4">
                {searchTerm || filterConfig.status !== 'all' || filterConfig.priority !== 'all' 
                  ? 'Try adjusting your search or filters to see more results.' 
                  : 'Ready to get help? Submit your first support ticket!'}
              </p>
            </div>
            <Link to="/submit-ticket" className="btn btn-primary btn-lg">🎫 Submit My First Ticket</Link>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className={`table table-hover table-sm ${theme === 'dark' ? 'table-dark' : ''}`} style={{ width: '100%', minWidth: '1200px' }}>
                <thead className={`${theme === 'dark' ? 'bg-secondary text-light' : 'bg-light'}`}>
                  <tr>
                    <th style={{ cursor: 'pointer', width: '8%' }} onClick={() => handleSort('ticket_id')}>Ticket # {getSortIcon('ticket_id')}</th>
                    <th style={{ width: '12%' }}>Issue Type</th>
                    <th style={{ width: '28%' }}>Description & Details</th>
                    <th style={{ cursor: 'pointer', width: '10%' }} onClick={() => handleSort('priority')}>Priority {getSortIcon('priority')}</th>
                    <th style={{ cursor: 'pointer', width: '12%' }} onClick={() => handleSort('status')}>Status {getSortIcon('status')}</th>
                    <th style={{ width: '12%' }}>Assignment</th>
                    <th style={{ cursor: 'pointer', width: '10%' }} onClick={() => handleSort('created_at')}>Created Date {getSortIcon('created_at')}</th>
                    <th style={{ width: '8%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => {
                    const queueInfoTicket = getQueueInfo(ticket);
                    const assignment = getAssignmentStatus(ticket);
                    const isExpanded = expandedTickets.has(ticket.ticket_id);
                    const timeline = getTimelineStatus(ticket);
                    return (
                      <React.Fragment key={ticket.ticket_id}>
                        <tr className={isExpanded ? (theme === 'dark' ? 'table-active bg-secondary' : 'table-active') : ''}>
                          <td><strong>#{ticket.ticket_id}</strong></td>
                          <td><span className="badge bg-info text-dark">{ticket.issue_type}</span></td>
                          <td>
                            <div className="d-flex align-items-start">
                              <span className="me-2 mt-1">
                                {ticket.issue_type === 'Hardware' && '💻'}
                                {ticket.issue_type === 'Software' && '🖥️'}
                                {ticket.issue_type === 'Network' && '🌐'}
                                {ticket.issue_type === 'Security' && '🔒'}
                                {ticket.issue_type === 'Account' && '👤'}
                                {ticket.issue_type === 'Database' && '🗄️'}
                                {ticket.issue_type === 'Configuration' && '⚙️'}
                                {ticket.issue_type === 'Maintenance' && '🔧'}
                                {ticket.issue_type === 'Other' && '❓'}
                              </span>
                              <div className="flex-grow-1">
                                <span 
                                  className={isExpanded ? '' : 'text-truncate d-block'} 
                                  style={{ cursor: 'pointer' }} 
                                  onClick={() => toggleTicketExpansion(ticket.ticket_id)} 
                                  title={ticket.description}
                                >
                                  {ticket.description}
                                </span>
                                {!isExpanded && ticket.description.length > 50 && <small className="text-muted">... (click to expand)</small>}
                                {ticket.attachment && (
                                  <div className="mt-2">
                                    <Link to={`/attachment/${ticket.ticket_id}`} className="btn btn-sm btn-outline-info">
                                      <i className="fas fa-paperclip me-1"></i>View Attachment
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className={getPriorityClass(ticket.priority)}>
                            <strong>{ticket.priority === 'High' && '🔴'}{ticket.priority === 'Medium' && '🟡'}{ticket.priority === 'Low' && '🟢'} {ticket.priority}</strong>
                          </td>
                          <td>
                            <span className={getStatusClass(ticket.status)} title={getStatusDescription(ticket.status)}>
                              {getStatusIcon(ticket.status)} {ticket.status}
                              {ticket.status === 'Queued' && ticket.queue_position && <small className="d-block">Position: #{ticket.queue_position}</small>}
                            </span>
                          </td>
                          <td>
                            <span className={assignment.class}>{assignment.icon} {assignment.text}</span>
                            {ticket.assigned_officer && <small className="d-block text-muted">Officer: {ticket.assigned_officer}</small>}
                          </td>
                          <td><small className="text-muted">{formatDate(ticket.created_at)}</small></td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              <Link to={`/view-ticket/${ticket.ticket_id}`} className="btn btn-outline-primary btn-sm">👁️ View</Link>
                              {canEditTicket(ticket) && <Link to={`/edit-ticket/${ticket.ticket_id}`} className="btn btn-outline-secondary btn-sm">✏️ Edit</Link>}
                              {/* REMOVED: Close button - only available to admin/senior officers */}
                              <button onClick={() => handleViewProcurement(ticket)} className="btn btn-outline-info btn-sm">📦 Equipment</button>
                              <button onClick={() => handleDelete(ticket.ticket_id)} className="btn btn-outline-danger btn-sm" disabled={deleteLoading === ticket.ticket_id}>
                                {deleteLoading === ticket.ticket_id ? <span className="spinner-border spinner-border-sm"></span> : '🗑️ Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan="8" className={`p-3 ${theme === 'dark' ? 'bg-secondary text-light' : 'bg-light text-dark'}`}>
                              <div className="row">
                                <div className="col-md-6">
                                  <h6>📋 Ticket Details</h6>
                                  <p><strong>Description:</strong> {ticket.description}</p>
                                  {ticket.steps_to_reproduce && <p><strong>Steps to Reproduce:</strong> {ticket.steps_to_reproduce}</p>}
                                  {ticket.additional_notes && <p><strong>Additional Notes:</strong> {ticket.additional_notes}</p>}
                                  {ticket.attachment && (
                                    <div className="mt-3">
                                      <h6>📎 Attachment</h6>
                                      <Link to={`/attachment/${ticket.ticket_id}`} className="btn btn-outline-info btn-sm">
                                        <i className="fas fa-paperclip me-1"></i>View Attachment
                                      </Link>
                                    </div>
                                  )}
                                  <h6 className="mt-3">👤 Assignment Info</h6>
                                  <p>
                                    <strong>Status:</strong> {ticket.status}<br/>
                                    <strong>Assigned Officer:</strong> {ticket.assigned_officer || 'Not assigned yet'}<br/>
                                    <strong>Department:</strong> {ticket.department || 'N/A'}
                                  </p>
                                </div>
                                <div className="col-md-6">
                                  <h6>🕓 Progress Timeline</h6>
                                  {timeline.map((step) => (
                                    <div key={step.status} className="timeline-item d-flex align-items-center mb-2">
                                      <div className={`timeline-icon me-3 ${step.active ? 'text-primary' : 'text-muted'}`}>{step.icon}</div>
                                      <div className="flex-grow-1">
                                        <div className={step.active ? 'fw-bold' : 'text-muted'}>{step.status}</div>
                                        <small className="text-muted">{step.date ? formatDate(step.date) : 'Pending...'}</small>
                                      </div>
                                    </div>
                                  ))}
                                  {queueInfoTicket && (
                                    <div className="mt-3 p-3 rounded bg-warning">
                                      <h6>⏳ Queue Information</h6>
                                      <p className="mb-1">
                                        <strong>Position:</strong> #{queueInfoTicket.position} in queue<br/>
                                        <strong>Estimated Start:</strong> {queueInfoTicket.date} ({queueInfoTicket.days} days)
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-end mt-3">
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleTicketExpansion(ticket.ticket_id)}>
                                  Collapse Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="row mt-3">
              <div className="col-md-12 text-center">
                <p className={`mb-0 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>
                  Showing <strong>{filteredTickets.length}</strong> of <strong>{tickets.length}</strong> tickets
                  {searchTerm && ` matching "${searchTerm}"`}
                  {filterConfig.status !== 'all' && ` with status "${filterConfig.status}"`}
                  {filterConfig.priority !== 'all' && ` with priority "${filterConfig.priority}"`}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <footer className={`text-center py-3 ${theme === 'dark' ? 'bg-dark text-light border-top border-secondary' : 'bg-light text-dark border-top'} mt-auto`}>
        <p className="mb-1">&copy; {new Date().getFullYear()} Ethiopian Statistical Service Helpdesk System. All rights reserved.</p>
        <small className="text-muted">Need help? Contact IT Support at <strong>it-support@ess.gov.et</strong></small>
      </footer>

      {selectedTicket && <ProcurementStatusModal ticket={selectedTicket} show={showProcurementModal} onClose={() => { setShowProcurementModal(false); setSelectedTicket(null); }} />}
    </div>
  );
};

export default UserDashboard;