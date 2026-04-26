import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';

const AdminBackups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [restoringId, setRestoringId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { user, theme } = useContext(UserContext);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/backups/users');
      if (response.data.success) {
        setBackups(response.data.backups);
      }
    } catch (error) {
      setError('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backupId, userName) => {
    if (!window.confirm(`Are you sure you want to restore user "${userName}"? This will recreate their account and all data.`)) return;
    
    setRestoringId(backupId);
    try {
      const response = await axiosInstance.post(`/api/admin/backups/users/${backupId}/restore`);
      if (response.data.success) {
        setSuccess(`✅ User "${userName}" restored successfully!`);
        fetchBackups();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (error) {
      setError('Restore failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteBackup = async (backupId, userName) => {
    if (!window.confirm(`Permanently delete backup for "${userName}"? This cannot be undone.`)) return;
    
    setDeletingId(backupId);
    try {
      const response = await axiosInstance.delete(`/api/admin/backups/users/${backupId}`);
      if (response.data.success) {
        setBackups(backups.filter(b => b._id !== backupId));
        setSuccess('🗑️ Backup deleted permanently');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError('Failed to delete backup');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary"></div>
        <p className="mt-2">Loading backups...</p>
      </div>
    );
  }

  return (
    <div className={`container-fluid px-4 py-4 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>💾 User Backups</h2>
          <p className="text-muted mb-0">Restore deleted user accounts and their data</p>
        </div>
        <Link to="/admin-dashboard" className="btn btn-secondary">← Back to Dashboard</Link>
      </div>

      {error && <div className="alert alert-danger">{error}<button className="btn-close" onClick={() => setError('')}></button></div>}
      {success && (
  <div className="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert">
    <span>{success}</span>
    <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
  </div>
)}

      {backups.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-archive fa-4x text-muted mb-3"></i>
          <h4>No Backups Found</h4>
          <p className="text-muted">Deleted user accounts will appear here for restoration.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className={`table table-hover ${theme === 'dark' ? 'table-dark' : ''}`}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Deleted Date</th>
                <th>Backup Data</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup._id}>
                  <td><strong>{backup.user_data?.name || 'Unknown'}</strong></td>
                  <td>{backup.user_data?.email || 'N/A'}</td>
                  <td><span className="badge bg-info">{backup.user_data?.role || 'N/A'}</span></td>
                  <td>{new Date(backup.deleted_at).toLocaleDateString()}</td>
                  <td>
                    <small>
                      🎫 {backup.tickets?.length || 0} tickets<br/>
                      💬 {backup.comments?.length || 0} comments<br/>
                      📋 {backup.logs?.length || 0} logs
                    </small>
                  </td>
                  <td>
                    {backup.restored ? (
                      <span className="badge bg-success">✅ Restored</span>
                    ) : (
                      <span className="badge bg-warning">📦 Available</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      {!backup.restored && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleRestore(backup._id, backup.user_data?.name)}
                          disabled={restoringId === backup._id}
                        >
                          {restoringId === backup._id ? (
                            <span className="spinner-border spinner-border-sm"></span>
                          ) : (
                            '🔄 Restore'
                          )}
                        </button>
                      )}
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteBackup(backup._id, backup.user_data?.name)}
                        disabled={deletingId === backup._id}
                      >
                        {deletingId === backup._id ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          '🗑️'
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBackups;