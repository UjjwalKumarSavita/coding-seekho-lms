import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { Empty, formatDate } from '../components/AppLayout';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard').then(setData).catch(err => setError(err.message));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="skeleton-page">Loading your workspace...</div>;

  const stats = [
    ['Active batches', data.batches, 'Structured learning spaces'],
    ['Learning modules', data.courses, 'Courses available to you'],
    ['Upcoming classes', data.upcomingMeetings, 'Live sessions ahead'],
    ['Pending work', data.pendingAssignments, 'Assignments to complete']
  ];
  const introductions = {
    STUDENT: 'Your next class, batch discussion and submitted work are all here.',
    TEACHER: 'Teach, guide and keep every batch moving from one place.',
    ADMIN: 'Manage access, learning spaces and the complete LLC World experience.'
  };

  return (
    <>
      <section className="welcome-panel">
        <div>
          <p className="eyebrow">{user.role} WORKSPACE</p>
          <h1>Good to see you, {user.username.split(' ')[0]}.</h1>
          <p>{introductions[user.role]}</p>
        </div>
        <div className="welcome-badge"><span>LLC</span><small>Little Long Concept</small></div>
      </section>

      <div className="stats-grid">
        {stats.map(([label, value, note], index) => (
          <article className="stat-card" key={label}>
            <div className={`stat-icon tone-${index}`}>{String(index + 1).padStart(2, '0')}</div>
            <small>{label}</small><strong>{value}</strong><p>{note}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-heading">
            <div><p className="eyebrow">SCHEDULE</p><h2>Next live classes</h2></div>
            <Link to="/batches">View batches</Link>
          </div>
          {data.nextMeetings.length === 0 ? <Empty text="No classes are scheduled yet." /> : (
            <div className="meeting-list">
              {data.nextMeetings.map(meeting => (
                <div className="meeting-row" key={meeting.id}>
                  <div className={`provider-dot ${meeting.provider === 'ZOOM' ? 'zoom' : ''}`}></div>
                  <div><strong>{meeting.title}</strong><span>{meeting.batchName} · {meeting.teacher.username}</span></div>
                  <time>{formatDate(meeting.scheduledAt)}</time>
                  <Link className="text-button" to={`/batches/${meeting.batchId}`}>Open</Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {user.role === 'STUDENT' ? (
          <section className="panel progress-panel">
            <p className="eyebrow">YOUR MOMENTUM</p><h2>Attendance</h2>
            <div className="progress-ring" style={{ '--progress': `${Math.round(data.attendancePercent)}%` }}>
              <div><strong>{Math.round(data.attendancePercent)}%</strong><span>recorded</span></div>
            </div>
            <p className="muted">Attendance is recorded when you join a class through LLC World.</p>
          </section>
        ) : (
          <section className="panel progress-panel">
            <p className="eyebrow">{user.role === 'ADMIN' ? 'PLATFORM CONTROL' : 'TEACHING DESK'}</p>
            <h2>{user.role === 'ADMIN' ? 'Keep LLC organized' : 'Lead your classroom'}</h2>
            <div className="welcome-badge dashboard-action-badge"><span>LLC</span><small>Little Long Concept</small></div>
            <p className="muted">{user.role === 'ADMIN'
              ? 'Approve students, organize batches and maintain course access.'
              : 'Schedule lectures, publish assignments and guide batch discussions.'}</p>
            <Link className="primary-button full" to={user.role === 'ADMIN' ? '/admin' : '/batches'}>
              {user.role === 'ADMIN' ? 'Open administration' : 'Open my batches'}
            </Link>
          </section>
        )}
      </div>
    </>
  );
}
