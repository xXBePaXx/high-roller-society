import { useState, useEffect } from 'react'
import { useRanks } from '../../hooks/useRanks'

const PERMISSIONS = [
  { key: 'canManageDKP',     label: 'DKP verwalten',       desc: 'DKP vergeben, Loot eintragen, Anpassungen' },
  { key: 'canViewDKP',      label: 'DKP einsehen',        desc: 'Eigenen Stand und Rangliste sehen' },
  { key: 'canManageEvents', label: 'Events verwalten',  desc: 'Events anlegen, bearbeiten & löschen' },
  { key: 'canSignupEvents', label: 'Events anmelden',   desc: 'Sich in Events ein-/austragen' },
  { key: 'canViewCalendar', label: 'Kalender sehen',    desc: 'Raid-Kalender aufrufen' },
  { key: 'canViewRoster',   label: 'Roster sehen',      desc: 'Mitgliederliste aufrufen' },
]

// Standardrechte je nach Rang-Level (1 = höchster)
function defaultPermissions(level) {
  if (level <= 2) return { canManageEvents: true,  canSignupEvents: true,  canViewCalendar: true,  canViewRoster: true  }
  if (level <= 4) return { canManageEvents: false, canSignupEvents: true,  canViewCalendar: true,  canViewRoster: true  }
  if (level <= 5) return { canManageEvents: false, canSignupEvents: false, canViewCalendar: true,  canViewRoster: true  }
  return               { canManageEvents: false, canSignupEvents: false, canViewCalendar: false, canViewRoster: true  }
}

export default function Ranks() {
  const { ranks, saveRanks, addRank, deleteRank } = useRanks()
  const [local, setLocal] = useState([])
  const [flash, setFlash] = useState(false)
  const [busy, setBusy]   = useState(false)
  const [expanded, setExpanded] = useState(null) // id des ausgeklappten Rangs

  useEffect(() => {
    setLocal(ranks.map(r => ({
      ...r,
      permissions: r.permissions || defaultPermissions(r.level),
    })))
  }, [ranks])

  function rename(idx, val) {
    setLocal(prev => prev.map((r, i) => i === idx ? { ...r, label: val } : r))
  }

  function togglePermission(idx, key) {
    setLocal(prev => prev.map((r, i) => i !== idx ? r : {
      ...r,
      permissions: { ...r.permissions, [key]: !r.permissions?.[key] },
    }))
  }

  async function handleSave() {
    setBusy(true)
    await saveRanks(local)
    setBusy(false)
    setFlash(true)
    setTimeout(() => setFlash(false), 2200)
  }

  return (
    <div>
      <div className="section-title">Rang-Verwaltung</div>
      <p style={{ fontSize: 13, color: '#7a6030', fontStyle: 'italic', marginBottom: '1.4rem' }}>
        Ränge umbenennen und Rechte pro Rang vergeben. Rang 1 = höchster Rang.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1.4rem' }}>
        {local.map((r, i) => {
          const isExpanded = expanded === r.id
          const perms = r.permissions || defaultPermissions(r.level)
          const activePerms = PERMISSIONS.filter(p => perms[p.key]).length

          return (
            <div key={r.id} style={{
              background: '#1a1208', border: `1px solid ${isExpanded ? '#3a2c18' : '#2e2210'}`,
              borderRadius: 3, overflow: 'hidden', transition: 'border-color .15s',
            }}>
              {/* Rang-Zeile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
                <span style={{ fontFamily: 'Cinzel,serif', fontSize: 10, color: '#4a3820', width: 18, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <input
                  value={r.label}
                  onChange={e => rename(i, e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid #3a2c18', color: '#f0d080', fontFamily: 'Crimson Text,serif', fontSize: 14, padding: '2px 4px', outline: 'none', borderRadius: 0 }}
                />

                {/* Rechte-Zusammenfassung + Toggle */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                  style={{
                    background: 'transparent', border: '1px solid #2e2210', borderRadius: 2,
                    color: '#5a4828', fontSize: 9, fontFamily: 'Cinzel,serif', letterSpacing: 1,
                    padding: '3px 8px', cursor: 'pointer', whiteSpace: 'nowrap',
                    textTransform: 'uppercase', transition: 'all .15s', flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c8a84b'; e.currentTarget.style.color = '#c8a84b' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2210'; e.currentTarget.style.color = '#5a4828' }}
                >
                  {activePerms}/{PERMISSIONS.length} Rechte {isExpanded ? '▲' : '▼'}
                </button>

                {i === 0
                  ? <span style={{ fontSize: 11, color: '#4a3820', fontStyle: 'italic', flexShrink: 0 }}>Höchster</span>
                  : <button className="btn-icon danger" onClick={() => deleteRank(r.id)} title="Rang löschen">✕</button>
                }
              </div>

              {/* Rechte-Panel */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid #2e2210', padding: '12px 14px', background: '#120e06' }}>
                  <div style={{ fontFamily: 'Cinzel,serif', fontSize: 8, letterSpacing: 3, color: '#3a2c18', textTransform: 'uppercase', marginBottom: 10 }}>
                    Berechtigungen
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {PERMISSIONS.map(p => {
                      const active = !!perms[p.key]
                      return (
                        <label key={p.key} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
                          padding: '8px 10px', borderRadius: 3,
                          background: active ? 'rgba(200,168,75,.06)' : 'rgba(0,0,0,.2)',
                          border: `1px solid ${active ? '#3a2c18' : '#1e1808'}`,
                          transition: 'all .15s',
                        }}>
                          {/* Custom Checkbox */}
                          <div
                            onClick={() => togglePermission(i, p.key)}
                            style={{
                              width: 16, height: 16, borderRadius: 2, flexShrink: 0, marginTop: 1,
                              background: active ? '#c8a84b' : 'transparent',
                              border: `1px solid ${active ? '#c8a84b' : '#3a2c18'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all .15s',
                            }}
                          >
                            {active && <span style={{ color: '#0d0a04', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                          </div>
                          <div onClick={() => togglePermission(i, p.key)}>
                            <div style={{ fontSize: 11, color: active ? '#f0d080' : '#5a4828', fontFamily: 'Cinzel,serif', letterSpacing: 0.5 }}>{p.label}</div>
                            <div style={{ fontSize: 10, color: '#3a2c18', fontStyle: 'italic', marginTop: 2 }}>{p.desc}</div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button onClick={addRank}
        style={{ width: '100%', background: 'none', border: '1px dashed #2e2210', color: '#5a4828', fontFamily: 'Cinzel,serif', fontSize: 10, letterSpacing: 2, padding: 10, cursor: 'pointer', borderRadius: 2, textTransform: 'uppercase', marginBottom: '1.4rem', transition: 'all .15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#c8a84b'; e.currentTarget.style.color = '#c8a84b' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2210'; e.currentTarget.style.color = '#5a4828' }}
      >
        + Neuen Rang hinzufügen
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn-primary" onClick={handleSave} disabled={busy}>
          {busy ? 'Speichern...' : 'Ränge speichern'}
        </button>
        <span className={`save-flash ${flash ? 'on' : ''}`}>✓ Gespeichert & geloggt</span>
      </div>
    </div>
  )
}
