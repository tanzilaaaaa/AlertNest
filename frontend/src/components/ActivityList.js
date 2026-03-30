import React from 'react';

const GOLD = '#c8873a';
const DOT  = { high: '#f87171', medium: GOLD, low: '#6ee7b7', resolved: '#6ee7b7', in_progress: GOLD, reported: '#93c5fd' };

export default function ActivityList({ items = [], onViewAll }) {
  return (
    <div style={{ background: '#0d2b1f', borderRadius: '12px', padding: '20px 22px', border: '1px solid #1e4030', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#e8e0d0' }}>Activity</span>
        <button onClick={onViewAll} style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>View All</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        {items.length === 0 && <p style={{ fontSize: '12px', color: '#7a9e8a', margin: 0 }}>No recent activity</p>}
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, marginTop: '5px', background: DOT[item.dot] || '#7a9e8a' }} />
            <p style={{ margin: 0, fontSize: '12px', color: '#7a9e8a', lineHeight: '1.6' }}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
