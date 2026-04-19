import { db } from '../firebase'
import {
  collection, addDoc, serverTimestamp,
  query, orderBy, limit, getDocs, where
} from 'firebase/firestore'

// Alle möglichen Aktionen zentral definiert
export const LOG = {
  // Auth
  LOGIN:              'LOGIN',
  LOGOUT:             'LOGOUT',
  LOGIN_FAILED:       'LOGIN_FAILED',
  LOGIN_LOCKED:       'LOGIN_LOCKED',
  // Benutzer
  USER_CREATED:       'USER_CREATED',
  USER_DELETED:       'USER_DELETED',
  USER_RANK_CHANGED:  'USER_RANK_CHANGED',
  USER_STATUS_CHANGED:'USER_STATUS_CHANGED',
  USER_CLASS_CHANGED: 'USER_CLASS_CHANGED',
  USER_NOTE_CHANGED:  'USER_NOTE_CHANGED',
  USER_PW_CHANGED:    'USER_PW_CHANGED',
  // Ränge
  RANK_CREATED:       'RANK_CREATED',
  RANK_RENAMED:       'RANK_RENAMED',
  RANK_DELETED:       'RANK_DELETED',
  // Seite
  SITE_CHANGED:       'SITE_CHANGED',
  ADMIN_CREDS_CHANGED:'ADMIN_CREDS_CHANGED',
  // Marktplatz (vorbereitet für später)
  MARKET_LISTED:      'MARKET_LISTED',
  MARKET_SOLD:        'MARKET_SOLD',
  MARKET_REMOVED:     'MARKET_REMOVED',
  MARKET_EDITED:      'MARKET_EDITED',
  // DKP / Gold (vorbereitet)
  DKP_AWARDED:        'DKP_AWARDED',
  DKP_SPENT:          'DKP_SPENT',
  DKP_ADJUSTED:       'DKP_ADJUSTED',
}

export const LOG_LABELS = {
  LOGIN:              'Eingeloggt',
  LOGOUT:             'Ausgeloggt',
  LOGIN_FAILED:       'Login fehlgeschlagen',
  LOGIN_LOCKED:       'Login gesperrt (zu viele Versuche)',
  USER_CREATED:       'Benutzer erstellt',
  USER_DELETED:       'Benutzer gelöscht',
  USER_RANK_CHANGED:  'Rang geändert',
  USER_STATUS_CHANGED:'Status geändert',
  USER_CLASS_CHANGED: 'Klasse geändert',
  USER_NOTE_CHANGED:  'Notiz bearbeitet',
  USER_PW_CHANGED:    'Passwort geändert',
  RANK_CREATED:       'Rang erstellt',
  RANK_RENAMED:       'Rang umbenannt',
  RANK_DELETED:       'Rang gelöscht',
  SITE_CHANGED:       'Seiteneinstellungen geändert',
  ADMIN_CREDS_CHANGED:'Admin-Zugangsdaten geändert',
  MARKET_LISTED:      'Artikel eingestellt',
  MARKET_SOLD:        'Artikel verkauft',
  MARKET_REMOVED:     'Artikel entfernt',
  MARKET_EDITED:      'Artikel bearbeitet',
  DKP_AWARDED:        'DKP vergeben',
  DKP_SPENT:          'DKP ausgegeben',
  DKP_ADJUSTED:       'DKP korrigiert',
}

export const LOG_CATEGORY = {
  LOGIN: 'auth', LOGOUT: 'auth', LOGIN_FAILED: 'auth', LOGIN_LOCKED: 'auth',
  USER_CREATED: 'user', USER_DELETED: 'user', USER_RANK_CHANGED: 'user',
  USER_STATUS_CHANGED: 'user', USER_CLASS_CHANGED: 'user',
  USER_NOTE_CHANGED: 'user', USER_PW_CHANGED: 'user',
  RANK_CREATED: 'rank', RANK_RENAMED: 'rank', RANK_DELETED: 'rank',
  SITE_CHANGED: 'site', ADMIN_CREDS_CHANGED: 'admin',
  MARKET_LISTED: 'market', MARKET_SOLD: 'market',
  MARKET_REMOVED: 'market', MARKET_EDITED: 'market',
  DKP_AWARDED: 'dkp', DKP_SPENT: 'dkp', DKP_ADJUSTED: 'dkp',
}

/**
 * Schreibt einen unveränderlichen Log-Eintrag nach Firestore.
 * Schlägt lautlos fehl wenn kein Netzwerk - nie soll das die UI blockieren.
 */
export async function writeLog(action, details = {}, performedBy = 'system') {
  try {
    await addDoc(collection(db, 'auditLog'), {
      action,
      label:    LOG_LABELS[action] || action,
      category: LOG_CATEGORY[action] || 'other',
      details,
      performedBy,
      timestamp: serverTimestamp(),
      // ip und userAgent werden aus Datenschutzgründen NICHT gespeichert
    })
  } catch (err) {
    // Log-Fehler niemals an User weitergeben - stattdessen nur konsole
    console.warn('[AuditLog] Schreibfehler:', err.message)
  }
}

/**
 * Lädt Log-Einträge. Nur für Admin zugänglich (durch Firestore Rules geregelt).
 */
export async function fetchLogs({ limitCount = 150, category = null } = {}) {
  try {
    const col = collection(db, 'auditLog')
    const constraints = [orderBy('timestamp', 'desc'), limit(limitCount)]
    if (category) constraints.unshift(where('category', '==', category))
    const snap = await getDocs(query(col, ...constraints))
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (err) {
    console.warn('[AuditLog] Ladefehler:', err.message)
    return []
  }
}
