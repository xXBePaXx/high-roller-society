import { useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const EMOJIS = ['🎰','⚔️','🛡️','🐉','💀','🔥','👑','💎','🎲','🗡️','🏹','🧙','⚡','🌙','✨','🔮','🌟','🎯','🗺️']

const FONTS = [
  { id: 'cinzel',        label: 'Cinzel',          css: "'Cinzel', serif" },
  { id: 'uncial',        label: 'Uncial Antiqua',  css: "'Uncial Antiqua', cursive" },
  { id: 'medievalsharp', label: 'MedievalSharp',   css: "'MedievalSharp', serif" },
  { id: 'almendra',      label: 'Almendra',        css: "'Almendra', serif" },
  { id: 'im_fell',       label: 'IM Fell English', css: "'IM Fell English', serif" },
]

// Alle vordefinierten Themes — unveränderlich als Basis
const PRESET_THEMES = {
  phase1: {
    label: 'Phase 1 — T4 / Karazhan',
    accent: '#c8a84b', accentSoft: '#f0d080', accentDim: '#7a6030',
    accentFade: '#4a3820', accentGhost: '#2e2210',
    bgDark: '#0d0a04', bgMid: '#1a1208', textColor: '#f0d080', font: 'cinzel',
  },
  phase2: {
    label: 'Phase 2 — T5 / SSC & TK',
    accent: '#38b8c8', accentSoft: '#7ae0ee', accentDim: '#2a7a88',
    accentFade: '#1a4858', accentGhost: '#0e2830',
    bgDark: '#050e12', bgMid: '#08141a', textColor: '#7ae0ee', font: 'cinzel',
  },
  phase3: {
    label: 'Phase 3 — T6 / Black Temple',
    accent: '#48c848', accentSoft: '#88ee88', accentDim: '#2a7830',
    accentFade: '#1a3820', accentGhost: '#0e2010',
    bgDark: '#040a04', bgMid: '#080f08', textColor: '#88ee88', font: 'cinzel',
  },
  phase4: {
    label: 'Phase 4 — T6.5 / Sunwell',
    accent: '#e87830', accentSoft: '#f8b060', accentDim: '#a04818',
    accentFade: '#602808', accentGhost: '#381808',
    bgDark: '#0d0502', bgMid: '#180a04', textColor: '#f8b060', font: 'cinzel',
  },
  darkportal: {
    label: 'Dark Portal',
    accent: '#58e830', accentSoft: '#90ff60', accentDim: '#2a6818',
    accentFade: '#6a1a08', accentGhost: '#3a0e06',
    bgDark: '#0e0604', bgMid: '#1c0e08', textColor: '#90ff60', font: 'cinzel',
  },
  custom1: {
    label: 'Custom 1',
    accent: '#c8a84b', accentSoft: '#f0d080', accentDim: '#7a6030',
    accentFade: '#4a3820', accentGhost: '#2e2210',
    bgDark: '#0d0a04', bgMid: '#1a1208', textColor: '#f0d080', font: 'cinzel',
  },
  custom2: {
    label: 'Custom 2',
    accent: '#a848c8', accentSoft: '#d080f0', accentDim: '#6a3080',
    accentFade: '#3a1848', accentGhost: '#220e30',
    bgDark: '#080410', bgMid: '#12081a', textColor: '#d080f0', font: 'cinzel',
  },
  custom3: {
    label: 'Custom 3',
    accent: '#c84848', accentSoft: '#f08080', accentDim: '#803030',
    accentFade: '#481818', accentGhost: '#300e0e',
    bgDark: '#100404', bgMid: '#1a0808', textColor: '#f08080', font: 'cinzel',
  },
}

const THEME_GROUPS = [
  { label: 'Spielphasen', keys: ['phase1','phase2','phase3','phase4'] },
  { label: 'Spezial',     keys: ['darkportal'] },
  { label: 'Custom Slots', keys: ['custom1','custom2','custom3'] },
]

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
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ width:38, height:30, borderRadius:3, border:'1px solid #2e2210', background:'transparent', cursor:'pointer', padding:2, flexShrink:0 }} />
        <input value={value} onChange={e => onChange(e.target.value)}
          style={{ width:82, fontSize:10, fontFamily:'monospace' }} />
        <div style={{ width:28, height:28, borderRadius:2, background:value, border:'1px solid #2e2210', flexShrink:0 }} />
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

  // ── Theme-System ──────────────────────────────────────────────────────────
  const [activeTheme, setActiveTheme] = useState(settings.phase || 'phase1')

  // Alle Theme-Styles: stored überschreibt Presets
  const [themeStyles, setThemeStyles] = useState(() => {
    const stored = settings.phaseStyles || {}
    const result = {}
    Object.keys(PRESET_THEMES).forEach(key => {
      result[key] = { ...PRESET_THEMES[key], ...(stored[key] || {}) }
    })
    return result
  })

  // Theme-Labels (anpassbar)
  const [themeLabels, setThemeLabels] = useState(() => {
    const stored = settings.themeLabels || {}
    const result = {}
    Object.keys(PRESET_THEMES).forEach(key => {
      result[key] = stored[key] || PRESET_THEMES[key].label
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

  const currentStyle = themeStyles[activeTheme] || PRESET_THEMES[activeTheme]

  function updateStyle(field, value) {
    setThemeStyles(prev => ({
      ...prev,
      [activeTheme]: { ...prev[activeTheme], [field]: value }
    }))
  }

  function resetToPreset() {
    setThemeStyles(prev => ({
      ...prev,
      [activeTheme]: { ...PRESET_THEMES[activeTheme], label: themeLabels[activeTheme] }
    }))
  }

  async function saveTheme() {
    const updatedStyles = { ...themeStyles }
    // Labels in Styles einbetten
    Object.keys(updatedStyles).forEach(k => {
      updatedStyles[k] = { ...updatedStyles[k], label: themeLabels[k] }
    })
    await saveSection('theme', {
      phase: activeTheme,
      phaseStyles: updatedStyles,
      themeLabels,
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
    if (!file.type.startsWith('image/')) { setUploadErr('Nur Bilder erlaubt.'); return }
    if (file.size > 512 * 1024) { setUploadErr('Max. 512 KB.'); return }
    setUploading(true); setUploadErr('')
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('Fehler'))
        reader.readAsDataURL(file)
      })
      setIdentity(prev => ({ ...prev, logoUrl: base64, emoji: '' }))
    } catch (err) { setUploadErr('Upload fehlgeschlagen.') }
    setUploading(false)
  }

  const isCustomSlot = activeTheme.startsWith('custom')

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
          {[['Gildenname — Zeile 1','guildName1'],['Gildenname — Zeile 2 (optional)','guildName2'],['Untertitel','guildSub'],['Realm-Tag','realm']].map(([lbl,key]) => (
            <div key={key}><Label>{lbl}</Label>
              <input value={identity[key]} onChange={e => setIdentity({ ...identity, [key]:e.target.value })} style={{ width:'100%', boxSizing:'border-box', fontSize:13 }} />
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
          <div><Label>Tagline (Zeilenumbruch mit Enter)</Label>
            <textarea value={texts.tagline} onChange={e => setTexts({ ...texts, tagline:e.target.value })} style={{ minHeight:80, width:'100%', boxSizing:'border-box', fontSize:13 }} /></div>
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
        <SectionTitle sub="Theme wählen, benennen und individuell anpassen">Theme & Farben</SectionTitle>

        {/* Theme-Auswahl gruppiert */}
        {THEME_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom:'1rem' }}>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:3, color:'#2e2210', textTransform:'uppercase', marginBottom:6 }}>{group.label}</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:4 }}>
              {group.keys.map(key => {
                const style   = themeStyles[key] || PRESET_THEMES[key]
                const active  = activeTheme === key
                const isLive  = (settings.phase || 'phase1') === key
                const label   = themeLabels[key] || style.label
                return (
                  <div key={key} onClick={() => setActiveTheme(key)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:3, cursor:'pointer',
                      background: active ? '#1a1208' : '#0d0a04',
                      border:`1px solid ${active ? style.accent : '#1e1808'}`,
                      transition:'all .2s',
                      boxShadow: active ? `0 0 8px ${style.accent}25` : 'none' }}>
                    {/* Mini-Vorschau */}
                    <div style={{ display:'flex', flexDirection:'column', gap:2, flexShrink:0 }}>
                      <div style={{ display:'flex', gap:2 }}>
                        <div style={{ width:16, height:8, borderRadius:1, background:style.bgDark }} />
                        <div style={{ width:8,  height:8, borderRadius:1, background:style.accent }} />
                        <div style={{ width:8,  height:8, borderRadius:1, background:style.accentSoft }} />
                      </div>
                      <div style={{ display:'flex', gap:2 }}>
                        <div style={{ width:16, height:5, borderRadius:1, background:style.bgMid }} />
                        <div style={{ width:16, height:5, borderRadius:1, background:style.accentFade }} />
                      </div>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                        <span style={{ fontFamily:'Cinzel,serif', fontSize:9, color: active ? '#f0d080' : '#6a5030', letterSpacing:0.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{label}</span>
                        {isLive && <span style={{ fontSize:7, color:style.accent, background:`${style.accent}20`, border:`1px solid ${style.accent}40`, borderRadius:2, padding:'1px 4px', fontFamily:'Cinzel,serif', letterSpacing:1, flexShrink:0 }}>LIVE</span>}
                      </div>
                    </div>
                    <div style={{ width:12, height:12, borderRadius:'50%', border:`2px solid ${active ? style.accent : '#3a2c18'}`, background: active ? style.accent : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {active && <span style={{ color:'#0d0a04', fontSize:7, fontWeight:700 }}>✓</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Editor für aktives Theme */}
        <div style={{ background:'#0d0a04', border:`1px solid ${currentStyle.accent}30`, borderRadius:3, padding:'1.2rem', marginBottom:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:8 }}>
            {/* Name bearbeitbar */}
            <div style={{ flex:1, minWidth:200 }}>
              <Label>Theme-Name</Label>
              <input value={themeLabels[activeTheme] || ''} onChange={e => setThemeLabels(prev => ({ ...prev, [activeTheme]: e.target.value }))}
                style={{ fontSize:13, width:'100%', boxSizing:'border-box' }} />
            </div>
            <button className="btn-ghost" style={{ fontSize:9, flexShrink:0, alignSelf:'flex-end', marginBottom:2 }} onClick={resetToPreset}>
              ↺ Standard
            </button>
            {isCustomSlot && (
              <div style={{ fontSize:10, color:'#4a9a5a', fontStyle:'italic', alignSelf:'flex-end', marginBottom:4 }}>
                💾 Custom-Slot — frei befüllbar
              </div>
            )}
          </div>

          {/* Farben */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:12 }}>
            <ColorRow label="Hintergrund dunkel" value={currentStyle.bgDark}      onChange={v => updateStyle('bgDark', v)} />
            <ColorRow label="Hintergrund mittel" value={currentStyle.bgMid}       onChange={v => updateStyle('bgMid', v)} />
            <ColorRow label="Akzent (Rahmen)"    value={currentStyle.accent}      onChange={v => updateStyle('accent', v)} />
            <ColorRow label="Akzent hell (Titel)" value={currentStyle.accentSoft} onChange={v => updateStyle('accentSoft', v)} />
            <ColorRow label="Text / Labels"      value={currentStyle.accentDim}   onChange={v => updateStyle('accentDim', v)} />
            <ColorRow label="Trennlinien"        value={currentStyle.accentFade}  onChange={v => updateStyle('accentFade', v)} />
            <ColorRow label="Schatten / Footer"  value={currentStyle.accentGhost} onChange={v => updateStyle('accentGhost', v)} />
            <ColorRow label="Titelfarbe"         value={currentStyle.textColor}   onChange={v => updateStyle('textColor', v)} />
          </div>

          {/* Schriftart */}
          <Label>Schriftart für dieses Theme</Label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4, marginBottom:12 }}>
            {FONTS.map(f => (
              <div key={f.id} onClick={() => updateStyle('font', f.id)}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:3, cursor:'pointer',
                  background: currentStyle.font===f.id ? 'rgba(200,168,75,.06)' : '#120e06',
                  border:`1px solid ${currentStyle.font===f.id ? '#c8a84b' : '#1e1808'}`,
                  transition:'all .2s' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:f.css, fontSize:13, color:'#f0d080' }}>HRS</div>
                  <div style={{ fontSize:9, color:'#3a2c18' }}>{f.label}</div>
                </div>
                <div style={{ width:12, height:12, borderRadius:'50%', border:`2px solid ${currentStyle.font===f.id ? '#c8a84b' : '#3a2c18'}`, background: currentStyle.font===f.id ? '#c8a84b' : 'transparent', flexShrink:0 }} />
              </div>
            ))}
          </div>

          {/* Live-Vorschau */}
          <div style={{ borderRadius:3, overflow:'hidden', border:'1px solid #2e2210' }}>
            <div style={{ height:3, background:`linear-gradient(90deg,transparent,${currentStyle.accent},${currentStyle.accentSoft},${currentStyle.accent},transparent)` }} />
            <div style={{ background:`linear-gradient(180deg,${currentStyle.bgMid},${currentStyle.bgDark})`, padding:'0.8rem 1rem', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:38, height:38, borderRadius:'50%', border:`2px solid ${currentStyle.accent}`, background:`radial-gradient(circle,${currentStyle.bgMid},${currentStyle.bgDark})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🎰</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily: FONTS.find(f=>f.id===currentStyle.font)?.css || "'Cinzel',serif", fontSize:15, color:currentStyle.accentSoft, letterSpacing:1 }}>High Roller Society</div>
                <div style={{ fontSize:9, color:currentStyle.accentDim, letterSpacing:3, textTransform:'uppercase', marginTop:2 }}>Raiding Guild · Spineshatter EU</div>
              </div>
              <div style={{ padding:'6px 16px', border:`1px solid ${currentStyle.accent}`, color:currentStyle.accentSoft, background:`linear-gradient(135deg,${currentStyle.accentFade},${currentStyle.accentGhost})`, borderRadius:2, fontSize:10, fontFamily:'Cinzel,serif', letterSpacing:2, textTransform:'uppercase', flexShrink:0 }}>
                Einloggen
              </div>
            </div>
            <div style={{ height:3, background:`linear-gradient(90deg,transparent,${currentStyle.accent},${currentStyle.accentSoft},${currentStyle.accent},transparent)` }} />
          </div>
        </div>

        <div style={{ fontSize:11, color:'#3a2c18', fontStyle:'italic', marginBottom:'0.8rem' }}>
          💡 Jedes Theme speichert seinen eigenen Namen, Farben und Schriftart. Custom-Slots sind freie Kreativ-Speicher.
        </div>

        <SaveBar onSave={saveTheme} saving={saving.theme} saved={saved.theme} />
      </Section>
    </div>
  )
}
