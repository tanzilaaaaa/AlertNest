import React from 'react';

export default function ProgressChart({ pct = 0, onViewAll }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;

  return (
    <div style={{
      background: '#ece8df', borderRadius: '16px', padding: '20px 22px',
      border: '1px solid #ddd8ce', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '0.2px' }}>Total Sale</span>
        <button onClick={onViewAll} style={{
          background: '#008055', color: '#fff', border: 'none', borderRadius: '20px',
          padding: '4px 13px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
        }}>View All</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={r} fill="none" stroke="#ccc5b5" strokeWidth="12" />
          <circle cx="65" cy="65" r={r} fill="none" stroke="#008055" strokeWidth="12"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 65 65)" />
          <text x="65" y="70" textAnchor="middle" fontSize="20" fontWeight="700" fill="#008055">{pct}%</text>
        </svg>
      </div>
    </div>
  );
}
