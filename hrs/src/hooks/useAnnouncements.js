import { useState, useEffect } from 'react'
import { db } from '../firebase'
import {
  collection, query, orderBy, limit,
  onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore'

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
    await addDoc(collection(db, 'announcements'), {
      title, text, pinned, author, authorRank, type,
      createdAt: serverTimestamp(),
    })
  }

  async function updateAnnouncement(id, data) {
    await updateDoc(doc(db, 'announcements', id), data)
  }

  async function deleteAnnouncement(id) {
    await deleteDoc(doc(db, 'announcements', id))
  }

  async function togglePin(id, pinned) {
    await updateDoc(doc(db, 'announcements', id), { pinned: !pinned })
  }

  const pinned  = announcements.filter(a => a.pinned)
  const regular = announcements.filter(a => !a.pinned)

  return { announcements, pinned, regular, loading, addAnnouncement, updateAnnouncement, deleteAnnouncement, togglePin }
}
