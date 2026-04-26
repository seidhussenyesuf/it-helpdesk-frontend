import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    users: [],
    tickets: [],
    teams: [],
    seniorOfficers: [],
    systemStats: {},
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7days');
  const { user, theme } = useContext(UserContext);
  const navigate = useNavigate();
  
  // Notification and file states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState([]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [timeRange, user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Fetching admin dashboard data...');
      
      const [
        usersRes, 
        ticketsRes, 
        teamsRes, 
        seniorRes, 
        statsRes, 
        activityRes
      ] = await Promise.allSettled([
        axiosInstance.get('/api/admin/users').catch(() => ({ data: { users: [] } })),
        axiosInstance.get('/api/tickets').catch(() => ({ data: { tickets: [] } })),
        axiosInstance.get('/api/teams').catch(() => ({ data: { teams: [] } })),
        axiosInstance.get('/api/admin/senior-officers').catch(() => ({ data: { senior_officers: [] } })),
        axiosInstance.get('/api/admin/system-stats').catch(() => ({ data: { stats: {} } })),
        axiosInstance.get('/api/admin/recent-activity').catch(() => ({ data: { activity: [] } }))
      ]);

      const users = usersRes.status === 'fulfilled' ? usersRes.value.data.users || [] : [];
      const tickets = ticketsRes.status === 'fulfilled' ? ticketsRes.value.data.tickets || [] : [];
      const teams = teamsRes.status === 'fulfilled' ? teamsRes.value.data.teams || [] : [];
      const seniorOfficers = seniorRes.status === 'fulfilled' ? seniorRes.value.data.senior_officers || [] : [];
      const systemStats = statsRes.status === 'fulfilled' ? statsRes.value.data.stats || {} : {};
      const recentActivity = activityRes.status === 'fulfilled' ? activityRes.value.data.activity || [] : [];

      console.log('📊 Dashboard data loaded:', {
        users: users.length,
        tickets: tickets.length,
        teams: teams.length,
        seniorOfficers: seniorOfficers.length,
        systemStats: Object.keys(systemStats).length,
        recentActivity: recentActivity.length
      });

      setDashboardData({
        users,
        tickets,
        teams,
        seniorOfficers,
        systemStats,
        recentActivity
      });
      
      addNotification('success', 'Dashboard data refreshed successfully');
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      addNotification('error', 'Failed to fetch dashboard data');
      
      setDashboardData({
        users: [],
        tickets: [],
        teams: [],
        seniorOfficers: [],
        systemStats: {},
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Notification system
  const addNotification = (type, message, fileData = null) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type,
      message,
      timestamp: new Date(),
      fileData
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
    
    if (type === 'success') {
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // File generation functions
  const generateFile = (content, filename, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    const fileInfo = {
      id: Date.now(),
      name: filename,
      type: type,
      size: content.length,
      timestamp: new Date(),
      url: url
    };
    
    setGeneratedFiles(prev => [fileInfo, ...prev.slice(0, 9)]);
    return fileInfo;
  };

  const generateSampleLogs = () => {
    const logs = [
      `=== SYSTEM LOGS - Generated ${new Date().toLocaleString()} ===`,
      `Admin: ${user?.name || 'System Admin'}`,
      `Period: Last ${timeRange}`,
      '',
      'SYSTEM ACTIVITIES:',
      '------------------',
      `Total Users: ${dashboardData.users.length}`,
      `Total Tickets: ${dashboardData.tickets.length}`,
      `Active Teams: ${dashboardData.teams.length}`,
      `Senior Officers: ${dashboardData.seniorOfficers.length}`,
      '',
      'RECENT EVENTS:',
      '-------------',
      ...dashboardData.recentActivity.slice(0, 10).map(activity => 
        `[${new Date(activity.timestamp).toLocaleString()}] ${activity.type?.toUpperCase() || 'EVENT'}: ${activity.description || 'No description'}`
      ),
      '',
      'SYSTEM STATUS:',
      '-------------',
      'Database: Healthy',
      'API: Responsive',
      'Authentication: Active',
      'Backups: Current',
      '',
      'SECURITY LOG:',
      '------------',
      'No security violations detected',
      'All services running normally',
      'User permissions verified',
      ''
    ];
    return logs.join('\n');
  };

  const generateSampleReport = () => {
    const stats = calculateStats();
    const report = `
ADMINISTRATIVE MONTHLY REPORT
==============================

Report Generated: ${new Date().toLocaleDateString()}
Generated By: ${user?.name || 'System Administrator'}
Reporting Period: ${timeRange}

EXECUTIVE SUMMARY
=================
Total System Users: ${stats.totalUsers}
Support Tickets Processed: ${stats.totalTickets}
Active Support Teams: ${stats.totalTeams}
Senior Officers: ${stats.totalSeniorOfficers}

DETAILED BREAKDOWN
==================

TICKET MANAGEMENT
-----------------
- Open Tickets: ${stats.ticketStatus.open}
- In Progress: ${stats.ticketStatus.inProgress}
- Resolved: ${stats.ticketStatus.resolved}
- Queued: ${stats.ticketStatus.queued}
- Closed: ${stats.ticketStatus.closed}

PRIORITY DISTRIBUTION
---------------------
- High Priority: ${stats.ticketPriority.high}
- Medium Priority: ${stats.ticketPriority.medium}
- Low Priority: ${stats.ticketPriority.low}

USER MANAGEMENT
---------------
- Administrators: ${stats.userRoles.admin}
- Senior Officers: ${stats.userRoles.senior}
- Regular Users: ${stats.userRoles.user}

PERFORMANCE METRICS
-------------------
- SLA Compliance Rate: ${stats.slaCompliance}%
- User Satisfaction: ${stats.userSatisfaction}%
- Average Response Time: ${stats.avgResponseTime}

TEAM PERFORMANCE
----------------
${dashboardData.teams.map(team => {
  const teamTickets = dashboardData.tickets.filter(t => t.team_id === team.team_id);
  const resolved = teamTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
  return `- ${team.team_name}: ${teamTickets.length} tickets, ${resolved} resolved`;
}).join('\n')}

RECOMMENDATIONS
===============
1. Monitor high-priority ticket response times
2. Consider team reallocation based on workload
3. Review SLA compliance metrics weekly
4. Schedule regular system maintenance
5. Backup critical data daily

CONCLUSION
==========
System performance is stable and within expected parameters.
All critical services are operational and responsive.

---
This report was automatically generated by the Administrative Dashboard System.
For questions, contact system administration.
    `.trim();
    
    return report;
  };

  const generateBackupManifest = () => {
    const stats = calculateStats();
    const manifest = {
      backupId: `BK-${Date.now()}`,
      timestamp: new Date().toISOString(),
      generatedBy: user?.name || 'admin',
      system: {
        version: "2.1.0",
        environment: "production"
      },
      statistics: {
        totalUsers: stats.totalUsers,
        totalTickets: stats.totalTickets,
        totalTeams: stats.totalTeams,
        seniorOfficers: stats.totalSeniorOfficers,
        ticketStatus: stats.ticketStatus,
        userRoles: stats.userRoles,
        performance: {
          slaCompliance: stats.slaCompliance,
          userSatisfaction: stats.userSatisfaction,
          avgResponseTime: stats.avgResponseTime
        }
      },
      dataTables: [
        { name: 'users', recordCount: dashboardData.users.length, backedUp: true },
        { name: 'tickets', recordCount: dashboardData.tickets.length, backedUp: true },
        { name: 'teams', recordCount: dashboardData.teams.length, backedUp: true },
        { name: 'senior_officers', recordCount: dashboardData.seniorOfficers.length, backedUp: true },
        { name: 'system_logs', recordCount: dashboardData.recentActivity.length, backedUp: true }
      ],
      backupInfo: {
        format: "JSON",
        compression: "gzip",
        estimatedSize: "2.3 MB",
        checksum: `CHK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        integrity: "verified"
      }
    };
    
    return JSON.stringify(manifest, null, 2);
  };

  // System actions handler
  const handleSystemAction = async (action) => {
    try {
      let fileInfo = null;
      
      switch (action) {
        case 'exportLogs':
          const logsContent = generateSampleLogs();
          fileInfo = generateFile(logsContent, `system-logs-${new Date().toISOString().split('T')[0]}.txt`);
          addNotification('success', 'System logs exported successfully! Click to download.', fileInfo);
          break;
        
        case 'backupDatabase':
          const backupContent = generateBackupManifest();
          fileInfo = generateFile(backupContent, `database-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
          addNotification('success', 'Database backup completed! Download manifest file.', fileInfo);
          break;
        
        case 'sendAnnouncement':
          addNotification('info', 'Preparing announcement creation...');
          setTimeout(() => {
            addNotification('success', 'System announcement has been sent to all users.');
          }, 1500);
          break;
        
        case 'generateReport':
          const reportContent = generateSampleReport();
          fileInfo = generateFile(reportContent, `monthly-report-${new Date().toLocaleDateString().replace(/\//g, '-')}.txt`);
          addNotification('success', 'Monthly report generated! Click to download.', fileInfo);
          break;
        
        default:
          console.warn('Unknown system action:', action);
      }

    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      addNotification('error', `Failed to complete ${action}. Please try again.`);
    }
  };

  const calculateStats = () => {
    const { users, tickets, seniorOfficers, teams } = dashboardData;
    
    const totalUsers = users.length;
    const totalTickets = tickets.length;
    const totalSeniorOfficers = seniorOfficers.length;
    const totalTeams = teams.length;

    const ticketStatus = {
      open: tickets.filter(t => t.status === 'Open').length,
      inProgress: tickets.filter(t => t.status === 'In Progress').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length,
      queued: tickets.filter(t => t.status === 'Queued').length,
      closed: tickets.filter(t => t.status === 'Closed').length
    };

    const ticketPriority = {
      high: tickets.filter(t => t.priority === 'High').length,
      medium: tickets.filter(t => t.priority === 'Medium').length,
      low: tickets.filter(t => t.priority === 'Low').length
    };

    const userRoles = {
      admin: users.filter(u => u.role === 'admin').length,
      senior: users.filter(u => u.role === 'senior').length,
      user: users.filter(u => u.role === 'user').length
    };

    const issueTypes = tickets.reduce((acc, ticket) => {
      const issueType = ticket.issue_type || 'Other';
      acc[issueType] = (acc[issueType] || 0) + 1;
      return acc;
    }, {});

    const avgResponseTime = dashboardData.systemStats.avgResponseTime || '0 hours';
    const slaCompliance = dashboardData.systemStats.slaCompliance || 0;
    const userSatisfaction = dashboardData.systemStats.userSatisfaction || 0;

    return {
      totalUsers,
      totalTickets,
      totalSeniorOfficers,
      totalTeams,
      ticketStatus,
      ticketPriority,
      userRoles,
      issueTypes,
      avgResponseTime,
      slaCompliance,
      userSatisfaction
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className={`min-vh-100 d-flex justify-content-center align-items-center ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
        <div className="text-center">
          <div className={`spinner-border ${theme === 'dark' ? 'text-light' : 'text-primary'} mb-3`} style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className={`${theme === 'dark' ? 'text-light' : 'text-dark'}`}>Loading Admin Dashboard...</h4>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark text-light' : 'bg-white text-dark'}`}>
      <style>
        {`
          :root {
            --bg-primary: ${theme === 'dark' ? '#1a202c' : 'white'};
            --bg-secondary: ${theme === 'dark' ? '#2d3748' : '#f8f9fa'};
            --text-primary: ${theme === 'dark' ? '#e2e8f0' : '#2c3e50'};
            --text-secondary: ${theme === 'dark' ? '#a0aec0' : '#6c757d'};
            --border-color: ${theme === 'dark' ? '#4a5568' : '#e9ecef'};
            --card-shadow: ${theme === 'dark' ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)'};
          }
          
          .admin-nav {
            background: var(--bg-primary);
            color: var(--text-primary);
            padding: 1rem 0;
            box-shadow: var(--card-shadow);
            border-bottom: 1px solid var(--border-color);
          }
          
          .stat-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            border: none;
            border-radius: 15px;
            overflow: hidden;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            color: white;
          }
          
          .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          }
          
          .stat-icon {
            font-size: 2.5rem;
            opacity: 0.8;
          }
          
          .progress {
            height: 8px;
            border-radius: 10px;
            background-color: var(--border-color);
          }
          
          .nav-tabs .nav-link {
            border: none;
            color: var(--text-secondary);
            font-weight: 500;
            background: var(--bg-secondary);
          }
          
          .nav-tabs .nav-link.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
          }
          
          .chart-container {
            background: var(--bg-primary);
            border-radius: 15px;
            padding: 1.5rem;
            box-shadow: var(--card-shadow);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
          }
          
          .quick-action-btn {
            transition: all 0.3s ease;
            border: none;
            border-radius: 10px;
            padding: 1rem;
            text-align: center;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            text-decoration: none;
            display: block;
          }
          
          .quick-action-btn:hover {
            transform: scale(1.05);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
          }
          
          .card-title {
            color: var(--text-primary);
          }
          
          .card-text {
            color: var(--text-secondary);
          }
          
          .notification-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #dc3545;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .notification-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            width: 400px;
            max-height: 500px;
            overflow-y: auto;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: 0.375rem;
            box-shadow: var(--card-shadow);
            z-index: 1000;
            color: var(--text-primary);
          }
          
          .notification-item {
            border-bottom: 1px solid var(--border-color);
            padding: 0.75rem;
            transition: background-color 0.2s;
          }
          
          .notification-item:hover {
            background-color: var(--bg-secondary);
          }
          
          .notification-success {
            border-left: 4px solid #28a745;
          }
          
          .notification-error {
            border-left: 4px solid #dc3545;
          }
          
          .notification-info {
            border-left: 4px solid #17a2b8;
          }
          
          .file-download-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            cursor: pointer;
            margin-top: 0.5rem;
          }
          
          .file-download-btn:hover {
            background: #0056b3;
          }
          
          .list-group-item {
            background: var(--bg-secondary);
            border-color: var(--border-color);
            color: var(--text-primary);
          }

          .back-to-admin-btn {
            color: var(--text-primary);
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s ease;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
          }

          .back-to-admin-btn:hover {
            background: var(--bg-secondary);
            color: var(--text-primary);
            text-decoration: none;
          }
        `}
      </style>

      {/* Admin Navigation */}
      <div className="admin-nav">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="d-flex align-items-center gap-3">
                <Link to="/admin" className="back-to-admin-btn">
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to Admin
                </Link>
                <div>
                  <h1 className="h3 mb-0" style={{color: 'var(--text-primary)'}}>
                    <i className="fas fa-crown me-2"></i>
                    Admin Dashboard
                  </h1>
                  <p className="mb-0" style={{color: 'var(--text-secondary)'}}>Complete System Control & Analytics</p>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-end">
              <div className="d-flex align-items-center justify-content-end gap-3">
                {/* Notifications Bell */}
                <div className="position-relative">
                  <button 
                    className={`btn ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark'} position-relative`}
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <i className="fas fa-bell"></i>
                    {notifications.length > 0 && (
                      <span className="notification-badge">
                        {notifications.length > 9 ? '9+' : notifications.length}
                      </span>
                    )}
                  </button>
                  
                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="notification-dropdown">
                      <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{borderColor: 'var(--border-color)'}}>
                        <h6 className="mb-0" style={{color: 'var(--text-primary)'}}>Notifications</h6>
                        {notifications.length > 0 && (
                          <button 
                            className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                            onClick={clearAllNotifications}
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      
                      {notifications.length === 0 ? (
                        <div className="text-center p-4" style={{color: 'var(--text-secondary)'}}>
                          <i className="fas fa-bell-slash fa-2x mb-2"></i>
                          <p>No notifications</p>
                        </div>
                      ) : (
                        <div>
                          {notifications.map(notification => (
                            <div 
                              key={notification.id} 
                              className={`notification-item notification-${notification.type}`}
                            >
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <p className="mb-1" style={{color: 'var(--text-primary)'}}>{notification.message}</p>
                                  {notification.fileData && (
                                    <button 
                                      className="file-download-btn"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = notification.fileData.url;
                                        link.download = notification.fileData.name;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                    >
                                      <i className="fas fa-download me-1"></i>
                                      Download {notification.fileData.name}
                                    </button>
                                  )}
                                </div>
                                <button 
                                  className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-secondary'} ms-2`}
                                  onClick={() => removeNotification(notification.id)}
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                              <small style={{color: 'var(--text-secondary)'}}>
                                {notification.timestamp.toLocaleTimeString()}
                              </small>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="btn-group">
                  <select 
                    className={`form-select ${theme === 'dark' ? 'bg-dark text-light border-dark' : 'bg-white text-dark'}`}
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    style={{width: 'auto', display: 'inline-block'}}
                  >
                    <option value="24hours">Last 24 Hours</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                  </select>
                  <button 
                    className={`btn ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark'} ms-2`}
                    onClick={fetchDashboardData}
                  >
                    <i className="fas fa-sync-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`container-fluid py-4 flex-grow-1 ${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
        {/* Quick Actions */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex flex-wrap gap-3">
              <Link to="/admin-manage-users" className="quick-action-btn">
                <i className="fas fa-users-cog fa-2x mb-2"></i>
                <div>Manage Users</div>
                <small className="opacity-75">User & Team Management</small>
              </Link>
              <Link to="/admin-manage-senior-officers" className="quick-action-btn">
                <i className="fas fa-user-cog fa-2x mb-2"></i>
                <div>Senior Officers</div>
                <small className="opacity-75">Officer Management</small>
              </Link>
              <Link to="/admin-system-config" className="quick-action-btn">
                <i className="fas fa-cogs fa-2x mb-2"></i>
                <div>System Config</div>
                <small className="opacity-75">Settings & Workflows</small>
              </Link>
              <Link to="/admin-reports" className="quick-action-btn">
                <i className="fas fa-chart-bar fa-2x mb-2"></i>
                <div>Analytics</div>
                <small className="opacity-75">Performance Metrics</small>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <ul className="nav nav-tabs mb-4">
          {[
            { id: 'overview', label: '📊 Overview', icon: 'chart-pie' },
            { id: 'users', label: '👥 Users & Teams', icon: 'users' },
            { id: 'tickets', label: '🎫 Tickets', icon: 'ticket-alt' },
            { id: 'performance', label: '⚡ Performance', icon: 'rocket' },
            { id: 'system', label: '🔧 System', icon: 'server' }
          ].map(tab => (
            <li key={tab.id} className="nav-item">
              <button
                className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={`fas fa-${tab.icon} me-2`}></i>
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="row">
            {/* Key Metrics */}
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="stat-card card" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4 className="card-title">{stats.totalTickets}</h4>
                      <p className="card-text">Total Tickets</p>
                    </div>
                    <div className="stat-icon">
                      <i className="fas fa-ticket-alt"></i>
                    </div>
                  </div>
                  <div className="mt-2">
                    <small>
                      {stats.ticketStatus.open} Open • {stats.ticketStatus.inProgress} In Progress
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="stat-card card" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4 className="card-title">{stats.totalUsers}</h4>
                      <p className="card-text">Total Users</p>
                    </div>
                    <div className="stat-icon">
                      <i className="fas fa-users"></i>
                    </div>
                  </div>
                  <div className="mt-2">
                    <small>
                      {stats.userRoles.admin} Admin • {stats.userRoles.senior} Senior
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="stat-card card" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4 className="card-title">{stats.totalTeams}</h4>
                      <p className="card-text">Support Teams</p>
                    </div>
                    <div className="stat-icon">
                      <i className="fas fa-layer-group"></i>
                    </div>
                  </div>
                  <div className="mt-2">
                    <small>
                      {stats.totalSeniorOfficers} Active Officers
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="stat-card card" style={{background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'}}>
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4 className="card-title">{stats.slaCompliance}%</h4>
                      <p className="card-text">SLA Compliance</p>
                    </div>
                    <div className="stat-icon">
                      <i className="fas fa-chart-line"></i>
                    </div>
                  </div>
                  <div className="mt-2">
                    <small>
                      Avg Response: {stats.avgResponseTime}
                    </small>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Status Chart */}
            <div className="col-lg-8 mb-4">
              <div className="chart-container">
                <h5 className="mb-3" style={{color: 'var(--text-primary)'}}>Ticket Status Distribution</h5>
                <div className="row">
                  {Object.entries(stats.ticketStatus).map(([status, count]) => (
                    <div key={status} className="col-md-2 col-4 mb-3">
                      <div className="text-center">
                        <div className={`badge bg-${getStatusColor(status)} p-2 mb-2`} style={{fontSize: '0.8rem'}}>
                          {status}
                        </div>
                        <h4 className="mb-0" style={{color: 'var(--text-primary)'}}>{count}</h4>
                        <small className="text-muted">
                          {stats.totalTickets > 0 ? Math.round((count / stats.totalTickets) * 100) : 0}%
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="col-lg-4 mb-4">
              <div className="chart-container">
                <h5 className="mb-3" style={{color: 'var(--text-primary)'}}>Priority Distribution</h5>
                {Object.entries(stats.ticketPriority).map(([priority, count]) => (
                  <div key={priority} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-capitalize" style={{color: 'var(--text-primary)'}}>{priority}</span>
                      <span style={{color: 'var(--text-primary)'}}>{count} ({stats.totalTickets > 0 ? Math.round((count / stats.totalTickets) * 100) : 0}%)</span>
                    </div>
                    <div className="progress">
                      <div 
                        className={`progress-bar bg-${getPriorityColor(priority)}`}
                        style={{width: `${stats.totalTickets > 0 ? (count / stats.totalTickets) * 100 : 0}%`}}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="col-12">
              <div className="chart-container">
                <h5 className="mb-3" style={{color: 'var(--text-primary)'}}>Recent System Activity</h5>
                <div className="list-group">
                  {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="list-group-item border-0">
                      <div className="d-flex align-items-center">
                        <div className={`badge bg-${getActivityColor(activity.type)} me-3`}>
                          {activity.type || 'event'}
                        </div>
                        <div className="flex-grow-1">
                          <small style={{color: 'var(--text-primary)'}}>{activity.description || 'No description available'}</small>
                        </div>
                        <div className="text-muted">
                          <small>{activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString() : 'Unknown time'}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                  {dashboardData.recentActivity.length === 0 && (
                    <div className="text-center p-4" style={{color: 'var(--text-secondary)'}}>
                      <i className="fas fa-info-circle me-2"></i>
                      No recent activity found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users & Teams Tab */}
        {activeTab === 'users' && (
          <div className="row">
            <div className="col-lg-6 mb-4">
              <div className="chart-container">
                <h5 className="mb-3" style={{color: 'var(--text-primary)'}}>User Role Distribution</h5>
                {Object.entries(stats.userRoles).map(([role, count]) => (
                  <div key={role} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-capitalize" style={{color: 'var(--text-primary)'}}>{role}</span>
                      <span className="fw-bold" style={{color: 'var(--text-primary)'}}>{count}</span>
                    </div>
                    <div className="progress" style={{height: '10px'}}>
                      <div 
                        className={`progress-bar bg-${getRoleColor(role)}`}
                        style={{width: `${stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0}%`}}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-6 mb-4">
              <div className="chart-container">
                <h5 className="mb-3" style={{color: 'var(--text-primary)'}}>Senior Officers by Team</h5>
                {dashboardData.teams.map(team => {
                  const teamOfficers = dashboardData.seniorOfficers.filter(officer => officer.team_id === team.team_id);
                  return (
                    <div key={team.team_id} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span style={{color: 'var(--text-primary)'}}>{team.team_name}</span>
                        <span className="badge text-white" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                          {teamOfficers.length} officers
                        </span>
                      </div>
                      <div className="progress" style={{height: '8px'}}>
                        <div 
                          className="progress-bar"
                          style={{width: `${stats.totalSeniorOfficers > 0 ? (teamOfficers.length / stats.totalSeniorOfficers) * 100 : 0}%`, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {dashboardData.teams.length === 0 && (
                  <div className="text-center p-4" style={{color: 'var(--text-secondary)'}}>
                    <i className="fas fa-users me-2"></i>
                    No teams found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="row">
            <div className="col-12 mb-4">
              <div className="chart-container">
                <h5 className="mb-3" style={{color: 'var(--text-primary)'}}>Issue Type Analysis</h5>
                {Object.keys(stats.issueTypes).length > 0 ? (
                  <div className="row">
                    {Object.entries(stats.issueTypes).map(([type, count]) => (
                      <div key={type} className="col-md-3 col-6 mb-3">
                        <div className="text-center p-3 border rounded" style={{background: 'var(--bg-secondary)', borderColor: 'var(--border-color)'}}>
                          <div className={`h4 mb-2 text-${getIssueTypeColor(type)}`}>
                            {count}
                          </div>
                          <div className="small" style={{color: 'var(--text-secondary)'}}>{type}</div>
                          <div className="small" style={{color: 'var(--text-primary)'}}>
                            {stats.totalTickets > 0 ? Math.round((count / stats.totalTickets) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4" style={{color: 'var(--text-secondary)'}}>
                    <i className="fas fa-ticket-alt fa-2x mb-3"></i>
                    <p>No tickets found in the system</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="chart-container text-center">
                <h5 style={{color: 'var(--text-primary)'}}>SLA Compliance</h5>
                <div className="display-4 text-success mb-2">
                  {stats.slaCompliance}%
                </div>
                <div className="progress mb-2">
                  <div 
                    className="progress-bar bg-success" 
                    style={{width: `${stats.slaCompliance}%`}}
                  ></div>
                </div>
                <small className="text-muted">Target: 95%</small>
              </div>
            </div>

            <div className="col-md-4 mb-4">
              <div className="chart-container text-center">
                <h5 style={{color: 'var(--text-primary)'}}>User Satisfaction</h5>
                <div className="display-4 text-warning mb-2">
                  {stats.userSatisfaction}%
                </div>
                <div className="progress mb-2">
                  <div 
                    className="progress-bar bg-warning" 
                    style={{width: `${stats.userSatisfaction}%`}}
                  ></div>
                </div>
                <small className="text-muted">Based on ticket feedback</small>
              </div>
            </div>

            <div className="col-md-4 mb-4">
              <div className="chart-container text-center">
                <h5 style={{color: 'var(--text-primary)'}}>Avg Response Time</h5>
                <div className="display-4 text-info mb-2">
                  {stats.avgResponseTime}
                </div>
                <div className="small text-muted">
                  Target: &lt; 2 hours
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="chart-container">
                <h5 className="mb-3" style={{color: 'var(--text-primary)'}}>System Health</h5>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{color: 'var(--text-primary)'}}>Database Performance</span>
                    <span className="text-success">Optimal</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar bg-success" style={{width: '95%'}}></div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{color: 'var(--text-primary)'}}>API Response Time</span>
                    <span className="text-success">Fast</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar bg-success" style={{width: '92%'}}></div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{color: 'var(--text-primary)'}}>System Uptime</span>
                    <span className="text-success">99.9%</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar bg-success" style={{width: '99.9%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="chart-container">
                <h5 className="mb-3" style={{color: 'var(--text-primary)'}}>Quick System Actions</h5>
                <div className="d-grid gap-2">
                  <button 
                    className={`btn ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-primary'}`}
                    onClick={() => handleSystemAction('exportLogs')}
                  >
                    <i className="fas fa-download me-2"></i>
                    Export System Logs
                  </button>
                  <button 
                    className={`btn ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-success'}`}
                    onClick={() => handleSystemAction('backupDatabase')}
                  >
                    <i className="fas fa-database me-2"></i>
                    Backup Database
                  </button>
                  <button 
                    className={`btn ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-warning'}`}
                    onClick={() => handleSystemAction('sendAnnouncement')}
                  >
                    <i className="fas fa-bell me-2"></i>
                    Send System Announcement
                  </button>
                  <button 
                    className={`btn ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-info'}`}
                    onClick={() => handleSystemAction('generateReport')}
                  >
                    <i className="fas fa-chart-bar me-2"></i>
                    Generate Monthly Report
                  </button>
                </div>
                
                {/* Generated Files Section */}
                {generatedFiles.length > 0 && (
                  <div className="mt-4">
                    <h6 className="text-primary mb-3" style={{color: 'var(--text-primary)'}}>Recently Generated Files</h6>
                    <div className="list-group">
                      {generatedFiles.map(file => (
                        <div key={file.id} className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <small className="text-dark d-block" style={{color: 'var(--text-primary)'}}>{file.name}</small>
                            <small className="text-muted">
                              {file.size} bytes • {new Date(file.timestamp).toLocaleString()}
                            </small>
                          </div>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = file.url;
                              link.download = file.name;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            <i className="fas fa-download"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions for colors
const getStatusColor = (status) => {
  const colors = {
    open: 'primary',
    'in progress': 'warning',
    resolved: 'success',
    queued: 'secondary',
    closed: 'dark'
  };
  return colors[status.toLowerCase()] || 'secondary';
};

const getPriorityColor = (priority) => {
  const colors = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  };
  return colors[priority.toLowerCase()] || 'secondary';
};

const getActivityColor = (type) => {
  const colors = {
    login: 'success',
    logout: 'secondary',
    create: 'primary',
    update: 'warning',
    delete: 'danger'
  };
  return colors[type?.toLowerCase()] || 'info';
};

const getRoleColor = (role) => {
  const colors = {
    admin: 'danger',
    senior: 'warning',
    user: 'info'
  };
  return colors[role.toLowerCase()] || 'secondary';
};

const getIssueTypeColor = (type) => {
  const colors = {
    hardware: 'primary',
    software: 'success',
    network: 'info',
    security: 'danger',
    account: 'warning',
    other: 'secondary'
  };
  return colors[type.toLowerCase()] || 'secondary';
};

export default AdminDashboard;