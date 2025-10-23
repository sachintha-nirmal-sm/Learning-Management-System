import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Profile.css';

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1>{user.name}</h1>
            <p className="profile-role">{user.role?.toUpperCase()}</p>
          </div>
        </div>
        <div className="profile-details">
          <div className="detail-row">
            <span className="detail-label">Full name</span>
            <span className="detail-value">{user.name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email</span>
            <span className="detail-value">{user.email}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Role</span>
            <span className="detail-value">{user.role}</span>
          </div>
        </div>
        <div className="profile-actions">
          <Link to="/my-courses" className="btn-link">
            Go to My Learning
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
