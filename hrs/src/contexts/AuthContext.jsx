import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
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

// Session-Speicher: bleibt nur für diese Browser-Session, kein localStorage
// Das ist sicherer als localStorage weil es beim Tab-Schließen weg ist
let sessionUser = null

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(sessionUser)
  const [settings, setSettings]       = useState(DEFAULT_SETTINGS)
  const [configLoading, setConfigLoading] = useState(true)

  // Einstellungen live aus Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'site'), snap => {
      if (snap.exists()) setSettings(prev => ({ ...prev, ...snap.data() }))
      setConfigLoading(false)
    }, () => setConfigLoading(false))
    return unsub
  }, [])

  const login = useCallback(async (username, password) => {
    // Brute-Force Check
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
      // Passwort wird sicher verglichen (Hash-Vergleich)
      const passwordMatch = data.passwordHash
        ? await verifyPassword(password, data.passwordHash)
        : password === data.password // Fallback für Ersteinrichtung ohne Hash

      if (usernameMatch && passwordMatch) {
        clearLoginAttempts()
        const user = { username, role: 'admin' }
        sessionUser = user
        setCurrentUser(user)
        await writeLog(LOG.LOGIN, { username }, username)
        return { ok: true }
      }
    } catch (err) {
      console.warn('Login-Fehler:', err.message)
    }

    const remaining = recordFailedAttempt()
    await writeLog(LOG.LOGIN_FAILED, { username })
    if (remaining <= 0) {
      return { ok: false, error: 'Zu viele Fehlversuche. Bitte 15 Minuten warten.', locked: true }
    }
    return { ok: false, error: `Zugang verweigert. Noch ${remaining} Versuch(e).` }
  }, [])

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
      username,
      passwordHash,
      // Altes Klartext-Passwort-Feld entfernen falls vorhanden
      password: null,
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
