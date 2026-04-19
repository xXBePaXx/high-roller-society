import { useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const CLASS_COLORS = {
  'Death Knight': '#C41E3A', 'Druid': '#FF7C0A', 'Hunter': '#AAD372',
  'Mage': '#3FC7EB', 'Paladin': '#F48CBA', 'Priest': '#FFFFFF',
  'Rogue': '#FFF468', 'Shaman': '#0070DD', 'Warlock': '#8788EE', 'Warrior': '#C69B3A',
}

export default function DashboardLayout() {
  const { currentUser, logout } = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    if (!currentUser) nav('/login', { replace: true })
    else if (currentUser.role === 'admin') nav('/admin', { replace: true })
  }, [currentUser, nav])

  if (!currentUser) return null

  const clsColor = CLASS_COLORS[currentUser.cls] || '#c8a84b'
  const perms    = currentUser.permissions || {}

  // Nav-Links je nach Rechten einblenden
  const hasVerwaltung = perms.canManageEvents || perms.canManageDKP

  const navLinks = [
    { to: '/dashboard',              label: 'Mein Charakter', end: true,  show: true },
    { to: '/dashboard/roster',       label: 'Roster',         end: false, show: currentUser.role === 'admin' || perms.canViewRoster },
    { to: '/dashboard/calendar',     label: 'Kalender',       end: false, show: currentUser.role === 'admin' || perms.canViewCalendar },
    { to: '/dashboard/dkp',          label: 'DKP',            end: false, show: currentUser.role === 'admin' || perms.canViewDKP },
    { to: '/dashboard/verwaltung',   label: 'Verwaltung',     end: false, show: hasVerwaltung },
  ].filter(l => l.show)

  async function handleLogout() {
    await logout()
    nav('/', { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0a04', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: '#120e06', borderBottom: '1px solid #2e2210',
        padding: '0 1.5rem', display: 'flex', alignItems: 'center',
        gap: '1.5rem', height: 52, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ fontFamily: 'Cinzel,serif', fontSize: 14, color: '#c8a84b', letterSpacing: 2, whiteSpace: 'nowrap', marginRight: 'auto' }}>
          🎰 HRS
        </div>

        <nav style={{ display: 'flex', gap: '0.2rem' }}>
          {navLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              fontFamily: 'Cinzel,serif', fontSize: 10, letterSpacing: 2,
              padding: '6px 12px', borderRadius: 2, textDecoration: 'none',
              textTransform: 'uppercase',
              color: isActive ? '#f0d080' : '#5a4828',
              background: isActive ? 'rgba(200,168,75,.08)' : 'transparent',
              border: isActive ? '1px solid rgba(200,168,75,.2)' : '1px solid transparent',
              transition: 'all .15s',
            })}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 11, color: clsColor, letterSpacing: 1 }}>
              {currentUser.username}
            </div>
            <div style={{ fontSize: 10, color: '#3a2c18', letterSpacing: 1 }}>
              {currentUser.rank || 'Mitglied'}
            </div>
          </div>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid #2e2210', color: '#5a4828',
            fontSize: 10, fontFamily: 'Cinzel,serif', letterSpacing: 1,
            padding: '5px 10px', borderRadius: 2, cursor: 'pointer',
            textTransform: 'uppercase', transition: 'all .15s',
          }}
            onMouseEnter={e => { e.target.style.color = '#c8a84b'; e.target.style.borderColor = '#4a3820' }}
            onMouseLeave={e => { e.target.style.color = '#5a4828'; e.target.style.borderColor = '#2e2210' }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: 900, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <Outlet />
      </main>
    </div>
  )
}
