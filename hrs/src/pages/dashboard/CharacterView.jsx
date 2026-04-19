import { useState, useEffect } from 'react'
import { useMemberData, PROFESSIONS, PRIMARY_PROFS, SECONDARY_PROFS } from '../../hooks/useMemberData'

// Klassen-Farben (WoW-authentisch)
const CLASS_COLORS = {
  'Death Knight': '#C41E3A',
  'Druid':        '#FF7C0A',
  'Hunter':       '#AAD372',
  'Mage':         '#3FC7EB',
  'Paladin':      '#F48CBA',
  'Priest':       '#DDDDDD',
  'Rogue':        '#FFF468',
  'Shaman':       '#0070DD',
  'Warlock':      '#8788EE',
  'Warrior':      '#C69B3A',
}

// Klassen-Icons (Unicode-Platzhalter, passt gut zum WoW-Stil)
const CLASS_ICONS = {
  'Death Knight': '💀', 'Druid': '🌙', 'Hunter': '🏹',
  'Mage': '🔮', 'Paladin': '⚔️', 'Priest': '✨',
  'Rogue': '🗡️', 'Shaman': '⚡', 'Warlock': '🔥', 'Warrior': '🛡️',
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily:'Cinzel,serif',
      fontSize:9,
      letterSpacing:3,
      color:'#5a4828',
      textTransform:'uppercase',
      marginBottom:'1rem',
      paddingBottom:'0.5rem',
      borderBottom:'1px solid #1e1808',
    }}>
      {children}
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background:'#120e06',
      border:'1px solid #2e2210',
      borderRadius:4,
      padding:'1.4rem',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Main/Twink Toggle ───────────────────────────────────────────────────────
function CharTypeToggle({ value, onChange, saving }) {
  return (
    <div style={{ display:'flex', gap:8 }}>
      {[
        { id:'main',  label:'Main',  desc:'Dein Hauptcharakter', icon:'⭐' },
        { id:'twink', label:'Twink', desc:'Alternativer Charakter', icon:'🔄' },
      ].map(opt => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            onClick={() => !saving && onChange(opt.id)}
            disabled={saving}
            style={{
              flex:1,
              background: active ? 'rgba(200,168,75,.1)' : 'transparent',
              border: active ? '1px solid #c8a84b' : '1px solid #2e2210',
              borderRadius:3,
              padding:'0.9rem 1rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              textAlign:'left',
              transition:'all .2s',
              opacity: saving ? 0.6 : 1,
            }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:16 }}>{opt.icon}</span>
              <span style={{
                fontFamily:'Cinzel,serif',
                fontSize:12,
                letterSpacing:1,
                color: active ? '#f0d080' : '#5a4828',
              }}>
                {opt.label}
              </span>
              {active && (
                <span style={{
                  marginLeft:'auto',
                  fontSize:9,
                  letterSpacing:1,
                  color:'#c8a84b',
                  fontFamily:'Cinzel,serif',
                  background:'rgba(200,168,75,.15)',
                  padding:'2px 6px',
                  borderRadius:2,
                }}>
                  AKTIV
                </span>
              )}
            </div>
            <div style={{ fontSize:11, color:'#3a2c18', fontStyle:'italic' }}>{opt.desc}</div>
          </button>
        )
      })}
    </div>
  )
}

// ─── Profession Row ──────────────────────────────────────────────────────────
function ProfessionRow({ prof, onChange, onRemove }) {
  const specs = PROFESSIONS[prof.name] || ['Keine']
  const hasSpecs = specs.length > 1

  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'1fr 80px 1fr auto',
      gap:8,
      alignItems:'center',
      padding:'0.6rem 0',
      borderBottom:'1px solid #1a1208',
    }}>
      {/* Beruf */}
      <select
        value={prof.name}
        onChange={e => onChange({ ...prof, name: e.target.value, specialization: 'Keine' })}
        style={{ fontSize:12 }}
      >
        <optgroup label="Hauptberufe">
          {PRIMARY_PROFS.map(p => <option key={p} value={p}>{p}</option>)}
        </optgroup>
        <optgroup label="Nebenberufe">
          {SECONDARY_PROFS.map(p => <option key={p} value={p}>{p}</option>)}
        </optgroup>
      </select>

      {/* Level */}
      <input
        type="number"
        min={1}
        max={375}
        value={prof.level}
        onChange={e => onChange({ ...prof, level: Math.min(375, Math.max(1, Number(e.target.value))) })}
        placeholder="375"
        style={{ fontSize:12, textAlign:'center' }}
      />

      {/* Spezialisierung */}
      {hasSpecs ? (
        <select
          value={prof.specialization || 'Keine'}
          onChange={e => onChange({ ...prof, specialization: e.target.value })}
          style={{ fontSize:12 }}
        >
          {specs.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      ) : (
        <div style={{ fontSize:11, color:'#3a2c18', fontStyle:'italic', padding:'0 8px' }}>
          Keine Spezialisierung
        </div>
      )}

      {/* Entfernen */}
      <button
        onClick={onRemove}
        style={{
          background:'transparent',
          border:'none',
          color:'#4a2820',
          cursor:'pointer',
          fontSize:14,
          padding:'4px 6px',
          borderRadius:2,
          transition:'color .15s',
        }}
        onMouseEnter={e => e.target.style.color='#c04040'}
        onMouseLeave={e => e.target.style.color='#4a2820'}
        title="Beruf entfernen"
      >
        ✕
      </button>
    </div>
  )
}

// ─── Hauptkomponente ─────────────────────────────────────────────────────────
export default function CharacterView() {
  const { memberData, loading, setCharacterType, setProfessions } = useMemberData()

  const [charTypeSaving, setCharTypeSaving] = useState(false)
  const [profsSaving, setProfsSaving]       = useState(false)
  const [profsSaved, setProfsSaved]         = useState(false)
  const [localProfs, setLocalProfs]         = useState(null)

  // Lokale Berufs-Kopie aus Firestore-Daten initialisieren
  useEffect(() => {
    if (memberData && localProfs === null) {
      setLocalProfs(memberData.professions || [])
    }
  }, [memberData])

  if (loading) {
    return (
      <div style={{ textAlign:'center', padding:'4rem', color:'#5a4828', fontStyle:'italic', fontFamily:'Crimson Text,serif' }}>
        Charakterdaten werden geladen...
      </div>
    )
  }

  if (!memberData) return null

  const clsColor = CLASS_COLORS[memberData.cls] || '#c8a84b'
  const clsIcon  = CLASS_ICONS[memberData.cls]  || '⚔️'
  const charType = memberData.characterType || 'main'
  const profs    = localProfs ?? []

  async function handleCharTypeChange(type) {
    setCharTypeSaving(true)
    await setCharacterType(type)
    setCharTypeSaving(false)
  }

  function addProfession() {
    if (profs.length >= 2 + SECONDARY_PROFS.length) return
    // Berufe die noch nicht gewählt sind vorschlagen
    const used = profs.map(p => p.name)
    const available = [...PRIMARY_PROFS, ...SECONDARY_PROFS].find(p => !used.includes(p))
    if (!available) return
    setLocalProfs([...profs, { name: available, level: 375, specialization: 'Keine' }])
  }

  function updateProfession(idx, updated) {
    const next = [...profs]
    next[idx] = updated
    setLocalProfs(next)
  }

  function removeProfession(idx) {
    setLocalProfs(profs.filter((_, i) => i !== idx))
  }

  async function saveProfs() {
    setProfsSaving(true)
    await setProfessions(profs)
    setProfsSaving(false)
    setProfsSaved(true)
    setTimeout(() => setProfsSaved(false), 2500)
  }

  const primaryCount   = profs.filter(p => PRIMARY_PROFS.includes(p.name)).length
  const canAddPrimary  = primaryCount < 2
  const canAddSecondary = profs.filter(p => SECONDARY_PROFS.includes(p.name)).length < SECONDARY_PROFS.length
  const canAdd = canAddPrimary || canAddSecondary

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

      {/* ── Charakter-Header ── */}
      <Card>
        <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
          {/* Klassen-Icon */}
          <div style={{
            width:64, height:64,
            borderRadius:4,
            background:'#0d0a04',
            border:`1px solid ${clsColor}40`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:28,
            flexShrink:0,
          }}>
            {clsIcon}
          </div>

          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:'0.8rem', flexWrap:'wrap' }}>
              <h1 style={{
                fontFamily:'Cinzel,serif',
                fontSize:22,
                fontWeight:600,
                color: clsColor,
                margin:0,
                letterSpacing:1,
              }}>
                {memberData.name}
              </h1>
              <span style={{
                fontSize:11,
                color:'#5a4828',
                fontFamily:'Cinzel,serif',
                letterSpacing:2,
                textTransform:'uppercase',
              }}>
                {memberData.rank}
              </span>
            </div>

            <div style={{ marginTop:4, display:'flex', gap:'1rem', flexWrap:'wrap' }}>
              <span style={{ fontSize:12, color:'#7a6030' }}>{memberData.cls}</span>
              <span style={{ fontSize:12, color:'#3a2c18' }}>·</span>
              <span style={{ fontSize:12, color:'#7a6030' }}>Spineshatter EU</span>
              <span style={{ fontSize:12, color:'#3a2c18' }}>·</span>
              <span style={{
                fontSize:11,
                color: charType === 'main' ? '#c8a84b' : '#7a6030',
                fontFamily:'Cinzel,serif',
                letterSpacing:1,
                textTransform:'uppercase',
              }}>
                {charType === 'main' ? '⭐ Main' : '🔄 Twink'}
              </span>
            </div>
          </div>

          {/* Status-Badge */}
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:6,
              fontSize:11,
              color: memberData.active ? '#4a9a5a' : '#5a4828',
              fontFamily:'Cinzel,serif',
              letterSpacing:1,
              textTransform:'uppercase',
            }}>
              <span style={{
                width:7, height:7, borderRadius:'50%',
                background: memberData.active ? '#4a9a5a' : '#4a3820',
                display:'inline-block', flexShrink:0,
              }} />
              {memberData.active ? 'Aktiv' : 'Inaktiv'}
            </div>
            <div style={{ fontSize:10, color:'#2e2210', marginTop:4, fontStyle:'italic' }}>
              Seit {memberData.createdAt?.toDate
                ? memberData.createdAt.toDate().toLocaleDateString('de-DE')
                : '—'}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Main / Twink ── */}
      <Card>
        <SectionTitle>Charakter-Typ</SectionTitle>
        <p style={{ fontSize:12, color:'#5a4828', fontStyle:'italic', marginBottom:'1rem', marginTop:0 }}>
          Lege fest ob dieser Charakter dein Main oder ein Twink ist. Diese Information ist für die Raid-Planung relevant.
        </p>
        <CharTypeToggle
          value={charType}
          onChange={handleCharTypeChange}
          saving={charTypeSaving}
        />
        {charTypeSaving && (
          <div style={{ fontSize:11, color:'#7a6030', fontStyle:'italic', marginTop:'.6rem' }}>
            Wird gespeichert...
          </div>
        )}
      </Card>

      {/* ── Berufe ── */}
      <Card>
        <SectionTitle>Berufe</SectionTitle>
        <p style={{ fontSize:12, color:'#5a4828', fontStyle:'italic', marginBottom:'1rem', marginTop:0 }}>
          Trag deine Berufe und Spezialisierungen ein. Max. 2 Hauptberufe.
        </p>

        {profs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'1.5rem', color:'#3a2c18', fontStyle:'italic', fontSize:13 }}>
            Noch keine Berufe eingetragen.
          </div>
        ) : (
          <div style={{ marginBottom:'1rem' }}>
            {/* Header */}
            <div style={{
              display:'grid',
              gridTemplateColumns:'1fr 80px 1fr auto',
              gap:8,
              padding:'0 0 0.4rem',
              borderBottom:'1px solid #2e2210',
              marginBottom:4,
            }}>
              {['Beruf','Level','Spezialisierung',''].map((h, i) => (
                <div key={i} style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase' }}>{h}</div>
              ))}
            </div>

            {profs.map((prof, idx) => (
              <ProfessionRow
                key={idx}
                prof={prof}
                onChange={updated => updateProfession(idx, updated)}
                onRemove={() => removeProfession(idx)}
              />
            ))}
          </div>
        )}

        <div style={{ display:'flex', gap:8, marginTop:'1rem', alignItems:'center' }}>
          {canAdd && (
            <button className="btn-ghost" style={{ fontSize:10 }} onClick={addProfession}>
              + Beruf hinzufügen
            </button>
          )}
          <button
            className="btn-primary"
            style={{ fontSize:11, padding:'7px 18px', marginLeft:'auto' }}
            onClick={saveProfs}
            disabled={profsSaving}
          >
            {profsSaving ? 'Speichern...' : profsSaved ? '✓ Gespeichert' : 'Berufe speichern'}
          </button>
        </div>

        <div style={{ marginTop:'0.8rem', fontSize:11, color:'#2e2210', fontStyle:'italic' }}>
          {primaryCount}/2 Hauptberufe · {profs.filter(p => SECONDARY_PROFS.includes(p.name)).length} Nebenberufe
        </div>
      </Card>

    </div>
  )
}
