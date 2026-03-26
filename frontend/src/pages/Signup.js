import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SocialButtons from '../components/SocialButtons';

const GREEN = '#008055';
const GREEN_DARK = '#006644';
const CREAM = '#f5f0e8';
const CREAM_DARK = '#ece8df';

export default function Signup({ onSwitch }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await register(form.name, form.email, form.password, form.role);
      setSuccess('Account created! Logging you in...');
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'Email already registered' : err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Segoe UI', sans-serif" }}>

      <div style={{ display: 'flex', width: '100%', maxWidth: '780px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>

        {/* Left green panel */}
        <div style={{ width: '40%', background: GREEN, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: '180px', height: '180px', background: GREEN_DARK, borderRadius: '30px', transform: 'rotate(45deg)', top: '-50px', left: '-50px', opacity: 0.6 }} />
          <div style={{ position: 'absolute', width: '140px', height: '140px', background: '#3a9e65', borderRadius: '24px', transform: 'rotate(45deg)', bottom: '-30px', right: '-40px', opacity: 0.5 }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌿</div>
            <p style={{ color: '#a7f3d0', fontSize: '12px', textAlign: 'center', margin: '0 0 16px' }}>Join AlertNest today</p>
            <button onClick={onSwitch} style={{
              background: 'transparent', color: '#d1fae5', border: 'none',
              fontSize: '13px', fontWeight: '500', cursor: 'pointer', opacity: 0.85
            }}>← LOGIN</button>
            <button style={{
              background: CREAM, color: GREEN, border: 'none', borderRadius: '20px',
              padding: '8px 28px', fontWeight: '700', fontSize: '13px', cursor: 'default'
            }}>SIGN UP</button>
          </div>
        </div>

        {/* Right cream panel */}
        <div style={{ width: '60%', background: CREAM_DARK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 40px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <svg viewBox="0 0 24 24" fill="white" width="26" height="26">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          <h2 style={{ margin: '0 0 20px', fontSize: '22px', fontWeight: '700', color: GREEN }}>SIGN UP</h2>

          {error && <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px', background: '#fef2f2', padding: '8px 12px', borderRadius: '8px', width: '100%', textAlign: 'center' }}>{error}</p>}
          {success && <p style={{ color: GREEN, fontSize: '12px', marginBottom: '12px', background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', width: '100%', textAlign: 'center' }}>{success}</p>}

          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ccc5b5', paddingBottom: '6px' }}>
              <svg style={{ marginRight: '8px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" width="16" height="16">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <input type="text" placeholder="Full Name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', color: '#333', background: 'transparent' }} />
            </div>

            {/* Email */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ccc5b5', paddingBottom: '6px' }}>
              <svg style={{ marginRight: '8px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" width="16" height="16">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              <input type="email" placeholder="Email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', color: '#333', background: 'transparent' }} />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ccc5b5', paddingBottom: '6px' }}>
              <svg style={{ marginRight: '8px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" width="16" height="16">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', color: '#333', background: 'transparent' }} />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: '#aaa', display: 'flex', alignItems: 'center' }}>
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Role */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ccc5b5', paddingBottom: '6px' }}>
              <svg style={{ marginRight: '8px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" width="16" height="16">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', color: '#333', background: 'transparent', cursor: 'pointer' }}>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" style={{
                background: GREEN, color: '#fff', border: 'none', borderRadius: '20px',
                padding: '9px 28px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
              }}>SIGN UP</button>
            </div>
          </form>

          <SocialButtons onError={setError} label="Sign Up" />

          <p style={{ fontSize: '12px', color: '#999', marginTop: '16px' }}>
            Already have an account?{' '}
            <button onClick={onSwitch} style={{ background: 'none', border: 'none', color: GREEN, fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>Login</button>
          </p>
        </div>
      </div>
    </div>
  );
}
