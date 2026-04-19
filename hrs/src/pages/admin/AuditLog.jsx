import { useState, useEffect, useCallback } from 'react'
import { fetchLogs } from '../../utils/auditLog'

const CATS = {
  all:    'Alle',
  auth:   'Login',
  user:   'Benutzer',
  rank:   'Ränge',
  site:   'Webseite',
  admin:  'Admin',
  market: 'Marktplatz',
  dkp:    'DKP / Gold',
}

const CAT_COLORS = {
  auth:   '#8050c0',
  user:   '#508060',
  rank:   '#c0a840',
  site:   '#4080c0',
  admin:  '#c05050',
  market: '#c07840',
  dkp:    '#50a0c0',
  other:  '#505050',
}

function ts(timestamp) {
  if (!timestamp) return '—'
  try {
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return d.toLocaleString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' })
  } catch { return '—' }
}

function Details({ d }) {
  if (!d || Object.keys(d).length === 0) return null
  const MAP = { name:'Benutzer', from:'Von', to:'Zu', username:'Benutzername', rank:'Rang', cls:'Klasse', changed:'Geändert', label:'Rang', newUsername:'Neuer Name', secondsLeft:'Gesperrt für (s)' }
  return (
    <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
      {Object.entries(d).map(([k, v]) => (
        <div key={k}>
          <span style={{ fontSize:10, letterSpacing:1.5, color:'#4a3820', textTransform:'uppercase', display:'block', marginBottom:2 }}>
            {MAP[k] || k}
          </span>
          <span style={{ fontSize:13, color:'#a08040' }}>
            {Array.isArray(v) ? v.join(', ') : String(v)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function AuditLog() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat]         = useState('all')
  const [search, setSearch]   = useState('')
  const [expanded, setExpanded] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchLogs({ limitCount: 200, category: cat === 'all' ? null : cat })
    setLogs(data)
    setLoading(false)
  }, [cat])

  useEffect(() => { load() }, [load])

  const filtered = logs.filter(l => {
    if (!search) return true
    const s = search.toLowerCase()
    return l.label?.toLowerCase().includes(s) ||
      l.performedBy?.toLowerCase().includes(s) ||
      JSON.stringify(l.details || {}).toLowerCase().includes(s)
  })

  const badge = (category) => {
    const color = CAT_COLORS[category] || CAT_COLORS.other
    return (
      <span style={{ background:`${color}22`, border:`1px solid ${color}66`, color, fontSize:9, fontFamily:'Cinzel,serif', letterSpacing:'1.5px', padding:'2px 8px', borderRadius:2, textTransform:'uppercase', whiteSpace:'nowrap' }}>
        {CATS[category] || category}
      </span>
    )
  }

  return (
    <div>
      <div className="section-title">Audit-Log</div>
      <p style={{ fontSize:13, color:'#7a6030', fontStyle:'italic', marginBottom:'1.2rem' }}>
        Alle Änderungen werden automatisch und unveränderlich protokolliert. Einträge können nicht gelöscht werden.
      </p>

      {/* Toolbar */}
      <div style={{ display:'flex', gap:10, marginBottom:'.8rem', alignItems:'center' }}>
        <input placeholder="Suche nach Aktion, Benutzer, Details..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn-ghost" style={{ fontSize:10, padding:'8px 14px' }} onClick={load}>↻</button>
      </div>

      {/* Kategorie-Filter */}
      <div style={{ display:'flex', gap:6, marginBottom:'1.2rem', flexWrap:'wrap' }}>
        {Object.entries(CATS).map(([key, label]) => (
          <button key={key} onClick={() => setCat(key)}
            style={{ background: cat===key ? 'rgba(200,168,75,.12)' : 'transparent', border:`1px solid ${cat===key ? '#c8a84b' : '#2e2210'}`, color: cat===key ? '#f0d080' : '#5a4828', fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:'1.5px', padding:'5px 11px', cursor:'pointer', borderRadius:2, textTransform:'uppercase', transition:'all .15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Einträge */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'2rem', color:'#7a6030', fontStyle:'italic' }}>Lade Einträge...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'2rem', color:'#5a4828', fontStyle:'italic' }}>Keine Einträge gefunden.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          {filtered.map(entry => {
            const hasDetails = entry.details && Object.keys(entry.details).length > 0
            const open = expanded === entry.id
            return (
              <div key={entry.id} style={{ background: open ? 'rgba(200,168,75,.04)' : '#0f0c06', border:`1px solid ${open ? '#3a2c18' : '#1e1608'}`, borderRadius:2 }}>
                <div onClick={() => hasDetails && setExpanded(open ? null : entry.id)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 12px', cursor: hasDetails ? 'pointer' : 'default', flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, color:'#4a3820', fontFamily:'monospace', flexShrink:0, minWidth:135 }}>{ts(entry.timestamp)}</span>
                  {badge(entry.category)}
                  <span style={{ fontSize:13, color:'#c8a84b', flex:1, minWidth:100 }}>{entry.label}</span>
                  <span style={{ fontSize:12, color:'#5a4828', fontStyle:'italic', flexShrink:0 }}>
                    von <span style={{ color:'#8a6830' }}>{entry.performedBy || '—'}</span>
                  </span>
                  {hasDetails && (
                    <span style={{ color:'#3a2c18', fontSize:10, flexShrink:0, transition:'transform .2s', display:'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0)' }}>▶</span>
                  )}
                </div>
                {open && hasDetails && (
                  <div style={{ borderTop:'1px solid #1e1608', padding:'8px 12px 10px 165px', background:'rgba(0,0,0,.25)' }}>
                    <Details d={entry.details} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop:'1rem', fontSize:11, color:'#2e2210', fontStyle:'italic' }}>
        {filtered.length} von {logs.length} Einträgen · schreibgeschützt · max. 200 pro Abfrage
      </div>
    </div>
  )
}
