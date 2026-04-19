import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp, getDoc, getDocs, writeBatch
} from 'firebase/firestore'
import { writeLog } from '../utils/auditLog'
import { useAuth } from '../contexts/AuthContext'

// Transaktions-Typen
export const DKP_TYPES = {
  RAID_ATTENDANCE: { label: 'Raid-Teilnahme',   icon: '⚔️',  color: '#4a9a5a', sign: +1 },
  LOOT:           { label: 'Loot gekauft',       icon: '🎁',  color: '#C41E3A', sign: -1 },
  BONUS:          { label: 'Bonus',              icon: '⭐',  color: '#c8a84b', sign: +1 },
  PENALTY:        { label: 'Abzug',              icon: '⚠️',  color: '#c07040', sign: -1 },
  MANUAL:         { label: 'Manuelle Anpassung', icon: '✏️',  color: '#8788EE', sign: +1 },
  RESET:          { label: 'Reset',              icon: '🔄',  color: '#5a4828', sign:  0 },
}

export function useDKP() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  const { currentUser }                 = useAuth()
  const by = currentUser?.username || 'system'

  useEffect(() => {
    const q = query(collection(db, 'dkp'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => {
      console.warn('DKP-Ladefehler:', err.message)
      setLoading(false)
    })
    return unsub
  }, [])

  // DKP-Stand eines Users berechnen
  function getBalance(userId) {
    return transactions
      .filter(t => t.userId === userId)
      .reduce((sum, t) => {
        const type = DKP_TYPES[t.type]
        if (!type || t.type === 'RESET') return 0 // Reset setzt auf 0
        return sum + (t.amount * type.sign)
      }, 0)
  }

  // Alle User-Balances als Map { userId → balance }
  function getAllBalances(users) {
    const balances = {}
    users.forEach(u => { balances[u.id] = 0 })

    // Chronologisch verarbeiten (älteste zuerst)
    const sorted = [...transactions].reverse()
    sorted.forEach(t => {
      if (!(t.userId in balances)) return
      if (t.type === 'RESET') {
        balances[t.userId] = 0
      } else {
        const type = DKP_TYPES[t.type]
        if (type) balances[t.userId] += t.amount * type.sign
      }
    })
    return balances
  }

  // Transaktion für einen einzelnen User
  const addTransaction = useCallback(async ({ userId, username, type, amount, reason, eventId, eventTitle }) => {
    const ref = await addDoc(collection(db, 'dkp'), {
      userId, username, type,
      amount:     Math.abs(amount),
      reason:     reason?.trim() || '',
      eventId:    eventId    || null,
      eventTitle: eventTitle || null,
      createdBy:  by,
      createdAt:  serverTimestamp(),
    })
    await writeLog('DKP_TRANSACTION', { userId, username, type, amount, reason }, by)
    return ref.id
  }, [by])

  // Raid-Attendance: mehrere User auf einmal (typischer Use-Case)
  const addRaidAttendance = useCallback(async ({ userIds, users, amount, eventId, eventTitle, reason }) => {
    const batch = writeBatch(db)
    const logEntries = []

    for (const userId of userIds) {
      const user = users.find(u => u.id === userId)
      if (!user) continue
      const ref = doc(collection(db, 'dkp'))
      batch.set(ref, {
        userId, username: user.name,
        type: 'RAID_ATTENDANCE',
        amount: Math.abs(amount),
        reason: reason?.trim() || eventTitle || 'Raid-Teilnahme',
        eventId:    eventId    || null,
        eventTitle: eventTitle || null,
        createdBy:  by,
        createdAt:  serverTimestamp(),
      })
      logEntries.push(user.name)
    }

    await batch.commit()
    await writeLog('DKP_RAID_ATTENDANCE', { users: logEntries, amount, eventTitle }, by)
  }, [by])

  // Loot-Eintrag
  const addLoot = useCallback(async ({ userId, username, amount, item, eventId, eventTitle }) => {
    const ref = await addDoc(collection(db, 'dkp'), {
      userId, username,
      type:   'LOOT',
      amount: Math.abs(amount),
      reason: item?.trim() || 'Loot',
      eventId:    eventId    || null,
      eventTitle: eventTitle || null,
      createdBy:  by,
      createdAt:  serverTimestamp(),
    })
    await writeLog('DKP_LOOT', { userId, username, amount, item }, by)
    return ref.id
  }, [by])

  // Reset für einen User
  const resetUser = useCallback(async (userId, username) => {
    await addDoc(collection(db, 'dkp'), {
      userId, username,
      type: 'RESET', amount: 0,
      reason: 'DKP-Reset durch Admin',
      createdBy: by, createdAt: serverTimestamp(),
    })
    await writeLog('DKP_RESET', { userId, username }, by)
  }, [by])

  // Transaktion löschen (Admin-Korrektur)
  const deleteTransaction = useCallback(async (id) => {
    await deleteDoc(doc(db, 'dkp', id))
    await writeLog('DKP_DELETE', { id }, by)
  }, [by])

  return {
    transactions, loading,
    getBalance, getAllBalances,
    addTransaction, addRaidAttendance, addLoot,
    resetUser, deleteTransaction,
  }
}
