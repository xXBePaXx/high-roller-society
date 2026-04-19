import { useState } from 'react'
import { useEvents, EVENT_TYPES } from '../../hooks/useEvents'
import Modal from '../../components/Modal'

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

export default function Events() {
  const { events, loading, createEvent, deleteEvent, updateEvent } = useEvents()
  const [modal, setModal]   = useState(null) // null | 'add' | { type: 'edit', event }
  const [form, setForm]     = useState(EMPTY_FORM)
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState('')

  const upcoming = events.filter(isUpcoming)
  const past     = events.filter(e => !isUpcoming(e))

  function openAdd() {
    setErr('')
    // Datum vorausfüllen: nächsten Mittwoch (typischer Raid-Tag)
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
    const et       = eventType(event.type)
    const signups  = event.signups?.length || 0
    const upcoming = isUpcoming(event)

    return (
      <tr style={{ borderBottom: '1px solid rgba(46,34,16,.5)', opacity: upcoming ? 1 : 0.5 }}>
        <td style={{ padding: '.65rem .8rem', fontSize: 18 }}>{et.icon}</td>
        <td style={{ padding: '.65rem .8rem', fontWeight: 500, color: '#f0d080', fontFamily: 'Cinzel,serif', fontSize: 13 }}>{event.title}</td>
        <td style={{ padding: '.65rem .8rem', fontSize: 11, color: '#7a6030' }}>
          <span style={{ color: et.color, fontSize: 10, fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>{et.label}</span>
        </td>
        <td style={{ padding: '.65rem .8rem', fontSize: 12, color: '#7a6030', whiteSpace: 'nowrap' }}>
          {formatDate(event.eventDate)} · {event.eventTime || '—'}
        </td>
        <td style={{ padding: '.65rem .8rem', fontSize: 12, color: '#5a4828', textAlign: 'center' }}>
          {signups}{event.maxSignups > 0 ? `/${event.maxSignups}` : ''}
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
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="z.B. Bringt Feuerresistenz-Gear mit..."
              style={{ minHeight: 70 }}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Max. Anmeldungen (0 = unbegrenzt)</label>
            <input
              type="number" min={0} max={100}
              value={form.maxSignups}
              onChange={e => setForm({ ...form, maxSignups: parseInt(e.target.value) || 0 })}
            />
          </div>

          {err && <p className="error-text">{err}</p>}
        </Modal>
      )}
    </div>
  )
}
