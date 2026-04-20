import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getDashboardSummary, getIncidents, createIncident, updateStatus, assignIncident, deleteIncident, getUsers, updateUserRole, deleteUser } from '../services/api';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ProgressChart from '../components/ProgressChart';
import ActivityList from '../components/ActivityList';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import IncidentDetailModal from '../components/IncidentDetailModal';
import Profile from './Profile';
import { FaClipboardList, FaSync, FaCheckCircle, FaTrash, FaSearch, FaMapMarkerAlt, FaDownload, FaFilter, FaSave, FaTimes, FaSort } from 'react-icons/fa';
import { COLORS } from '../utils/colors';

const PAGE_SIZE = 8;

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Toast ──────────────────────────────────────────────────────────────────
// Removed - using new Toast component

// ── Spinner ────────────────────────────────────────────────────────────────
// Removed - using LoadingSkeleton component

// ── Settings Panel ─────────────────────────────────────────────────────────
function SettingsPanel({ user, logout, showToast }) {
  const { theme, toggle } = useTheme();
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const inputStyle = {
    border: '1px solid var(--border)', 
    padding: '10px 14px',
    fontSize: '12px', 
    background: 'var(--bg-input)', 
    outline: 'none', 
    color: 'var(--text)',
    width: '100%', 
    boxSizing: 'border-box', 
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    letterSpacing: '0.03em',
  };
  const btnGold = {
    background: 'var(--gold)', 
    color: '#fff', 
    border: 'none',
    padding: '7px 16px', 
    fontSize: '11px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    letterSpacing: '0.1em', 
    textTransform: 'uppercase',
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    if (pwForm.next.length < 6) { setPwError('Password must be at least 6 characters'); return; }
    setPwLoading(true);
    try {
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth');
      const { auth: firebaseAuth } = await import('../firebase');
      const credential = EmailAuthProvider.credential(user.email, pwForm.current);
      await reauthenticateWithCredential(firebaseAuth.currentUser, credential);
      await updatePassword(firebaseAuth.currentUser, pwForm.next);
      setPwForm({ current: '', next: '', confirm: '' });
      setShowPw(false);
      showToast('Password updated successfully');
    } catch (err) {
      const msg = err.code === 'auth/wrong-password' ? 'Current password is incorrect'
        : err.code === 'auth/too-many-requests' ? 'Too many attempts. Try again later'
        : 'Failed to update password';
      setPwError(msg);
    } finally { setPwLoading(false); }
  };

  const sectionStyle = { 
    background: 'var(--bg-card)', 
    border: '1px solid var(--border)', 
    padding: '24px 26px', 
    borderRadius: '12px' 
  };
  const labelStyle = { 
    fontSize: '10px', 
    fontWeight: '700', 
    color: 'var(--muted)', 
    letterSpacing: '0.15em', 
    textTransform: 'uppercase', 
    margin: '0 0 16px' 
  };
  const rowStyle = { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '12px 0', 
    borderBottom: '1px solid var(--border)' 
  };

  return (
    <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Account */}
      <div style={sectionStyle}>
        <p style={labelStyle}>Account</p>
        <div style={rowStyle}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Email</span>
          <span style={{ fontSize: '13px', color: 'var(--text)' }}>{user?.email}</span>
        </div>
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Password</span>
          <button onClick={() => { setShowPw(p => !p); setPwError(''); }}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--gold)', fontSize: '11px', padding: '4px 12px', cursor: 'pointer', letterSpacing: '0.06em' }}>
            {showPw ? 'Cancel' : 'Change'}
          </button>
        </div>

        {showPw && (
          <form onSubmit={handleChangePassword} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pwError && <p style={{ margin: 0, fontSize: '12px', color: '#f87171' }}>{pwError}</p>}
            {[
              { placeholder: 'Current password', key: 'current' },
              { placeholder: 'New password',     key: 'next' },
              { placeholder: 'Confirm new password', key: 'confirm' },
            ].map(f => (
              <input key={f.key} type="password" placeholder={f.placeholder} required
                value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ ...inputStyle, borderRadius: '6px', padding: '9px 12px' }} />
            ))}
            <button type="submit" disabled={pwLoading}
              style={{ ...btnGold, borderRadius: '6px', padding: '9px', fontSize: '11px', opacity: pwLoading ? 0.6 : 1 }}>
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>

      {/* Appearance */}
      <div style={sectionStyle}>
        <p style={labelStyle}>Appearance</p>
        <div style={rowStyle}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Theme</span>
          <button onClick={toggle}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--gold)', fontSize: '11px', padding: '4px 12px', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'capitalize' }}>
            {theme === 'dark' ? '◐ Dark' : '◯ Light'}
          </button>
        </div>
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Timezone</span>
          <span style={{ fontSize: '13px', color: 'var(--text)' }}>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
        </div>
      </div>

      {/* About */}
      <div style={sectionStyle}>
        <p style={labelStyle}>About</p>
        {[
          { label: 'App',     value: 'AlertNest' },
          { label: 'Version', value: '1.0.0' },
          { label: 'Support', value: 'support@alertnest.com' },
        ].map(f => (
          <div key={f.label} style={rowStyle}>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{f.label}</span>
            <span style={{ fontSize: '13px', color: 'var(--text)' }}>{f.value}</span>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button onClick={logout}
        style={{ background: 'transparent', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        Sign Out
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const role = user?.role || 'student';

  // Use CSS variables directly in inline styles
  const inputStyle = {
    border: '1px solid var(--border)', 
    padding: '10px 14px',
    fontSize: '12px', 
    background: 'var(--bg-input)', 
    outline: 'none', 
    color: 'var(--text)',
    width: '100%', 
    boxSizing: 'border-box', 
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    letterSpacing: '0.03em',
  };
  const btnGold = {
    background: 'var(--gold)', 
    color: '#fff', 
    border: 'none',
    padding: '7px 16px', 
    fontSize: '11px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    letterSpacing: '0.1em', 
    textTransform: 'uppercase',
  };
  const ROLE_BADGE = {
    admin:   { bg: 'rgba(200,135,58,0.15)', color: '#c8873a', label: 'Admin' },
    staff:   { bg: 'rgba(110,231,183,0.12)', color: '#6ee7b7', label: 'Staff' },
    student: { bg: 'rgba(147,197,253,0.12)', color: '#93c5fd', label: 'Student' },
  };
  const STATUS_COLOR = {
    reported:    { bg: 'rgba(147,197,253,0.15)', color: '#93c5fd' },
    in_progress: { bg: 'rgba(200,135,58,0.15)',  color: '#c8873a' },
    resolved:    { bg: 'rgba(110,231,183,0.15)', color: '#6ee7b7' },
  };
  const SEV_DOT = { high: '#f87171', medium: '#c8873a', low: '#6ee7b7' };

  const [active, setActive]           = useState('Dashboard');
  const [summary, setSummary]         = useState(null);
  const [recent, setRecent]           = useState([]);
  const [incidents, setIncidents]     = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [form, setForm]               = useState({ title: '', description: '', category: '', location: '' });
  const [mediaFiles, setMediaFiles]   = useState([]);
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
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  // profile page
  const [showProfile, setShowProfile] = useState(false);

  // confirm dialog
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  // filter + search state
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [searchQuery,    setSearchQuery]    = useState('');

  // advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // saved filters
  const [savedFilters, setSavedFilters] = useState([]);
  const [filterName, setFilterName] = useState('');

  // sort
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // bulk actions
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');

  // incident detail modal
  const [detailIncident, setDetailIncident] = useState(null);

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
    const params = new URLSearchParams();
    if (filterStatus) params.append('status', filterStatus);
    if (filterSeverity) params.append('severity', filterSeverity);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (assignedTo) params.append('assigned_to', assignedTo);
    params.append('sort_by', sortBy);
    params.append('sort_order', sortOrder);
    
    api.get(`/api/incidents?${params.toString()}`)
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

    // Load saved filters
    api.get('/api/incidents/filters')
      .then(r => setSavedFilters(r.data.filters || []))
      .catch(() => {});
  }, [role, filterStatus, filterSeverity, dateFrom, dateTo, assignedTo, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);

  // reset page when filters change
  useEffect(() => { setPage(1); }, [filterStatus, filterSeverity, searchQuery, dateFrom, dateTo, assignedTo, sortBy, sortOrder]);

  if (showProfile) return <Profile onBack={() => setShowProfile(false)} summary={summary} />;

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
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('location', form.location);
      mediaFiles.forEach(f => formData.append('media', f));

      await api.post('/api/incidents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm({ title: '', description: '', category: '', location: '' });
      setMediaFiles([]);
      showToast('Incident reported', 'success');
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
      showToast('Incident assigned', 'success');
      load();
    } catch { showToast('Failed to assign', 'error'); }
  };

  const handleUpdateRole = async (userId) => {
    const newRole = roleInput[userId];
    if (!newRole) return;
    try {
      await updateUserRole(userId, newRole);
      setRoleInput(p => ({ ...p, [userId]: '' }));
      showToast('Role updated', 'success');
      load();
    } catch { showToast('Failed to update role', 'error'); }
  };

  const handleDeleteIncident = async (id) => {
    setConfirmModal({
      open: true,
      title: 'Delete Incident',
      message: 'Are you sure you want to delete this incident? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteIncident(id);
          showToast('Incident deleted', 'success');
          load();
        } catch {
          showToast('Failed to delete', 'error');
        }
      }
    });
  };

  const handleDeleteUser = async (userId) => {
    setConfirmModal({
      open: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteUser(userId);
          showToast('User deleted', 'success');
          load();
        } catch {
          showToast('Failed to delete user', 'error');
        }
      }
    });
  };

  // Export incidents
  const handleExport = async (format = 'csv') => {
    try {
      const response = await api.get(`/api/incidents/export?format=${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `incidents.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Export successful', 'success');
    } catch {
      showToast('Failed to export', 'error');
    }
  };

  // Save current filter
  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      showToast('Please enter a filter name', 'error');
      return;
    }
    try {
      await api.post('/api/incidents/filters', {
        name: filterName,
        filters: { status: filterStatus, severity: filterSeverity, dateFrom, dateTo, assignedTo, sortBy, sortOrder },
      });
      showToast('Filter saved', 'success');
      setFilterName('');
      load();
    } catch {
      showToast('Failed to save filter', 'error');
    }
  };

  // Apply saved filter
  const handleApplyFilter = (filter) => {
    const f = filter.filters;
    setFilterStatus(f.status || '');
    setFilterSeverity(f.severity || '');
    setDateFrom(f.dateFrom || '');
    setDateTo(f.dateTo || '');
    setAssignedTo(f.assignedTo || '');
    setSortBy(f.sortBy || 'created_at');
    setSortOrder(f.sortOrder || 'desc');
  };

  // Delete saved filter
  const handleDeleteFilter = async (filterId) => {
    try {
      await api.delete(`/api/incidents/filters/${filterId}`);
      showToast('Filter deleted', 'success');
      load();
    } catch {
      showToast('Failed to delete filter', 'error');
    }
  };

  // Bulk update
  const handleBulkUpdate = async () => {
    if (selectedIncidents.length === 0 || !bulkStatus) {
      showToast('Select incidents and status', 'error');
      return;
    }
    try {
      await api.post('/api/incidents/bulk-update', {
        incident_ids: selectedIncidents,
        status: bulkStatus,
      });
      showToast(`Updated ${selectedIncidents.length} incidents`, 'success');
      setSelectedIncidents([]);
      setBulkStatus('');
      load();
    } catch {
      showToast('Failed to bulk update', 'error');
    }
  };

  // Toggle incident selection
  const toggleIncidentSelection = (id) => {
    setSelectedIncidents(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Select all incidents
  const toggleSelectAll = () => {
    if (selectedIncidents.length === filteredIncidents.length) {
      setSelectedIncidents([]);
    } else {
      setSelectedIncidents(filteredIncidents.map(i => i.id));
    }
  };

  const navItems = ['Dashboard', 'Incidents', 'Reports', ...(role === 'admin' ? ['Users'] : []), 'Settings'];
  const badge = ROLE_BADGE[role] || ROLE_BADGE.student;

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-dark)', fontFamily: "'Jost', 'Segoe UI', system-ui, sans-serif", overflow: 'hidden' }} className="dash-bg">
      <div className="dash-glow" />
      <div className="dash-glow-2" />
      <div className="dash-arc" style={{ width: '600px', height: '600px', top: '5%', right: '-250px' }} />
      <div className="dash-arc" style={{ width: '350px', height: '350px', bottom: '10%', left: '-120px', animationDuration: '15s', animationDirection: 'reverse' }} />
      <Sidebar active={active} onNav={setActive} onLogout={logout} navItems={navItems} />

      {/* Toast Notification */}
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'success' })} />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
        }}
        onCancel={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
      />

      {/* Incident Detail Modal */}
      <IncidentDetailModal
        incident={detailIncident}
        onClose={() => setDetailIncident(null)}
        onToast={showToast}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* Topbar */}
        <div style={{ background: 'var(--bg-card)', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid var(--border)`, height: '56px' }}>
          <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>{active}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '9px', fontWeight: '600', padding: '3px 10px', background: badge.bg, color: badge.color, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{badge.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderLeft: `1px solid var(--border)`, paddingLeft: '16px' }} onClick={() => setShowProfile(true)}>
              <div style={{ width: '30px', height: '30px', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '13px' }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>{user?.name || 'User'}</p>
                <p style={{ margin: 0, fontSize: '10px', color: 'var(--muted)' }}>{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', background: 'var(--bg-dark)' }}>

          {/* ── DASHBOARD ── */}
          {active === 'Dashboard' && (
            <>
              <div style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: `1px solid var(--border)` }}>
                <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  {role === 'admin' ? 'System Overview' : role === 'staff' ? 'Staff Overview' : 'My Overview'}
                </p>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '400', color: 'var(--text)', letterSpacing: '0.05em', fontFamily: "'Oswald', sans-serif" }}>
                  {role === 'admin' ? 'All Incidents' : role === 'staff' ? 'Assigned Work' : `Welcome, ${user?.name?.split(' ')[0] || 'there'}`}
                </h2>
              </div>

              {loadingDash ? <LoadingSkeleton type="stat" /> : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', border: `1px solid var(--border)`, marginBottom: '24px' }}>
                    <StatCard label="Total Incidents" value={summary?.total}       subtitle="All time" icon={<FaClipboardList size={16} />} />
                    <StatCard label="In Progress"     value={summary?.in_progress} subtitle="Active now" icon={<FaSync size={16} />} trend="down" />
                    <StatCard label="Resolved Cases"  value={summary?.resolved}    subtitle="Completed" icon={<FaCheckCircle size={16} />} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'var(--border)', border: `1px solid var(--border)` }}>
                    <div style={{ background: 'var(--bg-card)', padding: '22px' }}>
                      <p style={{ margin: '0 0 16px', fontSize: '10px', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>Recent Activity</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
                        {recent.length === 0 && <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, padding: '12px', background: 'var(--bg-dark)' }}>No incidents yet</p>}
                        {recent.map((inc, idx) => (
                          <button key={inc.id} onClick={() => setSelectedIdx(idx)} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 14px', border: 'none', cursor: 'pointer',
                            background: selectedIdx === idx ? 'rgba(200,135,58,0.1)' : 'var(--bg-dark)',
                            color: selectedIdx === idx ? 'var(--gold)' : 'var(--text)',
                            transition: 'background 0.15s',
                            textAlign: 'left',
                            width: '100%',
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
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    {role === 'admin' ? 'All Incidents' : role === 'staff' ? 'Assigned to You' : 'My Reports'}
                  </p>
                  <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '400', color: 'var(--text)', letterSpacing: '0.04em', fontFamily: "'Oswald', sans-serif" }}>
                    {filteredIncidents.length} {filteredIncidents.length === 1 ? 'Incident' : 'Incidents'}
                  </h2>
                  {pagedIncidents.length > 0 && (
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--muted)' }}>
                      Showing {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, filteredIncidents.length)} of {filteredIncidents.length}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} style={{
                    background: showAdvancedFilters ? 'rgba(200,135,58,0.15)' : 'transparent',
                    border: `1px solid ${showAdvancedFilters ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '11px',
                    color: showAdvancedFilters ? 'var(--gold)' : 'var(--text)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '500',
                  }}>
                    <FaFilter size={10} /> Advanced
                  </button>
                  <button onClick={() => setActive('Reports')} style={{ ...btnGold, padding: '8px 18px', fontSize: '11px', borderRadius: '8px' }}>+ New Report</button>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showAdvancedFilters && (
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: 'var(--text)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      Advanced Filters
                    </h4>
                    <button onClick={() => setShowAdvancedFilters(false)} style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      fontSize: '18px',
                    }}>×</button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: 'var(--muted)', marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Date From</label>
                      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        style={{ ...inputStyle, borderRadius: '8px', padding: '8px 12px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: 'var(--muted)', marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Date To</label>
                      <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        style={{ ...inputStyle, borderRadius: '8px', padding: '8px 12px' }} />
                    </div>
                    {role === 'admin' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: 'var(--muted)', marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Assigned To</label>
                        <input type="text" placeholder="User ID" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
                          style={{ ...inputStyle, borderRadius: '8px', padding: '8px 12px' }} />
                      </div>
                    )}
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: 'var(--muted)', marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Sort By</label>
                      <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                        style={{ ...inputStyle, borderRadius: '8px', padding: '8px 12px' }}>
                        <option value="created_at">Date</option>
                        <option value="severity">Severity</option>
                        <option value="status">Status</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: 'var(--muted)', marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Order</label>
                      <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
                        style={{ ...inputStyle, borderRadius: '8px', padding: '8px 12px' }}>
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                      </select>
                    </div>
                  </div>

                  {/* Save Filter */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: 'var(--muted)', marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Save Current Filter</label>
                      <input type="text" placeholder="Filter name..." value={filterName} onChange={e => setFilterName(e.target.value)}
                        style={{ ...inputStyle, borderRadius: '8px', padding: '8px 12px' }} />
                    </div>
                    <button onClick={handleSaveFilter} style={{ ...btnGold, padding: '8px 16px', fontSize: '11px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaSave size={10} /> Save
                    </button>
                  </div>

                  {/* Saved Filters */}
                  {savedFilters.length > 0 && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Saved Filters</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {savedFilters.map(f => (
                          <div key={f.id} style={{
                            background: 'var(--bg-dark)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            <button onClick={() => handleApplyFilter(f)} style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text)',
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: 0,
                            }}>{f.name}</button>
                            <button onClick={() => handleDeleteFilter(f.id)} style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--muted)',
                              cursor: 'pointer',
                              fontSize: '14px',
                              padding: 0,
                            }}>×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bulk Actions Bar */}
              {role === 'admin' && selectedIncidents.length > 0 && (
                <div style={{
                  background: 'rgba(200,135,58,0.15)',
                  border: '1px solid var(--gold)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gold)' }}>
                    {selectedIncidents.length} selected
                  </span>
                  <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                    style={{ border: '1px solid var(--gold)', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', background: 'var(--bg-card)', color: 'var(--text)', outline: 'none' }}>
                    <option value="">Change status to...</option>
                    <option value="reported">Reported</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <button onClick={handleBulkUpdate} disabled={!bulkStatus} style={{
                    ...btnGold,
                    padding: '6px 16px',
                    fontSize: '11px',
                    borderRadius: '8px',
                    opacity: bulkStatus ? 1 : 0.5,
                    cursor: bulkStatus ? 'pointer' : 'default',
                  }}>Apply</button>
                  <button onClick={() => setSelectedIncidents([])} style={{
                    background: 'transparent',
                    border: '1px solid var(--gold)',
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '11px',
                    color: 'var(--gold)',
                    cursor: 'pointer',
                  }}>Clear Selection</button>
                </div>
              )}

              {/* Search + filter bar */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '14px 16px', border: `1px solid var(--border)`, borderRadius: '12px' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                  <FaSearch size={11} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input
                    placeholder="Search title, category, location..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: '32px', padding: '8px 12px 8px 32px', borderRadius: '8px', fontSize: '12px' }}
                  />
                </div>
                {[
                  { label: 'Status', value: filterStatus, set: setFilterStatus, opts: ['reported', 'in_progress', 'resolved'] },
                  { label: 'Severity', value: filterSeverity, set: setFilterSeverity, opts: ['high', 'medium', 'low'] },
                ].map(f => (
                  <select key={f.label} value={f.value} onChange={e => f.set(e.target.value)}
                    style={{ border: `1px solid var(--border)`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', background: 'var(--bg-input)', color: f.value ? 'var(--text)' : 'var(--muted)', outline: 'none' }}>
                    <option value="">All {f.label}s</option>
                    {f.opts.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                  </select>
                ))}
                {(filterStatus || filterSeverity || searchQuery) && (
                  <button onClick={() => { setFilterStatus(''); setFilterSeverity(''); setSearchQuery(''); }}
                    style={{ background: 'transparent', color: 'var(--muted)', border: `1px solid var(--border)`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer' }}>
                    Clear
                  </button>
                )}
              </div>

              {loadingIncidents ? <LoadingSkeleton type="card" count={6} /> : filteredIncidents.length === 0
                ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: '16px', border: `1px solid var(--border)` }}>
                    <FaClipboardList size={32} style={{ color: 'var(--muted)', marginBottom: '12px', opacity: 0.4 }} />
                    <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>No incidents found</p>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '6px 0 0', opacity: 0.6 }}>Try adjusting your filters or report a new incident</p>
                  </div>
                )
                : <>
                  {/* Card grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                    {role === 'admin' && filteredIncidents.length > 0 && (
                      <div style={{
                        gridColumn: '1 / -1',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedIncidents.length === filteredIncidents.length && filteredIncidents.length > 0}
                          onChange={toggleSelectAll}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '500' }}>Select All</span>
                      </div>
                    )}
                    {pagedIncidents.map(i => {
                      const sevColor = SEV_DOT[i.severity] || '#ccc';
                      const stColor  = STATUS_COLOR[i.status]?.color || 'var(--muted)';
                      const stBg     = STATUS_COLOR[i.status]?.bg || 'transparent';
                      const isSelected = selectedIncidents.includes(i.id);
                      return (
                        <div key={i.id} style={{
                          background: isSelected ? 'rgba(200,135,58,0.08)' : 'var(--bg-card)',
                          border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                          borderRadius: '14px',
                          padding: '18px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          transition: 'border-color 0.2s, transform 0.15s',
                          borderLeft: `3px solid ${sevColor}`,
                          cursor: 'pointer',
                        }}
                          onClick={() => setDetailIncident(i)}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = sevColor; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = isSelected ? 'var(--gold)' : 'var(--border)'; e.currentTarget.style.borderLeftColor = sevColor; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          {/* Top row: checkbox + title + delete */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            {role === 'admin' && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleIncidentSelection(i.id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{ cursor: 'pointer', flexShrink: 0, marginTop: '2px' }}
                              />
                            )}
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text)', lineHeight: 1.4, flex: 1 }}>{i.title}</p>
                            {(role === 'admin' || (role === 'student' && i.reported_by === user?.id && i.status === 'reported')) && (
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteIncident(i.id); }}
                                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', color: 'rgba(248,113,113,0.5)', cursor: 'pointer', padding: '4px 7px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.18)'; e.currentTarget.style.color = '#f87171'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.color = 'rgba(248,113,113,0.5)'; }}>
                                <FaTrash size={10} />
                              </button>
                            )}
                          </div>

                          {/* Meta row */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            {/* Severity badge */}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px', background: `${sevColor}18`, color: sevColor }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sevColor, flexShrink: 0 }} />
                              {i.severity}
                            </span>
                            {/* Status badge */}
                            <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px', background: stBg, color: stColor }}>
                              {i.status?.replace('_', ' ')}
                            </span>
                            {/* Category */}
                            <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: 'auto' }}>{i.category}</span>
                          </div>

                          {/* Location + time */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--muted)', opacity: 0.8 }}><FaMapMarkerAlt size={10} /> {i.location || '—'}</span>
                            <span style={{ fontSize: '10px', color: 'var(--muted)', opacity: 0.6 }}>{timeAgo(i.created_at)}</span>
                          </div>

                          {/* Assigned to (student view) */}
                          {role === 'student' && i.assigned_to && (
                            <p style={{ margin: 0, fontSize: '10px', color: 'var(--muted)', padding: '6px 10px', background: 'rgba(200,135,58,0.06)', borderRadius: '6px', border: `1px solid rgba(200,135,58,0.12)` }}>
                              Assigned to: <span style={{ color: 'var(--gold)' }}>{i.assigned_to}</span>
                            </p>
                          )}

                          {/* Admin controls */}
                          {role === 'admin' && (
                            <div onClick={(e) => e.stopPropagation()} style={{ borderTop: `1px solid rgba(200,121,65,0.1)`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {['reported', 'in_progress', 'resolved'].map(s => (
                                  <button key={s} onClick={() => handleStatusChange(i.id, s)} style={{
                                    padding: '4px 10px', border: `1px solid ${i.status === s ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '6px',
                                    fontSize: '10px', cursor: 'pointer', fontWeight: i.status === s ? '600' : '400',
                                    background: i.status === s ? 'rgba(200,135,58,0.15)' : 'transparent',
                                    color: i.status === s ? 'var(--gold)' : 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase',
                                  }}>
                                    {s.replace('_', ' ')}
                                  </button>
                                ))}
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <input placeholder="Assign to UID" value={assignInput[i.id] || ''} onChange={e => setAssignInput(p => ({ ...p, [i.id]: e.target.value }))}
                                  style={{ flex: 1, border: 'none', borderBottom: `1px solid var(--border)`, padding: '4px 0', fontSize: '11px', background: 'transparent', outline: 'none', color: 'var(--text)' }} />
                                <button onClick={() => handleAssign(i.id)} style={{ ...btnGold, padding: '4px 12px', fontSize: '10px', borderRadius: '6px' }}>Assign</button>
                              </div>
                            </div>
                          )}

                          {/* Staff controls */}
                          {role === 'staff' && i.assigned_to && (
                            <div onClick={(e) => e.stopPropagation()} style={{ borderTop: `1px solid rgba(200,121,65,0.1)`, paddingTop: '10px', display: 'flex', gap: '6px' }}>
                              {['in_progress', 'resolved'].map(s => (
                                <button key={s} onClick={() => handleStatusChange(i.id, s)} style={{
                                  padding: '4px 10px', border: `1px solid ${i.status === s ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '6px',
                                  fontSize: '10px', cursor: 'pointer', background: i.status === s ? 'rgba(200,135,58,0.15)' : 'transparent',
                                  color: i.status === s ? 'var(--gold)' : 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase',
                                }}>
                                  {s.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '24px', justifyContent: 'center' }}>
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        style={{ background: 'transparent', border: `1px solid var(--border)`, borderRadius: '8px', color: page === 1 ? 'var(--muted)' : 'var(--text)', padding: '8px 20px', fontSize: '11px', cursor: page === 1 ? 'default' : 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>← Prev</button>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{page} / {totalPages}</span>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        style={{ background: 'transparent', border: `1px solid var(--border)`, borderRadius: '8px', color: page === totalPages ? 'var(--muted)' : 'var(--text)', padding: '8px 20px', fontSize: '11px', cursor: page === totalPages ? 'default' : 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Next →</button>
                    </div>
                  )}
                </>
              }
            </div>
          )}

          {/* ── REPORTS ── */}
          {active === 'Reports' && (
            <div style={{ maxWidth: '560px' }}>
              <div style={{ marginBottom: '32px', paddingBottom: '20px', borderBottom: `1px solid var(--border)` }}>
                <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>New Report</p>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '400', color: 'var(--text)', letterSpacing: '0.05em', fontFamily: "'Oswald', sans-serif" }}>Report an Incident</h2>
              </div>

              {formError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.06)', marginBottom: '24px' }}>
                  <span style={{ color: '#f87171', fontSize: '12px' }}>— {formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <div className="report-field">
                  <label className="report-label">Title</label>
                  <input className="report-input" required placeholder="e.g. Water leak in washroom"
                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="report-field" style={{ marginTop: '20px' }}>
                  <label className="report-label">Category</label>
                  <input className="report-input" required placeholder="e.g. Plumbing, Electrical, Security"
                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                </div>
                <div className="report-field" style={{ marginTop: '20px' }}>
                  <label className="report-label">Location</label>
                  <input className="report-input" required placeholder="e.g. Block B, 2nd Floor"
                    value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
                <div style={{ marginTop: '20px', paddingBottom: '28px', borderBottom: `1px solid rgba(200,121,65,0.1)` }}>
                  <label className="report-label">Description</label>
                  <textarea className="report-input" required placeholder="Describe the incident in detail — keywords like 'fire', 'leak', 'broken' auto-set severity"
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    style={{ resize: 'none', height: '100px', marginTop: '6px' }} />
                </div>

                {/* Media Upload */}
                <div style={{ marginTop: '24px', paddingBottom: '28px', borderBottom: `1px solid rgba(200,121,65,0.1)` }}>
                  <label className="report-label">Photos / Videos <span style={{ color: 'var(--muted)', fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                  <label style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    marginTop: '10px', padding: '20px', border: '2px dashed var(--border)',
                    borderRadius: '10px', cursor: 'pointer', color: 'var(--muted)', fontSize: '12px',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
                  >
                    <span style={{ fontSize: '22px' }}>📎</span>
                    <span>Click to attach photos or videos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const files = Array.from(e.target.files);
                        setMediaFiles(prev => [...prev, ...files]);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  {/* Preview */}
                  {mediaFiles.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {mediaFiles.map((f, idx) => (
                        <div key={idx} style={{
                          position: 'relative', borderRadius: '8px', overflow: 'hidden',
                          border: '1px solid var(--border)', background: 'var(--bg-dark)',
                        }}>
                          {f.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(f)}
                              alt={f.name}
                              style={{ width: '80px', height: '80px', objectFit: 'cover', display: 'block' }}
                            />
                          ) : (
                            <div style={{ width: '80px', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '24px' }}>🎥</span>
                              <span style={{ fontSize: '9px', color: 'var(--muted)', textAlign: 'center', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '76px' }}>{f.name}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== idx))}
                            style={{
                              position: 'absolute', top: '3px', right: '3px',
                              background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                              color: '#fff', width: '18px', height: '18px', cursor: 'pointer',
                              fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '28px' }}>
                  <button type="submit" disabled={submitting} style={{ ...btnGold, padding: '12px 32px', fontSize: '11px', opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? 'Submitting...' : 'Submit Report →'}
                  </button>
                  <button type="button" onClick={() => { setActive('Dashboard'); setMediaFiles([]); }}
                    style={{ background: 'transparent', color: 'var(--muted)', border: 'none', fontSize: '11px', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── USERS (admin only) ── */}
          {active === 'Users' && role === 'admin' && (
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px 26px', border: `1px solid var(--border)` }}>
              <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', margin: '0 0 18px' }}>User Management</p>
              {loadingUsers ? (
                <div style={{ padding: '20px 0' }}>
                  <div style={{ height: '60px', background: 'var(--border)', borderRadius: '10px', marginBottom: '10px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ height: '60px', background: 'var(--border)', borderRadius: '10px', marginBottom: '10px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ height: '60px', background: 'var(--border)', borderRadius: '10px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
                </div>
              ) : users.length === 0
                ? <p style={{ fontSize: '13px', color: 'var(--muted)' }}>No users found.</p>
                : users.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-dark)', marginBottom: '10px', border: `1px solid var(--border)`, flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{u.name || '—'}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--muted)' }}>{u.email}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', background: ROLE_BADGE[u.role]?.bg || '#ddd', color: ROLE_BADGE[u.role]?.color || '#333', textTransform: 'capitalize' }}>{u.role}</span>
                      <select value={roleInput[u.id] || ''} onChange={e => setRoleInput(p => ({ ...p, [u.id]: e.target.value }))}
                        style={{ border: `1px solid var(--border)`, borderRadius: '6px', padding: '4px 8px', fontSize: '11px', background: 'var(--bg-input)', color: 'var(--text)', outline: 'none' }}>
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
            <SettingsPanel user={user} logout={logout} showToast={showToast} />
          )}

        </div>
      </div>

    </div>
  );
}
