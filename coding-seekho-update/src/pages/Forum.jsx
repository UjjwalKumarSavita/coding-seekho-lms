import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/forum.css';

function Forum() {
  const currentUser = localStorage.getItem('username') || 'Alex';

  const [lectures, setLectures]         = useState([]);
  const [students, setStudents]         = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [newMessage, setNewMessage]     = useState('');
  const [search, setSearch]             = useState('');
  const bottomRef = useRef(null);

  // Fetch contacts
  useEffect(() => {
    fetch('http://localhost:8080/api/messages/contacts?type=Lecture')
      .then(res => res.json())
      .then(data => {
        const unique = [...new Map(data.map(m => [m.senderName, m])).values()];
        setLectures(unique);
      });

    fetch('http://localhost:8080/api/messages/contacts?type=Student')
      .then(res => res.json())
      .then(data => {
        const unique = [...new Map(data.map(m =>
          [m.senderName === currentUser ? m.receiverName : m.senderName, m]
        ).values())];
        setStudents(unique);
      });
  }, []);

  // Fetch chat when contact selected
  useEffect(() => {
    if (!selectedContact) return;
    fetch(`http://localhost:8080/api/messages/chat?sender=${currentUser}&receiver=${selectedContact}`)
      .then(res => res.json())
      .then(data => setMessages(data));
  }, [selectedContact]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedContact) return;

    const msg = {
      senderName: currentUser,
      receiverName: selectedContact,
      content: newMessage,
      type: 'Student'
    };

    fetch('http://localhost:8080/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    })
      .then(res => res.json())
      .then(saved => {
        setMessages(prev => [...prev, saved]);
        setNewMessage('');
      });
  };

  const getInitial = (name) => name?.charAt(0).toUpperCase();

  const filteredStudents = students.filter(s => {
    const name = s.senderName === currentUser ? s.receiverName : s.senderName;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  const filteredLectures = lectures.filter(l =>
    l.senderName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-container">
      <Sidebar />

      <div className="forum-container">

        {/* ── LEFT PANEL ── */}
        <div className="contact-panel">
          <div className="topbar-title">Forum</div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Lectures */}
          <div className="contact-section-title">Lectures</div>
          {filteredLectures.map((msg, i) => (
            <div
              key={i}
              className={`contact-item ${selectedContact === msg.senderName ? 'active-contact' : ''}`}
              onClick={() => setSelectedContact(msg.senderName)}
            >
              <div className="contact-avatar">{getInitial(msg.senderName)}</div>
              <div className="contact-info">
                <div className="contact-name">{msg.senderName}</div>
                <div className="contact-preview">{msg.content?.slice(0, 20)}...</div>
              </div>
            </div>
          ))}

          {/* Students */}
          <div className="contact-section-title">Students</div>
          {filteredStudents.map((msg, i) => {
            const name = msg.senderName === currentUser ? msg.receiverName : msg.senderName;
            return (
              <div
                key={i}
                className={`contact-item ${selectedContact === name ? 'active-contact' : ''}`}
                onClick={() => setSelectedContact(name)}
              >
                <div className="contact-avatar">{getInitial(name)}</div>
                <div className="contact-info">
                  <div className="contact-name">{name}</div>
                  <div className="contact-preview">{msg.content?.slice(0, 20)}...</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── RIGHT PANEL ── */}
        {selectedContact ? (
          <div className="chat-panel">

            {/* Chat Header */}
            <div className="chat-header">
              <div className="contact-avatar">{getInitial(selectedContact)}</div>
              <div>
                <div className="contact-name">{selectedContact}</div>
                <div className="online-status">Online</div>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`message-bubble ${msg.senderName === currentUser ? 'sent' : 'received'}`}
                >
                  <div className="bubble-text">{msg.content}</div>
                  <div className="bubble-time">
                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="chat-input">
              <input
                type="text"
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button onClick={handleSend}>Send</button>
            </div>

          </div>
        ) : (
          <div className="chat-panel empty-chat">
            <div>👈 Select a contact to start chatting</div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Forum;