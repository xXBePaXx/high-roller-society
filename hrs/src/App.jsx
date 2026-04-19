import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Landing          from './pages/Landing'
import Login            from './pages/Login'
import AdminLayout      from './pages/AdminLayout'
import DashboardLayout  from './pages/dashboard/DashboardLayout'
import CharacterView    from './pages/dashboard/CharacterView'
import Roster          from './pages/dashboard/Roster'
import { Identity, Texts, Stats, Credentials } from './pages/admin/Settings'
import Users    from './pages/admin/Users'
import Ranks    from './pages/admin/Ranks'
import AuditLog from './pages/admin/AuditLog'
import './styles/global.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"      element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* ── Admin-Bereich ── */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index                   element={<Navigate to="identity" replace />} />
            <Route path="identity"         element={<Identity />} />
            <Route path="texts"            element={<Texts />} />
            <Route path="stats"            element={<Stats />} />
            <Route path="users"            element={<Users />} />
            <Route path="ranks"            element={<Ranks />} />
            <Route path="auditlog"         element={<AuditLog />} />
            <Route path="credentials"      element={<Credentials />} />
          </Route>

          {/* ── Member-Dashboard ── */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<CharacterView />} />
            <Route path="roster" element={<Roster />} />
          </Route>

          {/* Catch-all → Landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
