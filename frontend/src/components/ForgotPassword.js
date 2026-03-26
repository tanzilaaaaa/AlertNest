import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

const GREEN = '#2d7a4f';
const CREAM_DARK = '#ece8df';

export default function ForgotPassword({ onClose }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      console.error('Password reset error:', err.code, err.message);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    }}>
      <div style={{
        background: CREAM_DARK, borderRadius: '16px', padding: '32px',
        width: '100%', maxWidth: '360px', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '14px', right: '16px',
          background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#aaa'
        }}>✕</button>

        {!sent ? (
          <>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', color: '#008055' }}>Forgot Password</h3>
            <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#999' }}>
              Enter your registered email and we'll send a reset link.
            </p>
            {error && (
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#ef4444', background: '#fef2f2', padding: '8px 12px', borderRadius: '8px' }}>
                {error}
              </p>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '6px' }}>
                <svg style={{ marginRight: '8px', color: '#aaa', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" width="16" height="16">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  type="email" placeholder="Your email address" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', color: '#333' }}
                />
              </div>
              <button type="submit" disabled={loading} style={{
                background: '#008055', color: '#fff', border: 'none', borderRadius: '20px',
                padding: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                opacity: loading ? 0.6 : 1
              }}>
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '40px' }}>📬</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#008055', textAlign: 'center' }}>Check your inbox</h3>
            <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#888', textAlign: 'center' }}>
              A password reset link has been sent to <strong>{email}</strong>. Check your spam folder if you don't see it.
            </p>
            <button onClick={onClose} style={{
              width: '100%', background: '#008055', color: '#fff', border: 'none',
              borderRadius: '20px', padding: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
            }}>
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
