import { useState, useEffect } from 'react'
import { useRanks } from '../../hooks/useRanks'

export default function Ranks() {
  const { ranks, saveRanks, addRank, deleteRank } = useRanks()
  const [local, setLocal]   = useState([])
  const [flash, setFlash]   = useState(false)
  const [busy, setBusy]     = useState(false)

  useEffect(() => { setLocal(ranks) }, [ranks])

  function rename(idx, val) {
    setLocal(prev => prev.map((r, i) => i === idx ? { ...r, label: val } : r))
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
      <p style={{ fontSize:13, color:'#7a6030', fontStyle:'italic', marginBottom:'1.4rem' }}>
        Ränge umbenennen ohne Benutzer zu verlieren. Rang 1 = höchster Rang. Mindestens ein Rang muss immer existieren.
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:'1.4rem' }}>
        {local.map((r, i) => (
          <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, background:'#1a1208', border:'1px solid #2e2210', borderRadius:2, padding:'8px 12px' }}>
            <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'#4a3820', width:18, textAlign:'center', flexShrink:0 }}>{i + 1}</span>
            <span style={{ width:10, height:10, borderRadius:'50%', background:r.color, flexShrink:0 }} />
            <input value={r.label} onChange={e => rename(i, e.target.value)}
              style={{ flex:1, background:'transparent', border:'none', borderBottom:'1px solid #3a2c18', color:'#f0d080', fontFamily:'Crimson Text,serif', fontSize:14, padding:'2px 4px', outline:'none', borderRadius:0 }} />
            {i === 0
              ? <span style={{ fontSize:11, color:'#4a3820', fontStyle:'italic', flexShrink:0 }}>Höchster</span>
              : <button className="btn-icon danger" onClick={() => deleteRank(r.id)} title="Rang löschen">✕</button>
            }
          </div>
        ))}
      </div>

      <button onClick={addRank}
        style={{ width:'100%', background:'none', border:'1px dashed #2e2210', color:'#5a4828', fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:2, padding:10, cursor:'pointer', borderRadius:2, textTransform:'uppercase', marginBottom:'1.4rem', transition:'all .15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='#c8a84b'; e.currentTarget.style.color='#c8a84b' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='#2e2210'; e.currentTarget.style.color='#5a4828' }}
      >
        + Neuen Rang hinzufügen
      </button>

      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button className="btn-primary" onClick={handleSave} disabled={busy}>
          {busy ? 'Speichern...' : 'Ränge speichern'}
        </button>
        <span className={`save-flash ${flash ? 'on' : ''}`}>✓ Gespeichert & geloggt</span>
      </div>
    </div>
  )
}
