import { useEffect, useState } from 'react';
import { api, jsonBody } from '../api';
import { Empty } from '../components/AppLayout';

export default function Admin() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [message, setMessage] = useState('');
  const load = () => Promise.all([api('/admin/users'), api('/admin/batches')]).then(([u, b]) => { setUsers(u); setBatches(b); });
  useEffect(() => { load(); }, []);
  return <>
    <div className="page-heading"><div><p className="eyebrow">INSTITUTION CONTROL</p><h1>Administration</h1><p>Manage identities, batches, fees, access and the LLC curriculum.</p></div></div>
    {message && <div className="alert success">{message}</div>}
    <div className="workspace-tabs admin-tabs">{['users', 'batches', 'access'].map(value =>
      <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{value}</button>)}</div>
    {tab === 'users' && <Users users={users} reload={load} />}
    {tab === 'batches' && <BatchAdmin batches={batches} reload={load} setMessage={setMessage} />}
    {tab === 'access' && <AccessAdmin users={users} batches={batches} setMessage={setMessage} />}
  </>;
}

function Users({ users, reload }) {
  async function update(user, changes) {
    await api(`/admin/users/${user.id}`, { method: 'PUT', body: jsonBody({ role: user.role, enabled: user.enabled, ...changes }) });
    reload();
  }
  return <section className="panel"><div className="section-heading"><div><p className="eyebrow">PEOPLE</p><h2>Users and roles</h2></div><span>{users.length} accounts</span></div>
    <div className="data-table"><div className="data-head"><span>Name</span><span>Email</span><span>Role</span><span>Access</span></div>
      {users.map(user => <div className="data-row" key={user.id}><span><strong>{user.username}</strong><small>Joined {user.joinedAt}</small></span><span>{user.email}</span>
        <span><select value={user.role} onChange={e => update(user, { role: e.target.value })}><option>STUDENT</option><option>TEACHER</option><option>ADMIN</option></select></span>
        <span><button className={`status-toggle ${user.enabled ? 'on' : ''}`} onClick={() => update(user, { enabled: !user.enabled })}>{user.enabled ? 'Enabled' : 'Disabled'}</button></span></div>)}
    </div></section>;
}

function BatchAdmin({ batches, reload, setMessage }) {
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [course, setCourse] = useState({ batchId: '', name: '', code: '', description: '' });
  async function createBatch(event) {
    event.preventDefault(); await api('/admin/batches', { method: 'POST', body: jsonBody({ ...form, active: true }) });
    setForm({ name: '', code: '', description: '' }); setMessage('Batch created.'); reload();
  }
  async function createCourse(event) {
    event.preventDefault(); await api('/admin/courses', { method: 'POST', body: jsonBody({ ...course, batchId: Number(course.batchId), active: true }) });
    setCourse({ batchId: '', name: '', code: '', description: '' }); setMessage('Course module added.');
  }
  return <div className="admin-grid"><section className="panel"><p className="eyebrow">NEW LEARNING SPACE</p><h2>Create batch</h2>
    <form className="stack-form" onSubmit={createBatch}><label><span>Batch name</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
      <label><span>Code</span><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="LLC-JAVA-02" required /></label>
      <label><span>Description</span><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><button className="primary-button">Create batch</button></form></section>
    <section className="panel"><p className="eyebrow">CURRICULUM</p><h2>Add course module</h2>
      <form className="stack-form" onSubmit={createCourse}><label><span>Batch</span><select value={course.batchId} onChange={e => setCourse({ ...course, batchId: e.target.value })} required><option value="">Select batch</option>{batches.map(batch => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label>
        <label><span>Course name</span><input value={course.name} onChange={e => setCourse({ ...course, name: e.target.value })} required /></label>
        <label><span>Course code</span><input value={course.code} onChange={e => setCourse({ ...course, code: e.target.value })} required /></label>
        <label><span>Description</span><textarea value={course.description} onChange={e => setCourse({ ...course, description: e.target.value })} /></label><button className="primary-button">Add module</button></form></section>
    <section className="panel span-two"><div className="section-heading"><div><p className="eyebrow">ALL BATCHES</p><h2>Current learning spaces</h2></div></div>
      {batches.length === 0 ? <Empty text="Create the first LLC batch." /> : <div className="batch-admin-list">{batches.map(batch => <article key={batch.id}><b>{batch.code}</b><div><strong>{batch.name}</strong><p>{batch.description}</p></div><span className="status-pill live">{batch.active ? 'ACTIVE' : 'PAUSED'}</span></article>)}</div>}</section>
  </div>;
}

function AccessAdmin({ users, batches, setMessage }) {
  const students = users.filter(user => user.role === 'STUDENT' || user.role === 'TEACHER');
  const [form, setForm] = useState({ userId: '', batchId: '', status: 'ACTIVE', feePaid: true });
  async function save(event) {
    event.preventDefault();
    await api('/admin/enrollments', { method: 'POST', body: jsonBody({ ...form, userId: Number(form.userId), batchId: Number(form.batchId) }) });
    setMessage('Batch access updated and the user was notified.');
  }
  return <section className="panel access-panel"><div><p className="eyebrow">ENROLLMENT AND FEES</p><h2>Grant batch access</h2><p className="muted">A user can belong to multiple batches. Batch chat and learning content unlock only while access is Active.</p></div>
    <form className="product-form" onSubmit={save}><label><span>User</span><select value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} required><option value="">Select user</option>{students.map(user => <option value={user.id} key={user.id}>{user.username} ({user.role})</option>)}</select></label>
      <label><span>Batch</span><select value={form.batchId} onChange={e => setForm({ ...form, batchId: e.target.value })} required><option value="">Select batch</option>{batches.map(batch => <option value={batch.id} key={batch.id}>{batch.name}</option>)}</select></label>
      <label><span>Status</span><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>ACTIVE</option><option>PENDING</option><option>SUSPENDED</option></select></label>
      <label className="checkbox-field"><input type="checkbox" checked={form.feePaid} onChange={e => setForm({ ...form, feePaid: e.target.checked })} /><span>Fee verified</span></label>
      <button className="primary-button">Save access</button></form></section>;
}
