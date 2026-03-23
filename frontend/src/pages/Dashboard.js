import React, { useEffect, useState } from 'react';
import { getIncidents, createIncident } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SEVERITY_COLOR = { high: 'text-red-600', medium: 'text-yellow-600', low: 'text-green-600' };
const STATUS_COLOR = { reported: 'bg-blue-100 text-blue-700', in_progress: 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700' };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', location: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    getIncidents()
      .then(res => setIncidents(res.data.incidents))
      .catch(() => setError('Failed to load incidents'));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createIncident(form);
      setForm({ title: '', description: '', category: '', location: '' });
      setShowForm(false);
      load();
    } catch {
      setError('Failed to create incident');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-teal-700 text-white px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">AlertNest</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-80">{user?.name} · {user?.role}</span>
          <button onClick={logout} className="bg-white text-teal-700 text-xs font-bold px-4 py-1.5 rounded-full hover:bg-teal-50 transition">Logout</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Incidents</h2>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2 rounded-full transition">
            {showForm ? 'Cancel' : '+ Report Incident'}
          </button>
        </div>

        {/* Report Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 mb-6 flex flex-col gap-4">
            <h3 className="font-semibold text-teal-700">New Incident</h3>
            <input required placeholder="Title" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-teal-400" />
            <textarea required placeholder="Description" value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-teal-400 resize-none h-24" />
            <div className="flex gap-4">
              <input required placeholder="Category" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-teal-400" />
              <input required placeholder="Location" value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-teal-400" />
            </div>
            <button type="submit" disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold py-2 rounded-full transition disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Incident'}
            </button>
          </form>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {incidents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">No incidents yet.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {incidents.map(i => (
              <div key={i.id} className="bg-white rounded-2xl shadow px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{i.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{i.category} · {i.location}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${SEVERITY_COLOR[i.severity]}`}>{i.severity}</span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[i.status]}`}>{i.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
