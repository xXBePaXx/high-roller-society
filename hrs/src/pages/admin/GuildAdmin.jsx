import { useState, useEffect } from 'react'
import { useGuildInfo } from '../../hooks/useGuildInfo'
import { useTheme } from '../../hooks/useTheme'

function Lbl({ children, t }) {
  return <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:t.textMuted, textTransform:'uppercase', marginBottom:5 }}>{children}</div>
}

function Card({ children, t, style={} }) {
  return (
    <div style={{ background:t.cardBg, border:`1px solid ${t.accentFade}`, borderRadius:4, padding:'1.2rem 1.4rem', ...style }}>
      {children}
    </div>
  )
}

function STitle({ children, t }) {
  return (
    <div style={{ fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:3, color:t.accentDim, textTransform:'uppercase', marginBottom:'1rem', paddingBottom:'0.5rem', borderBottom:`1px solid ${t.accentFade}` }}>
      {children}
    </div>
  )
}

export default function GuildAdmin() {
  const t = useTheme()
  const { info, loading, saveGuildInfo } = useGuildInfo()

  const [form,  setForm]  = useState(null)
  const [busy,  setBusy]  = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { if (info) setForm({ ...info }) }, [info])

  const upd = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  async function handleSave() {
    setBusy(true)
    await saveGuildInfo(form)
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading || !form) return (
    <div style={{ textAlign:'center', padding:'4rem', color:t.accentDim, fontStyle:'italic' }}>Lade...</div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div className="section-title">Gilden-Info</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {saved && <span style={{ fontSize:11, color:'#4a9a5a', fontStyle:'italic' }}>✓ Gespeichert</span>}
          <button className="btn-ghost" style={{ fontSize:10 }} onClick={() => setForm({ ...info })}>Zurücksetzen</button>
          <button className="btn-primary" style={{ fontSize:11 }} onClick={handleSave} disabled={busy}>
            {busy ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* Schnellinfos */}
      <Card t={t}>
        <STitle t={t}>⚡ Schnellinfos</STitle>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          <div>
            <Lbl t={t}>⚔️ Raidzeiten</Lbl>
            <input
              value={form.raidTimes || ''}
              onChange={e => upd('raidTimes', e.target.value)}
              placeholder="z.B. Mittwoch & Donnerstag · 20:00 – 23:00 Uhr CEST"
              style={{ fontSize:13, width:'100%', boxSizing:'border-box' }}
            />
          </div>

          <div>
            <Lbl t={t}>💬 Discord</Lbl>
            <input
              value={form.discord || ''}
              onChange={e => upd('discord', e.target.value)}
              placeholder="z.B. discord.gg/deinserver"
              style={{ fontSize:13, width:'100%', boxSizing:'border-box' }}
            />
          </div>

          <div>
            <Lbl t={t}>📬 Kontakt</Lbl>
            <input
              value={form.contact || ''}
              onChange={e => upd('contact', e.target.value)}
              placeholder="z.B. Gildenmeister ingame anschreiben"
              style={{ fontSize:13, width:'100%', boxSizing:'border-box' }}
            />
          </div>

        </div>
      </Card>

      {/* Regeln & Info-Text */}
      <Card t={t}>
        <STitle t={t}>📜 Regeln & Informationen</STitle>
        <div style={{ fontSize:11, color:t.textMuted, fontStyle:'italic', marginBottom:10 }}>
          Markdown wird unterstützt: <code style={{ color:t.accentDim }}># Überschrift</code> · <code style={{ color:t.accentDim }}>## Unterüberschrift</code> · <code style={{ color:t.accentDim }}>**fett**</code> · <code style={{ color:t.accentDim }}>- Liste</code>
        </div>
        <textarea
          value={form.rules || ''}
          onChange={e => upd('rules', e.target.value)}
          style={{
            minHeight: 500,
            width: '100%',
            boxSizing: 'border-box',
            fontSize: 13,
            fontFamily: 'monospace',
            lineHeight: 1.6,
          }}
        />
      </Card>

      {/* Vorschau */}
      <Card t={t}>
        <STitle t={t}>👁️ Vorschau (so sehen es die Mitglieder)</STitle>
        <div style={{ lineHeight:1.8, fontSize:14, color:t.textPrimary }}>
          {(form.rules || '').split('\n').map((line, i) => {
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
                <span>{line.slice(2)}</span>
              </div>
            )
            if (line === '') return <div key={i} style={{ height:'0.5rem' }} />
            return <div key={i} style={{ marginBottom:2 }}>{line}</div>
          })}
        </div>
      </Card>

    </div>
  )
}
