import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';

const AdminManageSeniorOfficers = () => {
  const [seniorOfficers, setSeniorOfficers] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const { user, theme } = useContext(UserContext);
  const navigate = useNavigate();

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

  // Form state for adding/editing officers
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone_country_code: '+251',
    phone_number: '',
    department: '',
    team_id: '',
    role: 'senior',
    status: 'active',
    workload_limit: 10
  });

  // Departments and teams
  const departments = [
    'Hardware', 'Software', 'Network', 'Security', 
    'Account', 'Database', 'Configuration', 'Maintenance', 'Other'
  ];
  
  const teams = [
    { id: 1, name: 'Hardware Support Team' },
    { id: 2, name: 'Software Support Team' },
    { id: 3, name: 'Network Support Team' },
    { id: 4, name: 'Security Support Team' },
    { id: 5, name: 'Account Support Team' },
    { id: 6, name: 'Database Support Team' },
    { id: 7, name: 'Configuration Support Team' },
    { id: 8, name: 'Maintenance Support Team' },
    { id: 9, name: 'Other Support Team' }
  ];

  // Calculate real performance data from actual tickets
  const calculateRealPerformanceData = (officerId, tickets) => {
    const officerTickets = tickets.filter(ticket => 
      ticket.assigned_to === officerId || 
      ticket.assigned_officer === officerId ||
      ticket.assigned_senior === officerId
    );

    const totalAssigned = officerTickets.length;
    const resolvedTickets = officerTickets.filter(ticket => 
      ['resolved', 'closed', 'completed', 'Resolved', 'done'].some(status => 
        ticket.status?.toLowerCase() === status.toLowerCase()
      )
    ).length;
    const activeTickets = officerTickets.filter(ticket => 
      ['in_progress', 'assigned', 'inprogress'].some(status => 
        ticket.status?.toLowerCase() === status.toLowerCase()
      )
    ).length;
    
    const successRate = totalAssigned > 0 ? Math.round((resolvedTickets / totalAssigned) * 100) : 0;
    
    const ratedTickets = officerTickets.filter(ticket => ticket.rating || ticket.satisfaction_rating);
    const totalRating = ratedTickets.reduce((sum, ticket) => sum + (ticket.rating || ticket.satisfaction_rating || 0), 0);
    const satisfactionRate = ratedTickets.length > 0 
      ? Math.round((totalRating / ratedTickets.length) * 20)
      : 'N/A';

    const resolvedWithTime = officerTickets.filter(ticket => 
      ticket.resolved_at && ticket.created_at
    );
    let avgResolutionTime = '4h 30m';
    if (resolvedWithTime.length > 0) {
      const totalTime = resolvedWithTime.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at);
        const resolved = new Date(ticket.resolved_at);
        return sum + (resolved - created);
      }, 0);
      const avgMs = totalTime / resolvedWithTime.length;
      const hours = Math.floor(avgMs / (1000 * 60 * 60));
      const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
      avgResolutionTime = `${hours}h ${minutes}m`;
    }

    return {
      ticketsAssigned: totalAssigned,
      ticketsResolved: resolvedTickets,
      activeTickets: activeTickets,
      successRate: `${successRate}%`,
      satisfactionRate: satisfactionRate,
      avgResolutionTime: avgResolutionTime
    };
  };

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 'Not provided';
    return phoneNumber;
  };

  // Extract country code and number from full phone number
  const parsePhoneNumber = (fullPhoneNumber) => {
    if (!fullPhoneNumber) return { code: '+251', number: '' };
    
    const matchedCode = countryCodes.find(cc => fullPhoneNumber.startsWith(cc.code));
    if (matchedCode) {
      let number = fullPhoneNumber.substring(matchedCode.code.length);
      number = number.replace(/^0+/, '');
      return { code: matchedCode.code, number: number };
    }
    return { code: '+251', number: fullPhoneNumber };
  };

  useEffect(() => {
    if (user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAllData();
  }, [user, navigate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      const [usersResponse, ticketsResponse] = await Promise.all([
        axiosInstance.get('/api/admin/users'),
        axiosInstance.get('/api/tickets').catch(err => ({ data: { tickets: [] } }))
      ]);

      let seniorUsers = [];
      if (usersResponse.data.success && usersResponse.data.users) {
        seniorUsers = usersResponse.data.users.filter(u => u.role === 'senior');
      }

      let tickets = [];
      if (ticketsResponse.data) {
        tickets = ticketsResponse.data.tickets || ticketsResponse.data || [];
      }
      setAllTickets(tickets);

      const officersWithRealStats = seniorUsers.map(user => {
        const performanceData = calculateRealPerformanceData(user._id || user.id || user.user_id, tickets);
        
        const department = user.department || '';
        let team = teams.find(t => t.id === (user.team_id || '')) || 
                  teams.find(t => t.name === user.team_name) || 
                  teams.find(t => t.name.toLowerCase().includes(department.toLowerCase())) || 
                  teams[8];
        const team_id = user.team_id || team.id;
        const team_name = user.team_name || team.name;

        return {
          id: user._id || user.id || user.user_id,
          staff_id: user.staff_id || `B 5T-${(user._id || user.id || user.user_id).toString().slice(-4)}`,
          name: user.name || 'Unknown Officer',
          email: user.email || 'No email',
          phone_number: user.phone_number || 'Not provided',
          department: department,
          team_id: team_id,
          team_name: team_name,
          role: user.role || 'senior',
          status: user.status || 'active',
          workload_limit: user.workload_limit || 10,
          ticketsAssigned: performanceData.ticketsAssigned,
          ticketsResolved: performanceData.ticketsResolved,
          activeTickets: performanceData.activeTickets,
          successRate: performanceData.successRate,
          satisfactionRate: performanceData.satisfactionRate,
          avgResolutionTime: performanceData.avgResolutionTime,
          joinDate: user.created_at || user.joinDate || new Date().toISOString(),
          lastActive: user.last_active || user.lastActive || new Date().toISOString()
        };
      });

      setSeniorOfficers(officersWithRealStats);

    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage('Failed to load data. Please check your connection and try again.');
      setSeniorOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = () => {
    if (!formData.phone_number) return true;
    
    const cleanNumber = formData.phone_number.replace(/\D/g, '');
    const country = countryCodes.find(c => c.code === formData.phone_country_code);
    
    if (country && !country.pattern.test(cleanNumber)) {
      if (formData.phone_country_code === '+251') {
        setFormErrors(prev => ({ ...prev, phone_number: `ለኢትዮጵያ ስልክ ቁጥር በ7 ወይም በ9 መጀመር አለበት እና 9 አሃዝ ሊኖረው ይገባል (ለምሳሌ: ${country.example})` }));
      } else {
        setFormErrors(prev => ({ ...prev, phone_number: `Please enter a valid ${country.country} phone number (e.g., ${country.example})` }));
      }
      return false;
    }
    setFormErrors(prev => ({ ...prev, phone_number: '' }));
    return true;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'department') {
      const team = teams.find(t => t.name.toLowerCase().includes(value.toLowerCase()));
      if (team) {
        setFormData(prev => ({
          ...prev,
          department: value,
          team_id: team.id,
          team_name: team.name
        }));
      }
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

  const handleAddOfficer = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.name || !formData.email || !formData.password || !formData.department) {
      setErrorMessage('እባክዎ ሁሉንም አስፈላጊ መረጃዎች ይሙሉ / Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setErrorMessage('የይለፍ ቃላቶች አይዛመዱም / Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage('የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት / Password must be at least 6 characters');
      return;
    }
    
    if (!validatePhoneNumber()) {
      return;
    }

    try {
      setLoading(true);
      
      const team = teams.find(t => t.id == formData.team_id) || teams.find(t => t.name.toLowerCase().includes(formData.department.toLowerCase()));
      
      // Clean phone number and combine with country code
      let cleanPhoneNumber = formData.phone_number.replace(/\D/g, '');
      const fullPhoneNumber = formData.phone_number ? 
        `${formData.phone_country_code}${cleanPhoneNumber}` : '';
      
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
        phone_number: fullPhoneNumber,
        department: formData.department,
        team_id: team?.id || formData.team_id,
        team_name: team?.name || formData.department + ' Support Team',
        role: 'senior',
        status: 'active',
        workload_limit: parseInt(formData.workload_limit)
      };

      const response = await axiosInstance.post('/api/admin/register-user', payload);
      
      if (response.data.success) {
        setSuccessMessage('ሲኒየር ኦፊሰር በሚገባ ተመዝግቧል / Senior officer registered successfully!');
        setShowAddForm(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          confirm_password: '',
          phone_country_code: '+251',
          phone_number: '',
          department: '',
          team_id: '',
          role: 'senior',
          status: 'active',
          workload_limit: 10
        });
        fetchAllData();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(response.data.message || 'ኦፊሰሩን ማስመዝገብ አልተቻለም / Failed to register officer');
      }
    } catch (error) {
      console.error('Error adding officer:', error);
      setErrorMessage(error.response?.data?.message || 'ሲኒየር ኦፊሰር ማከል አልተቻለም። እባክዎ ይሞክሩ / Failed to add senior officer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOfficer = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.name || !formData.email || !formData.department) {
      setErrorMessage('እባክዎ ሁሉንም አስፈላጊ መረጃዎች ይሙሉ / Please fill in all required fields');
      return;
    }
    
    if (!validatePhoneNumber()) {
      return;
    }

    try {
      setLoading(true);
      
      const team = teams.find(t => t.id == formData.team_id) || teams.find(t => t.name.toLowerCase().includes(formData.department.toLowerCase()));
      
      // Clean phone number and combine with country code
      let cleanPhoneNumber = formData.phone_number.replace(/\D/g, '');
      const fullPhoneNumber = formData.phone_number ? 
        `${formData.phone_country_code}${cleanPhoneNumber}` : '';
      
      const payload = {
        name: formData.name,
        email: formData.email,
        phone_number: fullPhoneNumber,
        department: formData.department,
        team_id: team?.id || formData.team_id,
        team_name: team?.name || formData.department + ' Support Team',
        role: 'senior',
        status: formData.status,
        workload_limit: parseInt(formData.workload_limit)
      };

      if (formData.password && formData.password.length >= 6) {
        if (formData.password !== formData.confirm_password) {
          setErrorMessage('የይለፍ ቃላቶች አይዛመዱም / Passwords do not match');
          return;
        }
        payload.password = formData.password;
        payload.confirm_password = formData.confirm_password;
      }

      const response = await axiosInstance.put(`/api/admin/users/${selectedOfficer.id}`, payload);
      
      if (response.data.success) {
        setSuccessMessage('ሲኒየር ኦፊሰር በሚገባ ተሻሽሏል / Senior officer updated successfully!');
        setShowEditForm(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          confirm_password: '',
          phone_country_code: '+251',
          phone_number: '',
          department: '',
          team_id: '',
          role: 'senior',
          status: 'active',
          workload_limit: 10
        });
        fetchAllData();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(response.data.message || 'ኦፊሰሩን ማዘመን አልተቻለም / Failed to update officer');
      }
    } catch (error) {
      console.error('Error updating officer:', error);
      setErrorMessage(error.response?.data?.message || 'ሲኒየር ኦፊሰር ማዘመን አልተቻለም። እባክዎ ይሞክሩ / Failed to update senior officer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOfficer = async (officerId, officerName) => {
    if (window.confirm(`Are you sure you want to remove ${officerName}? This action cannot be undone.`)) {
      try {
        setActionLoading(officerId);
        
        const response = await axiosInstance.delete(`/api/admin/users/${officerId}`);
        if (response.data.success) {
          setSeniorOfficers(prev => prev.filter(officer => officer.id !== officerId));
          setSuccessMessage('Officer deleted successfully');
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } catch (error) {
        console.error('Error deleting officer:', error);
        setErrorMessage('Failed to delete officer');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleViewDetails = (officer) => {
    setSelectedOfficer(officer);
    setShowDetailsModal(true);
  };

  const handleEditClick = (officer) => {
    setSelectedOfficer(officer);
    const { code, number } = parsePhoneNumber(officer.phone_number);
    setFormData({
      name: officer.name,
      email: officer.email,
      password: '',
      confirm_password: '',
      phone_country_code: code,
      phone_number: number,
      department: officer.department,
      team_id: officer.team_id,
      role: 'senior',
      status: officer.status,
      workload_limit: officer.workload_limit
    });
    setShowEditForm(true);
  };

  const getAvailabilityStatus = (officer) => {
    const activeTickets = officer.activeTickets || 0;
    const workloadLimit = officer.workload_limit || 10;
    
    if (activeTickets === 0) return { status: 'available', label: 'Available', color: 'success' };
    if (activeTickets < 3) return { status: 'available', label: 'Available', color: 'success' };
    if (activeTickets < workloadLimit) return { status: 'busy', label: 'Busy', color: 'warning' };
    return { status: 'full', label: 'Full', color: 'danger' };
  };

  const calculateSuccessRate = (officer) => {
    if (!officer.ticketsAssigned || officer.ticketsAssigned === 0) return 0;
    return Math.round((officer.ticketsResolved / officer.ticketsAssigned) * 100);
  };

  const exportToCSV = () => {
    const headers = ['Staff ID', 'Name', 'Email', 'Phone', 'Department', 'Team', 'Status', 'Active Tickets', 'Tickets Assigned', 'Tickets Resolved', 'Success Rate', 'Satisfaction Rate', 'Join Date'];
    const csvData = filteredOfficers.map(officer => [
      officer.staff_id,
      officer.name,
      officer.email,
      officer.phone_number,
      officer.department,
      officer.team_name,
      officer.status,
      officer.activeTickets,
      officer.ticketsAssigned,
      officer.ticketsResolved,
      `${calculateSuccessRate(officer)}%`,
      officer.satisfactionRate,
      new Date(officer.joinDate).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `senior-officers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    setSuccessMessage('Data exported to CSV successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Fixed search filter to properly match department
  const filteredOfficers = seniorOfficers.filter(officer => {
    const searchMatch = searchTerm === '' || 
      officer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.staff_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const departmentMatch = filterDepartment === '' || 
      officer.department?.toLowerCase() === filterDepartment.toLowerCase();
    
    const statusMatch = filterStatus === '' || officer.status === filterStatus;
    const availabilityMatch = filterAvailability === '' || 
      getAvailabilityStatus(officer).status === filterAvailability;

    return searchMatch && departmentMatch && statusMatch && availabilityMatch;
  });

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? <span className="badge bg-success">Active</span>
      : <span className="badge bg-secondary">Inactive</span>;
  };

  const getAvailabilityBadge = (officer) => {
    const availability = getAvailabilityStatus(officer);
    return <span className={`badge bg-${availability.color}`}>{availability.label}</span>;
  };

  const getDepartmentIcon = (department) => {
    const icons = {
      'Hardware': '💻',
      'Software': '🖥️',
      'Network': '🌐',
      'Security': '🔒',
      'Account': '👤',
      'Database': '🗄️',
      'Configuration': '⚙️',
      'Maintenance': '🔧',
      'Other': '❓'
    };
    return icons[department] || '👨‍💼';
  };

  return (
    <div className={`d-flex flex-column min-vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}`}>
      <style>
        {`
          .officer-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            border: none;
            border-radius: 10px;
            overflow: hidden;
          }
          .officer-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
          .workload-bar {
            height: 6px;
            border-radius: 3px;
            overflow: hidden;
          }
          .performance-metric {
            font-size: 0.85rem;
          }
          .action-btn {
            transition: all 0.2s ease;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 1rem;
          }
          .detail-item {
            padding: 0.5rem 0;
            border-bottom: 1px solid #dee2e6;
          }
          .detail-item:last-child {
            border-bottom: none;
          }
          .department-icon {
            font-size: 1.5rem;
            margin-right: 0.5rem;
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
          .error-message {
            color: #dc3545;
            font-size: 0.875rem;
            margin-top: 0.25rem;
          }
        `}
      </style>

      <div className="container-fluid py-4 flex-grow-1">
        <div className="row">
          <div className="col-12">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <nav aria-label="breadcrumb">
                  <ol className={`breadcrumb ${theme === 'dark' ? 'breadcrumb-dark' : ''}`}>
                    <li className="breadcrumb-item">
                      <Link to="/admin-dashboard" className={theme === 'dark' ? 'text-light' : 'text-dark'}>
                        <i className="fas fa-tachometer-alt me-1"></i>
                        Dashboard
                      </Link>
                    </li>
                    <li className="breadcrumb-item active">Manage Senior Officers</li>
                  </ol>
                </nav>
                <h2 className={theme === 'dark' ? 'text-light' : 'text-dark'}>
                  <i className="fas fa-users-cog me-2"></i>
                  Manage Senior Officers / IT Staff
                </h2>
                <p className={`mb-0 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>
                  Create, edit, and monitor all technical support personnel
                </p>
              </div>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-success"
                  onClick={() => setShowAddForm(true)}
                >
                  <i className="fas fa-user-plus me-2"></i>
                  Add New Officer
                </button>
                <button 
                  className="btn btn-outline-primary"
                  onClick={exportToCSV}
                >
                  <i className="fas fa-download me-2"></i>
                  Export CSV
                </button>
                <Link to="/admin-dashboard" className="btn btn-outline-secondary">
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to Dashboard
                </Link>
              </div>
            </div>

            {/* Alerts */}
            {successMessage && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                <i className="fas fa-check-circle me-2"></i>
                {successMessage}
                <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
              </div>
            )}
            {errorMessage && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <i className="fas fa-exclamation-circle me-2"></i>
                {errorMessage}
                <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
              </div>
            )}

            {/* Search and Filters */}
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="input-group">
                  <span className={`input-group-text ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}>
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                    placeholder="Search by name, email, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-2">
                <select
                  className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <select
                  className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="col-md-2">
                <select
                  className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                  value={filterAvailability}
                  onChange={(e) => setFilterAvailability(e.target.value)}
                >
                  <option value="">All Availability</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="full">Full</option>
                </select>
              </div>
              <div className="col-md-3">
                <button 
                  className={`btn ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-primary'} w-100`}
                  onClick={fetchAllData}
                  disabled={loading}
                >
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
                  {loading ? ' Loading...' : ' Refresh Data'}
                </button>
              </div>
            </div>

            {/* Statistics Summary */}
            <div className="row mb-4">
              <div className="col-md-3">
                <div className={`card ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}>
                  <div className="card-body text-center">
                    <h4 className="text-primary">{seniorOfficers.length}</h4>
                    <p className="mb-0">Total Officers</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className={`card ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}>
                  <div className="card-body text-center">
                    <h4 className="text-success">{seniorOfficers.filter(o => o.status === 'active').length}</h4>
                    <p className="mb-0">Active Officers</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className={`card ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}>
                  <div className="card-body text-center">
                    <h4 className="text-warning">{seniorOfficers.filter(o => getAvailabilityStatus(o).status === 'busy').length}</h4>
                    <p className="mb-0">Busy Officers</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className={`card ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}>
                  <div className="card-body text-center">
                    <h4 className="text-info">{teams.length}</h4>
                    <p className="mb-0">Support Teams</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Officers Grid */}
            {loading ? (
              <div className="text-center py-5">
                <i className="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                <p className={theme === 'dark' ? 'text-light' : 'text-dark'}>Loading senior officers data...</p>
              </div>
            ) : (
              <div className="row">
                {filteredOfficers.map((officer) => (
                  <div key={officer.id} className="col-lg-6 col-xl-4 mb-4">
                    <div className={`card officer-card ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''} h-100`}>
                      <div className="card-body">
                        <div className="row align-items-center mb-3">
                          <div className="col-auto">
                            <div className="position-relative">
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  fontSize: '1rem'
                                }}
                              >
                                <i className="fas fa-user-shield"></i>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col">
                            <h6 className="mb-1">{officer.name}</h6>
                            <p className={`mb-1 small ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>
                              <i className="fas fa-id-badge me-1"></i>
                              {officer.staff_id}
                            </p>
                            <p className="mb-0 small">
                              <span className="department-icon">{getDepartmentIcon(officer.department)}</span>
                              {officer.department} • {officer.team_name}
                            </p>
                          </div>

                          <div className="col-auto text-end">
                            {getStatusBadge(officer.status)}
                            <div className="mt-1">
                              {getAvailabilityBadge(officer)}
                            </div>
                          </div>
                        </div>

                        <div className="row mb-3">
                          <div className="col-12">
                            <p className={`mb-1 small ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>
                              <i className="fas fa-envelope me-1"></i>
                              {officer.email}
                            </p>
                            {officer.phone_number && officer.phone_number !== 'Not provided' && (
                              <p className={`mb-0 small ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>
                                <i className="fas fa-phone me-1"></i>
                                {formatPhoneNumber(officer.phone_number)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className={theme === 'dark' ? 'text-light' : 'text-muted'}>Workload</small>
                            <small className={theme === 'dark' ? 'text-light' : 'text-muted'}>
                              {officer.activeTickets} / {officer.workload_limit} tickets
                            </small>
                          </div>
                          <div className="workload-bar bg-secondary">
                            <div 
                              className={`workload-bar bg-${getAvailabilityStatus(officer).color}`}
                              style={{ 
                                width: `${Math.min(100, (officer.activeTickets / officer.workload_limit) * 100)}%`,
                                height: '100%'
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="stats-grid mb-3">
                          <div className="text-center">
                            <div className="h6 mb-1 text-primary">{officer.ticketsAssigned}</div>
                            <small className={theme === 'dark' ? 'text-light' : 'text-muted'}>Assigned</small>
                          </div>
                          <div className="text-center">
                            <div className="h6 mb-1 text-success">{officer.ticketsResolved}</div>
                            <small className={theme === 'dark' ? 'text-light' : 'text-muted'}>Resolved</small>
                          </div>
                          <div className="text-center">
                            <div className="h6 mb-1 text-info">{calculateSuccessRate(officer)}%</div>
                            <small className={theme === 'dark' ? 'text-light' : 'text-muted'}>Success Rate</small>
                          </div>
                          <div className="text-center">
                            <div className="h6 mb-1 text-warning">{officer.satisfactionRate}</div>
                            <small className={theme === 'dark' ? 'text-light' : 'text-muted'}>Satisfaction</small>
                          </div>
                        </div>

                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            className="btn btn-outline-primary btn-sm action-btn"
                            onClick={() => handleViewDetails(officer)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline-secondary btn-sm action-btn"
                            onClick={() => handleEditClick(officer)}
                            title="Edit Officer"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm action-btn"
                            onClick={() => handleDeleteOfficer(officer.id, officer.name)}
                            disabled={actionLoading === officer.id}
                            title="Delete Officer"
                          >
                            {actionLoading === officer.id ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-trash"></i>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredOfficers.length === 0 && (
              <div className="text-center py-5">
                <i className="fas fa-users fa-4x text-muted mb-3"></i>
                <h5 className={theme === 'dark' ? 'text-light' : 'text-dark'}>
                  {searchTerm || filterDepartment || filterStatus || filterAvailability 
                    ? 'No matching officers found' 
                    : 'No senior officers registered yet'
                  }
                </h5>
                <p className="text-muted mb-4">
                  {searchTerm || filterDepartment || filterStatus || filterAvailability 
                    ? 'Try adjusting your search filters' 
                    : 'Get started by adding your first senior officer to the system'
                  }
                </p>
                {(searchTerm || filterDepartment || filterStatus || filterAvailability) ? (
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterDepartment('');
                      setFilterStatus('');
                      setFilterAvailability('');
                    }}
                  >
                    Clear All Filters
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowAddForm(true)}
                  >
                    <i className="fas fa-user-plus me-2"></i>
                    Add First Officer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`text-center py-3 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'} mt-auto`}>
        <p className="mb-0">&copy; {new Date().getFullYear()} Ethiopian Statistical Service. All rights reserved.</p>
      </footer>

      {/* Add Officer Modal */}
      {showAddForm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg">
            <div className={`modal-content ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-user-plus me-2"></i>
                  Register New Senior Officer
                </h5>
                <button
                  type="button"
                  className={`btn-close ${theme === 'dark' ? 'btn-close-white' : ''}`}
                  onClick={() => setShowAddForm(false)}
                  disabled={loading}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAddOfficer}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleFormChange}
                          className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleFormChange}
                          className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Password *</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleFormChange}
                          className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                          required
                          disabled={loading}
                          minLength="6"
                        />
                        <small className="text-muted">Minimum 6 characters</small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Confirm Password *</label>
                        <input
                          type="password"
                          name="confirm_password"
                          value={formData.confirm_password}
                          onChange={handleFormChange}
                          className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Phone Number</label>
                        <div className="phone-input-group">
                          <select
                            name="phone_country_code"
                            className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                            value={formData.phone_country_code}
                            onChange={handleFormChange}
                            disabled={loading}
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
                            className={`form-control ${formErrors.phone_number ? 'is-invalid' : ''} ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                            value={formData.phone_number}
                            onChange={handlePhoneNumberChange}
                            placeholder={formData.phone_country_code === '+251' ? "e.g., 912345678 or 712345678" : "Enter phone number"}
                            disabled={loading}
                          />
                        </div>
                        {formErrors.phone_number && <div className="error-message">{formErrors.phone_number}</div>}
                        {!formErrors.phone_number && formData.phone_country_code === '+251' && (
                          <small className="text-muted">
                            ለኢትዮጵያ ስልክ ቁጥር በ7 ወይም በ9 መጀመር አለበት እና 9 አሃዝ ሊኖረው ይገባል (ለምሳሌ: 912345678 ወይም 712345678)
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Department *</label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleFormChange}
                          className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                          required
                          disabled={loading}
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Team *</label>
                        <select
                          name="team_id"
                          value={formData.team_id}
                          onChange={handleFormChange}
                          className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                          required
                          disabled={loading}
                        >
                          <option value="">Select Team</option>
                          {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </select>
                        <small className="text-muted">Team will be auto-selected based on department</small>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Workload Limit *</label>
                        <select
                          name="workload_limit"
                          value={formData.workload_limit}
                          onChange={handleFormChange}
                          className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                          required
                          disabled={loading}
                        >
                          <option value="5">5 tickets</option>
                          <option value="10">10 tickets</option>
                          <option value="15">15 tickets</option>
                          <option value="20">20 tickets</option>
                        </select>
                        <small className="text-muted">Maximum number of active tickets this officer can handle</small>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowAddForm(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          Registering...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-user-plus me-2"></i>
                          Register Officer
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Officer Modal */}
      {showEditForm && selectedOfficer && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg">
            <div className={`modal-content ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-edit me-2"></i>
                  Edit Senior Officer - {selectedOfficer.name}
                </h5>
                <button
                  type="button"
                  className={`btn-close ${theme === 'dark' ? 'btn-close-white' : ''}`}
                  onClick={() => setShowEditForm(false)}
                  disabled={loading}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditOfficer}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleFormChange}
                          className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleFormChange}
                          className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Password (Leave blank to keep unchanged)</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleFormChange}
                          className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                          disabled={loading}
                          minLength="6"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Confirm Password</label>
                        <input
                          type="password"
                          name="confirm_password"
                          value={formData.confirm_password}
                          onChange={handleFormChange}
                          className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Phone Number</label>
                        <div className="phone-input-group">
                          <select
                            name="phone_country_code"
                            className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                            value={formData.phone_country_code}
                            onChange={handleFormChange}
                            disabled={loading}
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
                            className={`form-control ${formErrors.phone_number ? 'is-invalid' : ''} ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                            value={formData.phone_number}
                            onChange={handlePhoneNumberChange}
                            placeholder={formData.phone_country_code === '+251' ? "e.g., 912345678 or 712345678" : "Enter phone number"}
                            disabled={loading}
                          />
                        </div>
                        {formErrors.phone_number && <div className="error-message">{formErrors.phone_number}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Department *</label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleFormChange}
                          className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                          required
                          disabled={loading}
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Team *</label>
                        <select
                          name="team_id"
                          value={formData.team_id}
                          onChange={handleFormChange}
                          className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                          required
                          disabled={loading}
                        >
                          <option value="">Select Team</option>
                          {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Workload Limit *</label>
                        <select
                          name="workload_limit"
                          value={formData.workload_limit}
                          onChange={handleFormChange}
                          className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                          required
                          disabled={loading}
                        >
                          <option value="5">5 tickets</option>
                          <option value="10">10 tickets</option>
                          <option value="15">15 tickets</option>
                          <option value="20">20 tickets</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="status"
                              value="active"
                              checked={formData.status === 'active'}
                              onChange={handleFormChange}
                              disabled={loading}
                            />
                            <label className="form-check-label">Active</label>
                          </div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="status"
                              value="inactive"
                              checked={formData.status === 'inactive'}
                              onChange={handleFormChange}
                              disabled={loading}
                            />
                            <label className="form-check-label">Inactive</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowEditForm(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-2"></i>
                          Update Officer
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Officer Details Modal */}
      {showDetailsModal && selectedOfficer && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070 }}>
          <div className="modal-dialog modal-lg">
            <div className={`modal-content ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-user-shield me-2"></i>
                  Officer Details - {selectedOfficer.name}
                </h5>
                <button
                  type="button"
                  className={`btn-close ${theme === 'dark' ? 'btn-close-white' : ''}`}
                  onClick={() => setShowDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="detail-item">
                      <strong>Staff ID:</strong> {selectedOfficer.staff_id}
                    </div>
                    <div className="detail-item">
                      <strong>Email:</strong> {selectedOfficer.email}
                    </div>
                    <div className="detail-item">
                      <strong>Phone:</strong> {formatPhoneNumber(selectedOfficer.phone_number)}
                    </div>
                    <div className="detail-item">
                      <strong>Department:</strong> {selectedOfficer.department}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="detail-item">
                      <strong>Team:</strong> {selectedOfficer.team_name}
                    </div>
                    <div className="detail-item">
                      <strong>Status:</strong> {getStatusBadge(selectedOfficer.status)}
                    </div>
                    <div className="detail-item">
                      <strong>Availability:</strong> {getAvailabilityBadge(selectedOfficer)}
                    </div>
                    <div className="detail-item">
                      <strong>Join Date:</strong> {new Date(selectedOfficer.joinDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <hr />

                <h6>Performance Metrics</h6>
                <div className="row text-center">
                  <div className="col-3">
                    <div className={`p-2 ${theme === 'dark' ? 'bg-dark' : 'bg-light'} rounded`}>
                      <div className="h5 text-primary mb-1">{selectedOfficer.ticketsAssigned}</div>
                      <small className={theme === 'dark' ? 'text-light' : 'text-muted'}>Total Assigned</small>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className={`p-2 ${theme === 'dark' ? 'bg-dark' : 'bg-light'} rounded`}>
                      <div className="h5 text-success mb-1">{selectedOfficer.ticketsResolved}</div>
                      <small className={theme === 'dark' ? 'text-light' : 'text-muted'}>Resolved</small>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className={`p-2 ${theme === 'dark' ? 'bg-dark' : 'bg-light'} rounded`}>
                      <div className="h5 text-info mb-1">{calculateSuccessRate(selectedOfficer)}%</div>
                      <small className={theme === 'dark' ? 'text-light' : 'text-muted'}>Success Rate</small>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className={`p-2 ${theme === 'dark' ? 'bg-dark' : 'bg-light'} rounded`}>
                      <div className="h6 mb-1 text-warning">{selectedOfficer.satisfactionRate}</div>
                      <small className={theme === 'dark' ? 'text-light' : 'text-muted'}>Satisfaction</small>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <h6>Current Workload</h6>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className={theme === 'dark' ? 'text-light' : 'text-muted'}>
                      Active Tickets: {selectedOfficer.activeTickets} / {selectedOfficer.workload_limit}
                    </span>
                    <span className={theme === 'dark' ? 'text-light' : 'text-muted'}>
                      {Math.round((selectedOfficer.activeTickets / selectedOfficer.workload_limit) * 100)}%
                    </span>
                  </div>
                  <div className="progress" style={{ height: '10px' }}>
                    <div 
                      className={`progress-bar bg-${getAvailabilityStatus(selectedOfficer).color}`}
                      style={{ width: `${Math.min(100, (selectedOfficer.activeTickets / selectedOfficer.workload_limit) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageSeniorOfficers;