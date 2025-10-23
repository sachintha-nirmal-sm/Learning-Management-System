import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated, isInstructor } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          📚 LMS
        </Link>

        <ul className="navbar-menu">
          <li className="navbar-item">
            <Link to="/" className="navbar-link">
              Home
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/courses" className="navbar-link">
              Courses
            </Link>
          </li>

          {isAuthenticated ? (
            <>
              {isInstructor && (
                <li className="navbar-item">
                  <Link to="/instructor/dashboard" className="navbar-link">
                    Instructor
                  </Link>
                </li>
              )}
              <li className="navbar-item">
                <Link to="/my-courses" className="navbar-link">
                  My Learning
                </Link>
              </li>
              <li 
                className="navbar-item navbar-user"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <div className="user-avatar">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <p className="user-name">{user?.name}</p>
                      <p className="user-email">{user?.email}</p>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link to="/profile" className="dropdown-item">
                      Profile
                    </Link>
                    <Link to="/settings" className="dropdown-item">
                      Settings
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="dropdown-item logout-btn">
                      Logout
                    </button>
                  </div>
                )}
              </li>
            </>
          ) : (
            <>
              <li className="navbar-item">
                <Link to="/login" className="navbar-link">
                  Login
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/register" className="navbar-link-button">
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;