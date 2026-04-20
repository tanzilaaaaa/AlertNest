import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ForgotPassword from '../components/ForgotPassword';
import SocialButtons from '../components/SocialButtons';
import { FaLeaf, FaEye, FaEyeSlash, FaGraduationCap, FaTools, FaCrown } from 'react-icons/fa';

export default function Login({ onSwitch, onRoleSelect, roleError }) {
  const { login } = useAuth();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('student');
  const [error, setError]       = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]   = useState(false);

  const ROLES = [
    { value: 'student', icon: FaGraduationCap, label: 'Student' },
    { value: 'staff',   icon: FaTools,         label: 'Staff'   },
    { value: 'admin',   icon: FaCrown,          label: 'Admin'   },
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    onRoleSelect?.(role);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    onRoleSelect?.(selectedRole);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.code === 'auth/invalid-credential' ? 'Invalid email or password' : err.message);
    } finally { setLoading(false); }
  };

  const label = { fontSize: '11px', fontWeight: '600', color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' };
  const inputSt = { width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px 14px', fontSize: '13px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: 'hidden' }}>
      {showForgot && <ForgotPassword onClose={() => setShowForgot(false)} />}

      {/* Left branding panel */}
      <div style={{ width: '42%', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '36px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(200,135,58,0.1)', top: '50%', left: '10%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', border: '1px solid rgba(200,135,58,0.06)', top: '50%', left: '-10%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--gold)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaLeaf size={16} color="#fff" /></div>
          <span style={{ color: 'var(--text)', fontWeight: '700', fontSize: '16px', letterSpacing: '1px' }}>ALERTNEST</span>
        </div>

        <div style={{ position: 'relative' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '52px', fontWeight: '700', color: 'var(--text)', lineHeight: 1.1 }}>Report.</h1>
          <h1 style={{ margin: '0 0 4px', fontSize: '52px', fontWeight: '700', color: 'var(--gold)', lineHeight: 1.1, fontStyle: 'italic' }}>Track.</h1>
          <h1 style={{ margin: '0 0 24px', fontSize: '52px', fontWeight: '700', color: 'var(--text)', lineHeight: 1.1 }}>Resolve.</h1>
          <p style={{ margin: '0 0 32px', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7, maxWidth: '320px' }}>
            A centralized incident reporting system for university campuses — structured, fast, and accountable.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['INCIDENTS', 'TRACKING', 'ANALYTICS'].map(t => (
              <span key={t} style={{ border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '10px', fontWeight: '600', padding: '5px 12px', borderRadius: '4px', letterSpacing: '0.8px' }}>{t}</span>
            ))}
          </div>
        </div>

        <p style={{ position: 'relative', fontSize: '11px', color: 'var(--muted)', margin: 0 }}>© 2026 AlertNest</p>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '8px', padding: '4px', marginBottom: '36px', width: '100%', maxWidth: '360px' }}>
          <button style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'default', background: 'var(--gold)', color: '#fff', fontWeight: '700', fontSize: '13px', letterSpacing: '0.5px' }}>SIGN IN</button>
          <button onClick={onSwitch} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--muted)', fontWeight: '600', fontSize: '13px', letterSpacing: '0.5px' }}>SIGN UP</button>
        </div>

        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '700', color: 'var(--text)' }}>Welcome back</h2>
          <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'var(--muted)' }}>Sign in to your AlertNest account.</p>
          {(error || roleError) && (
            <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '16px', background: 'rgba(248,113,113,0.1)', padding: '10px 14px', borderRadius: '6px' }}>
              {error || roleError}
            </p>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Role selector */}
            <div>
              <label style={label}>Login as</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => handleRoleSelect(r.value)} style={{
                    padding: '10px 8px', borderRadius: '8px',
                    border: selectedRole === r.value ? '1px solid var(--gold)' : '1px solid var(--border)',
                    background: selectedRole === r.value ? 'rgba(200,135,58,0.12)' : 'var(--bg-input)',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  }}>
                    <r.icon size={16} color={selectedRole === r.value ? 'var(--gold)' : 'var(--muted)'} />
                    <span style={{ fontSize: '11px', fontWeight: '700', color: selectedRole === r.value ? 'var(--gold)' : 'var(--text)' }}>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={label}>Email Address</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required style={inputSt} />
            </div>

            <div>
              <label style={label}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} required
                  style={{ ...inputSt, paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowPassword(p => !p)} style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
                }}>
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: '6px',
              padding: '13px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              letterSpacing: '0.8px', opacity: loading ? 0.7 : 1, marginTop: '4px',
            }}>
              {loading ? 'SIGNING IN...' : `SIGN IN AS ${selectedRole.toUpperCase()}`}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer' }}>
              Forgot password?
            </button>
          </div>

          <SocialButtons onError={setError} label="Login" />
        </div>
      </div>
    </div>
  );
}
