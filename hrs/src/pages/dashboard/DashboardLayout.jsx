import { useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../hooks/useTheme'

const CLASS_COLORS = {
  'Death Knight': '#C41E3A', 'Druid': '#FF7C0A', 'Hunter': '#AAD372',
  'Mage': '#3FC7EB', 'Paladin': '#F48CBA', 'Priest': '#FFFFFF',
  'Rogue': '#FFF468', 'Shaman': '#0070DD', 'Warlock': '#8788EE', 'Warrior': '#C69B3A',
}

export default function DashboardLayout() {
  const { currentUser, logout } = useAuth()
  const nav = useNavigate()
  const t   = useTheme()

  useEffect(() => {
    if (!currentUser) nav('/login', { replace: true })
    else if (currentUser.role === 'admin') nav('/admin', { replace: true })
  }, [currentUser, nav])

  if (!currentUser) return null

  const clsColor = CLASS_COLORS[currentUser.cls] || t.accent
  const perms    = currentUser.permissions || {}
  const hasVerwaltung = perms.canManageEvents || perms.canManageDKP

  const navLinks = [
    { to: '/dashboard',            label: 'Mein Charakter', end: true,  show: true },
    { to: '/dashboard/roster',     label: 'Roster',         end: false, show: currentUser.role === 'admin' || perms.canViewRoster },
    { to: '/dashboard/calendar',   label: 'Kalender',       end: false, show: currentUser.role === 'admin' || perms.canViewCalendar },
    { to: '/dashboard/dkp',        label: 'DKP',            end: false, show: currentUser.role === 'admin' || perms.canViewDKP },
    { to: '/dashboard/verwaltung', label: 'Verwaltung',     end: false, show: hasVerwaltung },
  ].filter(l => l.show)

  async function handleLogout() {
    await logout()
    nav('/', { replace: true })
  }

  return (
    <div style={{ minHeight:'100vh', background:t.bgDark, display:'flex', flexDirection:'column' }}>

      {/* Top-Balken */}
      <div style={{ height:2, background:t.gradBar, flexShrink:0 }} />

      <header style={{
        background: t.bgMid,
        borderBottom: `1px solid ${t.accentFade}`,
        padding: '0 1.5rem', display:'flex', alignItems:'center',
        gap:'1.5rem', height:50, position:'sticky', top:0, zIndex:100,
        boxShadow: `0 2px 20px ${t.bgDark}80`,
      }}>
        {/* Logo */}
        <div style={{ fontFamily:'Cinzel,serif', fontSize:14, color:t.accent, letterSpacing:2, whiteSpace:'nowrap', marginRight:'auto' }}>
          🎰 HRS
        </div>

        {/* Nav */}
        <nav style={{ display:'flex', gap:'0.2rem' }}>
          {navLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:2,
              padding:'6px 12px', borderRadius:2, textDecoration:'none',
              textTransform:'uppercase', transition:'all .15s',
              color:       isActive ? t.accentSoft : t.accentDim,
              background:  isActive ? `${t.accent}12` : 'transparent',
              border:      isActive ? `1px solid ${t.accent}35` : '1px solid transparent',
            })}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User-Badge + Logout */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginLeft:'auto' }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:11, color:clsColor, letterSpacing:1 }}>
              {currentUser.username}
            </div>
            <div style={{ fontSize:10, color:t.accentDim, letterSpacing:1 }}>
              {currentUser.rank || 'Mitglied'}
            </div>
          </div>
          <button onClick={handleLogout} style={{
            background:'transparent', border:`1px solid ${t.accentFade}`,
            color:t.accentDim, fontSize:10, fontFamily:'Cinzel,serif',
            letterSpacing:1, padding:'5px 10px', borderRadius:2,
            cursor:'pointer', textTransform:'uppercase', transition:'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color=t.accent; e.currentTarget.style.borderColor=t.accentDim }}
            onMouseLeave={e => { e.currentTarget.style.color=t.accentDim; e.currentTarget.style.borderColor=t.accentFade }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ flex:1, padding:'2rem 1.5rem', maxWidth:900, width:'100%', margin:'0 auto', boxSizing:'border-box' }}>
        <Outlet />
      </main>

      {/* Bottom-Balken */}
      <div style={{ height:2, background:t.gradBar, flexShrink:0 }} />
    </div>
  )
}
