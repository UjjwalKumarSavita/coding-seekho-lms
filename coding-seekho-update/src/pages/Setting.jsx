import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/settings.css';
import { useNavigate } from 'react-router-dom';

function Settings() {
  const navigate   = useNavigate();
  const userId     = localStorage.getItem('userId');
  const username   = localStorage.getItem('username') || 'Student';
  const email      = localStorage.getItem('email') || '';
  const joinedAt   = localStorage.getItem('joinedAt') || 'N/A';
  const savedPhoto = localStorage.getItem('profilePhoto') || '';

  const [activeSection, setActiveSection] = useState(null);
  const [profilePhoto, setProfilePhoto]   = useState(savedPhoto);
  const [oldPassword, setOldPassword]     = useState('');
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage]             = useState('');

  // Handle profile photo upload
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setProfilePhoto(base64);

      fetch(`http://localhost:8080/api/user/${userId}/photo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePhoto: base64 })
      })
        .then(res => res.text())
        .then(() => {
          localStorage.setItem('profilePhoto', base64);
          setMessage('Profile photo updated! ✅');
        });
    };
    reader.readAsDataURL(file);
  };

  // Handle password change
  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match!');
      return;
    }

    fetch(`http://localhost:8080/api/user/${userId}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword })
    })
      .then(res => res.text())
      .then(msg => setMessage(msg));
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const menuItems = [
    { key: 'photo',    icon: '🖼️',  label: 'Profile Photo' },
    { key: 'password', icon: '🔑',  label: 'Change Password' },
    { key: 'security', icon: '🛡️',  label: 'Security' },
    { key: 'friends',  icon: '👥',  label: 'Friends' },
    { key: 'twostep',  icon: '✅',  label: 'Enable Two Step Verification' },
    { key: 'display',  icon: '🌐',  label: 'Display and languages' },
    { key: 'help',     icon: '❓',  label: 'Help' },
  ];

  return (
    <div className="app-container">
      <Sidebar />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">Settings</div>
        </div>

        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-photo-wrapper">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="profile-img" />
            ) : (
              <div className="profile-placeholder">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="photo-edit-btn" htmlFor="photoInput">✏️</label>
            <input
              id="photoInput"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </div>
          <div className="profile-details">
            <div className="profile-username">{username}</div>
            <div className="profile-email">{email}</div>
            <div className="profile-joined">Joined: {joinedAt}</div>
          </div>
        </div>

        {/* Message */}
        {message && <div className="settings-message">{message}</div>}

        {/* Settings Menu */}
        <div className="settings-menu">
          {menuItems.map((item) => (
            <div
              key={item.key}
              className={`settings-item ${activeSection === item.key ? 'active-setting' : ''}`}
              onClick={() => setActiveSection(activeSection === item.key ? null : item.key)}
            >
              <span>{item.icon} {item.label}</span>
              <span>›</span>
            </div>
          ))}
        </div>

        {/* Change Password Section */}
        {activeSection === 'password' && (
          <div className="settings-section">
            <h3>Change Password</h3>
            <input
              type="password"
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button onClick={handlePasswordChange}>Update Password</button>
          </div>
        )}

        {/* Coming Soon for other sections */}
        {activeSection && activeSection !== 'password' && activeSection !== 'photo' && (
          <div className="settings-section">
            <h3>Coming Soon 🚧</h3>
            <p>This feature will be available when admin panel is built.</p>
          </div>
        )}

        {/* Logout */}
        <div className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </div>

      </div>
    </div>
  );
}

export default Settings;