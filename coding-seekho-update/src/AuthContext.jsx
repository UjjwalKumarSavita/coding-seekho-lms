import { createContext, useContext, useEffect, useState } from 'react';
import { api, jsonBody } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('llc_user')); } catch { return null; }
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('llc_token');
    if (!token) {
      setReady(true);
      return;
    }
    api('/auth/me').then(next => {
      setUser(next);
      localStorage.setItem('llc_user', JSON.stringify(next));
    }).catch(() => logout()).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const unauthorized = () => logout();
    window.addEventListener('llc:unauthorized', unauthorized);
    return () => window.removeEventListener('llc:unauthorized', unauthorized);
  }, []);

  function saveSession(result) {
    localStorage.setItem('llc_token', result.token);
    localStorage.setItem('llc_user', JSON.stringify(result.user));
    setUser(result.user);
  }

  async function login(email, password) {
    const result = await api('/auth/login', { method: 'POST', body: jsonBody({ email, password }) });
    saveSession(result);
  }

  async function register(username, email, password) {
    const result = await api('/auth/register', {
      method: 'POST', body: jsonBody({ username, email, password })
    });
    saveSession(result);
  }

  function logout() {
    localStorage.removeItem('llc_token');
    localStorage.removeItem('llc_user');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, setUser, ready, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
