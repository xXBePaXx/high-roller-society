import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore'
import { writeLog, LOG } from '../utils/auditLog'
import {
  hashPassword, verifyPassword,
  isLockedOut, recordFailedAttempt,
  clearLoginAttempts, getLockoutRemaining
} from '../utils/security'

const AuthContext = createContext(null)

const DEFAULT_SETTINGS = {
  guildName1: 'High Roller', guildName2: 'Society',
  guildSub:   'Raiding Guild · Spineshatter EU',
  realm:      'World of Warcraft · TBC Classic',
  tagline:    'Wir raiden. Wir verdienen. Wir gewinnen.\nTritt ein — wenn du bereit bist.',
  footer:     'Deutsche Gilde · Progression Raiding · Vollversorgung',
  server:     'Spineshatter · EU · PvP',
  emoji:      '🎰',
  stat1n: '25', stat1l: 'Raider',
  stat2n: '2×', stat2l: 'Raids/Woche',
  stat3n: 'T6', stat3l: 'Progress',
}

const DEFAULT_MEMBER_PERMISSIONS = {
  canManageEvents: false, canSignupEvents: false,
  canViewCalendar: false, canViewRoster: false,
}

let sessionUser = null

export function AuthProvider({ children }) {
  const [currentUser,    setCurrentUser]    = useState(sessionUser)
  const [settings,       setSettings]       = useState(DEFAULT_SETTINGS)
  const [configLoading,  setConfigLoading]  = useState(true)
  // Charakter-Auswahl: gesetzt wenn User mehrere Charaktere hat und noch keinen gewählt hat
  const [pendingAccount, setPendingAccount] = useState(null) // { accountId, username, characters, rank, permissions }

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'site'), snap => {
      if (snap.exists()) setSettings(prev => ({ ...prev, ...snap.data() }))
      setConfigLoading(false)
    }, () => setConfigLoading(false))
    return unsub
  }, [])

  async function loadRankPermissions(rankLabel) {
    try {
      const snap = await getDoc(doc(db, 'config', 'ranks'))
      if (snap.exists() && Array.isArray(snap.data().list)) {
        const rank = snap.data().list.find(r => r.label === rankLabel)
        if (rank?.permissions) return rank.permissions
      }
    } catch (e) { console.warn('Rang-Rechte:', e.message) }
    return DEFAULT_MEMBER_PERMISSIONS
  }

  // ── Admin Login ────────────────────────────────────────────────────────────
  const loginAdmin = useCallback(async (username, password) => {
    if (isLockedOut()) {
      const secs = getLockoutRemaining()
      return { ok: false, error: `Zu viele Fehlversuche. Bitte ${Math.ceil(secs/60)} Minute(n) warten.`, locked: true }
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
        sessionUser = user; setCurrentUser(user)
        await writeLog(LOG.LOGIN, { username }, username)
        return { ok: true }
      }
    } catch (err) { console.warn('Admin-Login:', err.message) }
    const remaining = recordFailedAttempt()
    if (remaining <= 0) return { ok: false, error: 'Zu viele Fehlversuche.', locked: true }
    return { ok: false, error: `Zugang verweigert. Noch ${remaining} Versuch(e).` }
  }, [])

  // ── Member Login ───────────────────────────────────────────────────────────
  const loginMember = useCallback(async (username, password) => {
    if (isLockedOut()) {
      const secs = getLockoutRemaining()
      return { ok: false, error: `Zu viele Fehlversuche. Bitte ${Math.ceil(secs/60)} Minute(n) warten.`, locked: true }
    }
    try {
      // Suche nach username (neues System) oder name (altes System, Fallback)
      let userDoc = null
      let data    = null

      // Neues System: Suche nach usernameLower
      const q1 = query(collection(db, 'users'), where('usernameLower', '==', username.toLowerCase()))
      const snap1 = await getDocs(q1)
      if (!snap1.empty) { userDoc = snap1.docs[0]; data = userDoc.data() }

      // Altes System Fallback: Suche nach nameLower (für bestehende Accounts)
      if (!userDoc) {
        const q2 = query(collection(db, 'users'), where('nameLower', '==', username.toLowerCase()))
        const snap2 = await getDocs(q2)
        if (!snap2.empty) { userDoc = snap2.docs[0]; data = userDoc.data() }
      }

      if (userDoc && data) {
        if (!data.active) return { ok: false, error: 'Dein Account ist deaktiviert.' }

        const passwordMatch = data.passwordHash
          ? await verifyPassword(password, data.passwordHash)
          : password === data.password

        if (passwordMatch) {
          clearLoginAttempts()

          // Charaktere laden — neues System hat characters-Array
          // Altes System: einzelner Charakter aus top-level Feldern rekonstruieren
          let characters = data.characters || null
          if (!characters || characters.length === 0) {
            // Altes System — einzelnen Charakter aus Feldern bauen
            characters = [{
              name:          data.name,
              cls:           data.cls || 'Warrior',
              race:          data.race || '',
              level:         data.level || 70,
              characterType: data.characterType || 'main',
              professions:   data.professions || [],
              absence:       data.absence || null,
              rank:          data.rank, // Rang auch pro Charakter
            }]
          }

          // Sicherstellen dass jeder Charakter einen Rang hat
          characters = characters.map(char => ({
            ...char,
            rank: char.rank || data.rank,
          }))

          // Permissions für den Account-Rang laden (Fallback)
          const accountPermissions = await loadRankPermissions(data.rank)

          if (characters.length > 1) {
            // Mehrere Charaktere → Auswahl nötig
            setPendingAccount({
              accountId:        userDoc.id,
              username:         data.username || data.name,
              rank:             data.rank,
              accountPermissions,
              characters,
            })
            await writeLog(LOG.LOGIN, { username: data.username || data.name, step: 'char-select' }, data.username || data.name)
            return { ok: true, needsCharSelect: true }
          }

          // Einzelner Charakter → direkt einloggen
          const char = characters[0]
          const charPerms = char.rank ? await loadRankPermissions(char.rank) : accountPermissions
          const user = {
            id:            userDoc.id,
            username:      data.username || data.name,
            role:          'member',
            rank:          char.rank || data.rank,
            cls:           char.cls,
            race:          char.race,
            permissions:   charPerms,
            characters,
            activeCharIdx: 0,
            activeChar:    char,
          }
          sessionUser = user; setCurrentUser(user)
          await writeLog(LOG.LOGIN, { username: user.username, role: 'member' }, user.username)
          return { ok: true }
        }
      }
    } catch (err) { console.warn('Member-Login:', err.message) }
    const remaining = recordFailedAttempt()
    if (remaining <= 0) return { ok: false, error: 'Zu viele Fehlversuche.', locked: true }
    return { ok: false, error: `Zugang verweigert. Noch ${remaining} Versuch(e).` }
  }, [])

  // ── Charakter auswählen — funktioniert beim Login UND mid-session ──────────
  const selectCharacter = useCallback(async (charIdx) => {
    // Nach Login (pendingAccount gesetzt)
    if (pendingAccount) {
      const char = pendingAccount.characters[charIdx]
      const charRank = char.rank || pendingAccount.rank
      const permissions = char.rank
        ? await loadRankPermissions(char.rank)
        : pendingAccount.accountPermissions
      const user = {
        id:            pendingAccount.accountId,
        username:      pendingAccount.username,
        role:          'member',
        rank:          charRank,
        cls:           char.cls,
        race:          char.race,
        permissions,
        characters:    pendingAccount.characters,
        activeCharIdx: charIdx,
        activeChar:    char,
      }
      sessionUser = user; setCurrentUser(user)
      setPendingAccount(null)
      return
    }
    // Mid-session (aus dem Dashboard-Dropdown)
    if (currentUser?.characters) {
      const char = currentUser.characters[charIdx]
      const charRank = char.rank || currentUser.rank
      const permissions = char.rank
        ? await loadRankPermissions(char.rank)
        : currentUser.permissions
      const user = {
        ...currentUser,
        rank:          charRank,
        cls:           char.cls,
        race:          char.race,
        permissions,
        activeCharIdx: charIdx,
        activeChar:    char,
      }
      sessionUser = user; setCurrentUser(user)
    }
  }, [pendingAccount, currentUser])

  const cancelCharSelect = useCallback(() => setPendingAccount(null), [])

  // ── Unified Login ──────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    const adminRes = await loginAdmin(username, password)
    if (adminRes.ok || adminRes.locked) return adminRes
    return loginMember(username, password)
  }, [loginAdmin, loginMember])

  const logout = useCallback(async () => {
    if (currentUser) await writeLog(LOG.LOGOUT, {}, currentUser.username)
    sessionUser = null; setCurrentUser(null); setPendingAccount(null)
  }, [currentUser])

  const saveSettings = useCallback(async (newSettings, changedFields = []) => {
    await setDoc(doc(db, 'config', 'site'), newSettings, { merge: true })
    await writeLog(LOG.SITE_CHANGED, { changed: changedFields }, currentUser?.username)
  }, [currentUser])

  const saveAdminCreds = useCallback(async (newUsername, newPassword) => {
    const current = (await getDoc(doc(db, 'config', 'adminAuth'))).data() || {}
    const passwordHash = newPassword ? await hashPassword(newPassword) : current.passwordHash
    const username = newUsername || current.username
    await setDoc(doc(db, 'config', 'adminAuth'), { username, passwordHash, password: null, updatedAt: new Date().toISOString() })
    await writeLog(LOG.ADMIN_CREDS_CHANGED, { newUsername: username }, currentUser?.username)
  }, [currentUser])

  return (
    <AuthContext.Provider value={{
      currentUser, settings, configLoading,
      pendingAccount,
      login, logout, selectCharacter, cancelCharSelect,
      saveSettings, saveAdminCreds,
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
