import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import AppLayout from './components/AppLayout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Batches from './pages/Batches';
import BatchWorkspace from './pages/BatchWorkspace';
import Support from './pages/Support';
import Admin from './pages/Admin';
import Settings from './pages/Settings';

function Protected() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="splash">Preparing LLC World...</div>;
  return user ? <AppLayout /> : <Navigate to="/" replace />;
}

function PublicOnly() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="splash">Preparing LLC World...</div>;
  return user ? <Navigate to="/dashboard" replace /> : <AuthPage />;
}

function AdminOnly() {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <Admin /> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<PublicOnly />} />
          <Route element={<Protected />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/batches/:batchId" element={<BatchWorkspace />} />
            <Route path="/support" element={<Support />} />
            <Route path="/admin" element={<AdminOnly />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
