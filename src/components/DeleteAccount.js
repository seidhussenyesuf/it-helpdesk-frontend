import React, { useState, useContext } from 'react';
import { UserContext, axiosInstance } from '../App';
import { useNavigate } from 'react-router-dom';

const DeleteAccount = () => {
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupResult, setBackupResult] = useState(null);
  const { user, theme, handleLogout } = useContext(UserContext);
  const navigate = useNavigate();

  // 💾 Backup user data before deletion
  const handleBackupMyData = async () => {
    if (!window.confirm('This will backup all your tickets, comments, and data. Continue?')) return;
    
    setBackingUp(true);
    setError('');
    try {
      const response = await axiosInstance.post('/api/user/backup-my-data');
      if (response.data.success) {
        setBackupResult(response.data);
        setSuccess('✅ Your data has been backed up successfully! You can now safely delete your account.');
      }
    } catch (error) {
      setError('Backup failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setBackingUp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    if (confirmation !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion.');
      setIsSubmitting(false);
      return;
    }

    if (!window.confirm('⚠️ ARE YOU ABSOLUTELY SURE?\n\nThis will permanently delete your account, all your tickets, comments, and data. This action cannot be undone!')) {
      setIsSubmitting(false);
      return;
    }

    try {
      // FIXED: Correct API endpoint
      const response = await axiosInstance.delete(`/api/profile/${user.id}`, {
        data: { confirmation: 'DELETE' }
      });

      if (response.data.success) {
        setSuccess('Account deleted successfully! Redirecting...');
        
        // Logout user after account deletion
        setTimeout(() => {
          handleLogout();
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Failed to delete account');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <style>
        {`
          .card {
            background-color: ${theme === 'dark' ? '#1a202c' : '#fff'};
            color: ${theme === 'dark' ? '#e2e8f0' : '#000'};
            border-color: ${theme === 'dark' ? '#2d3748' : '#dee2e6'};
            border-width: 2px;
          }
          .danger-card {
            border-color: #dc3545;
            box-shadow: 0 0 10px rgba(220, 53, 69, 0.3);
          }
          .backup-card {
            border-color: #ffc107;
            box-shadow: 0 0 10px rgba(255, 193, 7, 0.3);
            background-color: ${theme === 'dark' ? '#2d1f00' : '#fff8e1'};
          }
          .form-control {
            background-color: ${theme === 'dark' ? '#2d3748' : '#fff'};
            color: ${theme === 'dark' ? '#e2e8f0' : '#000'};
            border-color: ${theme === 'dark' ? '#4a5568' : '#ced4da'};
          }
          .form-control:focus {
            border-color: #dc3545;
            box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
          }
          .form-label {
            color: ${theme === 'dark' ? '#e2e8f0' : '#000'};
          }
          .alert {
            background-color: ${theme === 'dark' ? '#1a202c' : 'transparent'};
            border-color: ${theme === 'dark' ? '#2d3748' : 'transparent'};
          }
          .alert-danger {
            color: ${theme === 'dark' ? '#fed7d7' : '#721c24'};
            border-color: #f5c6cb;
          }
          .alert-success {
            color: ${theme === 'dark' ? '#c6f6d5' : '#155724'};
            border-color: #c3e6cb;
          }
          .alert-warning {
            color: ${theme === 'dark' ? '#ffeeba' : '#856404'};
            border-color: #ffc107;
          }
          .btn-danger {
            background-color: #dc3545;
            border-color: #dc3545;
          }
          .btn-danger:hover {
            background-color: #c82333;
            border-color: #bd2130;
          }
          .btn-warning {
            background-color: #ffc107;
            border-color: #ffc107;
            color: #000;
          }
          .btn-warning:hover {
            background-color: #e0a800;
            border-color: #d39e00;
            color: #000;
          }
          .warning-icon {
            font-size: 4rem;
            color: #dc3545;
            margin-bottom: 1rem;
          }
        `}
      </style>

      <div className="container mt-5 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div id="flashMessageContainer">
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}
              {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  {success}
                  <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
                </div>
              )}
            </div>

            {/* 💾 BACKUP SECTION - ADDED HERE */}
            <div className="card backup-card p-4 mb-4">
              <div className="text-center mb-3">
                <div style={{ fontSize: '3rem' }}>💾</div>
                <h4 className="text-warning">Backup Your Data First!</h4>
                <p className="text-muted">
                  We recommend backing up all your data before deleting your account.
                </p>
              </div>

              {backupResult ? (
                <div className="alert alert-success">
                  <h5 className="alert-heading">✅ Backup Complete!</h5>
                  <hr />
                  <p className="mb-1"><strong>Backup ID:</strong> <code>{backupResult.backup_id}</code></p>
                  <p className="mb-1"><strong>Tickets:</strong> {backupResult.summary?.tickets || 0}</p>
                  <p className="mb-1"><strong>Comments:</strong> {backupResult.summary?.comments || 0}</p>
                  <p className="mb-1"><strong>Logs:</strong> {backupResult.summary?.logs || 0}</p>
                  <p className="mb-0"><strong>Notifications:</strong> {backupResult.summary?.notifications || 0}</p>
                  <p className="mt-2 mb-0 text-success fw-bold">
                    ✅ Your data is safe! You can now proceed with account deletion below.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-muted mb-3">
                    This will save your tickets, comments, and activity history.
                    Your data can be restored by an administrator if needed.
                  </p>
                  <button 
                    className="btn btn-warning btn-lg"
                    onClick={handleBackupMyData}
                    disabled={backingUp}
                  >
                    {backingUp ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Backing up your data...
                      </>
                    ) : (
                      '💾 Backup My Data Before Deletion'
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* DELETE SECTION */}
            <div className="card danger-card p-4">
              <div className="text-center mb-4">
                <div className="warning-icon">⚠️</div>
                <h2 className="text-danger">Delete Account</h2>
                <p className="text-muted">This action cannot be undone</p>
              </div>

              <div className="alert alert-danger mb-4">
                <h5 className="alert-heading">🚨 Extreme Warning</h5>
                <p className="mb-2"><strong>Deleting your account will:</strong></p>
                <ul className="mb-2">
                  <li>Permanently delete your profile</li>
                  <li>Delete all tickets you created</li>
                  <li>Remove all your comments</li>
                  <li>Delete your activity logs</li>
                  <li>Remove your avatar image</li>
                </ul>
                <p className="mb-0"><strong>This action is irreversible!</strong></p>
              </div>

              <form onSubmit={handleSubmit} className="needs-validation" noValidate>
                <div className="mb-4">
                  <label htmlFor="confirmation" className="form-label">
                    To confirm, please type <strong>DELETE</strong> in the box below:
                  </label>
                  <input
                    type="text"
                    name="confirmation"
                    id="confirmation"
                    className="form-control"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    required
                    disabled={isSubmitting}
                    placeholder="Type DELETE here"
                  />
                  <div className="form-text text-danger">
                    This is case-sensitive. You must type exactly "DELETE"
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-danger btn-lg"
                    disabled={isSubmitting || confirmation !== 'DELETE'}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Deleting...</span>
                        </span>
                        Deleting Account...
                      </>
                    ) : (
                      '🚨 Permanently Delete My Account'
                    )}
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(-1)}
                    disabled={isSubmitting}
                  >
                    ← Cancel and Go Back
                  </button>
                </div>
              </form>

              <div className="mt-4 p-3 bg-light rounded">
                <h6>Account Information:</h6>
                <p className="mb-1"><strong>Name:</strong> {user.name}</p>
                <p className="mb-1"><strong>Email:</strong> {user.email}</p>
                <p className="mb-1"><strong>Role:</strong> {user.role}</p>
                <p className="mb-0"><strong>User ID:</strong> {user.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className={`text-center py-3 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'} mt-auto`}>
        <p className="mb-0">&copy; {new Date().getFullYear()} Ethiopian Statistical Service. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default DeleteAccount;