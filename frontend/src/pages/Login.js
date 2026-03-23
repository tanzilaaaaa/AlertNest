import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SocialButtons from '../components/SocialButtons';
import ForgotPassword from '../components/ForgotPassword';

export default function Login({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-teal-900 flex items-center justify-center p-6">
      {showForgot && <ForgotPassword onClose={() => setShowForgot(false)} />}
      <div className="flex w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl">

        {/* Left Panel */}
        <div className="relative w-2/5 bg-teal-600 flex flex-col items-start justify-center p-8 overflow-hidden">
          <div className="absolute w-56 h-56 bg-teal-500 rounded-3xl rotate-45 -top-10 -left-10 opacity-70" />
          <div className="absolute w-48 h-48 bg-teal-700 rounded-3xl rotate-45 top-16 -left-16 opacity-60" />
          <div className="absolute w-40 h-40 bg-teal-400 rounded-3xl rotate-45 bottom-0 left-8 opacity-50" />
          <div className="relative z-10 flex flex-col gap-4 mt-auto mb-auto">
            <button className="bg-white text-teal-800 font-bold px-6 py-2 rounded-full text-sm shadow">LOGIN</button>
            <button onClick={onSwitch} className="text-white font-semibold text-sm px-2 opacity-80 hover:opacity-100">SIGN UP</button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-3/5 bg-white flex flex-col items-center justify-center px-10 py-10">
          <div className="bg-teal-600 rounded-full p-4 mb-3">
            <svg viewBox="0 0 24 24" fill="white" width="36" height="36">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-teal-700 mb-6">LOGIN</h2>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            <div className="flex items-center border-b border-gray-300 pb-1">
              <svg className="mr-2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <input type="email" placeholder="Email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required
                className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent" />
            </div>
            <div className="flex items-center border-b border-gray-300 pb-1">
              <svg className="mr-2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input type="password" placeholder="Password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required
                className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent" />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span onClick={() => setShowForgot(true)} className="text-teal-600 text-xs cursor-pointer hover:underline">Forgot Password?</span>
              <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-6 py-2 rounded-full transition">LOGIN</button>
            </div>
          </form>

          <SocialButtons onError={setError} label="Login" />

          <p className="text-xs text-gray-400 mt-4">
            Don't have an account?{' '}
            <button onClick={onSwitch} className="text-teal-600 font-semibold hover:underline">Sign Up</button>
          </p>
        </div>
      </div>
    </div>
  );
}
