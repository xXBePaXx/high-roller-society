import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { writeLog } from '../utils/auditLog'
import { useAuth } from '../contexts/AuthContext'

export const SHOP_CATEGORIES = [
  { id: 'consumable', label: 'Verbrauchsgut',  icon: '🧪' },
  { id: 'gear',       label: 'Ausrüstung',      icon: '⚔️' },
  { id: 'service',    label: 'Service',          icon: '🔧' },
  { id: 'cosmetic',   label: 'Kosmetisch',       icon: '✨' },
  { id: 'special',    label: 'Speziell',         icon: '🌟' },
]

export function useShop() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()
  const by = currentUser?.username || 'system'

  useEffect(() => {
    const q = query(collection(db, 'shop'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => { console.warn('Shop:', err.message); setLoading(false) })
  }, [])

  const addItem = useCallback(async ({ name, description, price, category, icon, stock, active }) => {
    const ref = await addDoc(collection(db, 'shop'), {
      name:        name.trim(),
      description: description?.trim() || '',
      price:       Math.abs(price),      // in Copper
      category:    category || 'special',
      icon:        icon || '📦',
      stock:       stock ?? -1,          // -1 = unbegrenzt
      active:      active ?? true,
      createdBy:   by,
      createdAt:   serverTimestamp(),
    })
    await writeLog('SHOP_ITEM_CREATED', { name, price }, by)
    return ref.id
  }, [by])

  const updateItem = useCallback(async (id, data) => {
    await updateDoc(doc(db, 'shop', id), { ...data, updatedAt: serverTimestamp() })
    await writeLog('SHOP_ITEM_UPDATED', { id, ...data }, by)
  }, [by])

  const deleteItem = useCallback(async (id) => {
    await deleteDoc(doc(db, 'shop', id))
    await writeLog('SHOP_ITEM_DELETED', { id }, by)
  }, [by])

  const toggleActive = useCallback(async (id, current) => {
    await updateDoc(doc(db, 'shop', id), { active: !current, updatedAt: serverTimestamp() })
  }, [])

  // Lager reduzieren nach Kauf
  const decreaseStock = useCallback(async (id, current) => {
    if (current <= 0) return false
    await updateDoc(doc(db, 'shop', id), { stock: current - 1, updatedAt: serverTimestamp() })
    return true
  }, [])

  const activeItems = items.filter(i => i.active && (i.stock === -1 || i.stock > 0))

  return {
    items, activeItems, loading,
    addItem, updateItem, deleteItem, toggleActive, decreaseStock,
  }
}
