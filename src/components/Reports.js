import React, { useState, useContext, useEffect } from 'react';
import { UserContext, axiosInstance } from '../App';

const Reports = () => {
  const { user, theme } = useContext(UserContext);
  const [reports, setReports] = useState({
    ticketVolume: {},
    responseTimes: {},
    teamPerformance: [],
    categoryDistribution: [],
    priorityTrends: {},
    timeBasedData: {}
  });
  const [filters, setFilters] = useState({
    dateRange: 'week',
    startDate: '',
    endDate: '',
    teamMember: 'all',
    priority: 'all',
    status: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [filters.dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/reports', {
        params: filters
      });
      
      if (response.data.success) {
        setReports(response.data.reports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const response = await axiosInstance.get('/api/reports/export', {
        params: { ...filters, format },
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `reports-${timestamp}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export reports');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading reports...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className={`container-fluid py-4 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}`} style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-2 text-primary">
            <i className="fas fa-chart-bar me-2"></i>
            Analytics & Performance Reports
          </h1>
          <p className="text-muted mb-0">
            Monitor team performance, track efficiency, and analyze ticket trends
          </p>
        </div>
        <div className="dropdown">
          <button className="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
            <i className="fas fa-download me-2"></i>
            Export
          </button>
          <ul className="dropdown-menu">
            <li>
              <button 
                className="dropdown-item" 
                onClick={() => handleExport('pdf')}
                disabled={exporting}
              >
                <i className="fas fa-file-pdf me-2 text-danger"></i>
                PDF
              </button>
            </li>
            <li>
              <button 
                className="dropdown-item" 
                onClick={() => handleExport('excel')}
                disabled={exporting}
              >
                <i className="fas fa-file-excel me-2 text-success"></i>
                Excel
              </button>
            </li>
            <li>
              <button 
                className="dropdown-item" 
                onClick={() => handleExport('csv')}
                disabled={exporting}
              >
                <i className="fas fa-file-csv me-2 text-info"></i>
                CSV
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow mb-4">
        <div className={`card-body ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-semibold">Date Range</label>
              <select 
                className="form-select"
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Team Member</label>
              <select 
                className="form-select"
                value={filters.teamMember}
                onChange={(e) => handleFilterChange('teamMember', e.target.value)}
              >
                <option value="all">All Members</option>
                <option value="me">My Performance</option>
                {/* Add team members dynamically */}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Priority</label>
              <select 
                className="form-select"
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Status</label>
              <select 
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-12">
              <button className="btn btn-primary" onClick={fetchReports}>
                <i className="fas fa-sync-alt me-2"></i>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className={`card border-left-primary shadow h-100 py-2 ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Tickets
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {reports.ticketVolume.total || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-ticket-alt fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className={`card border-left-success shadow h-100 py-2 ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Avg. Response Time
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {reports.responseTimes.average || '0'} min
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-clock fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className={`card border-left-info shadow h-100 py-2 ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Resolution Rate
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {reports.ticketVolume.resolutionRate || '0'}%
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className={`card border-left-warning shadow h-100 py-2 ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    SLA Compliance
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {reports.responseTimes.slaCompliance || '0'}%
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-chart-line fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="card shadow mb-4">
        <div className={`card-header py-3 ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
          <h6 className="m-0 font-weight-bold text-primary">
            <i className="fas fa-users me-2"></i>
            Team Performance Metrics
          </h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className={`table table-bordered ${theme === 'dark' ? 'table-dark' : ''}`}>
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Assigned</th>
                  <th>In Progress</th>
                  <th>Resolved</th>
                  <th>Avg. Resolution Time</th>
                  <th>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {reports.teamPerformance.map((member, index) => (
                  <tr key={index}>
                    <td className="fw-semibold">{member.name}</td>
                    <td>
                      <span className="badge bg-primary">{member.assigned}</span>
                    </td>
                    <td>
                      <span className="badge bg-warning text-dark">{member.inProgress}</span>
                    </td>
                    <td>
                      <span className="badge bg-success">{member.resolved}</span>
                    </td>
                    <td>{member.avgResolutionTime}</td>
                    <td>
                      <div className="progress" style={{ height: '20px' }}>
                        <div 
                          className={`progress-bar ${member.successRate >= 80 ? 'bg-success' : member.successRate >= 60 ? 'bg-warning' : 'bg-danger'}`}
                          style={{ width: `${member.successRate}%` }}
                        >
                          {member.successRate}%
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card shadow">
            <div className={`card-header py-3 ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
              <h6 className="m-0 font-weight-bold text-primary">
                <i className="fas fa-chart-pie me-2"></i>
                Issue Category Distribution
              </h6>
            </div>
            <div className="card-body">
              <div className="chart-pie pt-4 pb-2">
                {/* Placeholder for pie chart */}
                <div className="text-center text-muted py-5">
                  <i className="fas fa-chart-pie fa-3x mb-3"></i>
                  <p>Pie Chart Visualization</p>
                </div>
              </div>
              <div className="mt-4 text-center small">
                {reports.categoryDistribution.map((category, index) => (
                  <span key={index} className="me-3">
                    <i className="fas fa-circle me-1" style={{ color: category.color }}></i>
                    {category.name} ({category.count})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow">
            <div className={`card-header py-3 ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
              <h6 className="m-0 font-weight-bold text-primary">
                <i className="fas fa-chart-line me-2"></i>
                Priority Trends
              </h6>
            </div>
            <div className="card-body">
              <div className="chart-area">
                {/* Placeholder for line chart */}
                <div className="text-center text-muted py-5">
                  <i className="fas fa-chart-line fa-3x mb-3"></i>
                  <p>Trend Chart Visualization</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time-based Activity */}
      <div className="card shadow">
        <div className={`card-header py-3 ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
          <h6 className="m-0 font-weight-bold text-primary">
            <i className="fas fa-calendar me-2"></i>
            Ticket Activity Timeline
          </h6>
        </div>
        <div className="card-body">
          <div className="chart-bar">
            {/* Placeholder for bar chart */}
            <div className="text-center text-muted py-5">
              <i className="fas fa-chart-bar fa-3x mb-3"></i>
              <p>Bar Chart Visualization - Daily/Weekly/Monthly Activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;