import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { writeLog } from '../utils/auditLog'
import { hashPassword, verifyPassword } from '../utils/security'

export const PROFESSIONS = {
  'Schmiedekunst':    ['Keine','Waffenschmied','Rüstungsschmied'],
  'Lederverarbeitung':['Keine','Wildlederspezialist','Elementspezialist','Drachenspezialist'],
  'Schneiderei':      ['Keine','Mondtuchspezialist','Schattenweber','Spellfire-Spezialist'],
  'Alchemie':         ['Keine','Meisterelixirist','Meistertrankspezialist','Meistertransmutator'],
  'Ingenieurskunst':  ['Keine','Gnomische Ingenieurskunst','Goblin-Ingenieurskunst'],
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

export const RACES = {
  Allianz: ['Mensch','Zwerg','Gnome','Nachtelfe','Draenei'],
  Horde:   ['Orc','Troll','Untoter','Tauren','Blutelf'],
}
export const ALL_RACES = [...RACES.Allianz, ...RACES.Horde]

export function useMemberData() {
  const { currentUser } = useAuth()
  const [accountData, setAccountData] = useState(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!currentUser?.id) { setLoading(false); return }
    const unsub = onSnapshot(doc(db, 'users', currentUser.id), snap => {
      if (snap.exists()) setAccountData({ id: snap.id, ...snap.data() })
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [currentUser?.id])

  // Aktiver Charakter-Index
  const charIdx = currentUser?.activeCharIdx ?? 0

  // Aktiver Charakter aus dem Firestore-Dokument
  const memberData = accountData
    ? (accountData.characters?.[charIdx]
        ? {
            // Charakter-Felder
            ...accountData.characters[charIdx],
            // Account-Felder
            id:       accountData.id,
            username: accountData.username || accountData.name,
            name:     accountData.characters[charIdx].name,
            rank:     accountData.rank,
            active:   accountData.active,
            createdAt:accountData.createdAt,
            // Alle Charaktere des Accounts
            allCharacters: accountData.characters,
            charIdx,
          }
        : {
            // Altes System Fallback
            ...accountData,
            username: accountData.name,
          }
      )
    : null

  // ── Charakter-Felder updaten ───────────────────────────────────────────────
  async function updateActiveChar(fields) {
    if (!currentUser?.id || !accountData) return
    const chars = [...(accountData.characters || [])]
    chars[charIdx] = { ...chars[charIdx], ...fields }
    await updateDoc(doc(db, 'users', currentUser.id), { characters: chars })
  }

  const setCharacterType = useCallback(async (type) => {
    await updateActiveChar({ characterType: type })
    await writeLog('MEMBER_CHAR_TYPE', { type, charIdx }, currentUser?.username)
  }, [currentUser, accountData, charIdx])

  const setProfessions = useCallback(async (professions) => {
    await updateActiveChar({ professions })
    await writeLog('MEMBER_PROFS_UPDATED', { count: professions.length }, currentUser?.username)
  }, [currentUser, accountData, charIdx])

  const setCharacterInfo = useCallback(async ({ race, level }) => {
    const update = {}
    if (race  !== undefined) update.race  = race
    if (level !== undefined) update.level = level
    await updateActiveChar(update)
    await writeLog('MEMBER_CHAR_INFO_UPDATED', { race, level }, currentUser?.username)
  }, [currentUser, accountData, charIdx])

  const setAbsence = useCallback(async (absence) => {
    await updateActiveChar({ absence: absence || null })
    await writeLog('MEMBER_ABSENCE_UPDATED', { absence }, currentUser?.username)
  }, [currentUser, accountData, charIdx])

  // ── Passwort ändern (Account-Ebene) ───────────────────────────────────────
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!currentUser?.id) return { ok: false, error: 'Nicht eingeloggt.' }
    const snap = await getDoc(doc(db, 'users', currentUser.id))
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

  return {
    memberData, loading,
    accountData,
    setCharacterType, setProfessions,
    setCharacterInfo, changePassword, setAbsence,
  }
}
