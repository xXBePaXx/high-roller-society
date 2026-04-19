import { useState, useEffect } from 'react'
import { useNavigate, Outlet, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV = [
  { group: 'Webseite', items: [
    { path: 'identity', label: 'Identität' },
    { path: 'texts',    label: 'Texte' },
    { path: 'stats',    label: 'Statistiken' },
  ]},
  { group: 'Gilde', items: [
    { path: 'users',    label: 'Benutzer' },
    { path: 'ranks',    label: 'Ränge' },
    { path: 'events',   label: 'Events' },
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

  if (configLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0d0a04', color:'#7a6030', fontStyle:'italic' }}>
      Laden...
    </div>
  )

  // Schutz: Nicht eingeloggt → Login
  if (!currentUser) return <Navigate to="/login" replace />

  const active = location.pathname.split('/').pop()

  async function handleLogout() {
    await logout()
    nav('/', { replace: true })
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#0d0a04' }}>

      {/* Topbar */}
      <div style={{ background:'#100c04', borderBottom:'1px solid #2e2210', padding:'.8rem 1.2rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <span style={{ fontFamily:'Cinzel,serif', fontSize:12, color:'#c8a84b', letterSpacing:2 }}>
          ⚙ Admin · High Roller Society
        </span>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-ghost" style={{ fontSize:9, padding:'5px 14px' }} onClick={() => nav('/')}>Vorschau</button>
          <button className="btn-ghost" style={{ fontSize:9, padding:'5px 14px' }} onClick={handleLogout}>Abmelden</button>
        </div>
      </div>

      <div style={{ display:'flex', flex:1, minHeight:0 }}>

        {/* Sidebar */}
        <nav style={{ width:165, background:'#0b0804', borderRight:'1px solid #2e2210', padding:'1rem 0', flexShrink:0, overflowY:'auto' }}>
          {NAV.map(group => (
            <div key={group.group}>
              <span style={{ fontSize:9, letterSpacing:2, color:'#2a1e10', textTransform:'uppercase', padding:'.8rem 1.2rem .3rem', display:'block' }}>
                {group.group}
              </span>
              {group.items.map(item => {
                const isActive = active === item.path || (active === 'admin' && item.path === 'identity')
                return (
                  <button key={item.path} onClick={() => nav(`/admin/${item.path}`)}
                    style={{
                      display:'block', width:'100%', background: isActive ? 'rgba(200,168,75,.07)' : 'none',
                      border:'none', borderLeft: `2px solid ${isActive ? '#c8a84b' : 'transparent'}`,
                      color: isActive ? '#f0d080' : '#7a6030',
                      fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:'1.5px',
                      textAlign:'left', padding:'.7rem 1.2rem', cursor:'pointer',
                      textTransform:'uppercase', transition:'all .15s',
                    }}
                    onMouseEnter={e=>{ if(!isActive){ e.currentTarget.style.color='#c8a84b'; e.currentTarget.style.background='rgba(200,168,75,.04)' }}}
                    onMouseLeave={e=>{ if(!isActive){ e.currentTarget.style.color='#7a6030'; e.currentTarget.style.background='none' }}}
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
    </div>
  )
}
