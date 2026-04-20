import { FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import Comments from './Comments';
import Attachments from './Attachments';

export default function IncidentDetailModal({ incident, onClose, onToast }) {
  if (!incident) return null;

  const SEV_DOT = { high: '#f87171', medium: '#c8873a', low: '#6ee7b7' };
  const STATUS_COLOR = {
    reported: { bg: 'rgba(147,197,253,0.15)', color: '#93c5fd' },
    in_progress: { bg: 'rgba(200,135,58,0.15)', color: '#c8873a' },
    resolved: { bg: 'rgba(110,231,183,0.15)', color: '#6ee7b7' },
  };

  const sevColor = SEV_DOT[incident.severity] || '#ccc';
  const stColor = STATUS_COLOR[incident.status]?.color || 'var(--muted)';
  const stBg = STATUS_COLOR[incident.status]?.bg || 'transparent';

  const timeAgo = (isoString) => {
    if (!isoString) return '';
    const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 300,
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'scaleIn 0.2s ease-out',
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: '600', color: 'var(--text)', lineHeight: 1.3 }}>
              {incident.title}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: '20px',
                background: `${sevColor}18`,
                color: sevColor,
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sevColor }} />
                {incident.severity}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: '20px',
                background: stBg,
                color: stColor,
              }}>
                {incident.status?.replace('_', ' ')}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{incident.category}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '4px',
            flexShrink: 0,
          }}>
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Meta info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaMapMarkerAlt size={12} style={{ color: 'var(--muted)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text)' }}>{incident.location || '—'}</span>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>
              Reported {timeAgo(incident.created_at)}
            </p>
            {incident.assigned_to && (
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>
                Assigned to: <span style={{ color: 'var(--gold)' }}>{incident.assigned_to}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '600', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Description
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>
              {incident.description}
            </p>
          </div>

          {/* Media */}
          {incident.media && incident.media.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '600', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Photos / Videos ({incident.media.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {incident.media.map(m => (
                  <a
                    key={m.id}
                    href={`http://localhost:8000/api/incidents/${incident.id}/media/${m.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {m.content_type?.startsWith('image/') ? (
                      <img
                        src={`http://localhost:8000/api/incidents/${incident.id}/media/${m.id}`}
                        alt={m.filename}
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', display: 'block' }}
                      />
                    ) : (
                      <div style={{
                        width: '100px', height: '100px', borderRadius: '8px',
                        border: '1px solid var(--border)', background: 'var(--bg-dark)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      }}>
                        <span style={{ fontSize: '28px' }}>🎥</span>
                        <span style={{ fontSize: '9px', color: 'var(--muted)', textAlign: 'center', padding: '0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90px' }}>{m.filename}</span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <Comments incidentId={incident.id} onToast={onToast} />

          {/* Attachments */}
          <Attachments incidentId={incident.id} onToast={onToast} />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
