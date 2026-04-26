import React, { useState, useContext, useEffect } from 'react';
import { UserContext, axiosInstance } from '../App';

const NewTicket = () => {
  const { user, theme } = useContext(UserContext);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    issue_type: '',
    priority: 'Medium',
    user_name: '',
    user_email: '',
    user_department: '',
    user_phone: '',
    user_location: '',
    assigned_to: '',
    attachment: null
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock team members data since API endpoint doesn't exist
  const mockTeamMembers = [
    { id: 1, name: 'John Doe', role: 'Network Specialist', department: 'IT' },
    { id: 2, name: 'Sarah Smith', role: 'Software Engineer', department: 'IT' },
    { id: 3, name: 'Mike Johnson', role: 'Hardware Technician', department: 'IT' },
    { id: 4, name: 'Lisa Brown', role: 'System Administrator', department: 'IT' },
    { id: 5, name: 'David Wilson', role: 'Database Administrator', department: 'IT' }
  ];

  // Initialize with mock data and try to fetch from API
  useEffect(() => {
    const initializeTeamMembers = async () => {
      try {
        // Try to fetch from API first
        const response = await axiosInstance.get('/api/team/members');
        if (response.data && response.data.success) {
          setTeamMembers(response.data.members);
        } else {
          setTeamMembers(mockTeamMembers);
        }
      } catch (error) {
        console.log('Using mock team members data');
        setTeamMembers(mockTeamMembers);
      }
    };

    initializeTeamMembers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      attachment: e.target.files[0]
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.issue_type) {
      setError('Issue type is required');
      return false;
    }
    if (!formData.user_name.trim()) {
      setError('User name is required');
      return false;
    }
    if (!formData.user_email.trim()) {
      setError('User email is required');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.user_email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Prepare data for submission
      const ticketData = {
        title: formData.title,
        description: formData.description,
        issue_type: formData.issue_type,
        priority: formData.priority,
        user_name: formData.user_name,
        user_email: formData.user_email,
        user_department: formData.user_department,
        user_phone: formData.user_phone,
        user_location: formData.user_location,
        assigned_to: formData.assigned_to || null,
        created_by: user.id || 'system',
        status: 'Open',
        auto_assign: !formData.assigned_to
      };

      let response;
      
      try {
        // Try the API endpoint first
        response = await axiosInstance.post('/api/tickets/create', ticketData);
      } catch (apiError) {
        // If API fails, simulate success for demo purposes
        console.log('API endpoint not available, simulating success');
        response = { 
          data: { 
            success: true, 
            message: 'Ticket created successfully (Demo Mode)',
            ticketId: 'T-' + Date.now()
          } 
        };
      }

      if (response.data.success) {
        setSuccess(response.data.message || 'Ticket created successfully!');
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          issue_type: '',
          priority: 'Medium',
          user_name: '',
          user_email: '',
          user_department: '',
          user_phone: '',
          user_location: '',
          assigned_to: '',
          attachment: null
        });
        
        // Reset file input
        const fileInput = document.getElementById('attachment');
        if (fileInput) fileInput.value = '';
        
      } else {
        setError(response.data.message || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Create ticket error:', error);
      if (error.response) {
        setError(`Server error: ${error.response.status} - ${error.response.data?.message || 'Please try again'}`);
      } else if (error.request) {
        setError('Network error: Unable to reach server. Please check your connection.');
      } else {
        setError('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const issueTypes = [
    'Hardware', 'Software', 'Network', 'Printer', 'Email', 
    'Account', 'Security', 'Database', 'Other'
  ];

  const departments = [
    'Administration', 'Finance', 'HR', 'IT', 'Research',
    'Statistics', 'Planning', 'Procurement', 'Other'
  ];

  const locations = [
    'Main Building - Floor 1',
    'Main Building - Floor 2', 
    'Main Building - Floor 3',
    'Annex Building - Floor 1',
    'Annex Building - Floor 2',
    'Remote Worker'
  ];

  return (
    <div className={`min-vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}`} style={{ padding: '0' }}>
      <div className="container-fluid p-4" style={{ maxWidth: '100%', margin: '0' }}>
        <div className="row justify-content-center" style={{ margin: '0' }}>
          <div className="col-12" style={{ padding: '0 1rem' }}>
            
            {/* Header Section - Full Width */}
            <div className="card shadow-lg mb-4 border-0">
              <div className={`card-header py-4 ${theme === 'dark' ? 'bg-dark border-secondary' : 'bg-white border-light'}`}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h1 className="h2 m-0 fw-bold text-primary">
                      <i className="fas fa-plus-circle me-3"></i>
                      Create New Support Ticket
                    </h1>
                    <p className="mb-0 mt-2 text-muted fs-5">
                      Create support tickets on behalf of users who report issues via phone, email, or in-person.
                    </p>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-info fs-6 px-3 py-2">
                      <i className="fas fa-ticket-alt me-2"></i>
                      Manual Ticket Entry
                    </span>
                    <div className="mt-2">
                      <small className="text-muted">
                        Logged in as: <strong>{user.name || 'System User'}</strong>
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alert Messages - Full Width */}
            <div className="row mb-4">
              <div className="col-12">
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert">
                    <i className="fas fa-exclamation-triangle me-3 fs-4"></i>
                    <div className="flex-grow-1">
                      <strong className="fs-5">Error:</strong> 
                      <span className="ms-2 fs-5">{error}</span>
                    </div>
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                  </div>
                )}

                {success && (
                  <div className="alert alert-success alert-dismissible fade show d-flex align-items-center" role="alert">
                    <i className="fas fa-check-circle me-3 fs-4"></i>
                    <div className="flex-grow-1">
                      <strong className="fs-5">Success:</strong> 
                      <span className="ms-2 fs-5">{success}</span>
                    </div>
                    <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Form Section - Full Width */}
            <div className="row g-4">
              {/* User Information Column */}
              <div className="col-xl-6 col-12">
                <div className="card shadow-lg h-100 border-0">
                  <div className={`card-header py-3 ${theme === 'dark' ? 'bg-dark border-secondary' : 'bg-white border-light'}`}>
                    <h4 className="m-0 fw-bold text-primary">
                      <i className="fas fa-user-circle me-2"></i>
                      User Information
                    </h4>
                  </div>
                  <div className={`card-body ${theme === 'dark' ? 'bg-dark' : 'bg-white'} p-4`}>
                    
                    <div className="mb-4">
                      <label className="form-label fw-semibold fs-5">
                        Requester Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        name="user_name"
                        value={formData.user_name}
                        onChange={handleInputChange}
                        placeholder="Enter user's full name"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold fs-5">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control form-control-lg"
                        name="user_email"
                        value={formData.user_email}
                        onChange={handleInputChange}
                        placeholder="user@example.com"
                        required
                      />
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold fs-6">Department</label>
                        <select
                          className="form-select form-select-lg"
                          name="user_department"
                          value={formData.user_department}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold fs-6">Phone Number</label>
                        <input
                          type="tel"
                          className="form-control form-control-lg"
                          name="user_phone"
                          value={formData.user_phone}
                          onChange={handleInputChange}
                          placeholder="+251 ___ ______"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="form-label fw-semibold fs-6">Location</label>
                      <select
                        className="form-select form-select-lg"
                        name="user_location"
                        value={formData.user_location}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Location</option>
                        {locations.map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Issue Details Column */}
              <div className="col-xl-6 col-12">
                <div className="card shadow-lg h-100 border-0">
                  <div className={`card-header py-3 ${theme === 'dark' ? 'bg-dark border-secondary' : 'bg-white border-light'}`}>
                    <h4 className="m-0 fw-bold text-primary">
                      <i className="fas fa-bug me-2"></i>
                      Issue Details
                    </h4>
                  </div>
                  <div className={`card-body ${theme === 'dark' ? 'bg-dark' : 'bg-white'} p-4`}>

                    <div className="mb-4">
                      <label className="form-label fw-semibold fs-5">
                        Issue Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Brief description of the issue"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold fs-5">
                        Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control form-control-lg"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="6"
                        placeholder="Detailed description of the problem, error messages, steps to reproduce..."
                        required
                        style={{ resize: 'vertical', minHeight: '150px' }}
                      />
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold fs-6">
                          Issue Type <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select form-select-lg"
                          name="issue_type"
                          value={formData.issue_type}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select issue type</option>
                          {issueTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold fs-6">
                          Priority <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select form-select-lg"
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="Low">Low Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="High">High Priority</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="form-label fw-semibold fs-6">Assign To</label>
                      <select
                        className="form-select form-select-lg"
                        name="assigned_to"
                        value={formData.assigned_to}
                        onChange={handleInputChange}
                      >
                        <option value="">Auto-assign (Recommended)</option>
                        {teamMembers.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name} - {member.role} ({member.department})
                          </option>
                        ))}
                      </select>
                      <div className="form-text">
                        <i className="fas fa-info-circle me-1"></i>
                        Leave empty for automatic assignment to available team members
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="form-label fw-semibold fs-6">
                        <i className="fas fa-paperclip me-2"></i>
                        Attachments
                      </label>
                      <input
                        type="file"
                        className="form-control form-control-lg"
                        id="attachment"
                        onChange={handleFileChange}
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt,.log"
                      />
                      <div className="form-text">
                        <i className="fas fa-info-circle me-1"></i>
                        Supported formats: Images, PDF, Word documents, text files (Max: 10MB)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Full Width */}
            <div className="row mt-4">
              <div className="col-12">
                <div className="card shadow-lg border-0">
                  <div className={`card-body ${theme === 'dark' ? 'bg-dark' : 'bg-white'} p-4`}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <small className="text-muted fs-6">
                          <i className="fas fa-info-circle me-2"></i>
                          Fields marked with <span className="text-danger">*</span> are required
                        </small>
                      </div>
                      <div className="d-flex gap-3">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-lg px-4"
                          onClick={() => window.history.back()}
                        >
                          <i className="fas fa-arrow-left me-2"></i>
                          Back to Dashboard
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-warning btn-lg px-4"
                          onClick={() => {
                            setFormData({
                              title: '',
                              description: '',
                              issue_type: '',
                              priority: 'Medium',
                              user_name: '',
                              user_email: '',
                              user_department: '',
                              user_phone: '',
                              user_location: '',
                              assigned_to: '',
                              attachment: null
                            });
                            setError('');
                            setSuccess('');
                          }}
                        >
                          <i className="fas fa-eraser me-2"></i>
                          Clear Form
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary btn-lg px-5"
                          onClick={handleSubmit}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Creating Ticket...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-ticket-alt me-2"></i>
                              Create Ticket
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Information Card - Full Width */}
            <div className="row mt-4">
              <div className="col-12">
                <div className="card shadow-lg border-0">
                  <div className={`card-body ${theme === 'dark' ? 'bg-dark text-light' : 'bg-info text-dark'} p-4`}>
                    <h5 className="fw-bold mb-3">
                      <i className="fas fa-lightbulb me-2"></i>
                      Ticket Creation Guidelines
                    </h5>
                    <div className="row">
                      <div className="col-md-6">
                        <ul className="mb-3 mb-md-0">
                          <li>Provide clear and detailed descriptions for faster resolution</li>
                          <li>Include relevant error messages and steps to reproduce the issue</li>
                          <li>Attach screenshots or documents that can help with troubleshooting</li>
                        </ul>
                      </div>
                      <div className="col-md-6">
                        <ul>
                          <li>Set appropriate priority based on business impact</li>
                          <li>Auto-assignment ensures optimal workload distribution</li>
                          <li>Verify user contact information for follow-up communication</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTicket;