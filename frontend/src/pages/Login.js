import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ForgotPassword from '../components/ForgotPassword';
import SocialButtons from '../components/SocialButtons';
import { FaLeaf, FaEye, FaEyeSlash } from 'react-icons/fa';

const BG_DARK  = '#0d2b1f';
const BG_RIGHT = '#112d20';
const GOLD     = '#c8873a';
const GOLD_HOVER = '#b5762e';
const TEXT     = '#e8e0d0';
const MUTED    = '#7a9e8a';
const BORDER   = '#1e4030';
const INPUT_BG = '#0a2218';

export default function Login({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm]           = useState({ email: '', password: '' });
  const [error, setError]         = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.code === 'auth/invalid-credential' ? 'Invalid email or password' : err.message);
    } finally { setLoading(false); }
  };

  const label = { fontSize: '11px', fontWeight: '600', color: MUTED, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' };
  const inputSt = { width: '100%', background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '12px 14px', fontSize: '13px', color: TEXT, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: 'hidden' }}>
      {showForgot && <ForgotPassword onClose={() => setShowForgot(false)} />}

      {/* Left branding panel */}
      <div style={{ width: '42%', background: BG_DARK, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '36px 48px', position: 'relative', overflow: 'hidden' }}>
        {/* Grid overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        {/* Circle decoration */}
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(200,135,58,0.1)', top: '50%', left: '10%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', border: '1px solid rgba(200,135,58,0.06)', top: '50%', left: '-10%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: GOLD, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}><FaLeaf size={16} color="#fff" /></div>
          <span style={{ color: TEXT, fontWeight: '700', fontSize: '16px', letterSpacing: '1px' }}>ALERTNEST</span>
        </div>

        {/* Hero text */}
        <div style={{ position: 'relative' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '52px', fontWeight: '700', color: TEXT, lineHeight: 1.1 }}>Report.</h1>
          <h1 style={{ margin: '0 0 4px', fontSize: '52px', fontWeight: '700', color: GOLD, lineHeight: 1.1, fontStyle: 'italic' }}>Track.</h1>
          <h1 style={{ margin: '0 0 24px', fontSize: '52px', fontWeight: '700', color: TEXT, lineHeight: 1.1 }}>Resolve.</h1>
          <p style={{ margin: '0 0 32px', fontSize: '14px', color: MUTED, lineHeight: 1.7, maxWidth: '320px' }}>
            A centralized incident reporting system for university campuses — structured, fast, and accountable.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['INCIDENTS', 'TRACKING', 'ANALYTICS'].map(t => (
              <span key={t} style={{ border: `1px solid ${BORDER}`, color: MUTED, fontSize: '10px', fontWeight: '600', padding: '5px 12px', borderRadius: '4px', letterSpacing: '0.8px' }}>{t}</span>
            ))}
          </div>
        </div>

        <p style={{ position: 'relative', fontSize: '11px', color: MUTED, margin: 0 }}>© 2026 AlertNest</p>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, background: BG_RIGHT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#0a2218', borderRadius: '8px', padding: '4px', marginBottom: '36px', width: '100%', maxWidth: '360px' }}>
          <button style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'default', background: GOLD, color: '#fff', fontWeight: '700', fontSize: '13px', letterSpacing: '0.5px' }}>SIGN IN</button>
          <button onClick={onSwitch} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'transparent', color: MUTED, fontWeight: '600', fontSize: '13px', letterSpacing: '0.5px' }}>SIGN UP</button>
        </div>

        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '700', color: TEXT }}>Welcome back</h2>
          <p style={{ margin: '0 0 28px', fontSize: '13px', color: MUTED }}>Sign in to your AlertNest account.</p>

          {error && <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '16px', background: 'rgba(248,113,113,0.1)', padding: '10px 14px', borderRadius: '6px' }}>{error}</p>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                  background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: '14px'
                }}>
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', background: GOLD, color: '#fff', border: 'none', borderRadius: '6px',
              padding: '13px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              letterSpacing: '0.8px', opacity: loading ? 0.7 : 1, marginTop: '4px',
            }}>
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', color: MUTED, fontSize: '12px', cursor: 'pointer' }}>
              Forgot password?
            </button>
          </div>

          <SocialButtons onError={setError} label="Login" />
        </div>
      </div>
    </div>
  );
}
