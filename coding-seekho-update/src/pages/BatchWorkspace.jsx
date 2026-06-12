import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api, jsonBody } from '../api';
import { Empty, formatDate } from '../components/AppLayout';

const nowLocal = () => {
  const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return date.toISOString().slice(0, 16);
};

export default function BatchWorkspace() {
  const { batchId } = useParams();
  const { user } = useAuth();
  const [batch, setBatch] = useState(null);
  const [tab, setTab] = useState('overview');
  const [courses, setCourses] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const canTeach = user.role === 'TEACHER' || user.role === 'ADMIN';

  const refresh = useCallback(async () => {
    try {
      const [batches, courseData, meetingData, assignmentData, messageData] = await Promise.all([
        api('/batches'), api(`/batches/${batchId}/courses`), api(`/meetings/batch/${batchId}`),
        api(`/assignments/batch/${batchId}`), api(`/chat/batches/${batchId}`)
      ]);
      setBatch(batches.find(value => String(value.id) === String(batchId)));
      setCourses(courseData); setMeetings(meetingData); setAssignments(assignmentData); setMessages(messageData);
    } catch (err) { setError(err.message); }
  }, [batchId]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (tab !== 'chat') return undefined;
    const timer = setInterval(() => api(`/chat/batches/${batchId}`).then(setMessages).catch(() => {}), 8000);
    return () => clearInterval(timer);
  }, [tab, batchId]);

  if (error) return <div className="alert error">{error}</div>;
  if (!batch) return <div className="skeleton-page">Opening batch workspace...</div>;
  return (
    <>
      <div className="workspace-hero">
        <div><Link to="/batches" className="back-link">← All batches</Link><p className="eyebrow">{batch.code}</p>
          <h1>{batch.name}</h1><p>{batch.description}</p></div>
        <div className="workspace-symbol"><span>L</span><span>L</span><span>C</span></div>
      </div>
      <div className="workspace-tabs">
        {['overview', 'chat', 'meetings', 'assignments'].map(value =>
          <button className={tab === value ? 'active' : ''} onClick={() => setTab(value)} key={value}>{value}</button>)}
      </div>
      {tab === 'overview' && <Overview courses={courses} meetings={meetings} assignments={assignments} />}
      {tab === 'chat' && <BatchChat batchId={batchId} messages={messages} setMessages={setMessages} user={user} />}
      {tab === 'meetings' && <Meetings batchId={batchId} meetings={meetings} canTeach={canTeach} refresh={refresh} />}
      {tab === 'assignments' && <Assignments batchId={batchId} assignments={assignments} canTeach={canTeach}
        user={user} refresh={refresh} />}
    </>
  );
}

function Overview({ courses, meetings, assignments }) {
  const upcoming = meetings.filter(item => item.status !== 'CANCELLED').slice(0, 3);
  return <div className="workspace-grid">
    <section className="panel span-two"><div className="section-heading"><div><p className="eyebrow">CURRICULUM</p><h2>Course modules</h2></div></div>
      {courses.length === 0 ? <Empty text="No modules have been published." /> : <div className="module-list">
        {courses.map((course, index) => <article key={course.id}><b>{String(index + 1).padStart(2, '0')}</b><div><strong>{course.name}</strong><span>{course.code}</span><p>{course.description}</p></div></article>)}
      </div>}</section>
    <section className="panel"><p className="eyebrow">AT A GLANCE</p><h2>Batch activity</h2>
      <div className="compact-stats"><div><strong>{courses.length}</strong><span>Modules</span></div><div><strong>{meetings.length}</strong><span>Classes</span></div><div><strong>{assignments.length}</strong><span>Assignments</span></div></div>
    </section>
    <section className="panel span-three"><div className="section-heading"><div><p className="eyebrow">UP NEXT</p><h2>Upcoming classes</h2></div></div>
      {upcoming.length === 0 ? <Empty text="The teacher has not scheduled a class yet." /> :
        <div className="meeting-list">{upcoming.map(item => <div className="meeting-row" key={item.id}><div className="provider-dot"></div><div><strong>{item.title}</strong><span>{item.subject || item.provider.replace('_', ' ')}</span></div><time>{formatDate(item.scheduledAt)}</time></div>)}</div>}
    </section>
  </div>;
}

function BatchChat({ batchId, messages, setMessages, user }) {
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const bottom = useRef(null);
  useEffect(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);
  async function send(event) {
    event.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    try {
      const saved = await api(`/chat/batches/${batchId}`, { method: 'POST', body: jsonBody({ content }) });
      setMessages(list => [...list, saved]); setContent('');
    } finally { setBusy(false); }
  }
  return <section className="panel chat-workspace">
    <div className="chat-intro"><div><p className="eyebrow">BATCH-ONLY GROUP</p><h2>Class conversation</h2></div><span>Only approved members can read or send messages.</span></div>
    <div className="chat-stream">
      {messages.length === 0 && <Empty text="Start the first conversation for this batch." />}
      {messages.map(message => <div className={`chat-message ${message.sender.id === user.id ? 'mine' : ''}`} key={message.id}>
        <div className="message-avatar">{message.sender.username.charAt(0)}</div>
        <div><div><strong>{message.sender.username}</strong><small>{message.sender.role} · {formatDate(message.sentAt)}</small></div><p>{message.content}</p></div>
      </div>)}<div ref={bottom} />
    </div>
    <form className="chat-compose" onSubmit={send}><input value={content} onChange={e => setContent(e.target.value)}
      placeholder="Write to your batch..." maxLength="3000" /><button className="primary-button" disabled={busy}>Send</button></form>
  </section>;
}

function Meetings({ batchId, meetings, canTeach, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', provider: 'GOOGLE_MEET', joinUrl: '', scheduledAt: nowLocal(), endsAt: '' });
  const [error, setError] = useState('');
  const update = e => setForm(value => ({ ...value, [e.target.name]: e.target.value }));
  async function create(event) {
    event.preventDefault(); setError('');
    try {
      await api('/meetings', { method: 'POST', body: jsonBody({
        ...form, batchId: Number(batchId), scheduledAt: new Date(form.scheduledAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null
      }) });
      setShowForm(false); setForm(value => ({ ...value, title: '', subject: '', joinUrl: '' })); refresh();
    } catch (err) { setError(err.message); }
  }
  async function join(meeting) {
    const popup = window.open('', '_blank');
    try {
      const result = await api(`/meetings/${meeting.id}/join`, { method: 'POST' });
      if (popup) popup.location = result.joinUrl; else window.location.href = result.joinUrl;
    } catch (err) { popup?.close(); setError(err.message); }
  }
  return <section className="panel">
    <div className="section-heading"><div><p className="eyebrow">LIVE LEARNING</p><h2>Meetings and lectures</h2></div>
      {canTeach && <button className="primary-button" onClick={() => setShowForm(value => !value)}>{showForm ? 'Close' : '+ Create meeting'}</button>}</div>
    {error && <div className="alert error">{error}</div>}
    {showForm && <form className="product-form meeting-form" onSubmit={create}>
      <div className="form-note"><strong>Provider link setup</strong><p>Open your provider, create the free room, then paste its link below. LLC distributes it and records student joins.</p>
        <div><a target="_blank" rel="noreferrer" href="https://meet.google.com/new">Create Google Meet ↗</a>
          <a target="_blank" rel="noreferrer" href="https://zoom.us/meeting/schedule">Schedule Zoom ↗</a></div></div>
      <label><span>Class title</span><input name="title" value={form.title} onChange={update} required /></label>
      <label><span>Subject</span><input name="subject" value={form.subject} onChange={update} /></label>
      <label><span>Provider</span><select name="provider" value={form.provider} onChange={update}><option>GOOGLE_MEET</option><option>ZOOM</option></select></label>
      <label><span>Meeting URL</span><input name="joinUrl" type="url" value={form.joinUrl} onChange={update} placeholder={form.provider === 'ZOOM' ? 'https://zoom.us/j/...' : 'https://meet.google.com/xxx-xxxx-xxx'} required /></label>
      <label><span>Starts</span><input name="scheduledAt" type="datetime-local" value={form.scheduledAt} onChange={update} required /></label>
      <label><span>Ends (optional)</span><input name="endsAt" type="datetime-local" value={form.endsAt} onChange={update} /></label>
      <button className="primary-button">Publish to batch</button>
    </form>}
    {meetings.length === 0 ? <Empty text="No meeting has been published." /> :
      <div className="meeting-cards">{meetings.map(meeting => <article key={meeting.id}>
        <div className="meeting-card-top"><span className={`status-pill ${meeting.status.toLowerCase()}`}>{meeting.status}</span><small>{meeting.provider.replace('_', ' ')}</small></div>
        <h3>{meeting.title}</h3><p>{meeting.subject || 'LLC World live class'}</p>
        <div className="meeting-details"><span>{formatDate(meeting.scheduledAt)}</span><span>By {meeting.teacher.username}</span></div>
        <button className="primary-button full" onClick={() => join(meeting)}>Join class and mark attendance</button>
      </article>)}</div>}
  </section>;
}

function Assignments({ batchId, assignments, canTeach, user, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueAt: nowLocal(), maxScore: 100 });
  const [reviewing, setReviewing] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState('');
  async function create(event) {
    event.preventDefault();
    try {
      await api('/assignments', { method: 'POST', body: jsonBody({ ...form, batchId: Number(batchId),
        dueAt: new Date(form.dueAt).toISOString(), maxScore: Number(form.maxScore) }) });
      setShowForm(false); refresh();
    } catch (err) { setError(err.message); }
  }
  async function review(id) {
    setReviewing(id); setSubmissions(await api(`/assignments/${id}/submissions`));
  }
  return <section className="panel">
    <div className="section-heading"><div><p className="eyebrow">PRACTICE AND FEEDBACK</p><h2>Assignments</h2></div>
      {canTeach && <button className="primary-button" onClick={() => setShowForm(value => !value)}>{showForm ? 'Close' : '+ New assignment'}</button>}</div>
    {error && <div className="alert error">{error}</div>}
    {showForm && <form className="product-form" onSubmit={create}>
      <label><span>Title</span><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></label>
      <label className="wide"><span>Instructions</span><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
      <label><span>Due date</span><input type="datetime-local" value={form.dueAt} onChange={e => setForm({ ...form, dueAt: e.target.value })} required /></label>
      <label><span>Maximum score</span><input type="number" min="1" value={form.maxScore} onChange={e => setForm({ ...form, maxScore: e.target.value })} /></label>
      <button className="primary-button">Publish assignment</button>
    </form>}
    {assignments.length === 0 ? <Empty text="No assignments have been published." /> :
      <div className="assignment-list">{assignments.map(item => <article key={item.id}>
        <div><span className={`status-pill ${item.mySubmission ? 'completed' : 'scheduled'}`}>{item.mySubmission ? 'SUBMITTED' : `DUE ${formatDate(item.dueAt)}`}</span>
          <h3>{item.title}</h3><p>{item.description}</p><small>{item.maxScore} marks · {item.teacher.username}</small></div>
        {user.role === 'STUDENT' ? <SubmissionForm assignment={item} refresh={refresh} /> :
          <button className="secondary-button" onClick={() => review(item.id)}>Review submissions</button>}
      </article>)}</div>}
    {reviewing && <SubmissionReview submissions={submissions} setSubmissions={setSubmissions} close={() => setReviewing(null)} />}
  </section>;
}

function SubmissionForm({ assignment, refresh }) {
  const [answer, setAnswer] = useState(assignment.mySubmission?.answer || '');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault();
    const body = new FormData(); body.append('answer', answer); if (file) body.append('file', file);
    await api(`/assignments/${assignment.id}/submit`, { method: 'POST', body });
    setMessage('Submitted'); refresh();
  }
  return <form className="submission-form" onSubmit={submit}><textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Add your answer or submission note..." />
    <label className="file-field"><input type="file" onChange={e => setFile(e.target.files[0])} /><span>{file?.name || assignment.mySubmission?.fileName || 'Attach file'}</span></label>
    <button className="primary-button">{assignment.mySubmission ? 'Update submission' : 'Submit work'}</button>{message && <small>{message}</small>}</form>;
}

function SubmissionReview({ submissions, setSubmissions, close }) {
  async function grade(submission, score, feedback) {
    const updated = await api(`/assignments/submissions/${submission.id}/grade`, {
      method: 'PUT', body: jsonBody({ score: Number(score), feedback })
    });
    setSubmissions(list => list.map(item => item.id === updated.id ? updated : item));
  }
  return <div className="modal-backdrop"><div className="modal-card wide-modal"><div className="drawer-title"><h2>Submission review</h2><button onClick={close}>×</button></div>
    {submissions.length === 0 ? <Empty text="No students have submitted yet." /> : submissions.map(item => <GradeRow key={item.id} item={item} onGrade={grade} />)}</div></div>;
}

function GradeRow({ item, onGrade }) {
  const [score, setScore] = useState(item.score ?? 0);
  const [feedback, setFeedback] = useState(item.feedback || '');
  return <div className="grade-row"><div><strong>{item.student.username}</strong><small>{formatDate(item.submittedAt)} · {item.fileName || 'Text answer'}</small><p>{item.answer}</p></div>
    <input type="number" min="0" value={score} onChange={e => setScore(e.target.value)} /><input value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Feedback" />
    <button className="primary-button" onClick={() => onGrade(item, score, feedback)}>Save grade</button></div>;
}
