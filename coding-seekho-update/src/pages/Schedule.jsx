import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { Empty, formatDate } from '../components/AppLayout';

export default function Schedule() {
  const [meetings, setMeetings] = useState([]);
  const [filter, setFilter] = useState('upcoming');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/meetings/schedule').then(setMeetings).catch(err => setError(err.message));
  }, []);

  const visible = useMemo(() => {
    const now = Date.now();
    return meetings.filter(meeting => {
      if (filter === 'all') return true;
      if (filter === 'past') return new Date(meeting.scheduledAt).getTime() < now;
      return new Date(meeting.scheduledAt).getTime() >= now && meeting.status !== 'CANCELLED';
    });
  }, [meetings, filter]);

  const groups = visible.reduce((result, meeting) => {
    const key = new Date(meeting.scheduledAt).toLocaleDateString([], {
      weekday: 'long', month: 'long', day: 'numeric'
    });
    (result[key] ||= []).push(meeting);
    return result;
  }, {});

  async function join(meeting) {
    const popup = window.open('', '_blank');
    try {
      const result = await api(`/meetings/${meeting.id}/join`, { method: 'POST' });
      if (popup) popup.location = result.joinUrl;
    } catch (err) {
      popup?.close();
      setError(err.message);
    }
  }

  return (
    <>
      <section className="page-hero schedule-hero reveal">
        <div>
          <p className="eyebrow">LEARNING RHYTHM</p>
          <h1>Your weekly schedule</h1>
          <p>Classes from every approved batch, organized into one calm timeline.</p>
        </div>
        <div className="orbit-visual" aria-hidden="true"><span></span><b>LIVE</b></div>
      </section>

      <div className="filter-bar reveal reveal-delay-1">
        {['upcoming', 'past', 'all'].map(value => (
          <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>
            {value}
          </button>
        ))}
      </div>

      {error && <div className="alert error">{error}</div>}
      {visible.length === 0 ? <section className="panel"><Empty text="No classes match this schedule view." /></section> : (
        <div className="schedule-groups">
          {Object.entries(groups).map(([date, items], groupIndex) => (
            <section className="schedule-day reveal" style={{ '--delay': `${groupIndex * 70}ms` }} key={date}>
              <div className="schedule-date"><span>{String(groupIndex + 1).padStart(2, '0')}</span><h2>{date}</h2></div>
              <div className="schedule-list">
                {items.map(meeting => (
                  <article className="schedule-card" key={meeting.id}>
                    <time>{new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                    <div className="schedule-marker"><i></i></div>
                    <div>
                      <span className="status-pill">{meeting.provider.replace('_', ' ')}</span>
                      <h3>{meeting.title}</h3>
                      <p>{meeting.batchName} · {meeting.subject || 'Live class'} · {meeting.teacher.username}</p>
                      <small>{formatDate(meeting.scheduledAt)}{meeting.endsAt ? ` to ${formatDate(meeting.endsAt)}` : ''}</small>
                    </div>
                    <button className="primary-button" onClick={() => join(meeting)}>Join class</button>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
