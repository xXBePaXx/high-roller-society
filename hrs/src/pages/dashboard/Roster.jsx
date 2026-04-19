import { useState } from 'react'
import { useUsers } from '../../hooks/useUsers'
import { PRIMARY_PROFS, SECONDARY_PROFS } from '../../hooks/useMemberData'

const CLASS_COLORS = {
  'Death Knight': '#C41E3A', 'Druid': '#FF7C0A', 'Hunter': '#AAD372',
  'Mage': '#3FC7EB', 'Paladin': '#F48CBA', 'Priest': '#DDDDDD',
  'Rogue': '#FFF468', 'Shaman': '#0070DD', 'Warlock': '#8788EE', 'Warrior': '#C69B3A',
}

const CLASS_ICONS = {
  'Death Knight': '💀', 'Druid': '🌙', 'Hunter': '🏹', 'Mage': '🔮',
  'Paladin': '⚔️', 'Priest': '✨', 'Rogue': '🗡️', 'Shaman': '⚡',
  'Warlock': '🔥', 'Warrior': '🛡️',
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

function ProfBadge({ prof }) {
  const isPrimary = PRIMARY_PROFS.includes(prof.name)
  const hasSpec = prof.specialization && prof.specialization !== 'Keine'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: isPrimary ? 'rgba(200,168,75,.08)' : 'rgba(46,34,16,.4)',
      border: `1px solid ${isPrimary ? '#3a2c18' : '#1e1808'}`,
      borderRadius: 2, padding: '2px 7px', fontSize: 10,
      color: isPrimary ? '#7a6030' : '#4a3820',
      whiteSpace: 'nowrap',
    }}>
      {prof.name}
      {hasSpec && <span style={{ color: '#c8a84b', fontSize: 9 }}>· {prof.specialization}</span>}
      {prof.level && <span style={{ color: '#3a2c18', fontSize: 9 }}>{prof.level}</span>}
    </span>
  )
}

export default function Roster() {
  const { users, loading } = useUsers()
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterType, setFilterType] = useState('') // '' | 'main' | 'twink'

  const active = users.filter(u => u.active)

  const filtered = active.filter(u => {
    const matchSearch = !search || [u.name, u.rank, u.cls].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
    const matchClass = !filterClass || u.cls === filterClass
    const matchType  = !filterType  || (u.characterType || 'main') === filterType
    return matchSearch && matchClass && matchType
  })

  // Sortierung: Mains zuerst, dann nach Rang-Index, dann Name
  const sorted = [...filtered].sort((a, b) => {
    const typeA = a.characterType || 'main'
    const typeB = b.characterType || 'main'
    if (typeA !== typeB) return typeA === 'main' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const mainCount  = active.filter(u => (u.characterType || 'main') === 'main').length
  const twinkCount = active.filter(u => u.characterType === 'twink').length

  const classes = [...new Set(active.map(u => u.cls).filter(Boolean))].sort()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{
        background: '#120e06', border: '1px solid #2e2210',
        borderRadius: 4, padding: '1.4rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.3rem' }}>
          <h1 style={{
            fontFamily: 'Cinzel,serif', fontSize: 20, fontWeight: 600,
            color: '#f0d080', margin: 0, letterSpacing: 1,
          }}>Gilden-Roster</h1>
          <span style={{ fontFamily: 'Cinzel,serif', fontSize: 10, color: '#5a4828', letterSpacing: 2 }}>
            HIGH ROLLER SOCIETY
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.6rem' }}>
          {[
            { label: 'Aktive Mitglieder', value: active.length },
            { label: 'Mains', value: mainCount },
            { label: 'Twinks', value: twinkCount },
          ].map(s => (
            <div key={s.label}>
              <span style={{ fontFamily: 'Cinzel,serif', fontSize: 16, color: '#c8a84b' }}>{s.value}</span>
              <span style={{ fontSize: 11, color: '#3a2c18', marginLeft: 6 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div style={{
        background: '#120e06', border: '1px solid #2e2210',
        borderRadius: 4, padding: '1rem 1.4rem',
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          placeholder="Name, Rang oder Klasse..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 160, fontSize: 12 }}
        />
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ fontSize: 12 }}>
          <option value="">Alle Klassen</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ fontSize: 12 }}>
          <option value="">Main & Twink</option>
          <option value="main">Nur Mains</option>
          <option value="twink">Nur Twinks</option>
        </select>
        {(search || filterClass || filterType) && (
          <button className="btn-ghost" style={{ fontSize: 10 }}
            onClick={() => { setSearch(''); setFilterClass(''); setFilterType('') }}>
            ✕ Zurücksetzen
          </button>
        )}
      </div>

      {/* Mitgliederliste */}
      <div style={{
        background: '#120e06', border: '1px solid #2e2210',
        borderRadius: 4, padding: '1.4rem',
      }}>
        <SectionTitle>Mitglieder · {sorted.length} Ergebnisse</SectionTitle>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#5a4828', fontStyle: 'italic' }}>
            Lade Roster...
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#3a2c18', fontStyle: 'italic' }}>
            Keine Mitglieder gefunden.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sorted.map(u => {
              const clsColor  = CLASS_COLORS[u.cls] || '#c8a84b'
              const clsIcon   = CLASS_ICONS[u.cls]  || '⚔️'
              const charType  = u.characterType || 'main'
              const profs     = u.professions || []

              return (
                <div key={u.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr auto',
                  gap: '0 1rem',
                  alignItems: 'start',
                  padding: '0.9rem 0.8rem',
                  borderRadius: 3,
                  borderBottom: '1px solid #1a1208',
                  transition: 'background .15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,168,75,.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Klassen-Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 3,
                    background: '#0d0a04',
                    border: `1px solid ${clsColor}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {clsIcon}
                  </div>

                  {/* Name + Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'Cinzel,serif', fontSize: 14,
                        fontWeight: 600, color: clsColor,
                      }}>{u.name}</span>
                      <span style={{
                        fontSize: 10, color: '#4a3820',
                        fontFamily: 'Cinzel,serif', letterSpacing: 1,
                      }}>{u.rank}</span>
                      <span style={{
                        fontSize: 9, letterSpacing: 1,
                        fontFamily: 'Cinzel,serif',
                        color: charType === 'main' ? '#c8a84b' : '#4a3820',
                      }}>
                        {charType === 'main' ? '⭐ MAIN' : '🔄 TWINK'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#4a3820", marginTop: 2 }}>
                      {u.cls}{u.race && ` · ${u.race}`}{u.level && ` · Level ${u.level}`}
                    </div>
                    {u.absence && (
                      <div style={{ fontSize: 10, color: "#e08080", marginTop: 3, fontStyle: "italic" }}>🏖️ Abwesend {u.absence.from}{u.absence.until ? ` – ${u.absence.until}` : ""}</div>
                    )}
                    {profs.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {profs.map((p, i) => <ProfBadge key={i} prof={p} />)}
                      </div>
                    )}
                  </div>

                  {/* Rechts: Kontakt-Hinweis */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: '#2e2210', fontStyle: 'italic' }}>
                      /w {u.name}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
