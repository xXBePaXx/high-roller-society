import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp, arrayUnion, arrayRemove
} from 'firebase/firestore'
import { writeLog } from '../utils/auditLog'
import { useAuth } from '../contexts/AuthContext'

export const EVENT_TYPES = [
  { id: 'raid',        label: 'Raid',         icon: '⚔️',  color: '#c8a84b' },
  { id: 'heroic',      label: 'Heroic-Run',   icon: '🏰',  color: '#8788EE' },
  { id: 'pvp',         label: 'PvP',          icon: '🛡️',  color: '#C41E3A' },
  { id: 'socialEvent', label: 'Gilden-Event', icon: '🎰',  color: '#FF7C0A' },
  { id: 'other',       label: 'Sonstiges',    icon: '📌',  color: '#508060' },
]

export const ROLES = [
  { id: 'tank',  label: 'Tank',   icon: '🛡️' },
  { id: 'heal',  label: 'Heiler', icon: '💚' },
  { id: 'dps',   label: 'DPS',    icon: '⚔️' },
]

export function useEvents() {
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)
  const { currentUser }       = useAuth()
  const by = currentUser?.username || 'system'

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('eventDate', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => {
      console.warn('Events-Ladefehler:', err.message)
      setLoading(false)
    })
    return unsub
  }, [])

  const createEvent = useCallback(async ({ title, type, eventDate, eventTime, description, maxSignups }) => {
    const ref = await addDoc(collection(db, 'events'), {
      title:       title.trim(),
      type,
      eventDate,
      eventTime,
      description: description?.trim() || '',
      maxSignups:  maxSignups || 0,
      signups:     [],
      createdBy:   by,
      createdAt:   serverTimestamp(),
    })
    await writeLog('EVENT_CREATED', { title: title.trim(), type, eventDate }, by)
    return ref.id
  }, [by])

  const deleteEvent = useCallback(async (id) => {
    const event = events.find(e => e.id === id)
    await deleteDoc(doc(db, 'events', id))
    await writeLog('EVENT_DELETED', { title: event?.title }, by)
  }, [events, by])

  const updateEvent = useCallback(async (id, changes) => {
    await updateDoc(doc(db, 'events', id), { ...changes, updatedAt: serverTimestamp() })
    await writeLog('EVENT_UPDATED', { id, changes: Object.keys(changes) }, by)
  }, [by])

  const removeSignup = useCallback(async (eventId, signup) => {
    await updateDoc(doc(db, 'events', eventId), { signups: arrayRemove(signup) })
    await writeLog('EVENT_SIGNUP_REMOVED', { eventId, username: signup.username }, by)
  }, [by])

  const changeSignupRole = useCallback(async (eventId, oldSignup, newRole) => {
    const updatedSignup = { ...oldSignup, role: newRole }
    await updateDoc(doc(db, 'events', eventId), { signups: arrayRemove(oldSignup) })
    await updateDoc(doc(db, 'events', eventId), { signups: arrayUnion(updatedSignup) })
    await writeLog('EVENT_SIGNUP_ROLE_CHANGED', { eventId, username: oldSignup.username, newRole }, by)
  }, [by])

  const signUp = useCallback(async (eventId, role, note = '') => {
    if (!currentUser) return
    const event = events.find(e => e.id === eventId)
    if (!event) return
    const existing = event.signups?.find(s => s.userId === currentUser.id)
    if (existing) {
      await updateDoc(doc(db, 'events', eventId), { signups: arrayRemove(existing) })
    }
    const signup = {
      userId:     currentUser.id,
      username:   currentUser.username,
      cls:        currentUser.cls,
      rank:       currentUser.rank,
      role,
      note:       note.trim(),
      signedUpAt: new Date().toISOString(),
    }
    await updateDoc(doc(db, 'events', eventId), { signups: arrayUnion(signup) })
    await writeLog('EVENT_SIGNUP', { eventId, title: event.title, role }, by)
  }, [currentUser, events, by])

  const signOff = useCallback(async (eventId) => {
    if (!currentUser) return
    const event = events.find(e => e.id === eventId)
    const existing = event?.signups?.find(s => s.userId === currentUser.id)
    if (!existing) return
    await updateDoc(doc(db, 'events', eventId), { signups: arrayRemove(existing) })
    await writeLog('EVENT_SIGNOFF', { eventId, title: event.title }, by)
  }, [currentUser, events, by])

  return {
    events, loading,
    createEvent, deleteEvent, updateEvent,
    removeSignup, changeSignupRole,
    signUp, signOff,
  }
}
