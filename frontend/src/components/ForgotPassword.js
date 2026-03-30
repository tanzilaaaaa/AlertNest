import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { FaEnvelope } from 'react-icons/fa';

const BG    = '#112d20';
const GOLD  = '#c8873a';
const TEXT  = '#e8e0d0';
const MUTED = '#7a9e8a';
const BORDER = '#1e4030';
const INPUT_BG = '#0a2218';

export default function ForgotPassword({ onClose }) {
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      if (err.code === 'auth/user-not-found')   setError('No account found with this email.');
      else if (err.code === 'auth/invalid-email') setError('Please enter a valid email address.');
      else if (err.code === 'auth/too-many-requests') setError('Too many attempts. Try again later.');
      else setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: BG, borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '360px', position: 'relative', border: `1px solid ${BORDER}`, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '16px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: MUTED }}>✕</button>

        {!sent ? (
          <>
            <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '700', color: TEXT }}>Reset Password</h3>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: MUTED }}>Enter your email and we'll send a reset link.</p>
            {error && <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '14px', background: 'rgba(248,113,113,0.1)', padding: '8px 12px', borderRadius: '6px' }}>{error}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required
                style={{ width: '100%', background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '12px 14px', fontSize: '13px', color: TEXT, outline: 'none', boxSizing: 'border-box' }} />
              <button type="submit" disabled={loading} style={{
                width: '100%', background: GOLD, color: '#fff', border: 'none', borderRadius: '6px',
                padding: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                letterSpacing: '0.5px', opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'SENDING...' : 'SEND RESET EMAIL'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}><FaEnvelope size={40} style={{ color: GOLD }} /></div>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '700', color: TEXT, textAlign: 'center' }}>Check your inbox</h3>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: MUTED, textAlign: 'center' }}>
              Reset link sent to <strong style={{ color: TEXT }}>{email}</strong>. Check spam if you don't see it.
            </p>
            <button onClick={onClose} style={{
              width: '100%', background: GOLD, color: '#fff', border: 'none', borderRadius: '6px',
              padding: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.5px',
            }}>BACK TO LOGIN</button>
          </>
        )}
      </div>
    </div>
  );
}
