import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';

const AdminManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [formErrors, setFormErrors] = useState({});
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalTickets: 0
  });
  const { user: currentUser, theme } = useContext(UserContext);
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

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone_country_code: '+251',
    phone_number: '',
    department: '',
    position: '',
    role: 'user',
    status: 'active'
  });

  // Departments for dropdown
  const departments = [
    'Finance Department',
    'IT Department', 
    'Human Resources',
    'Marketing',
    'Operations',
    'Sales',
    'Customer Support',
    'Research & Development'
  ];

  useEffect(() => {
    if (currentUser.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchUsers();
  }, [currentUser, navigate]);

  useEffect(() => {
    filterUsers();
    calculateStats();
  }, [users, searchTerm, statusFilter, departmentFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/users');
      if (response.data.success) {
        console.log('Fetched users from database:', response.data.users);
        setUsers(response.data.users);
        
        // Check if department and position exist in the fetched data
        if (response.data.users.length > 0) {
          const sampleUser = response.data.users[0];
          console.log('Sample user data structure:', {
            department: sampleUser.department,
            position: sampleUser.position,
            hasDepartment: 'department' in sampleUser,
            hasPosition: 'position' in sampleUser
          });
        }
      }
    } catch (error) {
      setErrorMessage('Error fetching users: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = useCallback(() => {
    let filtered = users;

    // Only show regular users (role = 'user') for this page
    filtered = filtered.filter(u => u.role === 'user');

    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        u.user_id?.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === statusFilter);
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(u => u.department === departmentFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, departmentFilter]);

  const calculateStats = useCallback(() => {
    const regularUsers = users.filter(u => u.role === 'user');
    const totalUsers = regularUsers.length;
    const activeUsers = regularUsers.filter(u => u.status === 'active').length;
    const inactiveUsers = regularUsers.filter(u => u.status === 'inactive').length;
    const totalTickets = regularUsers.reduce((sum, user) => sum + (user.tickets_submitted || 0), 0);

    setStats({
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalTickets
    });
  }, [users]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!editUser) {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (formData.password.length > 20) {
        errors.password = 'Password cannot exceed 20 characters';
      }
      
      if (!formData.confirm_password) {
        errors.confirm_password = 'Please confirm your password';
      } else if (formData.password !== formData.confirm_password) {
        errors.confirm_password = 'Passwords do not match';
      }
    } else if (formData.password) {
      if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirm_password) {
        errors.confirm_password = 'Passwords do not match';
      }
    }
    
    // Validate phone number if provided
    if (formData.phone_number) {
      const cleanNumber = formData.phone_number.replace(/\D/g, '');
      const country = countryCodes.find(c => c.code === formData.phone_country_code);
      
      if (country && !country.pattern.test(cleanNumber)) {
        if (formData.phone_country_code === '+251') {
          errors.phone_number = `ለኢትዮጵያ ስልክ ቁጥር በ7 ወይም በ9 መጀመር አለበት እና 9 አሃዝ ሊኖረው ይገባል (ለምሳሌ: ${country.example})`;
        } else {
          errors.phone_number = `Please enter a valid ${country.country} phone number (e.g., ${country.example})`;
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handlePhoneNumberChange = (e) => {
    let value = e.target.value;
    // Remove any non-digit characters
    value = value.replace(/\D/g, '');
    
    // For Ethiopia, allow only numbers starting with 7 or 9
    if (formData.phone_country_code === '+251' && value.length > 0) {
      // If first digit is not 7 or 9, clear it
      if (value[0] !== '7' && value[0] !== '9') {
        value = '';
      } else if (value.length > 9) {
        value = value.substring(0, 9);
      }
    } else {
      // For other countries, limit to reasonable length
      if (value.length > 15) {
        value = value.substring(0, 15);
      }
    }
    
    setFormData({
      ...formData,
      phone_number: value
    });
    
    if (formErrors.phone_number) {
      setFormErrors({
        ...formErrors,
        phone_number: ''
      });
    }
  };

  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      // Clean phone number (remove non-digits)
      let cleanPhoneNumber = formData.phone_number.replace(/\D/g, '');
      
      // Combine country code and clean phone number
      const fullPhoneNumber = formData.phone_number ? 
        `${formData.phone_country_code}${cleanPhoneNumber}` : '';
      
      // Make sure department and position are included even if empty
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: 'user',
        phone_number: fullPhoneNumber,
        department: formData.department || '',
        position: formData.position || '',
        status: formData.status
      };

      console.log('SENDING PAYLOAD TO SERVER:', JSON.stringify(payload, null, 2));

      // For new user creation, include password
      if (!editUser) {
        payload.password = formData.password;
        payload.confirm_password = formData.confirm_password;
      } else if (formData.password) {
        payload.password = formData.password;
        payload.confirm_password = formData.confirm_password;
      }

      let response;
      if (editUser) {
        response = await axiosInstance.put(`/api/admin/users/${editUser.user_id}`, payload);
        console.log('UPDATE RESPONSE:', response.data);
        setSuccessMessage('✅ User updated successfully');
      } else {
        response = await axiosInstance.post('/api/admin/register-user', payload);
        console.log('CREATE RESPONSE:', response.data);
        setSuccessMessage('✅ User created successfully.');
      }

      if (response.data.success) {
        setShowUserForm(false);
        setEditUser(null);
        setFormErrors({});
        setFormData({
          name: '',
          email: '',
          password: '',
          confirm_password: '',
          phone_country_code: '+251',
          phone_number: '',
          department: '',
          position: '',
          role: 'user',
          status: 'active'
        });
        // Wait a moment before fetching to ensure database is updated
        setTimeout(() => {
          fetchUsers();
        }, 500);
      } else {
        setErrorMessage(response.data.message || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        setErrorMessage(error.response?.data?.message || 'Failed to save user');
      } else {
        setErrorMessage('Failed to save user. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    console.log('Editing user with data:', user);
    
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
      name: user.name || '',
      email: user.email || '',
      password: '',
      confirm_password: '',
      phone_country_code: phoneCountryCode,
      phone_number: phoneNumber,
      department: user.department || '',
      position: user.position || '',
      role: 'user',
      status: user.status || 'active'
    });
    setFormErrors({});
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u._id === userId);
    const hasOpenTickets = userToDelete?.tickets_submitted > 0;

    if (hasOpenTickets) {
      setErrorMessage('🚫 Cannot delete user with active tickets. Please reassign tickets first.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      const response = await axiosInstance.delete(`/api/admin/users/${userId}`);
      if (response.data.success) {
        setSuccessMessage('✅ User deleted successfully');
        fetchUsers();
      }
    } catch (error) {
      setErrorMessage('❌ Failed to delete user: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const response = await axiosInstance.put(`/api/admin/users/${userId}`, {
        status: newStatus
      });
      if (response.data.success) {
        setSuccessMessage(`✅ User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      }
    } catch (error) {
      setErrorMessage('❌ Failed to update user status');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      setErrorMessage('Please select users to perform bulk action');
      return;
    }

    try {
      const response = await axiosInstance.post('/api/admin/users/bulk-action', {
        userIds: selectedUsers,
        action: action
      });
      
      if (response.data.success) {
        setSuccessMessage(`✅ ${selectedUsers.length} users ${action}ed successfully`);
        setSelectedUsers([]);
        fetchUsers();
      }
    } catch (error) {
      setErrorMessage(`❌ Failed to ${action} users`);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length 
        ? [] 
        : filteredUsers.map(user => user._id)
    );
  };

  const exportToCSV = () => {
    const headers = ['User ID', 'Name', 'Email', 'Phone', 'Department', 'Position', 'Status', 'Tickets Submitted', 'Last Activity'];
    const csvData = filteredUsers.map(user => [
      user.user_id || 'N/A',
      user.name,
      user.email,
      user.phone_number || 'N/A',
      user.department && user.department !== '' ? user.department : 'N/A',
      user.position && user.position !== '' ? user.position : 'N/A',
      user.status || 'active',
      user.tickets_submitted || 0,
      user.last_activity || 'Never'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    setSuccessMessage('✅ Users exported to CSV successfully');
  };

  const getStatusBadgeColor = (status) => {
    return status === 'active' ? 'bg-success' : 'bg-secondary';
  };

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 'No phone';
    return phoneNumber;
  };

  return (
    <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <style>
        {`
          .admin-top-navigation {
            background: ${theme === 'dark' 
              ? 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
            color: white;
            padding: 12px 0;
            border-bottom: ${theme === 'dark' ? '1px solid #444' : '1px solid #e9ecef'};
          }
          .stats-card {
            background: ${theme === 'dark' ? '#2a2d35' : 'white'};
            border: 1px solid ${theme === 'dark' ? '#444' : '#e9ecef'};
            border-radius: 10px;
            transition: all 0.3s ease;
          }
          .stats-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px ${theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'};
          }
          .table-dark-custom {
            background: ${theme === 'dark' ? '#2a2d35' : 'white'};
            color: ${theme === 'dark' ? 'white' : 'black'};
          }
          .form-control, .form-select {
            background: ${theme === 'dark' ? '#343a40' : 'white'};
            border: 1px solid ${theme === 'dark' ? '#495057' : '#ced4da'};
            color: ${theme === 'dark' ? 'white' : 'black'};
          }
          .form-control:focus, .form-select:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
          }
          .modal-content {
            background: ${theme === 'dark' ? '#2a2d35' : 'white'};
            color: ${theme === 'dark' ? 'white' : 'black'};
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
          .action-buttons {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
          }
          .error-message {
            color: #dc3545;
            font-size: 0.875rem;
            margin-top: 0.25rem;
          }
          .form-label.required:after {
            content: " *";
            color: #dc3545;
          }
          .debug-info {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 15px;
            font-size: 12px;
          }
        `}
      </style>

      <div className="admin-top-navigation">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <i className="fas fa-users-cog fa-lg me-3"></i>
              <div>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0" style={{fontSize: '0.9rem'}}>
                    <li className="breadcrumb-item"><Link to="/admin-dashboard" className="text-white-50">Dashboard</Link></li>
                    <li className="breadcrumb-item active text-white">Manage Users</li>
                  </ol>
                </nav>
                <h4 className="mb-0">User Management</h4>
              </div>
            </div>
            <div className="d-flex gap-2">
              <Link to="/admin-dashboard" className="btn btn-outline-light btn-sm">
                <i className="fas fa-tachometer-alt me-1"></i> Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid py-4 flex-grow-1">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className={`${theme === 'dark' ? 'text-light' : 'text-dark'} mb-1`}>Manage Users</h2>
                <p className={`mb-0 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>
                  Total {stats.totalUsers} users • {stats.activeUsers} active • {stats.inactiveUsers} inactive
                </p>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary" onClick={exportToCSV}>
                  <i className="fas fa-file-export me-2"></i> Export
                </button>
                <button
                  className="btn text-white"
                  style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}
                  onClick={() => {
                    setEditUser(null);
                    setFormData({
                      name: '',
                      email: '',
                      password: '',
                      confirm_password: '',
                      phone_country_code: '+251',
                      phone_number: '',
                      department: '',
                      position: '',
                      role: 'user',
                      status: 'active'
                    });
                    setFormErrors({});
                    setShowUserForm(true);
                  }}
                >
                  <i className="fas fa-user-plus me-2"></i> Add User
                </button>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-xl-3 col-md-6 mb-3">
                <div className="stats-card p-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className={`mb-1 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>Total Users</h6>
                      <h3 className={`mb-0 ${theme === 'dark' ? 'text-light' : 'text-dark'}`}>{stats.totalUsers}</h3>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-users fa-2x text-primary"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 mb-3">
                <div className="stats-card p-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className={`mb-1 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>Active Users</h6>
                      <h3 className={`mb-0 ${theme === 'dark' ? 'text-light' : 'text-dark'}`}>{stats.activeUsers}</h3>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-user-check fa-2x text-success"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 mb-3">
                <div className="stats-card p-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className={`mb-1 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>Inactive Users</h6>
                      <h3 className={`mb-0 ${theme === 'dark' ? 'text-light' : 'text-dark'}`}>{stats.inactiveUsers}</h3>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-user-slash fa-2x text-secondary"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 mb-3">
                <div className="stats-card p-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className={`mb-1 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>Total Tickets</h6>
                      <h3 className={`mb-0 ${theme === 'dark' ? 'text-light' : 'text-dark'}`}>{stats.totalTickets}</h3>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-ticket-alt fa-2x text-warning"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {successMessage && (
              <div className="alert alert-success alert-dismissible fade show d-flex align-items-center">
                <i className="fas fa-check-circle me-2"></i>
                {successMessage}
                <button type="button" className="btn-close ms-auto" onClick={() => setSuccessMessage('')}></button>
              </div>
            )}

            {errorMessage && (
              <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {errorMessage}
                <button type="button" className="btn-close ms-auto" onClick={() => setErrorMessage('')}></button>
              </div>
            )}

            <div className="row mb-4">
              <div className="col-md-4 mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="🔍 Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-3 mb-2">
                <select
                  className="form-control"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="col-md-3 mb-2">
                <select
                  className="form-control"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 mb-2">
                <button className="btn btn-outline-secondary w-100" onClick={fetchUsers}>
                  <i className="fas fa-sync-alt me-2"></i> Refresh
                </button>
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="row mb-3">
                <div className="col-12">
                  <div className={`alert ${theme === 'dark' ? 'alert-dark' : 'alert-light'} d-flex justify-content-between align-items-center`}>
                    <span>
                      <i className="fas fa-users me-2"></i>
                      {selectedUsers.length} user(s) selected
                    </span>
                    <div className="d-flex gap-2">
                      <button className="btn btn-success btn-sm" onClick={() => handleBulkAction('activate')}>
                        <i className="fas fa-check me-1"></i> Activate
                      </button>
                      <button className="btn btn-warning btn-sm" onClick={() => handleBulkAction('deactivate')}>
                        <i className="fas fa-ban me-1"></i> Deactivate
                      </button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => setSelectedUsers([])}>
                        <i className="fas fa-times me-1"></i> Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="table-responsive">
              <table className={`table table-hover ${theme === 'dark' ? 'table-dark table-dark-custom' : ''}`}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={selectAllUsers}
                      />
                    </th>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Status</th>
                    <th>Tickets</th>
                    <th style={{ width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => toggleUserSelection(user._id)}
                        />
                      </td>
                      <td><small className="text-muted">{user.user_id || 'N/A'}</small></td>
                      <td><strong>{user.name}</strong></td>
                      <td>{user.email}</td>
                      <td>{formatPhoneNumber(user.phone_number)}</td>
                      <td>
                        <span style={{color: user.department && user.department !== '' ? 'green' : 'red'}}>
                          {user.department && user.department !== '' && user.department !== null 
                            ? user.department 
                            : '-'}
                        </span>
                      </td>
                      <td>
                        <span style={{color: user.position && user.position !== '' ? 'green' : 'red'}}>
                          {user.position && user.position !== '' && user.position !== null 
                            ? user.position 
                            : '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeColor(user.status)}`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td><span className="badge bg-secondary">{user.tickets_submitted || 0}</span></td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn btn-outline-primary btn-sm" onClick={() => handleEditUser(user)} title="Edit">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteUser(user._id)} title="Delete">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && !loading && (
              <div className="text-center py-5">
                <i className="fas fa-users fa-3x text-muted mb-3"></i>
                <h5 className={theme === 'dark' ? 'text-light' : 'text-dark'}>No users found</h5>
                <p className="text-muted">Try adjusting your search criteria or create a new user</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading users...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', overflow: 'auto'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`fas ${editUser ? 'fa-user-edit' : 'fa-user-plus'} me-2`}></i>
                  {editUser ? 'Edit User' : 'Create New User'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowUserForm(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUserFormSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label required">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                        value={formData.name}
                        onChange={handleUserFormChange}
                      />
                      {formErrors.name && <div className="error-message">{formErrors.name}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label required">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                        value={formData.email}
                        onChange={handleUserFormChange}
                      />
                      {formErrors.email && <div className="error-message">{formErrors.email}</div>}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Department</label>
                      <select
                        name="department"
                        className="form-control"
                        value={formData.department}
                        onChange={handleUserFormChange}
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Position</label>
                      <input
                        type="text"
                        name="position"
                        className="form-control"
                        value={formData.position}
                        onChange={handleUserFormChange}
                        placeholder="e.g., Accountant, Developer, Manager"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Phone Number</label>
                      <div className="phone-input-group">
                        <select
                          name="phone_country_code"
                          className="form-control"
                          value={formData.phone_country_code}
                          onChange={handleUserFormChange}
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
                          className={`form-control ${formErrors.phone_number ? 'is-invalid' : ''}`}
                          value={formData.phone_number}
                          onChange={handlePhoneNumberChange}
                          placeholder={formData.phone_country_code === '+251' ? "e.g., 912345678 or 712345678" : "Enter phone number"}
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

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status</label>
                      <select
                        name="status"
                        className="form-control"
                        value={formData.status}
                        onChange={handleUserFormChange}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className={`form-label ${!editUser ? 'required' : ''}`}>
                        Password {editUser ? '(Leave blank to keep current)' : ''}
                      </label>
                      // FIXED code
<input
  type="password"
  name="password"
  className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
  value={formData.password}
  onChange={handleUserFormChange}
  minLength="8"
  maxLength="20"
/>
                      {formErrors.password && <div className="error-message">{formErrors.password}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className={`form-label ${!editUser ? 'required' : ''}`}>
                        Confirm Password {editUser ? '(Leave blank to keep current)' : ''}
                      </label>
                      <input
                        type="password"
                        name="confirm_password"
                        className={`form-control ${formErrors.confirm_password ? 'is-invalid' : ''}`}
                        value={formData.confirm_password}
                        onChange={handleUserFormChange}
                      />
                      {formErrors.confirm_password && <div className="error-message">{formErrors.confirm_password}</div>}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowUserForm(false)}>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn text-white"
                      style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          {editUser ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <i className={`fas ${editUser ? 'fa-save' : 'fa-user-plus'} me-2`}></i>
                          {editUser ? 'Update User' : 'Create User'}
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
    </div>
  );
};

export default AdminManageUsers;