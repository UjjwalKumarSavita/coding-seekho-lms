import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/sidebar.css';

function Sidebar() {

    const profilePhoto = localStorage.getItem('profilePhoto') || '';

  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('username') || 'Student';
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: 'Home',        icon: '🏠', path: '/dashboard' },
    { label: 'My Courses',  icon: '📚', path: '/courses' },
    { label: 'Assignments', icon: '📋', path: '/assignments' },
    { label: 'Time Table',  icon: '📅', path: '/timetable' },
    { label: 'Forum',       icon: '💬', path: '/forum' },
    { label: 'Settings',    icon: '⚙️', path: '/settings' },
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

      <div className="sidebar-top">
        <div className="sidebar-logo">
          {!collapsed && <span className="logo-text">OXFORD</span>}
        </div>
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '→' : '☰'}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-profile">
          {/* <div className="avatar">{username.charAt(0).toUpperCase()}</div> */}
          {/* profile photo update karne ke liye */ }
          {profilePhoto ? (
          <img
            src={profilePhoto}
            alt="Profile"
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div className="avatar">{username.charAt(0).toUpperCase()}</div>
        )}
          <div>
            <div className="profile-name">Hi, {username}</div>
            <div className="profile-id">E173037</div>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </div>
        ))}
      </nav>

    </div>
  );
}

export default Sidebar;