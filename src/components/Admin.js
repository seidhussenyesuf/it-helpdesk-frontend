import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [teams, setTeams] = useState([]);
  const [seniorOfficers, setSeniorOfficers] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [deletingUserId, setDeletingUserId] = useState(null);
  
  // Country codes for phone input with validation patterns
  const countryCodes = [
    { code: '+1', country: 'USA/Canada', pattern: /^\d{10}$/, example: '2125551234' },
    { code: '+44', country: 'UK', pattern: /^\d{10}$/, example: '7911123456' },
    { code: '+251', country: 'Ethiopia', pattern: /^[79]\d{8}$/, example: '912345678 or 712345678' },
    { code: '+254', country: 'Kenya', pattern: /^\d{9}$/, example: '712345678' },
    { code: '+234', country: 'Nigeria', pattern: /^\d{10}$/, example: '8021234567' },
    { code: '+27', country: 'South Africa', pattern: /^\d{9}$/, example: '712345678' },
    { code: '+33', country: 'France', pattern: /^\d{9}$/, example: '612345678' },
    { code: '+49', country: 'Germany', pattern: /^\d{10,11}$/, example: '15123456789' },
    { code: '+91', country: 'India', pattern: /^\d{10}$/, example: '9876543210' },
    { code: '+86', country: 'China', pattern: /^\d{11}$/, example: '13812345678' },
    { code: '+81', country: 'Japan', pattern: /^\d{10}$/, example: '9012345678' },
    { code: '+55', country: 'Brazil', pattern: /^\d{10,11}$/, example: '11987654321' },
    { code: '+61', country: 'Australia', pattern: /^\d{9}$/, example: '412345678' },
    { code: '+7', country: 'Russia', pattern: /^\d{10}$/, example: '9123456789' },
    { code: '+971', country: 'UAE', pattern: /^\d{9}$/, example: '501234567' },
    { code: '+966', country: 'Saudi Arabia', pattern: /^\d{9}$/, example: '512345678' }
  ];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone_country_code: '+251',
    phone_number: '',
    role: 'user',
    team_id: ''
  });
  const [editUser, setEditUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [ticketFilter, setTicketFilter] = useState({
    status: '',
    priority: '',
    issue_type: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const { user, theme } = useContext(UserContext);
  const userId = user.user_id || user.id;
  const navigate = useNavigate();

  const [editingTicket, setEditingTicket] = useState(null);
  const [assigningTicket, setAssigningTicket] = useState(null);
  const [ticketEditData, setTicketEditData] = useState({
    description: '',
    priority: '',
    status: '',
    issue_type: '',
    team_id: ''
  });
  const [assignmentData, setAssignmentData] = useState({
    team_id: '',
    assigned_to: ''
  });

  const TEAM_MAP = {
    1: 'Hardware Support Team',
    2: 'Software Support Team',
    3: 'Network Operations Team',
    4: 'Security Team',
    5: 'Account Management Team',
    6: 'Database Administration Team',
    7: 'Configuration Management Team',
    8: 'System Maintenance Team',
    9: 'Other Issues Team'
  };

  useEffect(() => {
    if (!user?.user_id || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchUsers();
    fetchTickets();
    fetchTeams();
    fetchSeniorOfficers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/users');
      if (response.data.success) {
        const usersWithTeamNames = response.data.users.map(user => ({
          ...user,
          team_name: getDisplayTeamName(user.team_id, user.role)
        }));
        setUsers(usersWithTeamNames);
      }
    } catch (error) {
      setErrorMessage('Error fetching users: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/tickets', {
        params: ticketFilter
      });
      if (response.data.success) {
        const sortedTickets = sortTickets(response.data.tickets || [], sortConfig);
        setTickets(sortedTickets);
      }
    } catch (error) {
      setErrorMessage('Error fetching tickets: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axiosInstance.get('/api/teams');
      if (response.data.success) {
        setTeams(response.data.teams || []);
      }
    } catch (error) {
      console.error('fetchTeams error:', error);
    }
  };

  const fetchSeniorOfficers = async () => {
    try {
      const response = await axiosInstance.get('/api/senior-officers');
      if (response.data.success) {
        setSeniorOfficers(response.data.senior_officers || []);
      }
    } catch (error) {
      console.error('fetchSeniorOfficers error:', error);
    }
  };

  const getDisplayTeamName = (teamId, role) => {
    if (role === 'admin') return 'Admin';
    if (!teamId) return 'Not Assigned';
    const parsedTeamId = parseInt(teamId);
    if (TEAM_MAP[parsedTeamId]) return TEAM_MAP[parsedTeamId];
    const team = teams.find(t => t.team_id === parsedTeamId);
    return team?.team_name || 'Not Assigned';
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    try {
      const response = await axiosInstance.delete(`/api/admin/tickets/${ticketId}`);
      if (response.data.success) {
        setSuccessMessage('Ticket deleted successfully');
        fetchTickets();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setErrorMessage('Failed to delete ticket: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditTicket = (ticket) => {
    setEditingTicket(ticket);
    setTicketEditData({
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      issue_type: ticket.issue_type,
      team_id: ticket.team_id || ''
    });
  };

  const handleTicketEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/api/tickets/${editingTicket.ticket_id}`, ticketEditData);
      if (response.data.success) {
        setSuccessMessage('Ticket updated successfully');
        setEditingTicket(null);
        fetchTickets();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setErrorMessage('Failed to update ticket: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTicket = (ticket) => {
    setAssigningTicket(ticket);
    setAssignmentData({
      team_id: ticket.team_id || '',
      assigned_to: ticket.assigned_to || ''
    });
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (assignmentData.team_id !== assigningTicket.team_id) {
        await axiosInstance.put(`/api/tickets/${assigningTicket.ticket_id}`, {
          new_team_id: assignmentData.team_id
        });
      }
      if (assignmentData.assigned_to) {
        await axiosInstance.put(`/api/tickets/${assigningTicket.ticket_id}/assign`, {
          assigned_to: assignmentData.assigned_to
        });
      }
      setSuccessMessage('Ticket assigned successfully');
      setAssigningTicket(null);
      fetchTickets();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to assign ticket: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getSeniorOfficersForTeam = (teamId) => {
    return seniorOfficers.filter(officer => officer.team_id === parseInt(teamId));
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhoneNumberChange = (e) => {
    let value = e.target.value;
    value = value.replace(/\D/g, '');
    
    if (formData.phone_country_code === '+251' && value.length > 0) {
      if (value[0] !== '7' && value[0] !== '9') {
        value = '';
      } else if (value.length > 9) {
        value = value.substring(0, 9);
      }
    } else {
      if (value.length > 15) {
        value = value.substring(0, 15);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      phone_number: value
    }));
    
    if (formErrors.phone_number) {
      setFormErrors(prev => ({ ...prev, phone_number: '' }));
    }
  };

  const validatePhoneNumber = () => {
    if (!formData.phone_number) return true;
    
    const cleanNumber = formData.phone_number.replace(/\D/g, '');
    const country = countryCodes.find(c => c.code === formData.phone_country_code);
    
    if (country && !country.pattern.test(cleanNumber)) {
      if (formData.phone_country_code === '+251') {
        setErrorMessage(`ለኢትዮጵያ ስልክ ቁጥር በ7 ወይም በ9 መጀመር አለበት እና 9 አሃዝ ሊኖረው ይገባል (ለምሳሌ: ${country.example})`);
      } else {
        setErrorMessage(`Please enter a valid ${country.country} phone number (e.g., ${country.example})`);
      }
      return false;
    }
    return true;
  };

  const handleTicketEditChange = (e) => {
    setTicketEditData({ ...ticketEditData, [e.target.name]: e.target.value });
  };

  const handleAssignmentChange = (e) => {
    const { name, value } = e.target;
    setAssignmentData(prev => ({ ...prev, [name]: value }));
    if (name === 'team_id') {
      setAssignmentData(prev => ({ ...prev, assigned_to: '' }));
    }
  };

  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    if (!editUser) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirm_password || !formData.role) {
        setErrorMessage('Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirm_password) {
        setErrorMessage('Passwords do not match');
        return;
      }
// FIXED code
if (formData.password.length < 8) {
  setErrorMessage('Password must be at least 8 characters');
  return;
}
if (formData.password.length > 20) {
  setErrorMessage('Password cannot exceed 20 characters');
  return;
}
      if (formData.role === 'senior' && !formData.team_id) {
        setErrorMessage('Team is required for senior officers');
        return;
      }
      if (!validatePhoneNumber()) {
        return;
      }
    } else {
      if (!formData.name || !formData.email || !formData.role) {
        setErrorMessage('Please fill in all required fields');
        return;
      }
      if (formData.password && formData.password.length < 6) {
        setErrorMessage('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirm_password) {
        setErrorMessage('Passwords do not match');
        return;
      }
      if (!validatePhoneNumber()) {
        return;
      }
    }
    try {
      setLoading(true);
      
      // Clean phone number and combine with country code
      let cleanPhoneNumber = formData.phone_number.replace(/\D/g, '');
      const fullPhoneNumber = formData.phone_number ? 
        `${formData.phone_country_code}${cleanPhoneNumber}` : '';
      
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone_number: fullPhoneNumber,
        team_id: formData.role === 'senior' ? formData.team_id : undefined
      };
      if (formData.password) payload.password = formData.password;
      if (!editUser) payload.confirm_password = formData.confirm_password;
      
      let response;
      if (editUser) {
        response = await axiosInstance.put(`/api/admin/users/${editUser.user_id}`, payload);
        if (response.data.success) {
          setSuccessMessage('User updated successfully');
          setShowUserForm(false);
          setEditUser(null);
          fetchUsers();
        }
      } else {
        response = await axiosInstance.post('/api/admin/register-user', payload);
        if (response.data.success) {
          setSuccessMessage('User registered successfully');
          setFormData({
            name: '',
            email: '',
            password: '',
            confirm_password: '',
            phone_country_code: '+251',
            phone_number: '',
            role: 'user',
            team_id: ''
          });
          setShowUserForm(false);
          fetchUsers();
        }
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || (editUser ? 'Failed to update user' : 'Failed to register user'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    let phoneCountryCode = '+251';
    let phoneNumber = '';
    
    if (user.phone_number) {
      const matchedCode = countryCodes.find(cc => user.phone_number.startsWith(cc.code));
      if (matchedCode) {
        phoneCountryCode = matchedCode.code;
        phoneNumber = user.phone_number.substring(matchedCode.code.length);
        phoneNumber = phoneNumber.replace(/^0+/, '');
      } else {
        phoneNumber = user.phone_number;
      }
    }
    
    setEditUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      confirm_password: '',
      phone_country_code: phoneCountryCode,
      phone_number: phoneNumber,
      role: user.role,
      team_id: user.team_id || ''
    });
    setShowUserForm(true);
  };

const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    setDeletingUserId(userId);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      const response = await axiosInstance.delete(`/api/admin/users/${userId}`);
      if (response.data.success) {
        setUsers(prevUsers => prevUsers.filter(u => u.user_id !== userId && u._id !== userId));
        setSuccessMessage('✅ User deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setErrorMessage('❌ Failed to delete user: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleTicketFilterChange = (e) => {
    setTicketFilter({ ...ticketFilter, [e.target.name]: e.target.value });
  };

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
    const sortedTickets = sortTickets(tickets, { key, direction });
    setTickets(sortedTickets);
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

  const getTableClass = () => {
    return theme === 'dark' 
      ? 'table table-dark table-bordered table-striped table-hover' 
      : 'table table-light table-bordered table-striped table-hover';
  };

  const getModalContentClass = () => {
    return theme === 'dark' ? 'modal-content bg-dark text-white' : 'modal-content bg-light text-dark';
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'High': return 'badge bg-danger';
      case 'Medium': return 'badge bg-warning text-dark';
      case 'Low': return 'badge bg-success';
      default: return 'badge bg-secondary';
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

  const getTicketReport = () => {
    const totalTickets = tickets.length;
    const statusBreakdown = {
      Open: tickets.filter(t => t.status === 'Open').length,
      InProgress: tickets.filter(t => t.status === 'In Progress').length,
      Resolved: tickets.filter(t => t.status === 'Resolved').length,
      Queued: tickets.filter(t => t.status === 'Queued').length,
      Closed: tickets.filter(t => t.status === 'Closed').length
    };
    const priorityBreakdown = {
      High: tickets.filter(t => t.priority === 'High').length,
      Medium: tickets.filter(t => t.priority === 'Medium').length,
      Low: tickets.filter(t => t.priority === 'Low').length
    };
    const issueTypeBreakdown = tickets.reduce((acc, ticket) => {
      acc[ticket.issue_type] = (acc[ticket.issue_type] || 0) + 1;
      return acc;
    }, {});

    return { totalTickets, statusBreakdown, priorityBreakdown, issueTypeBreakdown };
  };

  const report = getTicketReport();

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 'N/A';
    return phoneNumber;
  };

  return (
    <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <style>
        {`
          .admin-main-content {
            margin-top: 20px;
          }
          .admin-nav-buttons {
            display: flex;
            gap: 10px;
            padding: 10px 15px;
            background-color: ${theme === 'dark' ? '#1a202c' : '#f8f9fa'};
            border-bottom: 1px solid ${theme === 'dark' ? '#4a5568' : '#dee2e6'};
          }
          .form-control, .form-select {
            background-color: ${theme === 'dark' ? '#2d3748' : '#fff'};
            color: ${theme === 'dark' ? '#e2e8f0' : '#000'};
            border-color: ${theme === 'dark' ? '#4a5568' : '#ced4da'};
          }
          .form-control:focus, .form-select:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
          }
          .btn-close {
            filter: ${theme === 'dark' ? 'invert(1)' : 'none'};
          }
          .summary-card {
            transition: all 0.3s ease;
            border: 1px solid ${theme === 'dark' ? '#4a5568' : '#dee2e6'};
          }
          .summary-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
          .phone-input-group {
            display: flex;
            gap: 10px;
          }
          .phone-input-group select {
            width: 140px;
          }
          .phone-input-group input {
            flex: 1;
          }
        `}
      </style>

      <div className="admin-nav-buttons">
  <Link to="/admin-dashboard" className="btn btn-primary btn-sm">
    <i className="fas fa-tachometer-alt me-1"></i> Admin Dashboard
  </Link>
  <Link to="/admin/backups" className="btn btn-warning btn-sm">
    <i className="fas fa-archive me-1"></i> 💾 Backups
  </Link>
  <Link to="/contact-senior-officers" className="btn btn-info btn-sm">
    <i className="fas fa-headset me-1"></i> Contact Senior Officer
  </Link>
</div>

      <div className="container-fluid px-4 py-4 flex-grow-1 admin-main-content">
        <h2 className="mb-4">Admin Dashboard - User Management</h2>

        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
          </div>
        )}
        {errorMessage && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {errorMessage}
            <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
          </div>
        )}

        {/* FIXED: HORIZONTAL TICKET SUMMARY - All in one row from left to right */}
        <div className="row mb-4 g-3">
          {/* Total Tickets Card */}
          <div className="col-md-3 col-sm-6">
            <div className={`summary-card p-3 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted mb-1">Total Tickets</div>
                  <div className="display-4 fw-bold text-primary">{report.totalTickets}</div>
                </div>
                <div className="text-primary fs-1">
                  <i className="fas fa-ticket-alt"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown Card */}
          <div className="col-md-3 col-sm-6">
            <div className={`summary-card p-3 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="text-muted">Status Breakdown</div>
                <div className="text-info fs-4">
                  <i className="fas fa-chart-pie"></i>
                </div>
              </div>
              <div className="row g-1 small">
                <div className="col-4"><span className="text-primary">📋 Open:</span></div>
                <div className="col-2 text-end">{report.statusBreakdown.Open}</div>
                <div className="col-4"><span className="text-warning">🔄 In Progress:</span></div>
                <div className="col-2 text-end">{report.statusBreakdown.InProgress}</div>
                <div className="col-4"><span className="text-success">✅ Resolved:</span></div>
                <div className="col-2 text-end">{report.statusBreakdown.Resolved}</div>
                <div className="col-4"><span className="text-secondary">⏳ Queued:</span></div>
                <div className="col-2 text-end">{report.statusBreakdown.Queued}</div>
                <div className="col-4"><span className="text-dark">🔒 Closed:</span></div>
                <div className="col-2 text-end">{report.statusBreakdown.Closed}</div>
              </div>
            </div>
          </div>

          {/* Priority Breakdown Card */}
          <div className="col-md-3 col-sm-6">
            <div className={`summary-card p-3 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="text-muted">Priority Breakdown</div>
                <div className="text-warning fs-4">
                  <i className="fas fa-flag"></i>
                </div>
              </div>
              <div className="row g-1 small">
                <div className="col-4"><span className="text-danger">🔴 High:</span></div>
                <div className="col-2 text-end">{report.priorityBreakdown.High}</div>
                <div className="col-4"><span className="text-warning">🟡 Medium:</span></div>
                <div className="col-2 text-end">{report.priorityBreakdown.Medium}</div>
                <div className="col-4"><span className="text-success">🟢 Low:</span></div>
                <div className="col-2 text-end">{report.priorityBreakdown.Low}</div>
              </div>
            </div>
          </div>

          {/* Issue Type Breakdown Card */}
          <div className="col-md-3 col-sm-6">
            <div className={`summary-card p-3 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="text-muted">Issue Type Breakdown</div>
                <div className="text-success fs-4">
                  <i className="fas fa-bug"></i>
                </div>
              </div>
              <div className="small">
                {Object.entries(report.issueTypeBreakdown).map(([type, count]) => (
                  <div key={type} className="row g-1">
                    <div className="col-8">{type}:</div>
                    <div className="col-4 text-end text-info">{count}</div>
                  </div>
                ))}
                {Object.keys(report.issueTypeBreakdown).length === 0 && (
                  <div className="text-muted text-center">No tickets yet</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="table-responsive mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">👥 All Users</h4>
            <button className="btn btn-primary btn-sm" onClick={() => setShowUserForm(true)}>
              <i className="fas fa-user-plus me-1"></i> Add User
            </button>
          </div>
          {users.length > 0 ? (
            <table className={getTableClass()}>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Team</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{formatPhoneNumber(user.phone_number)}</td>
                    <td><span className={`badge ${user.role === 'admin' ? 'bg-danger' : user.role === 'senior' ? 'bg-warning text-dark' : 'bg-info'}`}>{user.role}</span></td>
                    <td>{getDisplayTeamName(user.team_id, user.role)}</td>
                    <td>
                      <button onClick={() => handleEditUser(user)} className="btn btn-warning btn-sm me-2" disabled={loading}><i className="fas fa-edit me-1"></i> Edit</button>
<button onClick={() => handleDeleteUser(user.user_id || user._id)} className="btn btn-danger btn-sm" disabled={deletingUserId === (user.user_id || user._id)}>
  {deletingUserId === (user.user_id || user._id) ? (
    <><span className="spinner-border spinner-border-sm me-1" role="status"></span> Deleting...</>
  ) : (
    <><i className="fas fa-trash me-1"></i> Delete</>
  )}
</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="alert alert-info">No users found.</div>
          )}
        </div>

        {/* Ticket Filters */}
        <div className="mb-4">
          <h4 className="mb-3">🔍 Ticket Filters</h4>
          <div className="row g-3">
            <div className="col-md-4">
              <select name="status" value={ticketFilter.status} onChange={handleTicketFilterChange} className="form-select">
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Queued">Queued</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="col-md-4">
              <select name="priority" value={ticketFilter.priority} onChange={handleTicketFilterChange} className="form-select">
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="col-md-4">
              <select name="issue_type" value={ticketFilter.issue_type} onChange={handleTicketFilterChange} className="form-select">
                <option value="">All Issue Types</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Network">Network</option>
                <option value="Security">Security</option>
                <option value="Account">Account</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-primary btn-sm" onClick={fetchTickets}>
              <i className="fas fa-search me-1"></i> Apply Filters
            </button>
            <button className="btn btn-secondary btn-sm ms-2" onClick={() => {
              setTicketFilter({ status: '', priority: '', issue_type: '' });
              fetchTickets();
            }}>
              <i className="fas fa-undo me-1"></i> Reset Filters
            </button>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="table-responsive">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">🎫 All Tickets</h4>
            <small className="text-muted">Click column headers to sort</small>
          </div>
          {tickets.length > 0 ? (
            <table className={getTableClass()}>
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ticket_id')}>Ticket # {getSortIcon('ticket_id')}</th>
                  <th>Issue Type</th>
                  <th>Description</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('priority')}>Priority {getSortIcon('priority')}</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>Status {getSortIcon('status')}</th>
                  <th>Submitter</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('created_at')}>Created {getSortIcon('created_at')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket._id}>
                    <td>#{ticket.ticket_id}</td>
                    <td><span className="badge bg-info text-dark">{ticket.issue_type || 'Other'}</span></td>
                    <td>{ticket.description?.substring(0, 50)}{ticket.description?.length > 50 ? '...' : ''}</td>
                    <td><span className={getPriorityClass(ticket.priority)}>{ticket.priority}</span></td>
                    <td><span className={getStatusClass(ticket.status)}>{ticket.status}</span></td>
                    <td>{ticket.user_name || 'Unknown'} <small>({ticket.user_email})</small></td>
                    <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group">
                        <button onClick={() => handleEditTicket(ticket)} className="btn btn-warning btn-sm me-1" title="Edit"><i className="fas fa-edit"></i></button>
                        <button onClick={() => handleAssignTicket(ticket)} className="btn btn-info btn-sm me-1" title="Assign"><i className="fas fa-user-plus"></i></button>
                        <button onClick={() => handleDeleteTicket(ticket.ticket_id)} className="btn btn-danger btn-sm" title="Delete"><i className="fas fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="alert alert-info">No tickets found.</div>
          )}
        </div>
      </div>

      <footer className={`text-center py-3 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'} mt-auto border-top`}>
        <p className="mb-0">&copy; {new Date().getFullYear()} Ethiopian Statistical Service. All rights reserved.</p>
      </footer>

      {/* User Form Modal */}
      {showUserForm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog">
            <div className={getModalContentClass()}>
              <div className="modal-header">
                <h5 className="modal-title">{editUser ? 'Edit User' : 'Register New User'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowUserForm(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUserFormSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Full Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleUserFormChange} className="form-control" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleUserFormChange} className="form-control" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <div className="phone-input-group">
                      <select
                        name="phone_country_code"
                        value={formData.phone_country_code}
                        onChange={handleUserFormChange}
                        className="form-select"
                      >
                        {countryCodes.map(cc => (
                          <option key={cc.code} value={cc.code}>
                            {cc.code} ({cc.country})
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handlePhoneNumberChange}
                        className="form-control"
                        placeholder={formData.phone_country_code === '+251' ? "e.g., 912345678 or 712345678" : "Enter phone number"}
                      />
                    </div>
                    {formData.phone_country_code === '+251' && (
                      <small className="text-muted d-block mt-1">
                        ለኢትዮጵያ ስልክ ቁጥር በ7 ወይም በ9 መጀመር አለበት እና 9 አሃዝ ሊኖረው ይገባል (ለምሳሌ: 912345678 ወይም 712345678)
                      </small>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role *</label>
                    <select name="role" value={formData.role} onChange={handleUserFormChange} className="form-select" required>
                      <option value="user">User</option>
                      <option value="senior">Senior Officer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {formData.role === 'senior' && (
                    <div className="mb-3">
                      <label className="form-label">Team *</label>
                      <select name="team_id" value={formData.team_id} onChange={handleUserFormChange} className="form-select" required>
                        <option value="">Select Team</option>
                        <option value="1">Hardware Support Team</option>
                        <option value="2">Software Support Team</option>
                        <option value="3">Network Operations Team</option>
                        <option value="4">Security Team</option>
                        <option value="5">Account Management Team</option>
                        <option value="6">Database Administration Team</option>
                        <option value="7">Configuration Management Team</option>
                        <option value="8">System Maintenance Team</option>
                        <option value="9">Other Issues Team</option>
                      </select>
                    </div>
                  )}
                  // FIXED code
<div className="mb-3">
  <label className="form-label">Password {!editUser && '*'}</label>
  <input type="password" name="password" value={formData.password} onChange={handleUserFormChange} className="form-control" required={!editUser} minLength="8" maxLength="20" />
</div>
                  <div className="mb-3">
                    <label className="form-label">Confirm Password {!editUser && '*'}</label>
                    <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleUserFormChange} className="form-control" required={!editUser} />
                  </div>
                  <div className="modal-footer px-0 pb-0">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowUserForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Saving...' : (editUser ? 'Update' : 'Register')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ticket Modal */}
      {editingTicket && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg">
            <div className={getModalContentClass()}>
              <div className="modal-header">
                <h5 className="modal-title">Edit Ticket #{editingTicket.ticket_id}</h5>
                <button type="button" className="btn-close" onClick={() => setEditingTicket(null)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleTicketEditSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea name="description" value={ticketEditData.description} onChange={handleTicketEditChange} className="form-control" rows="3" />
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Priority</label>
                        <select name="priority" value={ticketEditData.priority} onChange={handleTicketEditChange} className="form-select">
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select name="status" value={ticketEditData.status} onChange={handleTicketEditChange} className="form-select">
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Queued">Queued</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Issue Type</label>
                        <select name="issue_type" value={ticketEditData.issue_type} onChange={handleTicketEditChange} className="form-select">
                          <option value="Hardware">Hardware</option>
                          <option value="Software">Software</option>
                          <option value="Network">Network</option>
                          <option value="Security">Security</option>
                          <option value="Account">Account</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Team</label>
                        <select name="team_id" value={ticketEditData.team_id} onChange={handleTicketEditChange} className="form-select">
                          <option value="">Select Team</option>
                          <option value="1">Hardware Support Team</option>
                          <option value="2">Software Support Team</option>
                          <option value="3">Network Operations Team</option>
                          <option value="4">Security Team</option>
                          <option value="5">Account Management Team</option>
                          <option value="6">Database Administration Team</option>
                          <option value="7">Configuration Management Team</option>
                          <option value="8">System Maintenance Team</option>
                          <option value="9">Other Issues Team</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer px-0 pb-0">
                    <button type="button" className="btn btn-secondary" onClick={() => setEditingTicket(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Updating...' : 'Update Ticket'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Ticket Modal */}
      {assigningTicket && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog">
            <div className={getModalContentClass()}>
              <div className="modal-header">
                <h5 className="modal-title">Assign Ticket #{assigningTicket.ticket_id}</h5>
                <button type="button" className="btn-close" onClick={() => setAssigningTicket(null)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAssignmentSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Assign to Team</label>
                    <select name="team_id" value={assignmentData.team_id} onChange={handleAssignmentChange} className="form-select" required>
                      <option value="">Select Team</option>
                      <option value="1">Hardware Support Team</option>
                      <option value="2">Software Support Team</option>
                      <option value="3">Network Operations Team</option>
                      <option value="4">Security Team</option>
                      <option value="5">Account Management Team</option>
                      <option value="6">Database Administration Team</option>
                      <option value="7">Configuration Management Team</option>
                      <option value="8">System Maintenance Team</option>
                      <option value="9">Other Issues Team</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Assign to Senior Officer</label>
                    <select name="assigned_to" value={assignmentData.assigned_to} onChange={handleAssignmentChange} className="form-select" disabled={!assignmentData.team_id}>
                      <option value="">Select Officer (Optional)</option>
                      {assignmentData.team_id && getSeniorOfficersForTeam(assignmentData.team_id).map(officer => (
                        <option key={officer.user_id} value={officer.user_id}>
                          {officer.name} - {getDisplayTeamName(officer.team_id, officer.role)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-footer px-0 pb-0">
                    <button type="button" className="btn btn-secondary" onClick={() => setAssigningTicket(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading || !assignmentData.team_id}>
                      {loading ? 'Assigning...' : 'Assign Ticket'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;