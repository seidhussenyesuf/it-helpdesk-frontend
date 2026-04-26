// CreateTeamOfficers.js - Add this to your admin panel
import React, { useState, useContext } from 'react';
import { UserContext, axiosInstance } from '../App';

const CreateTeamOfficers = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useContext(UserContext);

  const createOfficers = async () => {
    if (!window.confirm('This will create senior officers for all teams. Continue?')) return;
    
    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/admin/create-team-officers');
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Error: ' + error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (user.role !== 'admin') return null;

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">👮 Create Team Officers</h5>
      </div>
      <div className="card-body">
        <p className="text-muted">
          Create senior officers for all teams (Software, Network, Security, etc.) so tickets can be automatically assigned.
        </p>
        <button 
          onClick={createOfficers} 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Creating Officers...' : 'Create Officers for All Teams'}
        </button>
        {message && (
          <div className="mt-3 alert alert-info">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTeamOfficers;