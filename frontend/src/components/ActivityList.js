import React from 'react';

const DOT = {
  high: '#ef4444', medium: '#f59e0b', low: '#008055',
  resolved: '#008055', in_progress: '#f59e0b', reported: '#3b82f6',
};

export default function ActivityList({ items = [], onViewAll }) {
  return (
    <div style={{
      background: '#ece8df', borderRadius: '16px', padding: '20px 22px',
      border: '1px solid #ddd8ce', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '0.2px' }}>Activity</span>
        <button onClick={onViewAll} style={{
          background: '#008055', color: '#fff', border: 'none', borderRadius: '20px',
          padding: '4px 13px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
        }}>View All</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        {items.length === 0 && <p style={{ fontSize: '13px', color: '#9c9080', margin: 0 }}>No recent activity</p>}
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '5px',
              background: DOT[item.dot] || '#9c9080',
            }} />
            <p style={{ margin: 0, fontSize: '12px', color: '#5a5040', lineHeight: '1.6', letterSpacing: '0.1px' }}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
