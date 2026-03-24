import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

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
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      setError('Could not send reset email. Check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
        {!sent ? (
          <>
            <h3 className="text-xl font-bold text-teal-700 mb-2">Forgot Password</h3>
            <p className="text-xs text-gray-400 mb-6">Enter your email and we'll send you a reset link.</p>
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex items-center border-b border-gray-300 pb-1">
                <input type="email" placeholder="Email" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400" />
              </div>
              <button type="submit" disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold py-2 rounded-full transition disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold text-teal-700 mb-2">Email Sent</h3>
            <p className="text-sm text-gray-500 mb-6">Check your inbox for a password reset link from Firebase.</p>
            <button onClick={onClose}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold py-2 rounded-full transition">
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
