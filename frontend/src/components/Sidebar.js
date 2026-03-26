import React from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '⊞' },
  { label: 'Incidents', icon: '⚠' },
  { label: 'Reports', icon: '📄' },
  { label: 'Users', icon: '👥' },
  { label: 'Settings', icon: '⚙' },
  { label: 'Support', icon: '💬' },
];

const SIDEBAR = '#008055';
const CONTENT = '#f5f0e8';

export default function Sidebar({ active, onNav, onLogout }) {
  return (
    <>
      <style>{`
        .sb { width:210px; min-width:210px; background:${SIDEBAR}; display:flex; flex-direction:column; padding:24px 0 18px; height:100vh; box-sizing:border-box; position:relative; z-index:10; }
        .sb-logo { color:#fff; font-weight:700; font-size:16px; margin-bottom:28px; padding:0 20px; letter-spacing:0.3px; }
        .sb-nav { display:flex; flex-direction:column; flex:1; }
        .sb-item { position:relative; display:flex; align-items:center; gap:10px; width:100%; padding:12px 20px; border:none; cursor:pointer; font-size:14px; font-weight:400; text-align:left; background:transparent; color:#a7f3d0; transition:color 0.15s; box-sizing:border-box; letter-spacing:0.2px; }
        .sb-item:hover:not(.sb-active) { color:#fff; }
        .sb-active { background:${CONTENT}; color:${SIDEBAR}; font-weight:600; }
        .sb-active::before { content:''; position:absolute; right:0; bottom:100%; width:20px; height:20px; background:${SIDEBAR}; border-bottom-right-radius:16px; box-shadow:5px 5px 0 5px ${CONTENT}; pointer-events:none; z-index:2; }
        .sb-active::after  { content:''; position:absolute; right:0; top:100%;    width:20px; height:20px; background:${SIDEBAR}; border-top-right-radius:16px;    box-shadow:5px -5px 0 5px ${CONTENT}; pointer-events:none; z-index:2; }
        .sb-quit { display:flex; align-items:center; gap:10px; padding:12px 20px; border:none; cursor:pointer; font-size:14px; color:#a7f3d0; background:transparent; text-align:left; width:100%; margin-bottom:12px; box-sizing:border-box; }
        .sb-support { background:#006644; border-radius:14px; padding:14px 12px; text-align:center; margin:0 14px; }
      `}</style>

      <div className="sb">
        <div className="sb-logo">🌿 AlertNest</div>

        <div className="sb-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.label}
              onClick={() => onNav(item.label)}
              className={`sb-item${active === item.label ? ' sb-active' : ''}`}
            >
              <span style={{ fontSize: '15px', lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <button className="sb-quit" onClick={onLogout}>
          <span>⏻</span> Quit
        </button>

        <div className="sb-support">
          <div style={{ fontSize: '28px', lineHeight: 1 }}>🧑‍💻</div>
          <p style={{ color: '#a7f3d0', fontSize: '12px', margin: '6px 0 0', fontWeight: '500' }}>24/7 Support</p>
        </div>
      </div>
    </>
  );
}
