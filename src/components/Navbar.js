// src/components/Navbar.js

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext'; // <-- NEW IMPORT

const API_BASE_URL = 'http://localhost:5000'; 

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme(); // <-- Get theme state and toggle function

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login'); // Redirect to login page
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();

    if (!window.confirm('This will permanently delete your account. Are you sure?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/delete-account/${user.id}`, {
        data: { user_id: user.id } 
      });

      localStorage.clear(); // Clear all local storage
      alert('Account deleted successfully. You have been logged out.');
      navigate('/register');
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting account.');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/user-dashboard">
          Ticket Service
        </Link>
        {/* ... (Omitted responsive button for brevity) ... */}
        <div className="collapse navbar-collapse" id="navbarNavDropdown">
          <ul className="navbar-nav ms-auto">
            {/* ... other nav items ... */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle avatar-link"
                href="#"
                id="navbarDropdownMenuLink"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <img
                  src={user.avatar_path || 'assets/default_avatar.png'}
                  alt="Avatar"
                  className="avatar-icon"
                />
              </a>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdownMenuLink">
                <li><h6 className="dropdown-header">Logged in as {user.name}</h6></li>
                <li><hr className="dropdown-divider" /></li>
                
                {/* 1. PROFILE: Uses Link for React internal routing */}
                <li>
                  <Link className="dropdown-item" to="/profile">
                    <i className="fas fa-user-circle me-2"></i> Profile
                  </Link>
                </li>
                
                {/* 2. CHANGE PASSWORD: Uses Link for React internal routing */}
                <li>
                  <Link className="dropdown-item" to="/change-password">
                    <i className="fas fa-key me-2"></i> Change Password
                  </Link>
                </li>
                
                {/* 3. DARK MODE: Uses toggleTheme from context */}
                <li>
                  <div className="dropdown-item d-flex align-items-center">
                    <i className="fas fa-moon me-2"></i> Dark Theme
                    <div className="form-check form-switch ms-auto">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="darkThemeSwitch"
                        checked={theme === 'dark'}
                        onChange={toggleTheme}
                      />
                    </div>
                  </div>
                </li>
                
                <li><hr className="dropdown-divider" /></li>
                
                {/* 4. DELETE ACCOUNT: Uses handler with axios */}
                <li>
                  <a className="dropdown-item text-danger" href="#" onClick={handleDeleteAccount}>
                    <i className="fas fa-trash-alt me-2"></i> Delete Account
                  </a>
                </li>
                
                {/* 5. LOGOUT */}
                <li>
                  <a className="dropdown-item" href="#" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt me-2"></i> Logout
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;