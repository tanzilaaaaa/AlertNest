import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary, getIncidents, createIncident } from '../services/api';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ProgressChart from '../components/ProgressChart';
import ActivityList from '../components/ActivityList';

// ── Exact same palette as Login/Signup ──
const GREEN      = '#008055';
const GREEN_DARK = '#006644';
const CREAM      = '#f5f0e8';
const CREAM_DARK = '#ece8df';

const STATUS_COLOR = {
  reported:    { bg: '#dbeafe', color: '#1d4ed8' },
  in_progress: { bg: '#fef3c7', color: '#b45309' },
  resolved:    { bg: '#d1fae5', color: '#065f46' },
};
const SEV_DOT = { high: '#ef4444', medium: '#f59e0b', low: '#008055' };

const inputStyle = {
  border: '1px solid #ccc5b5', borderRadius: '10px', padding: '10px 14px',
  fontSize: '13px', background: CREAM, outline: 'none', color: '#333',
  width: '100%', boxSizing: 'border-box',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [active, setActive]           = useState('Dashboard');
  const [summary, setSummary]         = useState(null);
  const [recent, setRecent]           = useState([]);
  const [incidents, setIncidents]     = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [form, setForm]               = useState({ title: '', description: '', category: '', location: '' });
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  const load = () => {
    getDashboardSummary().then(r => setSummary(r.data)).catch(() => {});
    api.get('/api/dashboard/recent').then(r => setRecent(r.data.incidents || [])).catch(() => {});
    getIncidents().then(r => setIncidents(r.data.incidents || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const activityItems = recent.map(i => ({
    dot: i.severity || i.status,
    text: `${i.title} — ${i.category || 'General'} · ${i.status?.replace('_', ' ')}`,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await createIncident(form);
      setForm({ title: '', description: '', category: '', location: '' });
      setActive('Dashboard'); load();
    } catch { setError('Failed to submit. Try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: CREAM, fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: 'hidden' }}>
      <Sidebar active={active} onNav={setActive} onLogout={logout} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: CREAM }}>

        {/* Topbar */}
        <div style={{
          background: CREAM_DARK, padding: '15px 30px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #ccc5b5',
        }}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: GREEN, letterSpacing: '0.2px' }}>{active}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', background: GREEN,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: '700', fontSize: '14px',
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>{user?.name || 'User'}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#9c9080', textTransform: 'capitalize' }}>{user?.role || 'student'}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px', background: CREAM }}>

          {/* ── DASHBOARD ── */}
          {active === 'Dashboard' && (
            <>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '22px' }}>
                <StatCard label="Total Incidents" value={summary?.total}       subtitle="Since last month" icon="📋" />
                <StatCard label="In Progress"     value={summary?.in_progress} subtitle="Since last month" icon="🔄" trend="down" />
                <StatCard label="Resolved Cases"  value={summary?.resolved}    subtitle="Since last month" icon="✅" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

                {/* Overview */}
                <div style={{ background: CREAM_DARK, borderRadius: '16px', padding: '20px 22px', border: '1px solid #ddd8ce', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <p style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>Overview</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {recent.length === 0 && <p style={{ fontSize: '13px', color: '#9c9080', margin: 0 }}>No incidents yet</p>}
                    {recent.map((inc, idx) => (
                      <button key={inc.id} onClick={() => setSelectedIdx(idx)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        background: selectedIdx === idx ? GREEN : '#d8d3c8',
                        color: selectedIdx === idx ? '#fff' : '#3a3020',
                        textAlign: 'left', width: '100%', transition: 'all 0.15s',
                      }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', lineHeight: 1.4 }}>{inc.title}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '11px', opacity: 0.7 }}>{inc.category}</p>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', opacity: 0.75 }}>+1</span>
                      </button>
                    ))}
                  </div>
                </div>

                <ProgressChart pct={summary?.resolution_rate ?? 0} onViewAll={() => setActive('Incidents')} />
                <ActivityList items={activityItems} onViewAll={() => setActive('Incidents')} />
              </div>
            </>
          )}

          {/* ── INCIDENTS ── */}
          {active === 'Incidents' && (
            <div style={{ background: CREAM_DARK, borderRadius: '16px', padding: '22px 24px', border: '1px solid #ddd8ce', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>All Incidents</span>
                <button onClick={() => setActive('Reports')} style={{
                  background: GREEN, color: '#fff', border: 'none', borderRadius: '20px',
                  padding: '7px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                }}>+ Report</button>
              </div>
              {incidents.length === 0
                ? <p style={{ fontSize: '13px', color: '#9c9080' }}>No incidents found.</p>
                : incidents.map(i => (
                  <div key={i.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '13px 18px', borderRadius: '12px', background: CREAM,
                    marginBottom: '8px', border: '1px solid #ccc5b5',
                  }}>
                    <div>
                      <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>{i.title}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#9c9080' }}>{i.category} &middot; {i.location}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: SEV_DOT[i.severity] || '#ccc5b5' }} />
                        <span style={{ fontSize: '12px', color: '#7a7060', textTransform: 'capitalize' }}>{i.severity}</span>
                      </div>
                      <span style={{
                        fontSize: '12px', fontWeight: '600', padding: '3px 12px', borderRadius: '20px',
                        background: STATUS_COLOR[i.status]?.bg || '#ddd8ce',
                        color: STATUS_COLOR[i.status]?.color || '#7a7060',
                      }}>
                        {i.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── REPORTS ── */}
          {active === 'Reports' && (
            <div style={{ background: CREAM_DARK, borderRadius: '16px', padding: '24px 26px', maxWidth: '540px', border: '1px solid #ddd8ce', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '700', color: GREEN }}>Report New Incident</h3>
              {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
                {['title', 'category', 'location'].map(f => (
                  <input key={f} required placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                    value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })}
                    style={inputStyle} />
                ))}
                <textarea required placeholder="Description — 'fire', 'leak', 'broken' auto-sets severity"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ ...inputStyle, resize: 'none', height: '90px' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" disabled={submitting} style={{
                    background: GREEN, color: '#fff', border: 'none', borderRadius: '20px',
                    padding: '10px 24px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                    opacity: submitting ? 0.6 : 1,
                  }}>{submitting ? 'Submitting...' : 'Submit'}</button>
                  <button type="button" onClick={() => setActive('Dashboard')} style={{
                    background: 'transparent', color: '#7a7060', border: '1px solid #ccc5b5',
                    borderRadius: '20px', padding: '10px 24px', fontSize: '13px', cursor: 'pointer',
                  }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* ── USERS ── */}
          {active === 'Users' && (
            <div style={{ background: CREAM_DARK, borderRadius: '16px', padding: '24px 26px', maxWidth: '500px', border: '1px solid #ddd8ce', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px' }}>Users</p>
              <p style={{ fontSize: '13px', color: '#9c9080', margin: 0 }}>User management coming soon.</p>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {active === 'Settings' && (
            <div style={{ background: CREAM_DARK, borderRadius: '16px', padding: '24px 26px', maxWidth: '420px', border: '1px solid #ddd8ce', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 18px' }}>Settings</p>
              {[{ label: 'Name', value: user?.name }, { label: 'Email', value: user?.email }, { label: 'Role', value: user?.role }].map(f => (
                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #ccc5b5' }}>
                  <span style={{ fontSize: '13px', color: '#9c9080' }}>{f.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', textTransform: 'capitalize' }}>{f.value || '—'}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
