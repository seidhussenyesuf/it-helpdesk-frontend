import React, { useState, useContext, useEffect } from 'react';
import { UserContext, axiosInstance } from '../App';

const TeamView = () => {
  const { user, theme } = useContext(UserContext);
  const [teamData, setTeamData] = useState({
    members: [],
    tickets: [],
    statistics: {}
  });
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [reassignTicket, setReassignTicket] = useState(null);

  useEffect(() => {
    fetchTeamData();
    const interval = setInterval(fetchTeamData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchTeamData = async () => {
    try {
      const response = await axiosInstance.get('/api/team/view');
      if (response.data.success) {
        setTeamData(response.data.teamData);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityStatus = (member) => {
    const inProgressTickets = teamData.tickets.filter(
      ticket => ticket.assigned_to === member.id && ticket.status === 'In Progress'
    ).length;

    if (inProgressTickets === 0) return { status: 'available', label: 'Available', color: 'success' };
    if (inProgressTickets < 3) return { status: 'busy', label: 'Busy', color: 'warning' };
    return { status: 'full', label: 'Full Capacity', color: 'danger' };
  };

  const handleReassign = async (ticketId, newAssigneeId) => {
    try {
      const response = await axiosInstance.put(`/api/tickets/${ticketId}/reassign`, {
        assigned_to: newAssigneeId
      });

      if (response.data.success) {
        await fetchTeamData();
        setReassignTicket(null);
        alert('Ticket reassigned successfully!');
      }
    } catch (error) {
      console.error('Reassign error:', error);
      alert('Failed to reassign ticket');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading team view...</h5>
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
            <i className="fas fa-users me-2"></i>
            Team Management & Coordination
          </h1>
          <p className="text-muted mb-0">
            Monitor team workload, balance assignments, and coordinate support activities
          </p>
        </div>
        <div className="text-end">
          <div className="d-flex gap-2">
            <span className="badge bg-success">
              <i className="fas fa-circle me-1"></i>
              Available: {teamData.members.filter(m => getAvailabilityStatus(m).status === 'available').length}
            </span>
            <span className="badge bg-warning text-dark">
              <i className="fas fa-circle me-1"></i>
              Busy: {teamData.members.filter(m => getAvailabilityStatus(m).status === 'busy').length}
            </span>
            <span className="badge bg-danger">
              <i className="fas fa-circle me-1"></i>
              Full: {teamData.members.filter(m => getAvailabilityStatus(m).status === 'full').length}
            </span>
          </div>
          <small className="text-muted">Auto-refreshes every 10 seconds</small>
        </div>
      </div>

      {/* Team Statistics */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className={`card border-left-primary shadow h-100 py-2 ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Team Members
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {teamData.members.length}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-users fa-2x text-gray-300"></i>
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
                    Active Tickets
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {teamData.statistics.activeTickets || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-tasks fa-2x text-gray-300"></i>
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
                    In Progress
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {teamData.statistics.inProgress || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-sync-alt fa-2x text-gray-300"></i>
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
                    {teamData.statistics.resolutionRate || '0'}%
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="row mb-4">
        {teamData.members.map((member) => {
          const availability = getAvailabilityStatus(member);
          const memberTickets = teamData.tickets.filter(ticket => ticket.assigned_to === member.id);
          const inProgressCount = memberTickets.filter(t => t.status === 'In Progress').length;

          return (
            <div key={member.id} className="col-xl-4 col-md-6 mb-4">
              <div className={`card shadow h-100 ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
                <div className="card-header py-3 d-flex justify-content-between align-items-center">
                  <h6 className="m-0 font-weight-bold text-primary">
                    <i className="fas fa-user me-2"></i>
                    {member.name}
                  </h6>
                  <span className={`badge bg-${availability.color}`}>
                    {availability.label}
                  </span>
                </div>
                <div className="card-body">
                  <div className="row text-center mb-3">
                    <div className="col-4">
                      <div className="h5 mb-0 text-primary">{memberTickets.length}</div>
                      <small className="text-muted">Total</small>
                    </div>
                    <div className="col-4">
                      <div className="h5 mb-0 text-warning">{inProgressCount}</div>
                      <small className="text-muted">In Progress</small>
                    </div>
                    <div className="col-4">
                      <div className="h5 mb-0 text-success">
                        {memberTickets.filter(t => t.status === 'Resolved').length}
                      </div>
                      <small className="text-muted">Resolved</small>
                    </div>
                  </div>

                  {/* Workload Progress */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small className="text-muted">Workload</small>
                      <small className="text-muted">{inProgressCount}/3</small>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div 
                        className={`progress-bar bg-${availability.color}`}
                        style={{ width: `${(inProgressCount / 3) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="row small text-center">
                    <div className="col-6">
                      <div className="text-muted">Avg. Time</div>
                      <div className="fw-semibold">{member.avgResolutionTime || 'N/A'}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted">Success Rate</div>
                      <div className="fw-semibold">{member.successRate || '0'}%</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3">
                    <button
                      className="btn btn-outline-primary btn-sm w-100"
                      onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
                    >
                      <i className="fas fa-eye me-1"></i>
                      View Tickets
                    </button>
                  </div>
                </div>
              </div>

              {/* Member's Active Tickets */}
              {selectedMember?.id === member.id && (
                <div className="card mt-2">
                  <div className={`card-body ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`}>
                    <h6 className="card-title">
                      <i className="fas fa-tasks me-2"></i>
                      Active Tickets ({memberTickets.length})
                    </h6>
                    <div className="list-group list-group-flush">
                      {memberTickets.map(ticket => (
                        <div key={ticket.ticket_id} className="list-group-item d-flex justify-content-between align-items-center">
                          <div className="flex-grow-1">
                            <div className="fw-semibold">#{ticket.ticket_id} - {ticket.title}</div>
                            <small className="text-muted">
                              {ticket.issue_type} • {ticket.priority}
                            </small>
                            <div>
                              <span className={`badge bg-${ticket.status === 'In Progress' ? 'warning' : 'primary'}`}>
                                {ticket.status}
                              </span>
                            </div>
                          </div>
                          <div className="dropdown">
                            <button 
                              className="btn btn-sm btn-outline-secondary dropdown-toggle"
                              type="button"
                              data-bs-toggle="dropdown"
                            >
                              <i className="fas fa-ellipsis-v"></i>
                            </button>
                            <ul className="dropdown-menu">
                              <li>
                                <button 
                                  className="dropdown-item"
                                  onClick={() => setReassignTicket(ticket)}
                                >
                                  <i className="fas fa-exchange-alt me-2"></i>
                                  Reassign
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item">
                                  <i className="fas fa-eye me-2"></i>
                                  View Details
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Team Tickets Table */}
      <div className="card shadow">
        <div className={`card-header py-3 d-flex justify-content-between align-items-center ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
          <h6 className="m-0 font-weight-bold text-primary">
            <i className="fas fa-list me-2"></i>
            All Active Team Tickets
          </h6>
          <span className="badge bg-secondary">
            {teamData.tickets.length} total tickets
          </span>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className={`table table-bordered ${theme === 'dark' ? 'table-dark' : ''}`}>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Title</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamData.tickets.map(ticket => {
                  const assignee = teamData.members.find(m => m.id === ticket.assigned_to);
                  return (
                    <tr key={ticket.ticket_id}>
                      <td className="fw-bold">#{ticket.ticket_id}</td>
                      <td>
                        <div className="fw-semibold">{ticket.title}</div>
                        <small className="text-muted">{ticket.issue_type}</small>
                      </td>
                      <td>
                        <span className="badge bg-info">{assignee?.name || 'Unassigned'}</span>
                      </td>
                      <td>
                        <span className={`badge ${
                          ticket.status === 'Open' ? 'bg-primary' :
                          ticket.status === 'In Progress' ? 'bg-warning text-dark' :
                          ticket.status === 'Resolved' ? 'bg-success' : 'bg-secondary'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          ticket.priority === 'Critical' ? 'bg-danger' :
                          ticket.priority === 'High' ? 'bg-warning text-dark' :
                          ticket.priority === 'Medium' ? 'bg-info' : 'bg-success'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td>
                        <small>{new Date(ticket.created_at).toLocaleDateString()}</small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => setReassignTicket(ticket)}
                          >
                            <i className="fas fa-exchange-alt"></i>
                          </button>
                          <button className="btn btn-outline-info">
                            <i className="fas fa-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reassign Ticket Modal */}
      {reassignTicket && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className={`modal-content ${theme === 'dark' ? 'bg-dark' : ''}`}>
              <div className="modal-header">
                <h5 className="modal-title">
                  Reassign Ticket #{reassignTicket.ticket_id}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setReassignTicket(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Current Assignee:</strong>{' '}
                  {teamData.members.find(m => m.id === reassignTicket.assigned_to)?.name}
                </p>
                <p>
                  <strong>Ticket:</strong> {reassignTicket.title}
                </p>
                
                <label className="form-label fw-semibold">Assign to:</label>
                <select className="form-select" id="newAssignee">
                  {teamData.members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({getAvailabilityStatus(member).label})
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setReassignTicket(null)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => handleReassign(
                    reassignTicket.ticket_id, 
                    document.getElementById('newAssignee').value
                  )}
                >
                  Confirm Reassignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamView;