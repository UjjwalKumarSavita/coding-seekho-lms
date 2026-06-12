import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';
import { api, jsonBody } from '../api';
import { Avatar, Empty, formatDate } from '../components/AppLayout';

export default function Support() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(user.role === 'STUDENT' ? user : null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const bottom = useRef(null);
  const isStudent = user.role === 'STUDENT';

  useEffect(() => {
    if (!isStudent) api('/support/students').then(data => { setStudents(data); if (data[0]) setSelected(data[0]); });
  }, [isStudent]);
  useEffect(() => {
    if (!selected) return;
    const suffix = isStudent ? '' : `?studentId=${selected.id}`;
    api(`/support${suffix}`).then(setMessages);
  }, [selected, isStudent]);
  useEffect(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  async function send(event) {
    event.preventDefault();
    if (!content.trim() || !selected) return;
    const suffix = isStudent ? '' : `?studentId=${selected.id}`;
    const saved = await api(`/support${suffix}`, { method: 'POST', body: jsonBody({ content }) });
    setMessages(list => [...list, saved]); setContent('');
  }
  return <>
    <div className="page-heading"><div><p className="eyebrow">DIRECT HELP</p><h1>{isStudent ? 'LLC support' : 'Student support'}</h1>
      <p>{isStudent ? 'Students without batch access can always talk directly with LLC staff here.' : 'Reply to students privately outside batch group conversations.'}</p></div></div>
    <section className="panel support-layout">
      {!isStudent && <aside className="support-contacts"><strong>Students</strong>{students.map(student =>
        <button className={selected?.id === student.id ? 'active' : ''} onClick={() => setSelected(student)} key={student.id}><Avatar user={student} /><span>{student.username}<small>{student.email}</small></span></button>)}</aside>}
      <div className="support-conversation">
        {selected ? <><div className="support-header"><Avatar user={selected} /><div><strong>{isStudent ? 'LLC World team' : selected.username}</strong><small>Private support conversation</small></div></div>
          <div className="chat-stream">
            {messages.length === 0 && <Empty text="No messages yet. Start the conversation." />}
            {messages.map(message => <div className={`chat-message ${message.sender.id === user.id ? 'mine' : ''}`} key={message.id}>
              <div className="message-avatar">{message.sender.username.charAt(0)}</div><div><div><strong>{message.sender.username}</strong><small>{formatDate(message.sentAt)}</small></div><p>{message.content}</p></div>
            </div>)}<div ref={bottom} /></div>
          <form className="chat-compose" onSubmit={send}><input value={content} onChange={e => setContent(e.target.value)} placeholder="Write a private message..." /><button className="primary-button">Send</button></form></>
          : <Empty text="Select a student conversation." />}
      </div>
    </section>
  </>;
}
