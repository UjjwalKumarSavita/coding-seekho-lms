import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { api, jsonBody } from '../api';
import { Avatar } from '../components/AppLayout';

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function photo(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2_000_000) { setError('Please choose an image smaller than 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const updated = await api('/user/photo', { method: 'PUT', body: jsonBody({ profilePhoto: reader.result }) });
        setUser(updated); localStorage.setItem('llc_user', JSON.stringify(updated)); setMessage('Profile photo updated.');
      } catch (err) { setError(err.message); }
    };
    reader.readAsDataURL(file);
  }
  async function changePassword(event) {
    event.preventDefault(); setError('');
    try {
      const result = await api('/user/password', { method: 'PUT', body: jsonBody(passwords) });
      setMessage(result.message); setPasswords({ oldPassword: '', newPassword: '' });
    } catch (err) { setError(err.message); }
  }
  return <>
    <div className="page-heading"><div><p className="eyebrow">YOUR ACCOUNT</p><h1>Settings</h1><p>Keep your identity and sign-in details current.</p></div></div>
    {message && <div className="alert success">{message}</div>}{error && <div className="alert error">{error}</div>}
    <div className="settings-grid">
      <section className="panel profile-panel"><div className="large-avatar"><Avatar user={user} size="large" /><label className="photo-button">Change photo<input type="file" accept="image/*" onChange={photo} /></label></div>
        <div><p className="eyebrow">{user.role}</p><h2>{user.username}</h2><p>{user.email}</p><small>Member since {user.joinedAt}</small></div></section>
      <section className="panel"><p className="eyebrow">SECURITY</p><h2>Change password</h2>
        <form className="stack-form" onSubmit={changePassword}><label><span>Current password</span><input type="password" value={passwords.oldPassword} onChange={e => setPasswords({ ...passwords, oldPassword: e.target.value })} required /></label>
          <label><span>New password</span><input type="password" minLength="8" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} required /></label>
          <button className="primary-button">Update password</button></form></section>
      <section className="panel danger-panel"><div><p className="eyebrow">SESSION</p><h2>Sign out safely</h2><p>End this session on the current device.</p></div><button className="danger-button" onClick={logout}>Sign out</button></section>
    </div>
  </>;
}
