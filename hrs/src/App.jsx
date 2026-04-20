import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Landing          from './pages/Landing'
import Login            from './pages/Login'
import AdminLayout      from './pages/AdminLayout'
import DashboardLayout  from './pages/dashboard/DashboardLayout'
import Dashboard        from './pages/dashboard/Dashboard'
import CharacterView    from './pages/dashboard/CharacterView'
import GuildInfo        from './pages/dashboard/GuildInfo'
import Roster           from './pages/dashboard/Roster'
import Calendar         from './pages/dashboard/Calendar'
import DKP              from './pages/dashboard/DKP'
import Verwaltung       from './pages/dashboard/Verwaltung'
import Website     from './pages/admin/Website'
import { Credentials } from './pages/admin/Settings'
import Events           from './pages/admin/Events'
import Users            from './pages/admin/Users'
import Ranks            from './pages/admin/Ranks'
import DKPAdmin         from './pages/admin/DKP'
import AuditLog         from './pages/admin/AuditLog'
import ThemeInjector from './components/ThemeInjector'
import './styles/global.css'

export default function App() {
  return (
    <AuthProvider>
      <ThemeInjector />
      <BrowserRouter>
        <Routes>
          <Route path="/"      element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* ── Admin-Bereich ── */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index                   element={<Navigate to="website" replace />} />
            <Route path="website"          element={<Website />} />
            <Route path="users"            element={<Users />} />
            <Route path="ranks"            element={<Ranks />} />
            <Route path="events"           element={<Events />} />
            <Route path="dkp"              element={<DKPAdmin />} />
            <Route path="auditlog"         element={<AuditLog />} />
            <Route path="credentials"      element={<Credentials />} />
          </Route>

          {/* ── Member-Dashboard ── */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index              element={<Dashboard />} />
            <Route path="charakter"   element={<CharacterView />} />
            <Route path="info"        element={<GuildInfo />} />
            <Route path="roster"      element={<Roster />} />
            <Route path="calendar"    element={<Calendar />} />
            <Route path="dkp"         element={<DKP />} />
            <Route path="verwaltung"  element={<Verwaltung />} />
          </Route>

          {/* Catch-all → Landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
