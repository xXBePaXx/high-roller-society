import { useState } from 'react'
import { useEvents, EVENT_TYPES, ROLES } from '../../hooks/useEvents'
import Modal from '../../components/Modal'

const CLASS_COLORS = {
  'Death Knight': '#C41E3A', 'Druid': '#FF7C0A', 'Hunter': '#AAD372',
  'Mage': '#3FC7EB', 'Paladin': '#F48CBA', 'Priest': '#DDDDDD',
  'Rogue': '#FFF468', 'Shaman': '#0070DD', 'Warlock': '#8788EE', 'Warrior': '#C69B3A',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isUpcoming(event) {
  const now = new Date()
  const eventDt = new Date(`${event.eventDate}T${event.eventTime || '00:00'}`)
  return eventDt >= now
}

const EMPTY_FORM = {
  title: '', type: 'raid', eventDate: '', eventTime: '20:00',
  description: '', maxSignups: 0,
}

// ─── Admin Teilnehmerverwaltung Modal ────────────────────────────────────────
function SignupsModal({ event, onClose, onRemove, onChangeRole }) {
  const [busy, setBusy] = useState(null) // userId der gerade bearbeitet wird
  const signups = event.signups || []

  async function handleRemove(signup) {
    setBusy(signup.userId)
    await onRemove(event.id, signup)
    setBusy(null)
  }

  async function handleRoleChange(signup, newRole) {
    if (signup.role === newRole) return
    setBusy(signup.userId)
    await onChangeRole(event.id, signup, newRole)
    setBusy(null)
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
        borderRadius: 4, padding: '2rem', width: '100%', maxWidth: 560,
        position: 'relative', maxHeight: '80vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 2, background: 'linear-gradient(90deg,transparent,#c8a84b,transparent)' }} />

        <div style={{ marginBottom: '1.2rem', flexShrink: 0 }}>
          <div style={{ fontSize: 18, marginBottom: '.3rem' }}>{eventType.icon}</div>
          <h3 style={{ fontFamily: 'Cinzel,serif', fontSize: 15, color: '#f0d080', margin: '0 0 .2rem' }}>{event.title}</h3>
          <p style={{ fontSize: 11, color: '#5a4828', fontStyle: 'italic', margin: 0 }}>
            {formatDate(event.eventDate)} · {event.eventTime} Uhr · {signups.length} Anmeldung{signups.length !== 1 ? 'en' : ''}
          </p>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {signups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#3a2c18', fontStyle: 'italic' }}>Noch keine Anmeldungen.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Charakter', 'Klasse', 'Rang', 'Rolle', 'Notiz', 'Aktionen'].map(h => (
                    <th key={h} style={{
                      fontFamily: 'Cinzel,serif', fontSize: 8, letterSpacing: 2, color: '#3a2c18',
                      textTransform: 'uppercase', padding: '.5rem .6rem', borderBottom: '1px solid #2e2210',
                      textAlign: 'left', fontWeight: 400, whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {signups.map(s => (
                  <tr key={s.userId} style={{ borderBottom: '1px solid #1a1208', opacity: busy === s.userId ? 0.5 : 1 }}>
                    <td style={{ padding: '.5rem .6rem', color: CLASS_COLORS[s.cls] || '#c8a84b', fontWeight: 600 }}>{s.username}</td>
                    <td style={{ padding: '.5rem .6rem', color: '#5a4828', fontSize: 11 }}>{s.cls}</td>
                    <td style={{ padding: '.5rem .6rem', color: '#4a3820', fontSize: 11 }}>{s.rank}</td>
                    <td style={{ padding: '.5rem .6rem' }}>
                      <select
                        value={s.role}
                        onChange={e => handleRoleChange(s, e.target.value)}
                        disabled={busy === s.userId}
                        style={{ fontSize: 11, padding: '3px 6px', background: '#1a1208', border: '1px solid #2e2210', color: '#c8a84b', borderRadius: 2 }}
                      >
                        {ROLES.map(r => <option key={r.id} value={r.id}>{r.icon} {r.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '.5rem .6rem', color: '#4a3820', fontStyle: 'italic', fontSize: 11, maxWidth: 140 }}>
                      {s.note || <span style={{ color: '#2e2210' }}>—</span>}
                    </td>
                    <td style={{ padding: '.5rem .6rem' }}>
                      <button
                        className="btn-icon danger"
                        title="Teilnehmer entfernen"
                        disabled={busy === s.userId}
                        onClick={() => handleRemove(s)}
                      >✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: '1.2rem', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  )
}

// ─── Hauptkomponente ─────────────────────────────────────────────────────────
export default function Events() {
  const { events, loading, createEvent, deleteEvent, updateEvent, removeSignup, changeSignupRole } = useEvents()
  const [modal, setModal]         = useState(null)
  const [signupsModal, setSignupsModal] = useState(null) // event oder null
  const [form, setForm]           = useState(EMPTY_FORM)
  const [busy, setBusy]           = useState(false)
  const [err, setErr]             = useState('')

  const upcoming = events.filter(isUpcoming)
  const past     = events.filter(e => !isUpcoming(e))

  function openAdd() {
    setErr('')
    const next = new Date()
    next.setDate(next.getDate() + ((3 - next.getDay() + 7) % 7 || 7))
    setForm({ ...EMPTY_FORM, eventDate: next.toISOString().split('T')[0] })
    setModal('add')
  }

  function openEdit(event) {
    setErr('')
    setForm({
      title:       event.title,
      type:        event.type,
      eventDate:   event.eventDate,
      eventTime:   event.eventTime || '20:00',
      description: event.description || '',
      maxSignups:  event.maxSignups || 0,
    })
    setModal({ type: 'edit', event })
  }

  async function handleOk() {
    setErr('')
    if (!form.title?.trim()) { setErr('Titel fehlt.'); return }
    if (!form.eventDate)     { setErr('Datum fehlt.'); return }
    setBusy(true)
    try {
      if (modal === 'add') {
        await createEvent(form)
      } else if (modal?.type === 'edit') {
        await updateEvent(modal.event.id, form)
      }
      setModal(null)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  const eventType = (type) => EVENT_TYPES.find(t => t.id === type) || EVENT_TYPES[0]

  const EventRow = ({ event }) => {
    const et      = eventType(event.type)
    const signups = event.signups?.length || 0
    const up      = isUpcoming(event)

    return (
      <tr style={{ borderBottom: '1px solid rgba(46,34,16,.5)', opacity: up ? 1 : 0.5 }}>
        <td style={{ padding: '.65rem .8rem', fontSize: 18 }}>{et.icon}</td>
        <td style={{ padding: '.65rem .8rem', fontWeight: 500, color: '#f0d080', fontFamily: 'Cinzel,serif', fontSize: 13 }}>{event.title}</td>
        <td style={{ padding: '.65rem .8rem' }}>
          <span style={{ color: et.color, fontSize: 10, fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>{et.label}</span>
        </td>
        <td style={{ padding: '.65rem .8rem', fontSize: 12, color: '#7a6030', whiteSpace: 'nowrap' }}>
          {formatDate(event.eventDate)} · {event.eventTime || '—'}
        </td>
        <td style={{ padding: '.65rem .8rem', textAlign: 'center' }}>
          <button
            className="btn-icon"
            title="Anmeldungen verwalten"
            onClick={() => setSignupsModal(event)}
            style={{ fontSize: 12, color: signups > 0 ? '#c8a84b' : '#3a2c18' }}
          >
            👥 {signups}{event.maxSignups > 0 ? `/${event.maxSignups}` : ''}
          </button>
        </td>
        <td style={{ padding: '.65rem .8rem', whiteSpace: 'nowrap' }}>
          <button className="btn-icon" title="Bearbeiten" onClick={() => openEdit(event)}>✏️</button>
          <button className="btn-icon danger" title="Löschen" onClick={async () => {
            if (window.confirm(`"${event.title}" wirklich löschen?`)) await deleteEvent(event.id)
          }}>✕</button>
        </td>
      </tr>
    )
  }

  return (
    <div>
      <div className="section-title">Events & Raid-Kalender</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', alignItems: 'center' }}>
        <button className="btn-ghost" style={{ fontSize: 10 }} onClick={openAdd}>+ Event anlegen</button>
        <span style={{ fontSize: 11, color: '#3a2c18', fontStyle: 'italic', marginLeft: 'auto' }}>
          {upcoming.length} bevorstehend · {past.length} vergangen
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#7a6030', fontStyle: 'italic' }}>Lade Events...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['', 'Titel', 'Typ', 'Datum & Uhrzeit', 'Anmeldungen', 'Aktionen'].map(h => (
                  <th key={h} style={{
                    fontFamily: 'Cinzel,serif', fontSize: 9, letterSpacing: 2, color: '#5a4828',
                    textTransform: 'uppercase', padding: '.6rem .8rem', borderBottom: '1px solid #2e2210',
                    textAlign: 'left', fontWeight: 400, whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#5a4828', fontStyle: 'italic' }}>
                  Noch keine Events. Leg das erste an!
                </td></tr>
              )}
              {upcoming.map(e => <EventRow key={e.id} event={e} />)}
              {past.map(e => <EventRow key={e.id} event={e} />)}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Anlegen / Bearbeiten */}
      {(modal === 'add' || modal?.type === 'edit') && (
        <Modal
          title={modal === 'add' ? 'Neues Event anlegen' : `Event bearbeiten — ${modal.event.title}`}
          onClose={() => setModal(null)}
          onOk={handleOk}
          okLabel={busy ? 'Speichern...' : modal === 'add' ? 'Anlegen' : 'Speichern'}
        >
          <div className="field-group">
            <label className="field-label">Titel</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="z.B. Black Temple — Progress" />
          </div>
          <div className="field-group">
            <label className="field-label">Typ</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field-group">
              <label className="field-label">Datum</label>
              <input type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} />
            </div>
            <div className="field-group">
              <label className="field-label">Uhrzeit</label>
              <input type="time" value={form.eventTime} onChange={e => setForm({ ...form, eventTime: e.target.value })} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Beschreibung (optional)</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="z.B. Bringt Feuerresistenz-Gear mit..." style={{ minHeight: 70 }} />
          </div>
          <div className="field-group">
            <label className="field-label">Max. Anmeldungen (0 = unbegrenzt)</label>
            <input type="number" min={0} max={100} value={form.maxSignups}
              onChange={e => setForm({ ...form, maxSignups: parseInt(e.target.value) || 0 })} />
          </div>
          {err && <p className="error-text">{err}</p>}
        </Modal>
      )}

      {/* Modal: Anmeldungen verwalten */}
      {signupsModal && (
        <SignupsModal
          event={signupsModal}
          onClose={() => setSignupsModal(null)}
          onRemove={removeSignup}
          onChangeRole={changeSignupRole}
        />
      )}
    </div>
  )
}
