import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { api, jsonBody } from '../api';
import Logo from '../components/Logo';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', code: '', newPassword: '' });
  const [catalog, setCatalog] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/public/courses').then(setCatalog).catch(() => {}); }, []);
  const update = event => setForm(value => ({ ...value, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'login') await login(form.email, form.password);
      if (mode === 'register') await register(form.username, form.email, form.password);
      if (mode === 'forgot') {
        const result = await api('/auth/forgot-password', {
          method: 'POST', body: jsonBody({ email: form.email })
        });
        setMessage(result.message); setMode('reset');
      }
      if (mode === 'reset') {
        const result = await api('/auth/reset-password', {
          method: 'POST', body: jsonBody({ email: form.email, code: form.code, newPassword: form.newPassword })
        });
        setMessage(result.message); setMode('login');
      }
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  const titles = { login: 'Welcome back', register: 'Create your student account', forgot: 'Recover your account', reset: 'Enter your OTP' };
  return (
    <div className="auth-layout">
      <section className="auth-showcase">
        <Logo />
        <div className="auth-copy">
          <p className="eyebrow">PRIVATE LEARNING PLATFORM</p>
          <h1>Small concepts.<br /><span>Long-term confidence.</span></h1>
          <p>LLC World brings classes, assignments, batch conversations and progress into one calm learning space.</p>
        </div>
        <div className="catalog-preview">
          <small>WHAT STUDENTS LEARN</small>
          {(catalog.length ? catalog.slice(0, 3) : [{ name: 'React development' }, { name: 'Spring Boot APIs' }, { name: 'PostgreSQL' }])
            .map((course, index) => <div key={course.id || index}><b>0{index + 1}</b><span>{course.name}</span></div>)}
        </div>
      </section>
      <section className="auth-form-side">
        <form className="auth-card" onSubmit={submit}>
          <div className="mobile-logo"><Logo /></div>
          <p className="eyebrow">LLC WORLD ACCESS</p>
          <h2>{titles[mode]}</h2>
          <p className="muted">{mode === 'register' ? 'Batch access is approved separately by LLC administration.' : 'Use your institution account to continue.'}</p>
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}
          {mode === 'register' && <Field label="Full name" name="username" value={form.username} onChange={update} />}
          <Field label="Email address" name="email" type="email" value={form.email} onChange={update} />
          {(mode === 'login' || mode === 'register') &&
            <Field label="Password" name="password" type="password" value={form.password} onChange={update} hint={mode === 'register' ? 'Minimum 8 characters' : ''} />}
          {mode === 'reset' && <>
            <Field label="6-digit OTP" name="code" value={form.code} onChange={update} />
            <Field label="New password" name="newPassword" type="password" value={form.newPassword} onChange={update} />
          </>}
          <button className="primary-button full" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send OTP' : 'Reset password'}</button>
          <div className="auth-links">
            {mode === 'login' && <><button type="button" onClick={() => setMode('forgot')}>Forgot password?</button><button type="button" onClick={() => setMode('register')}>Create account</button></>}
            {mode !== 'login' && <button type="button" onClick={() => setMode('login')}>Back to sign in</button>}
          </div>
          <div className="demo-box"><strong>Institution access</strong><span>Students can register here.</span><span>Teacher and administrator roles are assigned securely by LLC administration.</span></div>
        </form>
      </section>
    </div>
  );
}

function Field({ label, hint, ...props }) {
  return <label className="field"><span>{label}<small>{hint}</small></span><input required {...props} /></label>;
}
