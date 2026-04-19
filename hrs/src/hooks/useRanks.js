import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { writeLog, LOG } from '../utils/auditLog'
import { useAuth } from '../contexts/AuthContext'

export const DEFAULT_RANKS = [
  { id: 'gildenmeister',  label: 'Gildenmeister',  color: '#c8a84b', level: 1 },
  { id: 'raidleiter',     label: 'Raidleiter',      color: '#c07040', level: 2 },
  { id: 'veteran',        label: 'Veteran',          color: '#8070c0', level: 3 },
  { id: 'mitglied',       label: 'Mitglied',         color: '#508060', level: 4 },
  { id: 'rookie',         label: 'Rookie',           color: '#6a5030', level: 5 },
  { id: 'sozialmitglied', label: 'Sozialmitglied',  color: '#484848', level: 6 },
]

export function useRanks() {
  const [ranks, setRanks] = useState(DEFAULT_RANKS)
  const { currentUser }   = useAuth()
  const by = currentUser?.username || 'admin'

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'ranks'), snap => {
      if (snap.exists() && Array.isArray(snap.data().list)) setRanks(snap.data().list)
    })
    return unsub
  }, [])

  async function saveRanks(newRanks) {
    // Welche Labels haben sich geändert?
    const changed = newRanks
      .filter((r, i) => ranks[i] && r.label !== ranks[i].label)
      .map(r => { const old = ranks.find(x => x.id === r.id); return old ? `"${old.label}" → "${r.label}"` : r.label })

    const normalized = newRanks.map((r, i) => ({ ...r, level: i + 1 }))
    await setDoc(doc(db, 'config', 'ranks'), { list: normalized })
    if (changed.length > 0) await writeLog(LOG.RANK_RENAMED, { changed }, by)
  }

  async function addRank() {
    const newRank = { id: `rang_${Date.now()}`, label: 'Neuer Rang', color: '#606060', level: ranks.length + 1 }
    const updated = [...ranks, newRank]
    await setDoc(doc(db, 'config', 'ranks'), { list: updated })
    await writeLog(LOG.RANK_CREATED, { label: newRank.label }, by)
  }

  async function deleteRank(id) {
    if (ranks.length <= 1) return // Mindestens ein Rang muss bleiben
    const rank = ranks.find(r => r.id === id)
    const updated = ranks.filter(r => r.id !== id).map((r, i) => ({ ...r, level: i + 1 }))
    await setDoc(doc(db, 'config', 'ranks'), { list: updated })
    await writeLog(LOG.RANK_DELETED, { label: rank?.label }, by)
  }

  return { ranks, saveRanks, addRank, deleteRank }
}
