import bcrypt from 'bcryptjs'

// ── PASSWORT-HASHING ──────────────────────────────────────────────
// Passwörter werden NIEMALS im Klartext gespeichert.
// bcrypt erzeugt einen sicheren Hash der nicht rückgängig gemacht werden kann.

export async function hashPassword(plaintext) {
  const salt = await bcrypt.genSalt(12) // 12 Runden = sehr sicher, noch schnell genug
  return bcrypt.hash(plaintext, salt)
}

export async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash)
}

// ── BRUTE-FORCE SCHUTZ ────────────────────────────────────────────
// Verhindert automatisierte Passwort-Rateversuche im Browser.
// Nach 5 fehlgeschlagenen Versuchen gibt es eine Wartezeit.

const ATTEMPTS_KEY = 'hrs_login_attempts'
const LOCKOUT_KEY  = 'hrs_lockout_until'
const MAX_ATTEMPTS = 5
const LOCKOUT_MS   = 15 * 60 * 1000 // 15 Minuten

export function isLockedOut() {
  const until = localStorage.getItem(LOCKOUT_KEY)
  if (!until) return false
  if (Date.now() < parseInt(until)) return true
  localStorage.removeItem(LOCKOUT_KEY)
  localStorage.removeItem(ATTEMPTS_KEY)
  return false
}

export function getLockoutRemaining() {
  const until = localStorage.getItem(LOCKOUT_KEY)
  if (!until) return 0
  return Math.max(0, Math.ceil((parseInt(until) - Date.now()) / 1000))
}

export function recordFailedAttempt() {
  const attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0') + 1
  localStorage.setItem(ATTEMPTS_KEY, attempts)
  if (attempts >= MAX_ATTEMPTS) {
    localStorage.setItem(LOCKOUT_KEY, Date.now() + LOCKOUT_MS)
    localStorage.removeItem(ATTEMPTS_KEY)
  }
  return attempts
}

export function clearLoginAttempts() {
  localStorage.removeItem(ATTEMPTS_KEY)
  localStorage.removeItem(LOCKOUT_KEY)
}

export function getRemainingAttempts() {
  const attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0')
  return MAX_ATTEMPTS - attempts
}
