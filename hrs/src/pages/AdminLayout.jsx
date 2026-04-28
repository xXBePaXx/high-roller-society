import { useNavigate, Outlet, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../hooks/useTheme'

const NAV = [
  { group: 'Webseite', items: [
    { path: 'website', label: 'Webseite' },
  ]},
  { group: 'Gilde', items: [
    { path: 'users',   label: 'Benutzer' },
    { path: 'ranks',   label: 'Ränge' },
    { path: 'gilde',   label: 'Gilden-Info' },
    { path: 'events',  label: 'Events' },
    { path: 'dkp',     label: 'DKP' },
  ]},
  { group: 'Wirtschaft', items: [
    { path: 'economy', label: 'Währung' },
    { path: 'shop',    label: 'Shop' },
  ]},
  { group: 'System', items: [
    { path: 'auditlog',    label: 'Audit-Log' },
    { path: 'credentials', label: 'Zugangsdaten' },
  ]},
]

export default function AdminLayout() {
  const { currentUser, logout, configLoading } = useAuth()
  const nav      = useNavigate()
  const location = useLocation()
  const t        = useTheme()

  if (configLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:t.bgDark, color:t.accentDim, fontStyle:'italic' }}>
      Laden...
    </div>
  )
  if (!currentUser) return <Navigate to="/login" replace />

  const active = location.pathname.split('/').pop()

  async function handleLogout() { await logout(); nav('/', { replace: true }) }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:t.bgDark }}>

      {/* Top-Balken */}
      <div style={{ height:2, background:t.gradBar, flexShrink:0 }} />

      {/* Header */}
      <div style={{ background:t.bgMid, borderBottom:`1px solid ${t.accentFade}`, padding:'.8rem 1.2rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <span style={{ fontFamily:'Cinzel,serif', fontSize:12, color:t.accent, letterSpacing:2 }}>
          ⚙ Admin · High Roller Society
        </span>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-ghost" style={{ fontSize:9, padding:'5px 14px' }} onClick={() => nav('/')}>Vorschau</button>
          <button className="btn-ghost" style={{ fontSize:9, padding:'5px 14px' }} onClick={handleLogout}>Abmelden</button>
        </div>
      </div>

      <div style={{ display:'flex', flex:1, minHeight:0 }}>
        {/* Sidebar */}
        <nav style={{ width:165, background:t.bgDark, borderRight:`1px solid ${t.accentFade}`, padding:'1rem 0', flexShrink:0, overflowY:'auto' }}>
          {NAV.map(group => (
            <div key={group.group}>
              <span style={{ fontSize:9, letterSpacing:2, color:t.accentGhost, textTransform:'uppercase', padding:'.8rem 1.2rem .3rem', display:'block' }}>
                {group.group}
              </span>
              {group.items.map(item => {
                const isActive = active === item.path || (active === 'admin' && item.path === 'website')
                return (
                  <button key={item.path} onClick={() => nav(`/admin/${item.path}`)}
                    style={{
                      display:'block', width:'100%',
                      background: isActive ? `${t.accent}10` : 'none',
                      border:'none', borderLeft:`2px solid ${isActive ? t.accent : 'transparent'}`,
                      color: isActive ? t.accentSoft : t.accentDim,
                      fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:'1.5px',
                      textAlign:'left', padding:'.7rem 1.2rem', cursor:'pointer',
                      textTransform:'uppercase', transition:'all .15s',
                    }}
                    onMouseEnter={e => { if(!isActive) { e.currentTarget.style.color=t.accent; e.currentTarget.style.background=`${t.accent}06` }}}
                    onMouseLeave={e => { if(!isActive) { e.currentTarget.style.color=t.accentDim; e.currentTarget.style.background='none' }}}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Content */}
        <div style={{ flex:1, padding:'1.5rem', overflowY:'auto' }}>
          <Outlet />
        </div>
      </div>

      {/* Bottom-Balken */}
      <div style={{ height:2, background:t.gradBar, flexShrink:0 }} />
    </div>
  )
}
import { useNavigate, Outlet, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../hooks/useTheme'

const NAV = [
  { group: 'Webseite', items: [
    { path: 'website', label: 'Webseite' },
  ]},
  { group: 'Gilde', items: [
    { path: 'users',   label: 'Benutzer' },
    { path: 'ranks',   label: 'Ränge' },
    { path: 'gilde',   label: 'Gilden-Info' },
    { path: 'events',  label: 'Events' },
    { path: 'dkp',     label: 'DKP' },
  ]},
  { group: 'Wirtschaft', items: [
    { path: 'economy', label: 'Währung' },
    { path: 'shop',    label: 'Shop' },
  ]},
  { group: 'System', items: [
    { path: 'auditlog',    label: 'Audit-Log' },
    { path: 'credentials', label: 'Zugangsdaten' },
  ]},
]

export default function AdminLayout() {
  const { currentUser, logout, configLoading } = useAuth()
  const nav      = useNavigate()
  const location = useLocation()
  const t        = useTheme()

  if (configLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:t.bgDark, color:t.accentDim, fontStyle:'italic' }}>
      Laden...
    </div>
  )
  if (!currentUser) return <Navigate to="/login" replace />

  const active = location.pathname.split('/').pop()

  async function handleLogout() { await logout(); nav('/', { replace: true }) }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:t.bgDark }}>

      {/* Top-Balken */}
      <div style={{ height:2, background:t.gradBar, flexShrink:0 }} />

      {/* Header */}
      <div style={{ background:t.bgMid, borderBottom:`1px solid ${t.accentFade}`, padding:'.8rem 1.2rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <span style={{ fontFamily:'Cinzel,serif', fontSize:12, color:t.accent, letterSpacing:2 }}>
          ⚙ Admin · High Roller Society
        </span>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-ghost" style={{ fontSize:9, padding:'5px 14px' }} onClick={() => nav('/')}>Vorschau</button>
          <button className="btn-ghost" style={{ fontSize:9, padding:'5px 14px' }} onClick={handleLogout}>Abmelden</button>
        </div>
      </div>

      <div style={{ display:'flex', flex:1, minHeight:0 }}>
        {/* Sidebar */}
        <nav style={{ width:165, background:t.bgDark, borderRight:`1px solid ${t.accentFade}`, padding:'1rem 0', flexShrink:0, overflowY:'auto' }}>
          {NAV.map(group => (
            <div key={group.group}>
              <span style={{ fontSize:9, letterSpacing:2, color:t.accentGhost, textTransform:'uppercase', padding:'.8rem 1.2rem .3rem', display:'block' }}>
                {group.group}
              </span>
              {group.items.map(item => {
                const isActive = active === item.path || (active === 'admin' && item.path === 'website')
                return (
                  <button key={item.path} onClick={() => nav(`/admin/${item.path}`)}
                    style={{
                      display:'block', width:'100%',
                      background: isActive ? `${t.accent}10` : 'none',
                      border:'none', borderLeft:`2px solid ${isActive ? t.accent : 'transparent'}`,
                      color: isActive ? t.accentSoft : t.accentDim,
                      fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:'1.5px',
                      textAlign:'left', padding:'.7rem 1.2rem', cursor:'pointer',
                      textTransform:'uppercase', transition:'all .15s',
                    }}
                    onMouseEnter={e => { if(!isActive) { e.currentTarget.style.color=t.accent; e.currentTarget.style.background=`${t.accent}06` }}}
                    onMouseLeave={e => { if(!isActive) { e.currentTarget.style.color=t.accentDim; e.currentTarget.style.background='none' }}}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Content */}
        <div style={{ flex:1, padding:'1.5rem', overflowY:'auto' }}>
          <Outlet />
        </div>
      </div>

      {/* Bottom-Balken */}
      <div style={{ height:2, background:t.gradBar, flexShrink:0 }} />
    </div>
  )
}
