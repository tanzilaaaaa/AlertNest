import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

function StatusBadge() {
  const [status, setStatus] = useState('checking...');
  const [ok, setOk] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/ping')
      .then(res => res.json())
      .then(() => { setStatus('healthy'); setOk(true); })
      .catch(() => { setStatus('unreachable'); setOk(false); });
  }, []);

  const bgColor = ok === true ? 'rgba(110,231,183,0.15)' : ok === false ? 'rgba(248,113,113,0.15)' : 'rgba(200,135,58,0.1)';
  const borderColor = ok === true ? 'rgba(110,231,183,0.3)' : ok === false ? 'rgba(248,113,113,0.3)' : 'var(--border)';
  const textColor = ok === true ? '#6ee7b7' : ok === false ? '#f87171' : 'var(--muted)';

  return (
    <div className="mt-6 px-10 py-4 rounded-xl text-center min-w-72" style={{ background: bgColor, border: `1px solid ${borderColor}`, color: textColor }}>
      <p className="font-semibold">Backend Status: {status}</p>
      <p className="text-sm mt-1">{ok === true ? 'API is running' : ok === false ? 'Cannot reach backend' : 'Connecting...'}</p>
    </div>
  );
}

function Home({ onLogin, onSignup }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-dark)' }}>
      <h1 className="text-5xl font-bold" style={{ color: 'var(--gold)' }}>AlertNest</h1>
      <p className="text-lg" style={{ color: 'var(--muted)' }}>AI-Powered Incident Alert Platform</p>
      <StatusBadge />
      <div className="flex gap-4 mt-6">
        <button onClick={onLogin} className="px-8 py-2 rounded-full font-semibold transition" style={{ background: 'var(--gold)', color: '#fff' }}>Login</button>
        <button onClick={onSignup} className="px-8 py-2 rounded-full font-semibold transition" style={{ border: '1px solid var(--gold)', color: 'var(--gold)', background: 'transparent' }}>Sign Up</button>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [page, setPage] = useState('home');
  const [loginRole, setLoginRole] = useState(null);
  const [roleError, setRoleError] = useState('');

  // Only check role mismatch on LOGIN (not signup)
  useEffect(() => {
    if (user && loginRole && user.role !== loginRole) {
      setRoleError(`This account is registered as "${user.role}". Please select the correct role.`);
      logout();
      setLoginRole(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loginRole]);

  if (loading) return <p className="text-center mt-20" style={{ color: 'var(--muted)' }}>Loading...</p>;
  if (user) return <Dashboard />;

  if (page === 'login') return <Login onSwitch={() => { setPage('signup'); setRoleError(''); setLoginRole(null); }} onRoleSelect={setLoginRole} roleError={roleError} />;
  if (page === 'signup') return <Signup onSwitch={() => { setPage('login'); setRoleError(''); setLoginRole(null); }} />;
  return <Home onLogin={() => { setPage('login'); setRoleError(''); }} onSignup={() => setPage('signup')} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
