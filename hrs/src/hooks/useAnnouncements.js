import { useState, useEffect } from 'react'
import { db } from '../firebase'
import {
  collection, query, orderBy, limit,
  onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore'
import { logAudit } from '../utils/auditLog'

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(20)
    )
    const unsub = onSnapshot(q, snap => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  async function addAnnouncement({ title, text, pinned = false, author, authorRank, type = 'info' }) {
    const ref = await addDoc(collection(db, 'announcements'), {
      title, text, pinned, author, authorRank, type,
      createdAt: serverTimestamp(),
    })
    await logAudit('announcement_create', author, { title, pinned })
    return ref.id
  }

  async function updateAnnouncement(id, data, author) {
    await updateDoc(doc(db, 'announcements', id), data)
    await logAudit('announcement_update', author, { id, ...data })
  }

  async function deleteAnnouncement(id, author) {
    await deleteDoc(doc(db, 'announcements', id))
    await logAudit('announcement_delete', author, { id })
  }

  async function togglePin(id, pinned, author) {
    await updateDoc(doc(db, 'announcements', id), { pinned: !pinned })
    await logAudit('announcement_pin', author, { id, pinned: !pinned })
  }

  const pinned  = announcements.filter(a => a.pinned)
  const regular = announcements.filter(a => !a.pinned)

  return { announcements, pinned, regular, loading, addAnnouncement, updateAnnouncement, deleteAnnouncement, togglePin }
}
