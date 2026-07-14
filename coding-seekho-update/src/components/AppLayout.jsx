import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  MessageCircleQuestion,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  UsersRound,
  X
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { api } from '../api';
import Logo from './Logo';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('llc_sidebar_collapsed') === 'true');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    api('/notifications').then(setNotifications).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('llc_sidebar_collapsed', collapsed);
  }, [collapsed]);

  useEffect(() => {
    setShowNotifications(false);
  }, [location.pathname]);

  const nav = [
    [LayoutDashboard, 'Dashboard', '/dashboard'],
    [UsersRound, 'My batches', '/batches'],
    [CalendarDays, 'Schedule', '/schedule'],
    [ClipboardCheck, 'Quizzes', '/quizzes'],
    [MessageCircleQuestion, 'Doubts', '/doubts'],
    [CircleHelp, user.role === 'STUDENT' ? 'LLC support' : 'Student support', '/support'],
    ...(user.role === 'ADMIN' ? [[ShieldCheck, 'Administration', '/admin']] : []),
    [Settings, 'Settings', '/settings']
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
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
          </button>
        </div>
        <div className="profile-mini">
          <Avatar user={user} />
          {!collapsed && <div><strong>{user.username}</strong><small>{user.role}</small></div>}
        </div>
        <nav>
          {nav.map(([Icon, label, path]) => (
            <NavLink key={path} to={path} className={({ isActive }) => isActive ? 'active' : ''}
              aria-label={label} title={collapsed ? label : undefined}>
              <span className="nav-icon"><Icon aria-hidden="true" /></span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-logout" onClick={logout} aria-label="Sign out"
          title={collapsed ? 'Sign out' : undefined}>
          <span className="nav-icon"><LogOut aria-hidden="true" /></span>
          <span className="nav-label">Sign out</span>
        </button>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div><small>LLC WORLD</small><strong>Learn deeply. Build confidently.</strong></div>
          <div className="top-actions">
            <button className="theme-toggle" onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              <span className="theme-icon" key={theme}>
                {theme === 'light' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
              </span>
            </button>
            <button className="notification-button" onClick={() => setShowNotifications(value => !value)}
              aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={showNotifications}>
              <Bell aria-hidden="true" />{unread > 0 && <b>{unread}</b>}
            </button>
            <Avatar user={user} />
          </div>
        </header>
        {showNotifications && (
          <div className="notification-drawer">
            <div className="drawer-title"><strong>Notifications</strong>
              <button onClick={() => setShowNotifications(false)} aria-label="Close notifications">
                <X aria-hidden="true" />
              </button></div>
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
        <div className="page-content route-stage" key={location.pathname}><Outlet /></div>
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
  return <div className="empty-state"><span><BookOpen aria-hidden="true" /></span><p>{text}</p></div>;
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}
