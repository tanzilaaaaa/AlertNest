import React, { useState } from 'react';
import api from '../services/api';

export default function ForgotPassword({ onClose }) {
  const [step, setStep] = useState('email'); // email | reset | done
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      if (res.data.reset_token) {
        setToken(res.data.reset_token);
        setStep('reset');
      } else {
        setError('No account found with that email.');
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, new_password: newPassword });
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. Token may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>

        {step === 'email' && (
          <>
            <h3 className="text-xl font-bold text-teal-700 mb-2">Forgot Password</h3>
            <p className="text-xs text-gray-400 mb-6">Enter your email and we'll send you a reset link.</p>
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <form onSubmit={handleForgot} className="flex flex-col gap-4">
              <div className="flex items-center border-b border-gray-300 pb-1">
                <input type="email" placeholder="Email" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400" />
              </div>
              <button type="submit" disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold py-2 rounded-full transition disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Token'}
              </button>
            </form>
          </>
        )}

        {step === 'reset' && (
          <>
            <h3 className="text-xl font-bold text-teal-700 mb-2">Reset Password</h3>
            <p className="text-xs text-gray-400 mb-6">Enter your new password below.</p>
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div className="flex items-center border-b border-gray-300 pb-1">
                <input type="password" placeholder="New Password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} required minLength={6}
                  className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400" />
              </div>
              <button type="submit" disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold py-2 rounded-full transition disabled:opacity-50">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {step === 'done' && (
          <>
            <h3 className="text-xl font-bold text-teal-700 mb-2">Password Reset</h3>
            <p className="text-sm text-gray-500 mb-6">Your password has been updated. You can now log in.</p>
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
