import React, { useState, useEffect, useContext } from 'react';
import { UserContext, axiosInstance } from '../App';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [slaData, setSlaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7days');
  const { theme } = useContext(UserContext);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, slaRes] = await Promise.all([
        axiosInstance.get(`/api/analytics/dashboard?period=${period}`),
        axiosInstance.get('/api/analytics/sla-compliance')
      ]);

      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.analytics);
      if (slaRes.data.success) setSlaData(slaRes.data);
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>
            <i className="fas fa-chart-line me-2 text-primary"></i>
            Analytics Dashboard
          </h2>
          <select 
            className="form-select w-auto"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>

        {analytics && (
          <>
            {/* Summary Cards */}
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div className="card bg-primary text-white">
                  <div className="card-body">
                    <h5 className="card-title">Total Tickets</h5>
                    <h2 className="display-4">{analytics.summary.total_tickets}</h2>
                    <p className="card-text">
                      {analytics.summary.open_tickets} Open, {analytics.summary.resolved_tickets} Resolved
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3 mb-3">
                <div className="card bg-success text-white">
                  <div className="card-body">
                    <h5 className="card-title">Resolution Rate</h5>
                    <h2 className="display-4">
                      {((analytics.summary.resolved_tickets / analytics.summary.total_tickets) * 100).toFixed(1)}%
                    </h2>
                    <p className="card-text">
                      Avg Time: {Math.round(analytics.summary.avg_resolution_time)}h
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3 mb-3">
                <div className="card bg-warning text-dark">
                  <div className="card-body">
                    <h5 className="card-title">In Progress</h5>
                    <h2 className="display-4">{analytics.summary.in_progress_tickets}</h2>
                    <p className="card-text">
                      {((analytics.summary.in_progress_tickets / analytics.summary.total_tickets) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3 mb-3">
                <div className="card bg-info text-white">
                  <div className="card-body">
                    <h5 className="card-title">SLA Compliance</h5>
                    <h2 className="display-4">
                      {slaData ? `${Math.round(slaData.overall_compliance)}%` : 'N/A'}
                    </h2>
                    <p className="card-text">
                      Meeting service level agreements
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Detailed Analytics */}
            <div className="row">
              <div className="col-md-6 mb-4">
                <div className="card">
                  <div className="card-header">
                    <i className="fas fa-chart-pie me-2"></i>
                    Issue Type Distribution
                  </div>
                  <div className="card-body">
                    {analytics.issue_types.map((item, index) => (
                      <div key={index} className="mb-2">
                        <div className="d-flex justify-content-between">
                          <span>{item.issue_type}</span>
                          <span>{item.percentage}% ({item.count})</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: `${item.percentage}%`,
                              backgroundColor: ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6c757d'][index]
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-md-6 mb-4">
                <div className="card">
                  <div className="card-header">
                    <i className="fas fa-tachometer-alt me-2"></i>
                    Team Performance
                  </div>
                  <div className="card-body">
                    {analytics.team_performance.map((team, index) => (
                      <div key={index} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <strong>{team.team_name}</strong>
                          <span className={`badge ${
                            team.resolution_rate > 80 ? 'bg-success' : 
                            team.resolution_rate > 60 ? 'bg-warning' : 'bg-danger'
                          }`}>
                            {team.resolution_rate}%
                          </span>
                        </div>
                        <small className="text-muted">
                          {team.resolved_tickets}/{team.total_tickets} resolved • 
                          Avg: {Math.round(team.avg_resolution_time || 0)}h
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SLA Compliance Details */}
            {slaData && (
              <div className="row">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <i className="fas fa-clipboard-check me-2"></i>
                      SLA Compliance Details
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Priority</th>
                              <th>SLA Target</th>
                              <th>Within SLA</th>
                              <th>Total Tickets</th>
                              <th>Compliance Rate</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {slaData.sla_compliance.map((sla, index) => (
                              <tr key={index}>
                                <td>
                                  <span className={`badge ${
                                    sla.priority === 'High' ? 'bg-danger' :
                                    sla.priority === 'Medium' ? 'bg-warning' : 'bg-success'
                                  }`}>
                                    {sla.priority}
                                  </span>
                                </td>
                                <td>{slaData.sla_targets[sla.priority]}</td>
                                <td>{sla.within_sla}</td>
                                <td>{sla.total_tickets}</td>
                                <td>
                                  <span className={`badge ${
                                    sla.sla_compliance_rate > 90 ? 'bg-success' :
                                    sla.sla_compliance_rate > 75 ? 'bg-warning' : 'bg-danger'
                                  }`}>
                                    {sla.sla_compliance_rate}%
                                  </span>
                                </td>
                                <td>
                                  {sla.sla_compliance_rate > 90 ? '✅ Excellent' :
                                   sla.sla_compliance_rate > 75 ? '⚠️ Good' : '❌ Needs Improvement'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;