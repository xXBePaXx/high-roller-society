import bcrypt from 'bcryptjs'

// ── PASSWORT-HASHING ──────────────────────────────────────────────
export async function hashPassword(plaintext) {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(plaintext, salt)
}
export async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash)
}

// ── FIBONACCI BRUTE-FORCE SCHUTZ ─────────────────────────────────
// Sperrzeiten in Minuten nach der n-ten Sperrung (Fibonacci-Folge):
// 1. Sperre: 1 Min → 2. Sperre: 2 Min → 3. Sperre: 3 Min →
// 4. Sperre: 5 Min → 5. Sperre: 8 Min → 6. Sperre: 13 Min →
// 7. Sperre: 21 Min → 8. Sperre: 34 Min → 9+: 55 Min (cap)
const FIBONACCI_MINUTES = [1, 2, 3, 5, 8, 13, 21, 34, 55]

const ATTEMPTS_KEY   = 'hrs_login_attempts'
const LOCKOUT_KEY    = 'hrs_lockout_until'
const LOCKOUT_COUNT  = 'hrs_lockout_count'  // wie oft wurde schon gesperrt?
const MAX_ATTEMPTS   = 5

function getLockoutDurationMs() {
  const count = parseInt(localStorage.getItem(LOCKOUT_COUNT) || '0')
  const idx   = Math.min(count, FIBONACCI_MINUTES.length - 1)
  return FIBONACCI_MINUTES[idx] * 60 * 1000
}

export function isLockedOut() {
  const until = localStorage.getItem(LOCKOUT_KEY)
  if (!until) return false
  if (Date.now() < parseInt(until)) return true
  // Sperre abgelaufen — Versuche zurücksetzen, Sperrzähler bleibt
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
    // Sperrzähler erhöhen (bestimmt die Fibonacci-Stufe)
    const lockoutCount = parseInt(localStorage.getItem(LOCKOUT_COUNT) || '0')
    localStorage.setItem(LOCKOUT_COUNT, lockoutCount + 1)

    const durationMs = getLockoutDurationMs()
    localStorage.setItem(LOCKOUT_KEY, Date.now() + durationMs)
    localStorage.removeItem(ATTEMPTS_KEY)
  }

  return attempts
}

export function clearLoginAttempts() {
  localStorage.removeItem(ATTEMPTS_KEY)
  localStorage.removeItem(LOCKOUT_KEY)
  localStorage.removeItem(LOCKOUT_COUNT)
}

export function getRemainingAttempts() {
  const attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0')
  return MAX_ATTEMPTS - attempts
}

// Gibt die aktuelle Fibonacci-Stufe zurück (für Debug/Anzeige)
export function getLockoutStage() {
  return parseInt(localStorage.getItem(LOCKOUT_COUNT) || '0')
}
