import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SocialButtons from '../components/SocialButtons';
import { FaLeaf, FaGraduationCap, FaTools, FaCrown, FaEye, FaEyeSlash } from 'react-icons/fa';

const STUDENT_DOMAIN = '@student.alertnest.edu';
const STAFF_DOMAIN   = '@staff.alertnest.edu';
const ADMIN_DOMAIN   = '@admin.alertnest.edu';

function getRoleFromEmail(email) {
  const e = email.toLowerCase();
  if (e.endsWith(ADMIN_DOMAIN))   return 'admin';
  if (e.endsWith(STAFF_DOMAIN))   return 'staff';
  if (e.endsWith(STUDENT_DOMAIN)) return 'student';
  return null;
}

export default function Signup({ onSwitch }) {
  const { register } = useAuth();
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const detectedRole = getRoleFromEmail(form.email);

  const ROLE_INFO = {
    student: { icon: FaGraduationCap, color: '#93c5fd', label: 'Student',  bg: 'rgba(147,197,253,0.12)' },
    staff:   { icon: FaTools,         color: '#6ee7b7', label: 'Staff',    bg: 'rgba(110,231,183,0.12)' },
    admin:   { icon: FaCrown,          color: '#c8873a', label: 'Admin',    bg: 'rgba(200,135,58,0.15)'  },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);

    if (!detectedRole) {
      setError(`Invalid email domain. Use:\n${STUDENT_DOMAIN} for students\n${STAFF_DOMAIN} for staff\n${ADMIN_DOMAIN} for admins`);
      setLoading(false);
      return;
    }

    try {
      await register(form.name, form.email, form.password, detectedRole);
      setSuccess('Account created! Logging you in...');
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'Email already registered' : err.message);
    } finally { setLoading(false); }
  };

  const label = { fontSize: '11px', fontWeight: '600', color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' };
  const inputSt = { width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px 14px', fontSize: '13px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };

  const roleInfo = detectedRole ? ROLE_INFO[detectedRole] : null;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: 'hidden' }}>

      {/* Left branding panel */}
      <div style={{ width: '42%', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '36px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(200,135,58,0.1)', top: '50%', left: '10%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--gold)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaLeaf size={16} color="#fff" /></div>
          <span style={{ color: 'var(--text)', fontWeight: '700', fontSize: '16px', letterSpacing: '1px' }}>ALERTNEST</span>
        </div>

        <div style={{ position: 'relative' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '52px', fontWeight: '700', color: 'var(--text)', lineHeight: 1.1 }}>Report.</h1>
          <h1 style={{ margin: '0 0 4px', fontSize: '52px', fontWeight: '700', color: 'var(--gold)', lineHeight: 1.1, fontStyle: 'italic' }}>Track.</h1>
          <h1 style={{ margin: '0 0 24px', fontSize: '52px', fontWeight: '700', color: 'var(--text)', lineHeight: 1.1 }}>Resolve.</h1>

          {/* Email domain guide */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '600', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Email Domains</p>
            {Object.entries(ROLE_INFO).map(([role, info]) => (
              <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: info.bg, borderRadius: '8px', border: `1px solid ${info.color}30` }}>
                <info.icon size={13} color={info.color} />
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: info.color }}>{info.label}</span>
                  <span style={{ fontSize: '10px', color: 'var(--muted)', marginLeft: '8px' }}>
                    {role === 'student' ? STUDENT_DOMAIN : role === 'staff' ? STAFF_DOMAIN : ADMIN_DOMAIN}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ position: 'relative', fontSize: '11px', color: 'var(--muted)', margin: 0 }}>© 2026 AlertNest</p>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', overflowY: 'auto' }}>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '8px', padding: '4px', marginBottom: '32px', width: '100%', maxWidth: '360px' }}>
          <button onClick={onSwitch} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--muted)', fontWeight: '600', fontSize: '13px', letterSpacing: '0.5px' }}>SIGN IN</button>
          <button style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'default', background: 'var(--gold)', color: '#fff', fontWeight: '700', fontSize: '13px', letterSpacing: '0.5px' }}>SIGN UP</button>
        </div>

        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '700', color: 'var(--text)' }}>Create account</h2>
          <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'var(--muted)' }}>Your role is determined by your email domain.</p>

          {error   && <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '14px', background: 'rgba(248,113,113,0.1)', padding: '10px 14px', borderRadius: '6px', whiteSpace: 'pre-line' }}>{error}</p>}
          {success && <p style={{ color: '#6ee7b7', fontSize: '12px', marginBottom: '14px', background: 'rgba(110,231,183,0.1)', padding: '10px 14px', borderRadius: '6px' }}>{success}</p>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={label}>Full Name</label>
              <input type="text" placeholder="Your name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required style={inputSt} />
            </div>

            <div>
              <label style={label}>Email Address</label>
              <input type="email" placeholder={`e.g. john${STUDENT_DOMAIN}`} value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required style={inputSt} />

              {/* Role auto-detected badge */}
              {roleInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '8px 12px', background: roleInfo.bg, borderRadius: '8px', border: `1px solid ${roleInfo.color}40` }}>
                  <roleInfo.icon size={13} color={roleInfo.color} />
                  <span style={{ fontSize: '12px', color: roleInfo.color, fontWeight: '600' }}>
                    Role detected: {roleInfo.label}
                  </span>
                </div>
              )}
              {form.email && !roleInfo && (
                <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#f87171' }}>
                  Unrecognized domain. Use a valid @alertnest.edu email.
                </p>
              )}
            </div>

            <div>
              <label style={label}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} required
                  style={{ ...inputSt, paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowPassword(p => !p)} style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
                }}>
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !detectedRole} style={{
              width: '100%', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: '6px',
              padding: '13px', fontSize: '13px', fontWeight: '700', cursor: loading || !detectedRole ? 'not-allowed' : 'pointer',
              letterSpacing: '0.8px', opacity: loading || !detectedRole ? 0.5 : 1, marginTop: '4px',
            }}>
              {loading ? 'CREATING...' : detectedRole ? `CREATE ${detectedRole.toUpperCase()} ACCOUNT` : 'CREATE ACCOUNT'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)', marginTop: '20px' }}>
            Already have an account?{' '}
            <button onClick={onSwitch} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}
