import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { writeLog, LOG } from '../utils/auditLog'

// TBC-Berufe mit Spezialisierungen
export const PROFESSIONS = {
  'Schmiedekunst': ['Keine', 'Waffenschmied', 'Rüstungsschmied'],
  'Lederverarbeitung': ['Keine', 'Wildlederspezialist', 'Elementspezialist', 'Drachenspezialist'],
  'Schneiderei': ['Keine', 'Mondtuchspezialist', 'Schattenweber', 'Spellfire-Spezialist'],
  'Alchemie': ['Keine', 'Meisterelixirist', 'Meistertrankspezialist', 'Meistertransmutator'],
  'Ingenieurskunst': ['Keine', 'Gnomische Ingenieurskunst', 'Goblin-Ingenieurskunst'],
  'Verzauberung': ['Keine'],
  'Juwelenschleifen': ['Keine'],
  'Kräuterkunde': ['Keine'],
  'Bergbau': ['Keine'],
  'Kochkunst': ['Keine'],
  'Angeln': ['Keine'],
  'Erste Hilfe': ['Keine'],
}

export const PRIMARY_PROFS = ['Schmiedekunst','Lederverarbeitung','Schneiderei','Alchemie','Ingenieurskunst','Verzauberung','Juwelenschleifen']
export const SECONDARY_PROFS = ['Kräuterkunde','Bergbau','Kochkunst','Angeln','Erste Hilfe']

export function useMemberData() {
  const { currentUser } = useAuth()
  const [memberData, setMemberData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser?.id) { setLoading(false); return }
    const unsub = onSnapshot(doc(db, 'users', currentUser.id), snap => {
      if (snap.exists()) setMemberData({ id: snap.id, ...snap.data() })
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [currentUser?.id])

  const setCharacterType = useCallback(async (type) => {
    // type: 'main' | 'twink'
    if (!currentUser?.id) return
    await updateDoc(doc(db, 'users', currentUser.id), { characterType: type })
    await writeLog('MEMBER_CHAR_TYPE', { type }, currentUser.username)
  }, [currentUser])

  const setProfessions = useCallback(async (professions) => {
    // professions: [{ name, level, specialization }]
    if (!currentUser?.id) return
    await updateDoc(doc(db, 'users', currentUser.id), { professions })
    await writeLog('MEMBER_PROFS_UPDATED', { count: professions.length }, currentUser.username)
  }, [currentUser])

  return { memberData, loading, setCharacterType, setProfessions }
}
