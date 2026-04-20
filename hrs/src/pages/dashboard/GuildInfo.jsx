import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { useGuildInfo } from '../../hooks/useGuildInfo'

// Einfacher Markdown-ähnlicher Renderer (nur für Fett, Überschriften, Listen)
function SimpleMarkdown({ text, t }) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <div style={{ lineHeight:1.8, fontSize:14, color:t.textPrimary }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return (
          <div key={i} style={{ fontFamily:'Cinzel,serif', fontSize:13, color:t.accent, letterSpacing:1, marginTop:'1.2rem', marginBottom:'0.4rem', paddingBottom:'0.3rem', borderBottom:`1px solid ${t.accentFade}` }}>
            {line.slice(3)}
          </div>
        )
        if (line.startsWith('# ')) return (
          <div key={i} style={{ fontFamily:'Cinzel,serif', fontSize:16, color:t.accentSoft, fontWeight:600, letterSpacing:1, marginBottom:'0.6rem' }}>
            {line.slice(2)}
          </div>
        )
        if (line.startsWith('- ')) return (
          <div key={i} style={{ display:'flex', gap:8, marginBottom:2 }}>
            <span style={{ color:t.accent, flexShrink:0 }}>·</span>
            <span>{renderBold(line.slice(2), t)}</span>
          </div>
        )
        if (line === '') return <div key={i} style={{ height:'0.5rem' }} />
        return <div key={i} style={{ marginBottom:2 }}>{renderBold(line, t)}</div>
      })}
    </div>
  )
}

function renderBold(text, t) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color:t.accentSoft, fontWeight:600 }}>{part}</strong>
      : <span key={i}>{part}</span>
  )
}

function Card({ children, t, style={} }) {
  return <div style={{ background:t.cardBg, border:`1px solid ${t.accentFade}`, borderRadius:4, padding:'1.4rem', ...style }}>{children}</div>
}
function STitle({ children, t }) {
  return <div style={{ fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:3, color:t.accentDim, textTransform:'uppercase', marginBottom:'0.8rem', paddingBottom:'0.5rem', borderBottom:`1px solid ${t.accentFade}` }}>{children}</div>
}

export default function GuildInfo() {
  const { currentUser } = useAuth()
  const t = useTheme()
  const { info, loading, saveGuildInfo } = useGuildInfo()

  const isAdmin = currentUser?.role === 'admin'
  const [editing, setEditing]   = useState(false)
  const [localInfo, setLocalInfo] = useState(null)
  const [busy, setBusy]           = useState(false)
  const [saved, setSaved]         = useState(false)

  useEffect(() => { if (info) setLocalInfo({ ...info }) }, [info])

  async function handleSave() {
    setBusy(true)
    await saveGuildInfo(localInfo, currentUser?.username)
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    setEditing(false)
  }

  if (loading || !localInfo) return (
    <div style={{ textAlign:'center', padding:'4rem', color:t.accentDim, fontStyle:'italic' }}>Lade Gilden-Info...</div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>

      {/* Header */}
      <Card t={t} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontFamily:'Cinzel,serif', fontSize:20, fontWeight:600, color:t.accentSoft, margin:0, letterSpacing:1 }}>Gilden-Info</h1>
          <div style={{ fontSize:12, color:t.textSecondary, marginTop:3 }}>Regeln, Raidzeiten und Kontakt</div>
        </div>
        {isAdmin && !editing && (
          <button className="btn-ghost" style={{ fontSize:10 }} onClick={() => setEditing(true)}>✏️ Bearbeiten</button>
        )}
        {isAdmin && editing && (
          <div style={{ display:'flex', gap:8 }}>
            {saved && <span style={{ fontSize:11, color:'#4a9a5a', fontStyle:'italic', alignSelf:'center' }}>✓ Gespeichert</span>}
            <button className="btn-ghost" style={{ fontSize:10 }} onClick={() => { setEditing(false); setLocalInfo({...info}) }}>Abbrechen</button>
            <button className="btn-primary" style={{ fontSize:11 }} onClick={handleSave} disabled={busy}>{busy?'Speichern...':'Speichern'}</button>
          </div>
        )}
      </Card>

      {/* Schnellinfo */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'0.8rem' }}>
        {[
          { icon:'⚔️', label:'Raidzeiten', key:'raidTimes', placeholder:'z.B. Mi & Do · 20:00 – 23:00 CEST' },
          { icon:'💬', label:'Discord', key:'discord', placeholder:'discord.gg/...' },
          { icon:'📬', label:'Kontakt', key:'contact', placeholder:'z.B. Gildenleiter ingame anschreiben' },
        ].map(item => (
          <Card key={item.key} t={t} style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
            <span style={{ fontSize:22, flexShrink:0, marginTop:2 }}>{item.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, color:t.accentDim, textTransform:'uppercase', marginBottom:4 }}>{item.label}</div>
              {editing
                ? <input value={localInfo[item.key]||''} onChange={e=>setLocalInfo(prev=>({...prev,[item.key]:e.target.value}))} placeholder={item.placeholder} style={{ fontSize:13, width:'100%', boxSizing:'border-box' }} />
                : <div style={{ fontSize:13, color:t.textPrimary }}>{info[item.key]||<span style={{ color:t.textMuted, fontStyle:'italic' }}>Nicht gesetzt</span>}</div>
              }
            </div>
          </Card>
        ))}
      </div>

      {/* Regeln / Info-Text */}
      <Card t={t}>
        <STitle t={t}>Regeln & Informationen</STitle>
        {editing ? (
          <div>
            <div style={{ fontSize:11, color:t.textMuted, fontStyle:'italic', marginBottom:8 }}>
              Markdown wird unterstützt: # Überschrift, ## Unterüberschrift, **fett**, - Liste
            </div>
            <textarea
              value={localInfo.rules||''}
              onChange={e=>setLocalInfo(prev=>({...prev,rules:e.target.value}))}
              style={{ minHeight:400, width:'100%', boxSizing:'border-box', fontSize:13, fontFamily:'monospace' }}
            />
          </div>
        ) : (
          <SimpleMarkdown text={info.rules} t={t} />
        )}
      </Card>
    </div>
  )
}
