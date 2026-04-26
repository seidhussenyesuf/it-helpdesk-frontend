import React, { useState, useEffect, useContext } from 'react';
import { axiosInstance } from '../App';

const DebugInfo = () => {
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDebugData();
  }, []);

  const fetchDebugData = async () => {
    try {
      const response = await axiosInstance.get('/debug/team-assignments');
      if (response.data.success) {
        setDebugData(response.data);
      }
    } catch (error) {
      console.error('Debug fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading debug info...</div>;

  return (
    <div className="container mt-4">
      <h3>Debug Information</h3>
      
      <div className="row">
        <div className="col-md-6">
          <h4>Senior Officers</h4>
          {debugData.senior_officers.length === 0 ? (
            <div className="alert alert-warning">No senior officers found!</div>
          ) : (
            debugData.senior_officers.map(officer => (
              <div key={officer.user_id} className="card mb-2">
                <div className="card-body">
                  <h5>{officer.name}</h5>
                  <p>Email: {officer.email}<br />
                  Team: {officer.team_name} (ID: {officer.team_id})<br />
                  Role: {officer.role}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="col-md-6">
          <h4>Recent Tickets</h4>
          {debugData.tickets.length === 0 ? (
            <div className="alert alert-warning">No tickets found!</div>
          ) : (
            debugData.tickets.map(ticket => (
              <div key={ticket.ticket_id} className="card mb-2">
                <div className="card-body">
                  <h5>Ticket #{ticket.ticket_id}</h5>
                  <p>Issue: {ticket.issue_type}<br />
                  Team: {ticket.team_name} (ID: {ticket.team_id})<br />
                  Assigned to: {ticket.assigned_to_name || 'None'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button onClick={fetchDebugData} className="btn btn-secondary mt-3">
        Refresh Debug Data
      </button>
    </div>
  );
};

export default DebugInfo;