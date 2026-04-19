import { useState } from 'react'
import { useEvents, EVENT_TYPES, ROLES } from '../../hooks/useEvents'
import { useAuth } from '../../contexts/AuthContext'

const CLASS_COLORS = {
  'Death Knight': '#C41E3A', 'Druid': '#FF7C0A', 'Hunter': '#AAD372',
  'Mage': '#3FC7EB', 'Paladin': '#F48CBA', 'Priest': '#DDDDDD',
  'Rogue': '#FFF468', 'Shaman': '#0070DD', 'Warlock': '#8788EE', 'Warrior': '#C69B3A',
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: 'Cinzel,serif', fontSize: 9, letterSpacing: 3,
      color: '#5a4828', textTransform: 'uppercase', marginBottom: '1rem',
      paddingBottom: '0.5rem', borderBottom: '1px solid #1e1808',
    }}>{children}</div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#120e06', border: '1px solid #2e2210',
      borderRadius: 4, padding: '1.4rem', ...style,
    }}>{children}</div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isUpcoming(event) {
  const now = new Date()
  const eventDt = new Date(`${event.eventDate}T${event.eventTime || '00:00'}`)
  return eventDt >= now
}

// ─── Signup-Modal ────────────────────────────────────────────────────────────
function SignupModal({ event, currentSignup, onSignup, onSignoff, onClose }) {
  const [selectedRole, setSelectedRole] = useState(currentSignup?.role || 'dps')
  const [busy, setBusy] = useState(false)

  async function handleSignup() {
    setBusy(true)
    await onSignup(event.id, selectedRole)
    setBusy(false)
    onClose()
  }

  async function handleSignoff() {
    setBusy(true)
    await onSignoff(event.id)
    setBusy(false)
    onClose()
  }

  const eventType = EVENT_TYPES.find(t => t.id === event.type) || EVENT_TYPES[0]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: '1rem',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#120e06', border: '1px solid #4a3820',
        borderRadius: 4, padding: '2rem', width: '100%', maxWidth: 400,
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 2, background: 'linear-gradient(90deg,transparent,#c8a84b,transparent)' }} />

        <div style={{ fontSize: 20, marginBottom: '.3rem' }}>{eventType.icon}</div>
        <h3 style={{ fontFamily: 'Cinzel,serif', fontSize: 16, color: '#f0d080', margin: '0 0 .3rem' }}>{event.title}</h3>
        <p style={{ fontSize: 12, color: '#5a4828', fontStyle: 'italic', margin: '0 0 1.5rem' }}>
          {formatDate(event.eventDate)} · {event.eventTime || '—'} Uhr
        </p>

        {currentSignup ? (
          <div style={{ background: 'rgba(200,168,75,.06)', border: '1px solid #3a2c18', borderRadius: 3, padding: '0.8rem', marginBottom: '1.2rem', fontSize: 12, color: '#7a6030' }}>
            Du bist angemeldet als <strong style={{ color: '#c8a84b' }}>{ROLES.find(r => r.id === currentSignup.role)?.label}</strong>
          </div>
        ) : null}

        <div style={{ marginBottom: '1.2rem' }}>
          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 9, letterSpacing: 2, color: '#5a4828', textTransform: 'uppercase', marginBottom: '.6rem' }}>Rolle wählen</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {ROLES.map(r => (
              <button key={r.id} onClick={() => setSelectedRole(r.id)} style={{
                flex: 1, background: selectedRole === r.id ? 'rgba(200,168,75,.1)' : 'transparent',
                border: selectedRole === r.id ? '1px solid #c8a84b' : '1px solid #2e2210',
                borderRadius: 3, padding: '0.6rem', cursor: 'pointer', textAlign: 'center',
                transition: 'all .15s',
              }}>
                <div style={{ fontSize: 18 }}>{r.icon}</div>
                <div style={{ fontSize: 10, fontFamily: 'Cinzel,serif', letterSpacing: 1, color: selectedRole === r.id ? '#f0d080' : '#5a4828', marginTop: 3 }}>{r.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" style={{ flex: 1, fontSize: 12 }} onClick={handleSignup} disabled={busy}>
            {busy ? '...' : currentSignup ? 'Rolle ändern' : 'Anmelden'}
          </button>
          {currentSignup && (
            <button className="btn-ghost" style={{ fontSize: 12, color: '#8a3020' }} onClick={handleSignoff} disabled={busy}>
              Abmelden
            </button>
          )}
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  )
}

// ─── Event-Karte ─────────────────────────────────────────────────────────────
function EventCard({ event, currentUser, onSignup, onSignoff }) {
  const [expanded, setExpanded] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const eventType    = EVENT_TYPES.find(t => t.id === event.type) || EVENT_TYPES[0]
  const signups      = event.signups || []
  const mySignup     = signups.find(s => s.userId === currentUser?.id)
  const upcoming     = isUpcoming(event)
  const isFull       = event.maxSignups > 0 && signups.length >= event.maxSignups

  const tanks = signups.filter(s => s.role === 'tank')
  const heals = signups.filter(s => s.role === 'heal')
  const dps   = signups.filter(s => s.role === 'dps')

  return (
    <>
      <div style={{
        border: `1px solid ${mySignup ? '#3a2c18' : '#1e1808'}`,
        borderLeft: `3px solid ${mySignup ? '#c8a84b' : eventType.color}`,
        borderRadius: 3,
        background: mySignup ? 'rgba(200,168,75,.04)' : '#0d0a04',
        overflow: 'hidden',
        opacity: upcoming ? 1 : 0.5,
        transition: 'all .15s',
      }}>
        {/* Header */}
        <div
          style={{ padding: '0.9rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem' }}
          onClick={() => setExpanded(e => !e)}
        >
          <span style={{ fontSize: 20, flexShrink: 0 }}>{eventType.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: '#f0d080', fontWeight: 600 }}>{event.title}</span>
              {mySignup && (
                <span style={{ fontSize: 9, letterSpacing: 1, fontFamily: 'Cinzel,serif', color: '#c8a84b', background: 'rgba(200,168,75,.15)', padding: '2px 6px', borderRadius: 2 }}>
                  ANGEMELDET · {ROLES.find(r => r.id === mySignup.role)?.label.toUpperCase()}
                </span>
              )}
              {isFull && !mySignup && (
                <span style={{ fontSize: 9, letterSpacing: 1, fontFamily: 'Cinzel,serif', color: '#8a3020', background: 'rgba(138,48,32,.15)', padding: '2px 6px', borderRadius: 2 }}>
                  VOLL
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#4a3820', marginTop: 2 }}>
              {formatDate(event.eventDate)} · {event.eventTime || '—'} Uhr
              <span style={{ margin: '0 6px', color: '#2e2210' }}>·</span>
              {signups.length}{event.maxSignups > 0 ? `/${event.maxSignups}` : ''} Anmeldungen
            </div>
          </div>
          {upcoming && (
            <button
              className={mySignup ? 'btn-ghost' : 'btn-primary'}
              style={{ fontSize: 10, padding: '5px 12px', flexShrink: 0 }}
              onClick={e => { e.stopPropagation(); setShowModal(true) }}
              disabled={isFull && !mySignup}
            >
              {mySignup ? 'Ändern' : 'Anmelden'}
            </button>
          )}
          <span style={{ color: '#3a2c18', fontSize: 10, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
        </div>

        {/* Ausgeklappter Bereich */}
        {expanded && (
          <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #1e1808' }}>
            {event.description && (
              <p style={{ fontSize: 12, color: '#5a4828', fontStyle: 'italic', margin: '0.8rem 0' }}>{event.description}</p>
            )}

            {signups.length === 0 ? (
              <div style={{ fontSize: 12, color: '#3a2c18', fontStyle: 'italic', padding: '0.5rem 0' }}>Noch keine Anmeldungen.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: '0.8rem' }}>
                {[
                  { label: 'Tanks', icon: '🛡️', list: tanks },
                  { label: 'Heiler', icon: '💚', list: heals },
                  { label: 'DPS', icon: '⚔️', list: dps },
                ].map(group => (
                  <div key={group.label}>
                    <div style={{ fontSize: 9, fontFamily: 'Cinzel,serif', letterSpacing: 2, color: '#3a2c18', textTransform: 'uppercase', marginBottom: 6 }}>
                      {group.icon} {group.label} ({group.list.length})
                    </div>
                    {group.list.map(s => (
                      <div key={s.userId} style={{
                        fontSize: 11, color: CLASS_COLORS[s.cls] || '#c8a84b',
                        padding: '2px 0',
                        fontWeight: s.userId === currentUser?.id ? 600 : 400,
                      }}>
                        {s.username}
                        <span style={{ fontSize: 9, color: '#3a2c18', marginLeft: 4 }}>{s.rank}</span>
                      </div>
                    ))}
                    {group.list.length === 0 && (
                      <div style={{ fontSize: 10, color: '#2e2210', fontStyle: 'italic' }}>—</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <SignupModal
          event={event}
          currentSignup={mySignup}
          onSignup={onSignup}
          onSignoff={onSignoff}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

// ─── Hauptkomponente ─────────────────────────────────────────────────────────
export default function Calendar() {
  const { events, loading, signUp, signOff } = useEvents()
  const { currentUser } = useAuth()
  const [showPast, setShowPast] = useState(false)

  const upcoming = events.filter(isUpcoming)
  const past     = events.filter(e => !isUpcoming(e)).reverse()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
          <h1 style={{ fontFamily: 'Cinzel,serif', fontSize: 20, fontWeight: 600, color: '#f0d080', margin: 0, letterSpacing: 1 }}>
            Raid-Kalender
          </h1>
          <span style={{ fontFamily: 'Cinzel,serif', fontSize: 10, color: '#5a4828', letterSpacing: 2 }}>
            HIGH ROLLER SOCIETY
          </span>
        </div>
        <div style={{ marginTop: '0.6rem', fontSize: 12, color: '#3a2c18', fontStyle: 'italic' }}>
          {upcoming.length === 0
            ? 'Keine bevorstehenden Events.'
            : `${upcoming.length} bevorstehende${upcoming.length === 1 ? 's Event' : ' Events'}`}
        </div>
      </Card>

      {/* Kommende Events */}
      <Card>
        <SectionTitle>Bevorstehende Events</SectionTitle>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#5a4828', fontStyle: 'italic' }}>Lade Events...</div>
        ) : upcoming.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#3a2c18', fontStyle: 'italic' }}>
            Keine bevorstehenden Events geplant.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {upcoming.map(event => (
              <EventCard key={event.id} event={event} currentUser={currentUser} onSignup={signUp} onSignoff={signOff} />
            ))}
          </div>
        )}
      </Card>

      {/* Vergangene Events */}
      {past.length > 0 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showPast ? '1rem' : 0 }}>
            <SectionTitle>Vergangene Events ({past.length})</SectionTitle>
            <button className="btn-ghost" style={{ fontSize: 10, marginTop: -8 }} onClick={() => setShowPast(v => !v)}>
              {showPast ? 'Ausblenden' : 'Anzeigen'}
            </button>
          </div>
          {showPast && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {past.map(event => (
                <EventCard key={event.id} event={event} currentUser={currentUser} onSignup={signUp} onSignoff={signOff} />
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
