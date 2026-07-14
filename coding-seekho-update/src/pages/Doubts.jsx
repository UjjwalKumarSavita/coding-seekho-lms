import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api, jsonBody } from '../api';
import { Avatar, Empty, formatDate } from '../components/AppLayout';

export default function Doubts() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState(params.get('batch') || '');
  const [threads, setThreads] = useState([]);
  const [selectedId, setSelectedId] = useState(params.get('thread') || '');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/batches').then(data => {
      setBatches(data);
      if (!batchId && data.length) setBatchId(String(data[0].id));
    }).catch(err => setError(err.message));
  }, [batchId]);

  const refresh = useCallback(() => {
    if (!batchId) return;
    setParams(current => {
      current.set('batch', batchId);
      return current;
    }, { replace: true });
    api(`/doubts/batch/${batchId}`).then(setThreads).catch(err => setError(err.message));
  }, [batchId, setParams]);

  useEffect(() => { refresh(); }, [refresh]);

  const visible = useMemo(() => threads.filter(thread => {
    const matchesText = `${thread.title} ${thread.content} ${thread.topic}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filter === 'all' || (filter === 'resolved' ? thread.resolved : !thread.resolved);
    return matchesText && matchesStatus;
  }), [threads, search, filter]);
  const selected = threads.find(thread => String(thread.id) === String(selectedId));

  function select(thread) {
    setSelectedId(String(thread.id));
    setParams({ batch: batchId, thread: String(thread.id) }, { replace: true });
  }

  return (
    <>
      <section className="page-hero doubt-hero reveal">
        <div><p className="eyebrow">ASK. ANSWER. GROW.</p><h1>Every doubt deserves<br />a clear next step.</h1>
          <p>Batch-focused question threads keep useful answers visible for everyone learning the same concept.</p></div>
        <div className="question-visual" aria-hidden="true"><span>?</span><i></i><i></i></div>
      </section>

      <section className="learning-toolbar reveal reveal-delay-1">
        <label><span>Learning batch</span><select value={batchId} onChange={event => {
          setBatchId(event.target.value); setSelectedId('');
        }}>{batches.map(batch => <option value={batch.id} key={batch.id}>{batch.name}</option>)}</select></label>
        <div><span>{threads.filter(thread => !thread.resolved).length} open questions</span>
          <button className="primary-button" onClick={() => setShowForm(true)}>Ask a doubt</button></div>
      </section>

      {error && <div className="alert error">{error}</div>}
      <div className="doubt-layout">
        <aside className="doubt-list panel">
          <input className="doubt-search" value={search} onChange={event => setSearch(event.target.value)}
            placeholder="Search doubts and topics..." />
          <div className="filter-bar compact">
            {['all', 'open', 'resolved'].map(value => <button key={value}
              className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value}</button>)}
          </div>
          <div className="thread-list">
            {visible.length === 0 && <Empty text="No doubt threads match this view." />}
            {visible.map(thread => <button key={thread.id} className={String(thread.id) === String(selectedId) ? 'active' : ''}
              onClick={() => select(thread)}>
              <div><span className={`status-dot ${thread.resolved ? 'resolved' : ''}`}></span><small>{thread.topic}</small></div>
              <strong>{thread.title}</strong>
              <p>{thread.content}</p>
              <footer><span>{thread.author.username}</span><b>{thread.replies.length} replies</b></footer>
            </button>)}
          </div>
        </aside>

        <section className="thread-panel panel">
          {!selected ? <Empty text="Select a doubt to read the full discussion." /> :
            <Thread thread={selected} user={user} updated={updated => {
              setThreads(list => list.map(item => item.id === updated.id ? updated : item));
            }} />}
        </section>
      </div>
      {showForm && <DoubtForm batchId={Number(batchId)} close={() => setShowForm(false)}
        saved={thread => { setShowForm(false); refresh(); setSelectedId(String(thread.id)); }} />}
    </>
  );
}

function Thread({ thread, user, updated }) {
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const canResolve = user.role !== 'STUDENT' || user.id === thread.author.id;

  async function reply(event) {
    event.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    try {
      const result = await api(`/doubts/${thread.id}/replies`, {
        method: 'POST', body: jsonBody({ content })
      });
      updated(result); setContent('');
    } finally { setBusy(false); }
  }

  async function resolve() {
    const result = await api(`/doubts/${thread.id}/resolved?value=${!thread.resolved}`, { method: 'PUT' });
    updated(result);
  }

  return <div className="thread-content">
    <header>
      <div><span className={`status-pill ${thread.resolved ? 'completed' : ''}`}>{thread.resolved ? 'RESOLVED' : 'OPEN'}</span>
        <small>{thread.topic}</small></div>
      <h2>{thread.title}</h2>
      <div className="thread-author"><Avatar user={thread.author} /><span><strong>{thread.author.username}</strong>
        <small>{thread.author.role} · {formatDate(thread.createdAt)}</small></span></div>
      <p>{thread.content}</p>
      {canResolve && <button className="text-button" onClick={resolve}>
        Mark as {thread.resolved ? 'open' : 'resolved'}</button>}
    </header>
    <div className="reply-stream">
      <div className="reply-heading"><h3>Discussion</h3><span>{thread.replies.length} replies</span></div>
      {thread.replies.length === 0 && <Empty text="Be the first person to add a helpful answer." />}
      {thread.replies.map(reply => <article key={reply.id}><Avatar user={reply.author} /><div>
        <div><strong>{reply.author.username}</strong><small>{reply.author.role} · {formatDate(reply.createdAt)}</small></div>
        <p>{reply.content}</p></div></article>)}
    </div>
    <form className="reply-compose" onSubmit={reply}><textarea value={content}
      onChange={event => setContent(event.target.value)} placeholder="Write a clear answer or ask for clarification..." />
      <button className="primary-button" disabled={busy}>Post reply</button></form>
  </div>;
}

function DoubtForm({ batchId, close, saved }) {
  const [form, setForm] = useState({ title: '', topic: '', content: '' });
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    try {
      saved(await api('/doubts', { method: 'POST', body: jsonBody({ ...form, batchId }) }));
    } catch (err) { setError(err.message); }
  }
  return <div className="modal-backdrop"><form className="modal-card doubt-form" onSubmit={submit}>
    <div className="drawer-title"><div><p className="eyebrow">NEW QUESTION</p><h2>Ask your batch</h2></div>
      <button type="button" onClick={close}>Close</button></div>
    {error && <div className="alert error">{error}</div>}
    <label><span>Short title</span><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
      placeholder="What concept are you stuck on?" required /></label>
    <label><span>Topic</span><input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}
      placeholder="React hooks, JWT, PostgreSQL..." required /></label>
    <label><span>Explain the doubt</span><textarea value={form.content}
      onChange={e => setForm({ ...form, content: e.target.value })}
      placeholder="Share what you tried and where the confusion begins." required /></label>
    <button className="primary-button full">Publish doubt</button>
  </form></div>;
}
