import { useState, useEffect } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { writeLog, LOG } from '../utils/auditLog'
import { hashPassword } from '../utils/security'
import { useAuth } from '../contexts/AuthContext'

export function useUsers() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const { currentUser }       = useAuth()
  const by = currentUser?.username || 'admin'

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => {
      console.warn('Benutzer-Ladefehler:', err.message)
      setLoading(false)
    })
    return unsub
  }, [])

  async function addUser({ name, password, rank, cls, note = '' }) {
    if (!name?.trim()) throw new Error('Kein Charaktername angegeben')
    if (!password)     throw new Error('Kein Passwort angegeben')

    const passwordHash = await hashPassword(password) // Nie Klartext speichern!
    const ref = await addDoc(collection(db, 'users'), {
      name: name.trim(),
      passwordHash,  // gehashtes Passwort
      rank, cls, note,
      active: true,
      createdAt: serverTimestamp(),
      createdBy: by,
    })
    await writeLog(LOG.USER_CREATED, { name: name.trim(), rank, cls }, by)
    return ref.id
  }

  async function deleteUser(id) {
    const user = users.find(u => u.id === id)
    await deleteDoc(doc(db, 'users', id))
    await writeLog(LOG.USER_DELETED, { name: user?.name, rank: user?.rank }, by)
  }

  async function updateRank(id, newRank) {
    const user = users.find(u => u.id === id)
    await updateDoc(doc(db, 'users', id), { rank: newRank, updatedAt: serverTimestamp() })
    await writeLog(LOG.USER_RANK_CHANGED, { name: user?.name, from: user?.rank, to: newRank }, by)
  }

  async function updateClass(id, newCls) {
    const user = users.find(u => u.id === id)
    await updateDoc(doc(db, 'users', id), { cls: newCls, updatedAt: serverTimestamp() })
    await writeLog(LOG.USER_CLASS_CHANGED, { name: user?.name, from: user?.cls, to: newCls }, by)
  }

  async function toggleActive(id) {
    const user = users.find(u => u.id === id)
    const newStatus = !user?.active
    await updateDoc(doc(db, 'users', id), { active: newStatus, updatedAt: serverTimestamp() })
    await writeLog(LOG.USER_STATUS_CHANGED, { name: user?.name, to: newStatus ? 'aktiv' : 'inaktiv' }, by)
  }

  async function updateNote(id, note) {
    const user = users.find(u => u.id === id)
    await updateDoc(doc(db, 'users', id), { note, updatedAt: serverTimestamp() })
    await writeLog(LOG.USER_NOTE_CHANGED, { name: user?.name }, by)
  }

  async function updatePassword(id, newPassword) {
    const user = users.find(u => u.id === id)
    if (!newPassword) throw new Error('Kein neues Passwort angegeben')
    const passwordHash = await hashPassword(newPassword)
    await updateDoc(doc(db, 'users', id), { passwordHash, updatedAt: serverTimestamp() })
    await writeLog(LOG.USER_PW_CHANGED, { name: user?.name }, by)
  }

  return {
    users, loading,
    addUser, deleteUser, updateRank, updateClass,
    toggleActive, updateNote, updatePassword
  }
}
