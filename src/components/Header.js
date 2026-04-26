import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';

const Header = () => {
  const { user, handleLogout, theme, toggleTheme } = useContext(UserContext);
  const [userProfile, setUserProfile] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null); // Add this ref for timeout

  useEffect(() => {
    // Use the user from context directly, no need to fetch separately
    if (user.id) {
      setUserProfile(user);
    }
  }, [user]);

  const handleLogoutClick = () => {
    handleLogout();
    navigate('/');
  };

  const handleDeleteAccount = () => {
    // Navigate to the delete account page instead of direct API call
    navigate('/delete-account');
    setDropdownOpen(false);
  };

  // Handle image error
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.nextSibling) {
      e.target.nextSibling.style.display = 'inline';
    }
  };

  // Open dropdown on hover
  const handleMouseEnter = () => {
    // Clear any pending close timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setDropdownOpen(true);
  };

  // Close dropdown when mouse leaves with delay
  const handleMouseLeave = () => {
    // Set a timeout to close the dropdown after a short delay
    // This gives time for the mouse to move to the dropdown menu
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
      timeoutRef.current = null;
    }, 300); // 300ms delay - adjust as needed
  };

  // Close dropdown when clicking outside (for mobile/touch devices)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.dropdown-container')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      // Clean up timeout on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [dropdownOpen]);

  return (
    <nav className={`navbar navbar-expand-lg ${theme === 'dark' ? 'navbar-dark bg-dark' : 'navbar-light bg-light'}`}>
      <div className="container-fluid">
        {/* Left side - Contact Senior Officers button for logged-in users */}
        {user.id && (
          <div className="me-auto">
          </div>
        )}

        {/* Right-aligned items */}
        <div className="d-flex align-items-center ms-auto">
          {user.id ? (
            <>
              {/* Theme Toggle Button */}
              <button 
                className="btn btn-outline-secondary me-2" 
                onClick={toggleTheme}
                style={{
                  border: 'none',
                  fontSize: '1.2rem',
                  padding: '0.25rem 0.5rem'
                }}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>

              {/* Profile Dropdown with Hover */}
              <div 
                className="dropdown-container position-relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                ref={dropdownRef}
              >
                <button 
                  className="btn dropdown-toggle d-flex align-items-center" 
                  type="button" 
                  id="profileDropdown"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme === 'dark' ? '#fff' : '#000',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Avatar - Use user.avatar_path directly from context */}
                  {user.avatar_path ? (
                    <img 
                      src={`http://localhost:5000/${user.avatar_path}`} 
                      alt="Avatar" 
                      className="rounded-circle me-2"
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onError={handleImageError}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                    />
                  ) : null}
                  {/* Fallback icon - only show if no avatar or avatar fails to load */}
                  <i 
                    className="fas fa-user-circle me-2" 
                    style={{ 
                      fontSize: '1.5rem',
                      display: user.avatar_path ? 'none' : 'inline',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }}
                  ></i>
                  {user.name}
                </button>
                <ul 
                  className={`dropdown-menu dropdown-menu-end ${dropdownOpen ? 'show' : ''}`}
                  aria-labelledby="profileDropdown"
                  style={{ 
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    zIndex: 1000,
                    minWidth: '200px',
                    marginTop: '0.5rem'
                  }}
                  onMouseEnter={handleMouseEnter} // Add mouse enter to dropdown menu
                  onMouseLeave={handleMouseLeave} // Add mouse leave to dropdown menu
                >
                  <li>
                    <span className="dropdown-item-text fw-bold">
                      <small>Logged in as</small><br />
                      {user.name}
                    </span>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link 
                      className="dropdown-item" 
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <i className="fas fa-user me-2"></i>Profile
                    </Link>
                  </li>
                  <li>
                    <Link 
                      className="dropdown-item" 
                      to="/change-password"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <i className="fas fa-key me-2"></i>Change Password
                    </Link>
                  </li>
                  <li>
                    <button 
                      className="dropdown-item" 
                      onClick={() => {
                        toggleTheme();
                        setDropdownOpen(false);
                      }}
                      style={{
                        transition: 'background-color 0.2s ease',
                        border: 'none',
                        background: 'none',
                        width: '100%',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <i className={theme === 'light' ? 'fas fa-moon me-2' : 'fas fa-sun me-2'}></i>
                      {theme === 'light' ? 'Dark Theme' : 'Light Theme'}
                    </button>
                  </li>
                  
                  {/* Show Delete Account for all users except admin */}
                  {user.role !== 'admin' && (
                    <>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button 
                          className="dropdown-item text-danger" 
                          onClick={handleDeleteAccount}
                          style={{
                            transition: 'background-color 0.2s ease',
                            border: 'none',
                            background: 'none',
                            width: '100%',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = theme === 'dark' ? 'rgba(255,0,0,0.1)' : 'rgba(255,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                          }}
                        >
                          <i className="fas fa-trash me-2"></i>Delete Account
                        </button>
                      </li>
                    </>
                  )}
                  
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button 
                      className="dropdown-item" 
                      onClick={() => {
                        handleLogoutClick();
                        setDropdownOpen(false);
                      }}
                      style={{
                        transition: 'background-color 0.2s ease',
                        border: 'none',
                        background: 'none',
                        width: '100%',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <i className="fas fa-sign-out-alt me-2"></i>Logout
                    </button>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Theme Toggle for non-logged in users */}
              <button 
                className="btn btn-outline-secondary me-2" 
                onClick={toggleTheme}
                style={{
                  border: 'none',
                  fontSize: '1.2rem',
                  padding: '0.25rem 0.5rem'
                }}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              
              {/* Login/Register buttons for non-logged in users */}
              <Link to="/login" className="btn btn-outline-primary me-2">
                Login
              </Link>
              
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;