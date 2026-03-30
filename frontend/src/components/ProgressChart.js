import React from 'react';

const GOLD = '#c8873a';

export default function ProgressChart({ pct = 0, onViewAll }) {
  const r = 44, circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;

  return (
    <div style={{ background: '#0d2b1f', borderRadius: '12px', padding: '20px 22px', border: '1px solid #1e4030', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#e8e0d0', letterSpacing: '0.2px' }}>Resolution Rate</span>
        <button onClick={onViewAll} style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.3px' }}>View All</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={r} fill="none" stroke="#1e4030" strokeWidth="12" />
          <circle cx="65" cy="65" r={r} fill="none" stroke={GOLD} strokeWidth="12"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 65 65)" />
          <text x="65" y="70" textAnchor="middle" fontSize="20" fontWeight="700" fill={GOLD}>{pct}%</text>
        </svg>
      </div>
    </div>
  );
}
