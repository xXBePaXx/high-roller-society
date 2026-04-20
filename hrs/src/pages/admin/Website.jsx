import { useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const EMOJIS = ['🎰','⚔️','🛡️','🐉','💀','🔥','👑','💎','🎲','🗡️','🏹','🧙','⚡','🌙','✨','🔮','🌟','🎯','🗺️']

const FONTS = [
  { id: 'cinzel',        label: 'Cinzel',           css: "'Cinzel', serif" },
  { id: 'uncial',        label: 'Uncial Antiqua',   css: "'Uncial Antiqua', cursive" },
  { id: 'medievalsharp', label: 'MedievalSharp',    css: "'MedievalSharp', serif" },
  { id: 'almendra',      label: 'Almendra',         css: "'Almendra', serif" },
  { id: 'im_fell',       label: 'IM Fell English',  css: "'IM Fell English', serif" },
]

// Standard-Themes pro Phase — vollständige Farbpalette
const DEFAULT_PHASE_THEMES = {
  phase1: {
    label:       'Phase 1 — T4 / Karazhan',
    accent:      '#c8a84b',
    accentSoft:  '#f0d080',
    accentDim:   '#7a6030',
    accentFade:  '#4a3820',
    accentGhost: '#2e2210',
    bgDark:      '#0d0a04',
    bgMid:       '#1a1208',
    textColor:   '#f0d080',
    font:        'cinzel',
  },
  phase2: {
    label:       'Phase 2 — T5 / SSC & TK',
    accent:      '#38b8c8',
    accentSoft:  '#7ae0ee',
    accentDim:   '#2a7a88',
    accentFade:  '#1a4858',
    accentGhost: '#0e2830',
    bgDark:      '#050e12',
    bgMid:       '#08141a',
    textColor:   '#7ae0ee',
    font:        'cinzel',
  },
  phase3: {
    label:       'Phase 3 — T6 / Black Temple',
    accent:      '#48c848',
    accentSoft:  '#88ee88',
    accentDim:   '#2a7830',
    accentFade:  '#1a3820',
    accentGhost: '#0e2010',
    bgDark:      '#040a04',
    bgMid:       '#080f08',
    textColor:   '#88ee88',
    font:        'cinzel',
  },
  phase4: {
    label:       'Phase 4 — T6.5 / Sunwell',
    accent:      '#e87830',
    accentSoft:  '#f8b060',
    accentDim:   '#a04818',
    accentFade:  '#602808',
    accentGhost: '#381808',
    bgDark:      '#0d0502',
    bgMid:       '#180a04',
    textColor:   '#f8b060',
    font:        'cinzel',
  },
}

function Label({ children }) {
  return <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase', marginBottom:5 }}>{children}</div>
}
function Section({ children, style={} }) {
  return <div style={{ background:'#120e06', border:'1px solid #2e2210', borderRadius:4, padding:'1.4rem', marginBottom:'1rem', ...style }}>{children}</div>
}
function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom:'1.2rem' }}>
      <div style={{ fontFamily:'Cinzel,serif', fontSize:13, color:'#c8a84b', letterSpacing:2, fontWeight:600 }}>{children}</div>
      {sub && <div style={{ fontSize:11, color:'#4a3820', marginTop:3, fontStyle:'italic' }}>{sub}</div>}
    </div>
  )
}
function SaveBar({ onSave, saving, saved }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:'1rem' }}>
      <button className="btn-primary" onClick={onSave} disabled={saving} style={{ fontSize:11 }}>
        {saving ? 'Speichern...' : 'Speichern'}
      </button>
      {saved && <span style={{ fontSize:11, color:'#4a9a5a', fontStyle:'italic' }}>✓ Gespeichert</span>}
    </div>
  )
}

function ColorRow({ label, value, onChange }) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ width:40, height:32, borderRadius:3, border:'1px solid #2e2210', background:'transparent', cursor:'pointer', padding:2, flexShrink:0 }} />
        <input value={value} onChange={e => onChange(e.target.value)}
          style={{ width:90, fontSize:11, fontFamily:'monospace' }} />
        <div style={{ width:32, height:32, borderRadius:3, background:value, border:'1px solid #2e2210', flexShrink:0 }} />
      </div>
    </div>
  )
}

export default function Website() {
  const { settings, saveSettings } = useAuth()

  // ── Identität ─────────────────────────────────────────────────────────────
  const [identity, setIdentity] = useState({
    guildName1: settings.guildName1 || 'High Roller',
    guildName2: settings.guildName2 || 'Society',
    guildSub:   settings.guildSub   || '',
    realm:      settings.realm      || '',
    emoji:      settings.emoji      || '🎰',
    logoUrl:    settings.logoUrl    || '',
  })

  // ── Texte ─────────────────────────────────────────────────────────────────
  const [texts, setTexts] = useState({
    tagline: settings.tagline || '',
    footer:  settings.footer  || '',
    server:  settings.server  || '',
  })

  // ── Statistiken ───────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    stat1n: settings.stat1n||'', stat1l: settings.stat1l||'',
    stat2n: settings.stat2n||'', stat2l: settings.stat2l||'',
    stat3n: settings.stat3n||'', stat3l: settings.stat3l||'',
  })

  // ── Theme: aktive Phase + alle gespeicherten Phase-Styles ─────────────────
  const [activePhase, setActivePhase] = useState(settings.phase || 'phase1')

  // phaseStyles: { phase1: {...farben}, phase2: {...}, ... }
  // Lädt gespeicherte Custom-Styles aus settings, fällt auf Defaults zurück
  const [phaseStyles, setPhaseStyles] = useState(() => {
    const stored = settings.phaseStyles || {}
    const result = {}
    Object.keys(DEFAULT_PHASE_THEMES).forEach(key => {
      result[key] = { ...DEFAULT_PHASE_THEMES[key], ...(stored[key] || {}) }
    })
    return result
  })

  const [saving, setSaving] = useState({})
  const [saved,  setSaved]  = useState({})

  async function saveSection(key, data) {
    setSaving(s => ({ ...s, [key]:true }))
    await saveSettings({ ...settings, ...data }, Object.keys(data))
    setSaving(s => ({ ...s, [key]:false }))
    setSaved(s => ({ ...s, [key]:true }))
    setTimeout(() => setSaved(s => ({ ...s, [key]:false })), 2500)
  }

  // Phase-Style für aktuell bearbeitete Phase
  const currentStyle = phaseStyles[activePhase] || DEFAULT_PHASE_THEMES[activePhase]

  function updateCurrentStyle(field, value) {
    setPhaseStyles(prev => ({
      ...prev,
      [activePhase]: { ...prev[activePhase], [field]: value }
    }))
  }

  function resetPhaseToDefault() {
    setPhaseStyles(prev => ({
      ...prev,
      [activePhase]: { ...DEFAULT_PHASE_THEMES[activePhase] }
    }))
  }

  async function saveTheme() {
    await saveSection('theme', {
      phase: activePhase,
      phaseStyles,
      // Für Landing.jsx Rückwärtskompatibilität — aktive Phase direkt eingebettet
      ...currentStyle,
    })
  }

  // ── Icon-Upload ───────────────────────────────────────────────────────────
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  async function handleIconUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setUploadErr('Nur Bilder erlaubt (PNG/JPG/SVG/WebP).'); return }
    if (file.size > 512 * 1024) { setUploadErr('Max. 512 KB — bitte Bild verkleinern.'); return }
    setUploading(true); setUploadErr('')
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('Lesen fehlgeschlagen'))
        reader.readAsDataURL(file)
      })
      setIdentity(prev => ({ ...prev, logoUrl: base64, emoji: '' }))
    } catch (err) {
      setUploadErr('Upload fehlgeschlagen: ' + err.message)
    }
    setUploading(false)
  }

  return (
    <div>
      <div className="section-title">Webseite</div>
      <p style={{ fontSize:12, color:'#5a4828', fontStyle:'italic', marginBottom:'1.4rem' }}>
        Alle Einstellungen für die öffentliche Landing-Page an einem Ort.
      </p>

      {/* ── 1. IDENTITÄT ── */}
      <Section>
        <SectionTitle sub="Name, Untertitel und Logo der Gilde">Identität</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          {[['Gildenname — Zeile 1','guildName1'],['Gildenname — Zeile 2 (optional)','guildName2'],['Untertitel','guildSub'],['Realm-Tag','realm']].map(([lbl, key]) => (
            <div key={key}>
              <Label>{lbl}</Label>
              <input value={identity[key]} onChange={e => setIdentity({ ...identity, [key]: e.target.value })} style={{ width:'100%', boxSizing:'border-box', fontSize:13 }} />
            </div>
          ))}
        </div>
        <Label>Logo / Icon</Label>
        <div style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontSize:11, color:'#4a3820', marginBottom:6, fontStyle:'italic' }}>Emoji wählen:</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {EMOJIS.map(e => (
                <span key={e} onClick={() => setIdentity({ ...identity, emoji:e, logoUrl:'' })}
                  style={{ fontSize:22, cursor:'pointer', padding:'4px 6px', borderRadius:3, transition:'all .15s',
                    border:`1px solid ${identity.emoji===e && !identity.logoUrl ? '#c8a84b' : 'transparent'}`,
                    background: identity.emoji===e && !identity.logoUrl ? 'rgba(200,168,75,.1)' : 'transparent' }}>
                  {e}
                </span>
              ))}
            </div>
          </div>
          <div style={{ flexShrink:0 }}>
            <div style={{ fontSize:11, color:'#4a3820', marginBottom:6, fontStyle:'italic' }}>Eigenes Bild:</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {identity.logoUrl && (
                <div style={{ width:48, height:48, borderRadius:'50%', overflow:'hidden', border:'1px solid #3a2c18', flexShrink:0 }}>
                  <img src={identity.logoUrl} alt="Logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
              )}
              <button className="btn-ghost" style={{ fontSize:10 }} onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Lädt...' : identity.logoUrl ? 'Ändern' : '+ Hochladen'}
              </button>
              {identity.logoUrl && <button className="btn-ghost" style={{ fontSize:10, color:'#8a3020' }} onClick={() => setIdentity({ ...identity, logoUrl:'', emoji:'🎰' })}>Entfernen</button>}
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleIconUpload} />
            </div>
            {uploadErr && <div style={{ fontSize:10, color:'#e08080', marginTop:4 }}>{uploadErr}</div>}
            <div style={{ fontSize:10, color:'#2e2210', marginTop:4, fontStyle:'italic' }}>Max. 512 KB · PNG/JPG/SVG</div>
          </div>
        </div>
        <SaveBar onSave={() => saveSection('identity', identity)} saving={saving.identity} saved={saved.identity} />
      </Section>

      {/* ── 2. TEXTE ── */}
      <Section>
        <SectionTitle sub="Tagline, Footer und Server-Info">Texte</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div>
            <Label>Tagline (Zeilenumbruch mit Enter)</Label>
            <textarea value={texts.tagline} onChange={e => setTexts({ ...texts, tagline:e.target.value })} style={{ minHeight:80, width:'100%', boxSizing:'border-box', fontSize:13 }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><Label>Footer-Text</Label><input value={texts.footer} onChange={e => setTexts({ ...texts, footer:e.target.value })} style={{ width:'100%', boxSizing:'border-box', fontSize:13 }} /></div>
            <div><Label>Server-Tag</Label><input value={texts.server} onChange={e => setTexts({ ...texts, server:e.target.value })} style={{ width:'100%', boxSizing:'border-box', fontSize:13 }} /></div>
          </div>
        </div>
        <SaveBar onSave={() => saveSection('texts', texts)} saving={saving.texts} saved={saved.texts} />
      </Section>

      {/* ── 3. STATISTIKEN ── */}
      <Section>
        <SectionTitle sub="Die drei Kennzahlen auf der Landing-Page">Statistiken</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {[['stat1n','stat1l'],['stat2n','stat2l'],['stat3n','stat3l']].map(([nk,lk],i) => (
            <div key={i} style={{ background:'#0d0a04', border:'1px solid #1e1808', borderRadius:3, padding:'10px 12px' }}>
              <Label>Wert</Label>
              <input value={stats[nk]} onChange={e => setStats({ ...stats, [nk]:e.target.value })}
                style={{ width:'100%', boxSizing:'border-box', fontFamily:'Cinzel,serif', fontSize:18, color:'#f0d080', background:'transparent', border:'none', borderBottom:'1px solid #2e2210', textAlign:'center', outline:'none', marginBottom:6 }} />
              <Label>Beschriftung</Label>
              <input value={stats[lk]} onChange={e => setStats({ ...stats, [lk]:e.target.value })}
                style={{ width:'100%', boxSizing:'border-box', fontSize:11, color:'#7a6030', background:'transparent', border:'none', textAlign:'center', outline:'none', letterSpacing:2, textTransform:'uppercase' }} />
            </div>
          ))}
        </div>
        <SaveBar onSave={() => saveSection('stats', stats)} saving={saving.stats} saved={saved.stats} />
      </Section>

      {/* ── 4. THEME ── */}
      <Section>
        <SectionTitle sub="Pro Phase individuell anpassbar — Farben, Hintergrund, Schrift">Phase & Theme</SectionTitle>

        {/* Phase-Auswahl */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:6, marginBottom:'1.4rem' }}>
          {Object.entries(DEFAULT_PHASE_THEMES).map(([key, def]) => {
            const style   = phaseStyles[key] || def
            const active  = activePhase === key
            const isLive  = (settings.phase || 'phase1') === key
            return (
              <div key={key} onClick={() => setActivePhase(key)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:3, cursor:'pointer',
                  background: active ? '#1a1208' : '#0d0a04',
                  border:`1px solid ${active ? style.accent : '#1e1808'}`,
                  transition:'all .2s',
                  boxShadow: active ? `0 0 10px ${style.accent}20` : 'none',
                }}>
                {/* Farbvorschau */}
                <div style={{ display:'flex', flexDirection:'column', gap:2, flexShrink:0 }}>
                  <div style={{ display:'flex', gap:2 }}>
                    <div style={{ width:20, height:10, borderRadius:1, background:style.bgDark }} />
                    <div style={{ width:10, height:10, borderRadius:1, background:style.accent }} />
                    <div style={{ width:10, height:10, borderRadius:1, background:style.accentSoft }} />
                  </div>
                  <div style={{ display:'flex', gap:2 }}>
                    <div style={{ width:20, height:6, borderRadius:1, background:style.bgMid }} />
                    <div style={{ width:20, height:6, borderRadius:1, background:style.accentFade }} />
                  </div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color: active ? '#f0d080' : '#7a6030', letterSpacing:0.5 }}>{def.label.split('—')[0].trim()}</span>
                    {isLive && <span style={{ fontSize:8, color:style.accent, background:`${style.accent}20`, border:`1px solid ${style.accent}40`, borderRadius:2, padding:'1px 5px', fontFamily:'Cinzel,serif', letterSpacing:1, flexShrink:0 }}>LIVE</span>}
                  </div>
                </div>
                <div style={{ width:14, height:14, borderRadius:'50%', border:`2px solid ${active ? style.accent : '#3a2c18'}`, background: active ? style.accent : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {active && <span style={{ color:'#0d0a04', fontSize:8, fontWeight:700 }}>✓</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Farb-Editor für aktive Phase */}
        <div style={{ background:'#0d0a04', border:'1px solid #1e1808', borderRadius:3, padding:'1.2rem', marginBottom:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:11, color:'#c8a84b', letterSpacing:1 }}>
              {currentStyle.label} — Anpassen
            </div>
            <button className="btn-ghost" style={{ fontSize:9 }} onClick={resetPhaseToDefault}>
              ↺ Auf Standard zurücksetzen
            </button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:12 }}>
            <ColorRow label="Hintergrund (dunkel)"  value={currentStyle.bgDark}      onChange={v => updateCurrentStyle('bgDark', v)} />
            <ColorRow label="Hintergrund (mittel)"  value={currentStyle.bgMid}       onChange={v => updateCurrentStyle('bgMid', v)} />
            <ColorRow label="Akzentfarbe"           value={currentStyle.accent}      onChange={v => updateCurrentStyle('accent', v)} />
            <ColorRow label="Akzent hell (Titel)"   value={currentStyle.accentSoft}  onChange={v => updateCurrentStyle('accentSoft', v)} />
            <ColorRow label="Akzent mittel (Text)"  value={currentStyle.accentDim}   onChange={v => updateCurrentStyle('accentDim', v)} />
            <ColorRow label="Akzent gedimmt"        value={currentStyle.accentFade}  onChange={v => updateCurrentStyle('accentFade', v)} />
            <ColorRow label="Akzent Schatten"       value={currentStyle.accentGhost} onChange={v => updateCurrentStyle('accentGhost', v)} />
            <ColorRow label="Titelfarbe"            value={currentStyle.textColor}   onChange={v => updateCurrentStyle('textColor', v)} />
          </div>

          {/* Live-Vorschau-Streifen */}
          <div style={{ borderRadius:3, overflow:'hidden', border:'1px solid #2e2210' }}>
            <div style={{ height:4, background:`linear-gradient(90deg,transparent,${currentStyle.accent},${currentStyle.accentSoft},${currentStyle.accent},transparent)` }} />
            <div style={{ background:`linear-gradient(180deg,${currentStyle.bgMid},${currentStyle.bgDark})`, padding:'1rem', display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', border:`2px solid ${currentStyle.accent}`, background:`radial-gradient(circle,${currentStyle.bgMid},${currentStyle.bgDark})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎰</div>
              <div>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:16, color:currentStyle.accentSoft, letterSpacing:1 }}>High Roller Society</div>
                <div style={{ fontSize:10, color:currentStyle.accentDim, letterSpacing:3, textTransform:'uppercase', marginTop:2 }}>Raiding Guild · Spineshatter EU</div>
              </div>
              <div style={{ marginLeft:'auto', padding:'8px 20px', border:`1px solid ${currentStyle.accent}`, color:currentStyle.accentSoft, background:`linear-gradient(135deg,${currentStyle.accentFade},${currentStyle.accentGhost})`, borderRadius:2, fontSize:11, fontFamily:'Cinzel,serif', letterSpacing:2, textTransform:'uppercase' }}>
                Einloggen
              </div>
            </div>
            <div style={{ height:4, background:`linear-gradient(90deg,transparent,${currentStyle.accent},${currentStyle.accentSoft},${currentStyle.accent},transparent)` }} />
          </div>
        </div>

        {/* Schriftart pro Phase */}
        <div style={{ marginBottom:'1rem' }}>
          <Label>Schriftart für diese Phase</Label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:4 }}>
            {FONTS.map(f => (
              <div key={f.id} onClick={() => updateCurrentStyle('font', f.id)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:3, cursor:'pointer',
                  background: currentStyle.font===f.id ? 'rgba(200,168,75,.06)' : '#0d0a04',
                  border:`1px solid ${currentStyle.font===f.id ? '#c8a84b' : '#1e1808'}`,
                  transition:'all .2s' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:f.css, fontSize:15, color:'#f0d080' }}>High Roller Society</div>
                  <div style={{ fontSize:9, color:'#3a2c18', marginTop:2 }}>{f.label}</div>
                </div>
                <div style={{ width:14, height:14, borderRadius:'50%', border:`2px solid ${currentStyle.font===f.id ? '#c8a84b' : '#3a2c18'}`, background: currentStyle.font===f.id ? '#c8a84b' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {currentStyle.font===f.id && <span style={{ color:'#0d0a04', fontSize:8, fontWeight:700 }}>✓</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize:11, color:'#3a2c18', fontStyle:'italic', marginBottom:'0.8rem' }}>
          💡 Änderungen gelten nur für <strong style={{ color:'#5a4828' }}>{currentStyle.label.split('—')[0].trim()}</strong>. Jede Phase speichert ihre eigenen Farben und Schriften.
        </div>

        <SaveBar onSave={saveTheme} saving={saving.theme} saved={saved.theme} />
      </Section>
    </div>
  )
}
