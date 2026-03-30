import React from 'react';

const GOLD = '#c8873a';

export default function StatCard({ label, value, subtitle, icon, trend = 'up' }) {
  return (
    <div style={{
      background: '#0d2b1f', borderRadius: '12px', padding: '20px 22px',
      border: '1px solid #1e4030', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flex: 1,
    }}>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#7a9e8a', fontWeight: '600', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{label}</p>
        <p style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: '700', color: '#e8e0d0', lineHeight: 1, letterSpacing: '-0.5px' }}>{value ?? '—'}</p>
        <p style={{ margin: 0, fontSize: '12px', color: trend === 'down' ? '#f87171' : GOLD, fontWeight: '500' }}>
          {trend === 'down' ? '↓' : '↑'} {subtitle}
        </p>
      </div>
      {icon && (
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(200,135,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
          {icon}
        </div>
      )}
    </div>
  );
}
