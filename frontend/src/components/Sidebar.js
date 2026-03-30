import { FaThLarge, FaExclamationTriangle, FaFileAlt, FaUsers, FaCog, FaLeaf, FaHeadset } from 'react-icons/fa';

const ALL_NAV = [
  { label: 'Dashboard', icon: FaThLarge },
  { label: 'Incidents', icon: FaExclamationTriangle },
  { label: 'Reports',   icon: FaFileAlt },
  { label: 'Users',     icon: FaUsers },
  { label: 'Settings',  icon: FaCog },
];

const SIDEBAR  = '#0d2b1f';
const CONTENT  = '#112d20';
const GOLD     = '#c8873a';
const MUTED    = '#7a9e8a';

export default function Sidebar({ active, onNav, onLogout, navItems }) {
  const items = navItems ? ALL_NAV.filter(n => navItems.includes(n.label)) : ALL_NAV;

  return (
    <>
      <style>{`
        .sb { width:210px; min-width:210px; background:${SIDEBAR}; display:flex; flex-direction:column; padding:24px 0 18px; height:100vh; box-sizing:border-box; position:relative; z-index:10; }
        .sb-logo { color:#e8e0d0; font-weight:700; font-size:15px; margin-bottom:32px; padding:0 20px; letter-spacing:1px; display:flex; align-items:center; gap:10px; }
        .sb-logo-icon { width:28px; height:28px; background:${GOLD}; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
        .sb-nav { display:flex; flex-direction:column; flex:1; }
        .sb-item { position:relative; display:flex; align-items:center; gap:10px; width:100%; padding:11px 20px; border:none; cursor:pointer; font-size:13px; font-weight:400; text-align:left; background:transparent; color:${MUTED}; transition:color 0.15s; box-sizing:border-box; letter-spacing:0.2px; }
        .sb-item:hover:not(.sb-active) { color:#e8e0d0; }
        .sb-active { background:${CONTENT}; color:${GOLD}; font-weight:600; }
        .sb-active::before { content:''; position:absolute; right:0; bottom:100%; width:20px; height:20px; background:${SIDEBAR}; border-bottom-right-radius:16px; box-shadow:5px 5px 0 5px ${CONTENT}; pointer-events:none; z-index:2; }
        .sb-active::after  { content:''; position:absolute; right:0; top:100%;    width:20px; height:20px; background:${SIDEBAR}; border-top-right-radius:16px;    box-shadow:5px -5px 0 5px ${CONTENT}; pointer-events:none; z-index:2; }
        .sb-support { background:#0a2218; border-radius:12px; padding:14px 12px; text-align:center; margin:0 14px; border:1px solid #1e4030; }
      `}</style>

      <div className="sb">
        <div className="sb-logo">
          <div className="sb-logo-icon"><FaLeaf size={16} /></div>
          ALERTNEST
        </div>

        <div className="sb-nav">
          {items.map(item => {
            const IconComponent = item.icon;
            return (
              <button key={item.label} onClick={() => onNav(item.label)}
                className={`sb-item${active === item.label ? ' sb-active' : ''}`}>
                <IconComponent size={14} style={{ lineHeight: 1 }} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="sb-support">
          <div style={{ fontSize: '26px', lineHeight: 1 }}><FaHeadset size={24} style={{ color: GOLD }} /></div>
          <p style={{ color: MUTED, fontSize: '11px', margin: '6px 0 0', fontWeight: '500' }}>24/7 Support</p>
        </div>
      </div>
    </>
  );
}
