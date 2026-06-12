import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import Logo from './Logo';

const icons = { dashboard: '⌂', batches: '▤', support: '◌', admin: '◇', settings: '⚙' };

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    api('/notifications').then(setNotifications).catch(() => {});
  }, []);

  const nav = [
    ['dashboard', 'Dashboard', '/dashboard'],
    ['batches', 'My batches', '/batches'],
    ['support', user.role === 'STUDENT' ? 'LLC support' : 'Student support', '/support'],
    ...(user.role === 'ADMIN' ? [['admin', 'Administration', '/admin']] : []),
    ['settings', 'Settings', '/settings']
  ];
  const unread = notifications.filter(item => !item.read).length;

  async function openNotification(item) {
    if (!item.read) {
      const updated = await api(`/notifications/${item.id}/read`, { method: 'PUT' });
      setNotifications(list => list.map(value => value.id === item.id ? updated : value));
    }
    if (item.actionUrl) navigate(item.actionUrl);
    setShowNotifications(false);
  }

  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo compact={collapsed} />
          <button className="icon-button sidebar-toggle" onClick={() => setCollapsed(value => !value)}
            aria-label="Toggle menu">☰</button>
        </div>
        <div className="profile-mini">
          <Avatar user={user} />
          {!collapsed && <div><strong>{user.username}</strong><small>{user.role}</small></div>}
        </div>
        <nav>
          {nav.map(([icon, label, path]) => (
            <NavLink key={path} to={path} className={({ isActive }) => isActive ? 'active' : ''}>
              <span>{icons[icon]}</span>{!collapsed && label}
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-logout" onClick={logout}><span>↪</span>{!collapsed && 'Sign out'}</button>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div><small>LLC WORLD</small><strong>Learn deeply. Build confidently.</strong></div>
          <div className="top-actions">
            <button className="notification-button" onClick={() => setShowNotifications(value => !value)}>
              ♢{unread > 0 && <b>{unread}</b>}
            </button>
            <Avatar user={user} />
          </div>
        </header>
        {showNotifications && (
          <div className="notification-drawer">
            <div className="drawer-title"><strong>Notifications</strong><button onClick={() => setShowNotifications(false)}>×</button></div>
            {notifications.length === 0 && <Empty text="You are all caught up." />}
            {notifications.map(item => (
              <button key={item.id} className={`notification-item ${item.read ? '' : 'unread'}`}
                onClick={() => openNotification(item)}>
                <strong>{item.title}</strong><span>{item.message}</span>
                <small>{formatDate(item.createdAt)}</small>
              </button>
            ))}
          </div>
        )}
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}

export function Avatar({ user, size = 'normal' }) {
  return user.profilePhoto
    ? <img className={`avatar avatar-${size}`} src={user.profilePhoto} alt="" />
    : <div className={`avatar avatar-${size}`}>{user.username?.charAt(0).toUpperCase()}</div>;
}

export function Empty({ text }) {
  return <div className="empty-state"><span>LLC</span><p>{text}</p></div>;
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}
