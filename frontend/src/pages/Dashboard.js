import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary, getIncidents, createIncident, updateStatus, assignIncident, deleteIncident, getUsers, updateUserRole, deleteUser } from '../services/api';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ProgressChart from '../components/ProgressChart';
import ActivityList from '../components/ActivityList';
import { FaCrown, FaTools, FaGraduationCap, FaClipboardList, FaSync, FaCheckCircle, FaTrash, FaSearch } from 'react-icons/fa';

const GOLD     = '#c8873a';
const TEXT     = '#e8e0d0';
const BORDER   = '#1e4030';
const INPUT_BG = '#0a2218';
const GREEN    = '#c8873a';

const PAGE_SIZE = 8;

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const STATUS_COLOR = {
  reported:    { bg: 'rgba(147,197,253,0.15)', color: '#93c5fd' },
  in_progress: { bg: 'rgba(200,135,58,0.15)',  color: '#c8873a' },
  resolved:    { bg: 'rgba(110,231,183,0.15)', color: '#6ee7b7' },
};
const SEV_DOT = { high: '#f87171', medium: '#c8873a', low: '#6ee7b7' };

const inputStyle = {
  border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 14px',
  fontSize: '13px', background: INPUT_BG, outline: 'none', color: TEXT,
  width: '100%', boxSizing: 'border-box', fontFamily: "'Segoe UI', system-ui, sans-serif",
};
const btnGold = {
  background: GOLD, color: '#fff', border: 'none', borderRadius: '6px',
  padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.3px',
};
const ROLE_BADGE = {
  admin:   { bg: '#fef3c7', color: '#b45309', label: 'Admin' },
  staff:   { bg: '#dbeafe', color: '#1d4ed8', label: 'Staff' },
  student: { bg: '#d1fae5', color: '#065f46', label: 'Student' },
};

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  const isErr = type === 'error';
  return (
    <span style={{
      fontSize: '12px', fontWeight: '600', padding: '4px 14px', borderRadius: '6px',
      background: isErr ? 'rgba(248,113,113,0.15)' : 'rgba(200,135,58,0.15)',
      color: isErr ? '#f87171' : GOLD,
    }}>{msg}</span>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        border: `3px solid ${BORDER}`, borderTopColor: GOLD,
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const role = user?.role || 'student';

  const [active, setActive]           = useState('Dashboard');
  const [summary, setSummary]         = useState(null);
  const [recent, setRecent]           = useState([]);
  const [incidents, setIncidents]     = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [form, setForm]               = useState({ title: '', description: '', category: '', location: '' });
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState('');
  const [assignInput, setAssignInput] = useState({});
  const [users, setUsers]             = useState([]);
  const [roleInput, setRoleInput]     = useState({});

  // loading states
  const [loadingDash, setLoadingDash]           = useState(true);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [loadingUsers, setLoadingUsers]         = useState(false);

  // toast
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 2500);
  };

  // filter + search state
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [searchQuery,    setSearchQuery]    = useState('');

  // pagination
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoadingDash(true);
    Promise.all([
      getDashboardSummary(),
      api.get('/api/dashboard/recent'),
    ]).then(([s, r]) => {
      setSummary(s.data);
      setRecent(r.data.incidents || []);
    }).catch(() => showToast('Failed to load dashboard', 'error'))
      .finally(() => setLoadingDash(false));

    setLoadingIncidents(true);
    getIncidents()
      .then(r => setIncidents(r.data.incidents || []))
      .catch(() => showToast('Failed to load incidents', 'error'))
      .finally(() => setLoadingIncidents(false));

    if (role === 'admin') {
      setLoadingUsers(true);
      getUsers()
        .then(r => setUsers(r.data.users || []))
        .catch(() => showToast('Failed to load users', 'error'))
        .finally(() => setLoadingUsers(false));
    }
  }, [role]);

  useEffect(() => { load(); }, [load]);

  // reset page when filters change
  useEffect(() => { setPage(1); }, [filterStatus, filterSeverity, searchQuery]);

  const activityItems = recent.map(i => ({
    dot: i.severity || i.status,
    text: `${i.title} — ${i.category || 'General'} · ${i.status?.replace('_', ' ')}`,
  }));

  // filtered + searched incidents
  const filteredIncidents = incidents.filter(i => {
    if (filterStatus   && i.status   !== filterStatus)   return false;
    if (filterSeverity && i.severity !== filterSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return i.title?.toLowerCase().includes(q) ||
             i.category?.toLowerCase().includes(q) ||
             i.location?.toLowerCase().includes(q);
    }
    return true;
  });

  // paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / PAGE_SIZE));
  const pagedIncidents = filteredIncidents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormError('');
    try {
      await createIncident(form);
      setForm({ title: '', description: '', category: '', location: '' });
      showToast('Incident reported');
      setActive('Dashboard'); load();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setFormError(Array.isArray(detail) ? detail[0]?.msg : (detail || 'Failed to submit. Try again.'));
    } finally { setSubmitting(false); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateStatus(id, { status: newStatus });
      showToast('Status updated');
      load();
    } catch { showToast('Failed to update status', 'error'); }
  };

  const handleAssign = async (id) => {
    const dept = assignInput[id];
    if (!dept?.trim()) return;
    try {
      await assignIncident(id, { assigned_to: dept.trim() });
      setAssignInput(p => ({ ...p, [id]: '' }));
      showToast('Incident assigned');
      load();
    } catch { showToast('Failed to assign', 'error'); }
  };

  const handleDeleteIncident = async (id) => {
    if (!window.confirm('Delete this incident?')) return;
    try {
      await deleteIncident(id);
      showToast('Incident deleted');
      load();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const handleUpdateRole = async (userId) => {
    const newRole = roleInput[userId];
    if (!newRole) return;
    try {
      await updateUserRole(userId, newRole);
      setRoleInput(p => ({ ...p, [userId]: '' }));
      showToast('Role updated');
      load();
    } catch { showToast('Failed to update role', 'error'); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteUser(userId);
      showToast('User deleted');
      load();
    } catch { showToast('Failed to delete user', 'error'); }
  };

  const navItems = ['Dashboard', 'Incidents', 'Reports', ...(role === 'admin' ? ['Users'] : []), 'Settings'];
  const badge = ROLE_BADGE[role] || ROLE_BADGE.student;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0d2b1f', fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: 'hidden' }}>
      <Sidebar active={active} onNav={setActive} onLogout={logout} navItems={navItems} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ background: '#112d20', padding: '14px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: GOLD }}>{active}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Toast msg={toast.msg} type={toast.type} />
            <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', background: badge.bg, color: badge.color }}>{badge.label}</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: TEXT }}>{user?.name || 'User'}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#7a9e8a' }}>{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px', background: '#0d2b1f' }}>

          {/* ── DASHBOARD ── */}
          {active === 'Dashboard' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: TEXT, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {role === 'admin'   && <><FaCrown size={20} style={{ color: GOLD }} /> Admin Dashboard</>}
                  {role === 'staff'   && <><FaTools size={20} style={{ color: GOLD }} /> Staff Dashboard</>}
                  {role === 'student' && <><FaGraduationCap size={20} style={{ color: GOLD }} /> Student Dashboard</>}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#7a9e8a' }}>
                  {role === 'admin' && 'Full system overview — all incidents, all users'}
                  {role === 'staff' && 'Your assigned incidents and reports'}
                  {role === 'student' && 'Track your submitted incident reports'}
                </p>
              </div>

              {loadingDash ? <Spinner /> : (
                <>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '22px' }}>
                    <StatCard label="Total Incidents" value={summary?.total}       subtitle="All time" icon={<FaClipboardList size={24} style={{ color: GOLD }} />} />
                    <StatCard label="In Progress"     value={summary?.in_progress} subtitle="Active now" icon={<FaSync size={24} style={{ color: GOLD }} />} trend="down" />
                    <StatCard label="Resolved Cases"  value={summary?.resolved}    subtitle="Completed" icon={<FaCheckCircle size={24} style={{ color: GOLD }} />} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div style={{ background: '#112d20', borderRadius: '16px', padding: '20px 22px', border: `1px solid ${BORDER}` }}>
                      <p style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '600', color: TEXT }}>Recent</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {recent.length === 0 && <p style={{ fontSize: '13px', color: '#7a9e8a', margin: 0 }}>No incidents yet</p>}
                        {recent.map((inc, idx) => (
                          <button key={inc.id} onClick={() => setSelectedIdx(idx)} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                            background: selectedIdx === idx ? GREEN : '#d8d3c8',
                            color: selectedIdx === idx ? '#fff' : '#3a3020',
                            textAlign: 'left', width: '100%',
                          }}>
                            <div>
                              <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', lineHeight: 1.4 }}>{inc.title}</p>
                              <p style={{ margin: '2px 0 0', fontSize: '11px', opacity: 0.7 }}>{inc.category} {inc.created_at && `· ${timeAgo(inc.created_at)}`}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <ProgressChart pct={summary?.resolution_rate ?? 0} onViewAll={() => setActive('Incidents')} />
                    <ActivityList items={activityItems} onViewAll={() => setActive('Incidents')} />
                  </div>
                </>
              )}
            </>
          )}

          {/* ── INCIDENTS ── */}
          {active === 'Incidents' && (
            <div style={{ background: '#112d20', borderRadius: '16px', padding: '22px 24px', border: `1px solid ${BORDER}` }}>
              {/* Header + search + filters */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: TEXT }}>
                  {role === 'admin' ? 'All Incidents' : role === 'staff' ? 'Your Incidents' : 'My Reports'}
                </span>
                <button onClick={() => setActive('Reports')} style={btnGold}>+ Report</button>
              </div>

              {/* Search + filter bar */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                  <FaSearch size={12} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#7a9e8a' }} />
                  <input
                    placeholder="Search title, category, location..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: '32px', padding: '8px 12px 8px 32px' }}
                  />
                </div>
                {[
                  { label: 'Status', value: filterStatus, set: setFilterStatus, opts: ['reported', 'in_progress', 'resolved'] },
                  { label: 'Severity', value: filterSeverity, set: setFilterSeverity, opts: ['high', 'medium', 'low'] },
                ].map(f => (
                  <select key={f.label} value={f.value} onChange={e => f.set(e.target.value)}
                    style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', background: INPUT_BG, color: f.value ? TEXT : '#7a9e8a', outline: 'none' }}>
                    <option value="">All {f.label}s</option>
                    {f.opts.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                  </select>
                ))}
                {(filterStatus || filterSeverity || searchQuery) && (
                  <button onClick={() => { setFilterStatus(''); setFilterSeverity(''); setSearchQuery(''); }}
                    style={{ background: 'transparent', color: '#7a9e8a', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>
                    Clear
                  </button>
                )}
              </div>

              {loadingIncidents ? <Spinner /> : filteredIncidents.length === 0
                ? <p style={{ fontSize: '13px', color: '#7a9e8a' }}>No incidents found.</p>
                : <>
                  {pagedIncidents.map(i => (
                    <div key={i.id} style={{ padding: '14px 18px', borderRadius: '12px', background: '#0d2b1f', marginBottom: '10px', border: `1px solid ${BORDER}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: TEXT }}>{i.title}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#7a9e8a' }}>
                            {i.category} &middot; {i.location} {i.created_at && <span>&middot; {timeAgo(i.created_at)}</span>}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: SEV_DOT[i.severity] || '#ccc' }} />
                            <span style={{ fontSize: '11px', color: '#7a9e8a', textTransform: 'capitalize' }}>{i.severity}</span>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', background: STATUS_COLOR[i.status]?.bg || '#ddd8ce', color: STATUS_COLOR[i.status]?.color || '#7a7060' }}>
                            {i.status?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {role === 'admin' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${BORDER}` }}>
                          <span style={{ fontSize: '11px', color: '#7a9e8a' }}>Status:</span>
                          {['reported', 'in_progress', 'resolved'].map(s => (
                            <button key={s} onClick={() => handleStatusChange(i.id, s)} style={{ padding: '3px 10px', borderRadius: '20px', border: `1px solid ${BORDER}`, fontSize: '11px', cursor: 'pointer', fontWeight: i.status === s ? '700' : '400', background: i.status === s ? GREEN : 'transparent', color: i.status === s ? '#fff' : '#7a7060' }}>
                              {s.replace('_', ' ')}
                            </button>
                          ))}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                            <input placeholder="Assign to dept / UID" value={assignInput[i.id] || ''} onChange={e => setAssignInput(p => ({ ...p, [i.id]: e.target.value }))}
                              style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '4px 10px', fontSize: '11px', background: '#0d2b1f', outline: 'none', color: TEXT, width: '160px' }} />
                            <button onClick={() => handleAssign(i.id)} style={{ ...btnGold, padding: '4px 12px', fontSize: '11px' }}>Assign</button>
                          </div>
                        </div>
                      )}

                      {role === 'staff' && i.assigned_to && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${BORDER}` }}>
                          <span style={{ fontSize: '11px', color: '#7a9e8a' }}>Update:</span>
                          {['in_progress', 'resolved'].map(s => (
                            <button key={s} onClick={() => handleStatusChange(i.id, s)} style={{ padding: '3px 10px', borderRadius: '20px', border: `1px solid ${BORDER}`, fontSize: '11px', cursor: 'pointer', fontWeight: i.status === s ? '700' : '400', background: i.status === s ? GREEN : 'transparent', color: i.status === s ? '#fff' : '#7a7060' }}>
                              {s.replace('_', ' ')}
                            </button>
                          ))}
                          <span style={{ fontSize: '11px', color: '#7a9e8a', marginLeft: '8px' }}>Assigned to: <strong>{i.assigned_to}</strong></span>
                        </div>
                      )}

                      {role === 'student' && i.assigned_to && (
                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#7a9e8a' }}>Assigned to: <strong>{i.assigned_to}</strong></p>
                      )}

                      {(role === 'admin' || (role === 'student' && i.reported_by === user?.id && i.status === 'reported')) && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                          <button onClick={() => handleDeleteIncident(i.id)} style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FaTrash size={10} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        style={{ ...btnGold, opacity: page === 1 ? 0.4 : 1, padding: '5px 14px' }}>Prev</button>
                      <span style={{ fontSize: '12px', color: '#7a9e8a' }}>{page} / {totalPages}</span>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        style={{ ...btnGold, opacity: page === totalPages ? 0.4 : 1, padding: '5px 14px' }}>Next</button>
                    </div>
                  )}
                </>
              }
            </div>
          )}

          {/* ── REPORTS ── */}
          {active === 'Reports' && (
            <div style={{ background: '#112d20', borderRadius: '16px', padding: '24px 26px', maxWidth: '540px', border: `1px solid ${BORDER}` }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '700', color: GOLD }}>Report New Incident</h3>
              {formError && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px', background: 'rgba(248,113,113,0.1)', padding: '8px 12px', borderRadius: '6px' }}>{formError}</p>}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
                {['title', 'category', 'location'].map(f => (
                  <input key={f} required placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                    value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} style={inputStyle} />
                ))}
                <textarea required placeholder="Description — 'fire', 'leak', 'broken' auto-sets severity"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ ...inputStyle, resize: 'none', height: '90px' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" disabled={submitting} style={{ ...btnGold, padding: '10px 24px', fontSize: '13px', opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                  <button type="button" onClick={() => setActive('Dashboard')} style={{ background: 'transparent', color: '#7a9e8a', border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '10px 24px', fontSize: '13px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── USERS (admin only) ── */}
          {active === 'Users' && role === 'admin' && (
            <div style={{ background: '#112d20', borderRadius: '16px', padding: '24px 26px', border: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: '15px', fontWeight: '600', color: TEXT, margin: '0 0 18px' }}>User Management</p>
              {loadingUsers ? <Spinner /> : users.length === 0
                ? <p style={{ fontSize: '13px', color: '#7a9e8a' }}>No users found.</p>
                : users.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', background: '#0d2b1f', marginBottom: '10px', border: `1px solid ${BORDER}`, flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: TEXT }}>{u.name || '—'}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#7a9e8a' }}>{u.email}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', background: ROLE_BADGE[u.role]?.bg || '#ddd', color: ROLE_BADGE[u.role]?.color || '#333', textTransform: 'capitalize' }}>{u.role}</span>
                      <select value={roleInput[u.id] || ''} onChange={e => setRoleInput(p => ({ ...p, [u.id]: e.target.value }))}
                        style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '4px 8px', fontSize: '11px', background: INPUT_BG, color: TEXT, outline: 'none' }}>
                        <option value="">Change role</option>
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button onClick={() => handleUpdateRole(u.id)} style={{ ...btnGold, padding: '4px 12px', fontSize: '11px' }}>Save</button>
                      <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}>
                        <FaTrash size={11} />
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── SETTINGS ── */}
          {active === 'Settings' && (
            <div style={{ maxWidth: '420px' }}>
              <div style={{ background: '#112d20', borderRadius: '16px', padding: '24px 26px', border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: '15px', fontWeight: '600', color: TEXT, margin: '0 0 18px' }}>Settings</p>
                {[{ label: 'Name', value: user?.name || '—' }, { label: 'Email', value: user?.email || '—' }, { label: 'Role', value: user?.role || '—' }].map(f => (
                  <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ fontSize: '13px', color: '#7a9e8a' }}>{f.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: TEXT, textTransform: f.label === 'Role' ? 'capitalize' : 'none' }}>{f.value}</span>
                  </div>
                ))}
              </div>
              <button onClick={logout} style={{ marginTop: '16px', width: '100%', background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '11px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                Log Out
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
