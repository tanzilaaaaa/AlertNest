import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login({ onSwitch }) {
  const { login, loginWithToken } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await api.post('/api/auth/google', { access_token: tokenResponse.access_token });
        loginWithToken(res.data.token, res.data.user);
      } catch (err) {
        setError('Google login failed');
      }
    },
    onError: () => setError('Google login failed'),
  });

  return (
    <div className="min-h-screen bg-teal-900 flex items-center justify-center p-6">
      <div className="flex w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl">

        {/* Left Panel */}
        <div className="relative w-2/5 bg-teal-600 flex flex-col items-start justify-center p-8 overflow-hidden">
          {/* Geometric shapes */}
          <div className="absolute w-56 h-56 bg-teal-500 rounded-3xl rotate-45 -top-10 -left-10 opacity-70" />
          <div className="absolute w-48 h-48 bg-teal-700 rounded-3xl rotate-45 top-16 -left-16 opacity-60" />
          <div className="absolute w-40 h-40 bg-teal-400 rounded-3xl rotate-45 bottom-0 left-8 opacity-50" />

          {/* Tabs */}
          <div className="relative z-10 flex flex-col gap-4 mt-auto mb-auto">
            <button className="bg-white text-teal-800 font-bold px-6 py-2 rounded-full text-sm shadow">
              LOGIN
            </button>
            <button
              onClick={onSwitch}
              className="text-white font-semibold text-sm px-2 opacity-80 hover:opacity-100"
            >
              SIGN UP
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-3/5 bg-white flex flex-col items-center justify-center px-10 py-10">
          {/* Avatar */}
          <div className="bg-teal-600 rounded-full p-4 mb-3">
            <svg viewBox="0 0 24 24" fill="white" width="36" height="36">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-teal-700 mb-6">LOGIN</h2>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            {/* Email */}
            <div className="flex items-center border-b border-gray-300 pb-1">
              <svg className="mr-2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
              />
            </div>

            {/* Password */}
            <div className="flex items-center border-b border-gray-300 pb-1">
              <svg className="mr-2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
              />
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className="text-teal-600 text-xs cursor-pointer hover:underline">Forgot Password?</span>
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-6 py-2 rounded-full transition"
              >
                LOGIN
              </button>
            </div>
          </form>

          {/* Social */}
          <div className="w-full mt-8 pt-4 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400 mb-3">Or Login With</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => googleLogin()} className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </button>
              <button className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Apple
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Don't have an account?{' '}
            <button onClick={onSwitch} className="text-teal-600 font-semibold hover:underline">Sign Up</button>
          </p>
        </div>
      </div>
    </div>
  );
}
