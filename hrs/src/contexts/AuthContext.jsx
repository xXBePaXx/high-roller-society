import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore'
import { writeLog, LOG } from '../utils/auditLog'
import {
  hashPassword, verifyPassword,
  isLockedOut, recordFailedAttempt,
  clearLoginAttempts, getRemainingAttempts, getLockoutRemaining
} from '../utils/security'

const AuthContext = createContext(null)

const DEFAULT_SETTINGS = {
  guildName1: 'High Roller',
  guildName2: 'Society',
  guildSub:   'Raiding Guild · Spineshatter EU',
  realm:      'World of Warcraft · TBC Classic',
  tagline:    'Wir raiden. Wir verdienen. Wir gewinnen.\nTritt ein — wenn du bereit bist.',
  footer:     'Deutsche Gilde · Progression Raiding · Vollversorgung',
  server:     'Spineshatter · EU · PvP',
  emoji:      '🎰',
  stat1n: '25',  stat1l: 'Raider',
  stat2n: '2×',  stat2l: 'Raids/Woche',
  stat3n: 'T6',  stat3l: 'Progress',
}

// Standard-Fallback-Rechte wenn Rang keine Rechte hat
const DEFAULT_MEMBER_PERMISSIONS = {
  canManageEvents: false,
  canSignupEvents: true,
  canViewCalendar: true,
  canViewRoster:   true,
}

let sessionUser = null

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(sessionUser)
  const [settings, setSettings]       = useState(DEFAULT_SETTINGS)
  const [configLoading, setConfigLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'site'), snap => {
      if (snap.exists()) setSettings(prev => ({ ...prev, ...snap.data() }))
      setConfigLoading(false)
    }, () => setConfigLoading(false))
    return unsub
  }, [])

  // Rechte eines Rangs aus Firestore laden
  async function loadRankPermissions(rankLabel) {
    try {
      const snap = await getDoc(doc(db, 'config', 'ranks'))
      if (snap.exists() && Array.isArray(snap.data().list)) {
        const rank = snap.data().list.find(r => r.label === rankLabel)
        if (rank?.permissions) return rank.permissions
      }
    } catch (e) {
      console.warn('Rang-Rechte konnten nicht geladen werden:', e.message)
    }
    return DEFAULT_MEMBER_PERMISSIONS
  }

  // ── Admin Login ────────────────────────────────────────────────────────────
  const loginAdmin = useCallback(async (username, password) => {
    if (isLockedOut()) {
      const secs = getLockoutRemaining()
      await writeLog(LOG.LOGIN_LOCKED, { username, secondsLeft: secs })
      const mins = Math.ceil(secs / 60)
      return { ok: false, error: `Zu viele Fehlversuche. Bitte ${mins} Minute(n) warten.`, locked: true }
    }

    try {
      const snap = await getDoc(doc(db, 'config', 'adminAuth'))
      if (!snap.exists()) return { ok: false, error: 'Konfigurationsfehler.' }

      const data = snap.data()
      const usernameMatch = username === data.username
      const passwordMatch = data.passwordHash
        ? await verifyPassword(password, data.passwordHash)
        : password === data.password

      if (usernameMatch && passwordMatch) {
        clearLoginAttempts()
        const user = { username, role: 'admin' }
        sessionUser = user
        setCurrentUser(user)
        await writeLog(LOG.LOGIN, { username }, username)
        return { ok: true }
      }
    } catch (err) {
      console.warn('Admin-Login-Fehler:', err.message)
    }

    const remaining = recordFailedAttempt()
    await writeLog(LOG.LOGIN_FAILED, { username })
    if (remaining <= 0) return { ok: false, error: 'Zu viele Fehlversuche. Bitte 15 Minuten warten.', locked: true }
    return { ok: false, error: `Zugang verweigert. Noch ${remaining} Versuch(e).` }
  }, [])

  // ── Member Login ───────────────────────────────────────────────────────────
  const loginMember = useCallback(async (username, password) => {
    if (isLockedOut()) {
      const secs = getLockoutRemaining()
      const mins = Math.ceil(secs / 60)
      return { ok: false, error: `Zu viele Fehlversuche. Bitte ${mins} Minute(n) warten.`, locked: true }
    }

    try {
      const q = query(collection(db, 'users'), where('nameLower', '==', username.toLowerCase()))
      const snap = await getDocs(q)

      if (!snap.empty) {
        const userDoc = snap.docs[0]
        const data = userDoc.data()

        if (!data.active) {
          return { ok: false, error: 'Dein Account ist deaktiviert. Kontaktiere einen Admin.' }
        }

        const passwordMatch = data.passwordHash
          ? await verifyPassword(password, data.passwordHash)
          : password === data.password

        if (passwordMatch) {
          clearLoginAttempts()

          // Rechte aus Rang laden
          const permissions = await loadRankPermissions(data.rank)

          const user = {
            id:          userDoc.id,
            username:    data.name,
            role:        'member',
            rank:        data.rank,
            cls:         data.cls,
            permissions,
          }
          sessionUser = user
          setCurrentUser(user)
          await writeLog(LOG.LOGIN, { username: data.name, role: 'member' }, data.name)
          return { ok: true }
        }
      }
    } catch (err) {
      console.warn('Member-Login-Fehler:', err.message)
    }

    const remaining = recordFailedAttempt()
    await writeLog(LOG.LOGIN_FAILED, { username, role: 'member' })
    if (remaining <= 0) return { ok: false, error: 'Zu viele Fehlversuche. Bitte 15 Minuten warten.', locked: true }
    return { ok: false, error: `Zugang verweigert. Noch ${remaining} Versuch(e).` }
  }, [])

  // ── Unified Login ──────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    const adminRes = await loginAdmin(username, password)
    if (adminRes.ok) return adminRes
    if (adminRes.locked) return adminRes
    return loginMember(username, password)
  }, [loginAdmin, loginMember])

  const logout = useCallback(async () => {
    if (currentUser) await writeLog(LOG.LOGOUT, {}, currentUser.username)
    sessionUser = null
    setCurrentUser(null)
  }, [currentUser])

  const saveSettings = useCallback(async (newSettings, changedFields = []) => {
    await setDoc(doc(db, 'config', 'site'), newSettings, { merge: true })
    await writeLog(LOG.SITE_CHANGED, { changed: changedFields }, currentUser?.username)
  }, [currentUser])

  const saveAdminCreds = useCallback(async (newUsername, newPassword) => {
    const current = (await getDoc(doc(db, 'config', 'adminAuth'))).data() || {}
    const passwordHash = newPassword ? await hashPassword(newPassword) : current.passwordHash
    const username = newUsername || current.username
    await setDoc(doc(db, 'config', 'adminAuth'), {
      username, passwordHash, password: null,
      updatedAt: new Date().toISOString(),
    })
    await writeLog(LOG.ADMIN_CREDS_CHANGED, { newUsername: username }, currentUser?.username)
  }, [currentUser])

  return (
    <AuthContext.Provider value={{
      currentUser, settings, configLoading,
      login, logout, saveSettings, saveAdminCreds,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden')
  return ctx
}
