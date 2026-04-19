import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { writeLog } from '../utils/auditLog'
import { hashPassword, verifyPassword } from '../utils/security'

// TBC-Berufe mit Spezialisierungen
export const PROFESSIONS = {
  'Schmiedekunst':    ['Keine', 'Waffenschmied', 'Rüstungsschmied'],
  'Lederverarbeitung':['Keine', 'Wildlederspezialist', 'Elementspezialist', 'Drachenspezialist'],
  'Schneiderei':      ['Keine', 'Mondtuchspezialist', 'Schattenweber', 'Spellfire-Spezialist'],
  'Alchemie':         ['Keine', 'Meisterelixirist', 'Meistertrankspezialist', 'Meistertransmutator'],
  'Ingenieurskunst':  ['Keine', 'Gnomische Ingenieurskunst', 'Goblin-Ingenieurskunst'],
  'Verzauberung':     ['Keine'],
  'Juwelenschleifen': ['Keine'],
  'Kräuterkunde':     ['Keine'],
  'Bergbau':          ['Keine'],
  'Kochkunst':        ['Keine'],
  'Angeln':           ['Keine'],
  'Erste Hilfe':      ['Keine'],
}

export const PRIMARY_PROFS   = ['Schmiedekunst','Lederverarbeitung','Schneiderei','Alchemie','Ingenieurskunst','Verzauberung','Juwelenschleifen']
export const SECONDARY_PROFS = ['Kräuterkunde','Bergbau','Kochkunst','Angeln','Erste Hilfe']

// TBC-Rassen pro Fraktion
export const RACES = {
  Allianz: ['Mensch', 'Zwerg', 'Gnome', 'Nachtelfe', 'Draenei'],
  Horde:   ['Orc', 'Troll', 'Untoter', 'Tauren', 'Blutelf'],
}
export const ALL_RACES = [...RACES.Allianz, ...RACES.Horde]

export function useMemberData() {
  const { currentUser } = useAuth()
  const [memberData, setMemberData] = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!currentUser?.id) { setLoading(false); return }
    const unsub = onSnapshot(doc(db, 'users', currentUser.id), snap => {
      if (snap.exists()) setMemberData({ id: snap.id, ...snap.data() })
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [currentUser?.id])

  const setCharacterType = useCallback(async (type) => {
    if (!currentUser?.id) return
    await updateDoc(doc(db, 'users', currentUser.id), { characterType: type })
    await writeLog('MEMBER_CHAR_TYPE', { type }, currentUser.username)
  }, [currentUser])

  const setProfessions = useCallback(async (professions) => {
    if (!currentUser?.id) return
    await updateDoc(doc(db, 'users', currentUser.id), { professions })
    await writeLog('MEMBER_PROFS_UPDATED', { count: professions.length }, currentUser.username)
  }, [currentUser])

  // Rasse und Level speichern
  const setCharacterInfo = useCallback(async ({ race, level }) => {
    if (!currentUser?.id) return
    const update = {}
    if (race  !== undefined) update.race  = race
    if (level !== undefined) update.level = level
    await updateDoc(doc(db, 'users', currentUser.id), update)
    await writeLog('MEMBER_CHAR_INFO_UPDATED', { race, level }, currentUser.username)
  }, [currentUser])

  // Passwort ändern — verifyPassword prüft das alte Passwort zuerst
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!currentUser?.id) return { ok: false, error: 'Nicht eingeloggt.' }
    const snap = await import('firebase/firestore').then(({ getDoc, doc: d }) => getDoc(d(db, 'users', currentUser.id)))
    if (!snap.exists()) return { ok: false, error: 'Benutzerdaten nicht gefunden.' }
    const data = snap.data()
    const valid = data.passwordHash
      ? await verifyPassword(currentPassword, data.passwordHash)
      : currentPassword === data.password
    if (!valid) return { ok: false, error: 'Aktuelles Passwort ist falsch.' }
    if (newPassword.length < 6) return { ok: false, error: 'Neues Passwort muss mind. 6 Zeichen haben.' }
    const passwordHash = await hashPassword(newPassword)
    await updateDoc(doc(db, 'users', currentUser.id), { passwordHash, password: null })
    await writeLog('MEMBER_PW_CHANGED', {}, currentUser.username)
    return { ok: true }
  }, [currentUser])

  // Abwesenheit setzen / löschen
  const setAbsence = useCallback(async (absence) => {
    // absence: { from, until, reason } oder null zum Löschen
    if (!currentUser?.id) return
    await updateDoc(doc(db, 'users', currentUser.id), { absence: absence || null })
    await writeLog('MEMBER_ABSENCE_UPDATED', { absence }, currentUser.username)
  }, [currentUser])

  return {
    memberData, loading,
    setCharacterType, setProfessions,
    setCharacterInfo, changePassword, setAbsence,
  }
}
