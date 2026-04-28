import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, updateDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp, where
} from 'firebase/firestore'
import { writeLog } from '../utils/auditLog'
import { useAuth } from '../contexts/AuthContext'

// Status-Definitionen
export const ORDER_STATUS = {
  pending:          { label: 'Offen',               icon: '🟡', color: '#c8a84b' },
  delivered:        { label: 'Ausgegeben',           icon: '✅', color: '#4a9a5a' },
  cancelled:        { label: 'Storniert',            icon: '❌', color: '#c04040' },
  cancel_requested: { label: 'Stornierung beantragt',icon: '🔄', color: '#e87830' },
}

// Lieferarten (pro Item beim Anlegen festgelegt)
export const DELIVERY_TYPES = [
  { id: 'ingame',   label: 'Ingame',    icon: '🎮', desc: 'Per Handelsfenster oder ingame Post' },
  { id: 'postal',   label: 'Postalisch',icon: '📬', desc: 'Physisch per Post (Adresse nötig)' },
  { id: 'service',  label: 'Service',   icon: '⚡', desc: 'Wird direkt erbracht (z.B. Boost)' },
  { id: 'both',     label: 'Beides',    icon: '🎁', desc: 'Ingame oder postalisch möglich' },
]

export function useOrders() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()
  const by = currentUser?.username || 'system'

  // Alle Bestellungen live laden (Admin sieht alle, Member nur eigene)
  useEffect(() => {
    const q = currentUser?.role === 'admin'
      ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'orders'), where('userId', '==', currentUser?.id || ''), orderBy('createdAt', 'desc'))

    return onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => { console.warn('Orders:', err.message); setLoading(false) })
  }, [currentUser?.role, currentUser?.id])

  // Bestellung erstellen
  const createOrder = useCallback(async ({ userId, username, itemId, itemName, itemIcon, price, deliveryType, note }) => {
    const ref = await addDoc(collection(db, 'orders'), {
      userId, username,
      itemId, itemName, itemIcon,
      price,
      deliveryType: deliveryType || 'ingame',
      note:         note?.trim() || '',
      status:       'pending',
      createdAt:    serverTimestamp(),
      updatedAt:    serverTimestamp(),
      deliveredAt:  null,
      cancelledAt:  null,
      adminNote:    '',
    })
    await writeLog('ORDER_CREATED', { userId, username, itemName, price }, by)
    return ref.id
  }, [by])

  // Admin: als ausgegeben markieren
  const markDelivered = useCallback(async (orderId, adminNote = '') => {
    await updateDoc(doc(db, 'orders', orderId), {
      status:      'delivered',
      deliveredAt: serverTimestamp(),
      updatedAt:   serverTimestamp(),
      adminNote:   adminNote.trim(),
    })
    await writeLog('ORDER_DELIVERED', { orderId, adminNote }, by)
  }, [by])

  // Admin: Stornierung genehmigen
  const confirmCancel = useCallback(async (orderId) => {
    await updateDoc(doc(db, 'orders', orderId), {
      status:      'cancelled',
      cancelledAt: serverTimestamp(),
      updatedAt:   serverTimestamp(),
    })
    await writeLog('ORDER_CANCELLED', { orderId }, by)
  }, [by])

  // User: sofort stornieren (innerhalb 3 Min)
  const cancelImmediate = useCallback(async (orderId) => {
    await updateDoc(doc(db, 'orders', orderId), {
      status:      'cancelled',
      cancelledAt: serverTimestamp(),
      updatedAt:   serverTimestamp(),
    })
    await writeLog('ORDER_SELF_CANCELLED', { orderId }, by)
  }, [by])

  // User: Stornierungsanfrage stellen (nach 3 Min)
  const requestCancel = useCallback(async (orderId) => {
    await updateDoc(doc(db, 'orders', orderId), {
      status:    'cancel_requested',
      updatedAt: serverTimestamp(),
    })
    await writeLog('ORDER_CANCEL_REQUESTED', { orderId }, by)
  }, [by])

  // User: Notiz aktualisieren
  const updateNote = useCallback(async (orderId, note) => {
    await updateDoc(doc(db, 'orders', orderId), {
      note:      note.trim(),
      updatedAt: serverTimestamp(),
    })
  }, [])

  // Hilfsfunktion: Kann noch sofort storniert werden? (innerhalb 3 Min)
  function canSelfCancel(order) {
    if (!order.createdAt) return false
    const created = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt)
    return (Date.now() - created.getTime()) < 3 * 60 * 1000
  }

  // Offene Bestellungen (für Admin-Badge)
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'cancel_requested').length

  return {
    orders, loading, pendingCount,
    createOrder, markDelivered, confirmCancel,
    cancelImmediate, requestCancel, updateNote,
    canSelfCancel,
  }
}
