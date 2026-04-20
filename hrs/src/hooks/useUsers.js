import { useState, useEffect } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp, query, orderBy, arrayUnion, arrayRemove
} from 'firebase/firestore'
import { writeLog, LOG } from '../utils/auditLog'
import { hashPassword } from '../utils/security'
import { useAuth } from '../contexts/AuthContext'

export function useUsers() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()
  const by = currentUser?.username || 'admin'

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => { console.warn('Benutzer-Ladefehler:', err.message); setLoading(false) })
    return unsub
  }, [])

  // ── Benutzer anlegen (neues System: username + erster Charakter) ───────────
  async function addUser({ username, password, rank, cls, charName, note = '' }) {
    if (!username?.trim()) throw new Error('Kein Benutzername angegeben')
    if (!charName?.trim()) throw new Error('Kein Charaktername angegeben')
    if (!password)         throw new Error('Kein Passwort angegeben')

    const passwordHash = await hashPassword(password)
    const firstChar = {
      name:          charName.trim(),
      cls:           cls || 'Warrior',
      race:          '',
      level:         70,
      characterType: 'main',
      professions:   [],
      absence:       null,
    }

    const ref = await addDoc(collection(db, 'users'), {
      // Login-Daten
      username:      username.trim(),
      usernameLower: username.trim().toLowerCase(),
      // Rückwärtskompatibilität (altes System)
      name:          charName.trim(),
      nameLower:     charName.trim().toLowerCase(),
      passwordHash,
      rank, note,
      active:        true,
      // Neues Charakter-System
      characters:    [firstChar],
      createdAt:     serverTimestamp(),
      createdBy:     by,
    })
    await writeLog(LOG.USER_CREATED, { username: username.trim(), charName: charName.trim(), rank, cls }, by)
    return ref.id
  }

  async function deleteUser(id) {
    const user = users.find(u => u.id === id)
    await deleteDoc(doc(db, 'users', id))
    await writeLog(LOG.USER_DELETED, { username: user?.username || user?.name }, by)
  }

  async function toggleActive(id) {
    const user = users.find(u => u.id === id)
    const newStatus = !user?.active
    await updateDoc(doc(db, 'users', id), { active: newStatus, updatedAt: serverTimestamp() })
    await writeLog(LOG.USER_STATUS_CHANGED, { name: user?.username || user?.name, to: newStatus ? 'aktiv' : 'inaktiv' }, by)
  }

  async function updateNote(id, note) {
    await updateDoc(doc(db, 'users', id), { note, updatedAt: serverTimestamp() })
  }

  // ── Charakter in characters-Array updaten ─────────────────────────────────
  async function updateCharacter(userId, charIdx, charData) {
    const user = users.find(u => u.id === userId)
    if (!user) throw new Error('User nicht gefunden')
    const chars = [...(user.characters || [])]
    chars[charIdx] = { ...chars[charIdx], ...charData }
    await updateDoc(doc(db, 'users', userId), { characters: chars, updatedAt: serverTimestamp() })
    await writeLog('CHAR_UPDATED', { username: user.username || user.name, charIdx }, by)
  }

  // ── Rang, Klasse für altes System ─────────────────────────────────────────
  async function updateRank(id, newRank) {
    const user = users.find(u => u.id === id)
    await updateDoc(doc(db, 'users', id), { rank: newRank, updatedAt: serverTimestamp() })
    await writeLog(LOG.USER_RANK_CHANGED, { name: user?.name, from: user?.rank, to: newRank }, by)
  }

  async function updateClass(id, newCls) {
    const user = users.find(u => u.id === id)
    await updateDoc(doc(db, 'users', id), { cls: newCls, updatedAt: serverTimestamp() })
  }

  async function updatePassword(id, newPassword) {
    if (!newPassword) throw new Error('Kein Passwort')
    const passwordHash = await hashPassword(newPassword)
    await updateDoc(doc(db, 'users', id), { passwordHash, password: null, updatedAt: serverTimestamp() })
    const user = users.find(u => u.id === id)
    await writeLog(LOG.USER_PW_CHANGED, { name: user?.username || user?.name }, by)
  }

  // ── Hilfsfunktion: alle sichtbaren Charaktere aus allen Usern ─────────────
  // Gibt flache Liste: { userId, charIdx, name, cls, race, ... }
  function getAllCharacters() {
    const result = []
    for (const user of users) {
      if (!user.active) continue
      if (user.characters && user.characters.length > 0) {
        user.characters.forEach((char, idx) => {
          result.push({
            userId:    user.id,
            charIdx:   idx,
            username:  user.username || user.name,
            rank:      user.rank,
            ...char,
          })
        })
      } else {
        // Altes System Fallback
        result.push({
          userId:        user.id,
          charIdx:       null,
          username:      user.name,
          name:          user.name,
          rank:          user.rank,
          cls:           user.cls,
          race:          user.race,
          level:         user.level,
          characterType: user.characterType || 'main',
          professions:   user.professions || [],
          absence:       user.absence || null,
        })
      }
    }
    return result
  }

  return {
    users, loading,
    addUser, deleteUser, toggleActive, updateNote,
    updateRank, updateClass, updatePassword,
    updateCharacter, getAllCharacters,
  }
}
