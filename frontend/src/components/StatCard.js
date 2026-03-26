import React from 'react';

export default function StatCard({ label, value, subtitle, icon, trend = 'up' }) {
  return (
    <div style={{
      background: '#ece8df',
      borderRadius: '16px',
      padding: '20px 22px',
      border: '1px solid #ddd8ce',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      flex: 1,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#7a7060', fontWeight: '500', letterSpacing: '0.3px' }}>
          {label}
        </p>
        <p style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: '700', color: '#1a1a1a', lineHeight: 1, letterSpacing: '-0.5px' }}>
          {value ?? '—'}
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: trend === 'down' ? '#ef4444' : '#008055', fontWeight: '500' }}>
          {trend === 'down' ? '↓' : '↑'} {subtitle}
        </p>
      </div>
      {icon && (
        <div style={{
          width: '38px', height: '38px', borderRadius: '12px',
          background: '#ddd8ce', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '18px', flexShrink: 0,
        }}>
          {icon}
        </div>
      )}
    </div>
  );
}
