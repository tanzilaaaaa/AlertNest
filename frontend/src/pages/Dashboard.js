import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary, getIncidents, createIncident } from '../services/api';
import api from '../services/api';

const NAV = [
  { label: 'Dashboard', icon: '⊞' },
  { label: 'Incidents', icon: '⚠' },
  { label: 'Report', icon: '+' },
  { label: 'Settings', icon: '⚙' },
];

const SEV_DOT = { high: 'bg-red-500', medium: 'bg-yellow-400', low: 'bg-green-500' };
const STATUS_PILL = {
  reported: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
};

function DonutChart({ pct }) {
  const r = 40, c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
      <circle cx="55" cy="55" r={r} fill="none" stroke="#0d9488" strokeWidth="12"
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
        transform="rotate(-90 55 55)" />
      <text x="55" y="60" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#0d9488">{pct}%</text>
    </svg>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState('Dashboard');
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', location: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardSummary().then(r => setSummary(r.data)).catch(() => {});
    api.get('/api/dashboard/recent').then(r => setRecent(r.data.incidents)).catch(() => {});
    getIncidents().then(r => setIncidents(r.data.incidents)).catch(() => {});
  }, []);

  const reload = () => {
    getDashboardSummary().then(r => setSummary(r.data)).catch(() => {});
    api.get('/api/dashboard/recent').then(r => setRecent(r.data.incidents)).catch(() => {});
    getIncidents().then(r => setIncidents(r.data.incidents)).catch(() => {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createIncident(form);
      setForm({ title: '', description: '', category: '', location: '' });
      setShowForm(false);
      setActive('Dashboard');
      reload();
    } catch { setError('Failed to submit incident'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-52 bg-teal-700 flex flex-col py-6 px-4 gap-2 shrink-0">
        <div className="text-white font-bold text-lg mb-6 px-2">AlertNest</div>
        {NAV.map(n => (
          <button key={n.label} onClick={() => { setActive(n.label); if (n.label === 'Report') setShowForm(true); }}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition
              ${active === n.label ? 'bg-white text-teal-700' : 'text-white hover:bg-teal-600'}`}>
            <span>{n.icon}</span>{n.label}
          </button>
        ))}
        <div className="mt-auto">
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-white hover:bg-teal-600 w-full">
            <span>⏻</span> Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="bg-white px-8 py-4 flex items-center justify-between shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">{active}</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-gray-600">{user?.name} · <span className="capitalize">{user?.role}</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {/* Report Form */}
          {(active === 'Report' || showForm) && (
            <div className="bg-white rounded-2xl shadow p-6 mb-6 max-w-2xl">
              <h3 className="font-semibold text-teal-700 mb-4">Report New Incident</h3>
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input required placeholder="Title" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-teal-400" />
                <textarea required placeholder="Description (keywords like 'fire', 'leak' auto-set severity)"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-teal-400 resize-none h-24" />
                <div className="flex gap-4">
                  <input required placeholder="Category" value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-teal-400" />
                  <input required placeholder="Location / Block" value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-teal-400" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-6 py-2 rounded-full transition disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Incident'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setActive('Dashboard'); }}
                    className="border border-gray-200 text-gray-500 text-sm px-6 py-2 rounded-full hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Dashboard View */}
          {active === 'Dashboard' && summary && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Total Incidents', value: summary.total, icon: '📋' },
                  { label: 'In Progress', value: summary.in_progress, icon: '🔄' },
                  { label: 'Resolved', value: summary.resolved, icon: '✅' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl shadow p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                      <p className="text-3xl font-bold text-gray-800">{s.value}</p>
                    </div>
                    <span className="text-3xl">{s.icon}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-3 gap-4">
                {/* Recent Incidents */}
                <div className="col-span-1 bg-white rounded-2xl shadow p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Recent Incidents</p>
                    <button onClick={() => setActive('Incidents')}
                      className="text-xs bg-teal-600 text-white px-3 py-1 rounded-full">View All</button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {recent.length === 0 && <p className="text-xs text-gray-400">No incidents yet</p>}
                    {recent.map((i, idx) => (
                      <div key={i.id} className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm
                        ${idx === 0 ? 'bg-teal-600 text-white' : 'bg-gray-50 text-gray-700'}`}>
                        <span className="truncate max-w-32">{i.title}</span>
                        <span className={`text-xs font-semibold ${idx === 0 ? 'text-teal-100' : 'text-gray-400'}`}>
                          {i.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resolution Rate */}
                <div className="col-span-1 bg-white rounded-2xl shadow p-5 flex flex-col items-center justify-center">
                  <div className="flex items-center justify-between w-full mb-3">
                    <p className="text-sm font-semibold text-gray-700">Resolution Rate</p>
                    <button className="text-xs bg-teal-600 text-white px-3 py-1 rounded-full">Stats</button>
                  </div>
                  <DonutChart pct={summary.resolution_rate} />
                  <p className="text-xs text-gray-400 mt-2">of incidents resolved</p>
                </div>

                {/* Severity Breakdown */}
                <div className="col-span-1 bg-white rounded-2xl shadow p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Severity Breakdown</p>
                    <button className="text-xs bg-teal-600 text-white px-3 py-1 rounded-full">View All</button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {[
                      { label: 'High Priority', count: summary.high, dot: 'bg-red-500' },
                      { label: 'Medium Priority', count: summary.medium, dot: 'bg-yellow-400' },
                      { label: 'Low Priority', count: summary.low, dot: 'bg-green-500' },
                      { label: 'Reported', count: summary.reported, dot: 'bg-blue-400' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                          {s.label}
                        </div>
                        <span className="font-semibold text-gray-800">+{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Incidents List View */}
          {active === 'Incidents' && (
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">All Incidents</h3>
                <button onClick={() => { setActive('Report'); setShowForm(true); }}
                  className="bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-full">+ Report</button>
              </div>
              {incidents.length === 0
                ? <p className="text-sm text-gray-400">No incidents found.</p>
                : <div className="flex flex-col gap-3">
                  {incidents.map(i => (
                    <div key={i.id} className="flex items-center justify-between border border-gray-100 rounded-xl px-5 py-3">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{i.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{i.category} · {i.location}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${SEV_DOT[i.severity]}`} />
                          <span className="text-xs text-gray-500 capitalize">{i.severity}</span>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_PILL[i.status]}`}>
                          {i.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
