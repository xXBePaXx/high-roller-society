import { useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db } from '../../firebase'
import { doc, setDoc } from 'firebase/firestore'

// ─── Konstanten ───────────────────────────────────────────────────────────────
const EMOJIS = ['🎰','⚔️','🛡️','🐉','💀','🔥','👑','💎','🎲','🗡️','🏹','🧙','⚡','🌙','✨','🏹','🔮','🌟','🎯','🗺️']

const FONTS = [
  { id: 'cinzel',     label: 'Cinzel',      sample: 'High Roller Society',  css: "'Cinzel', serif" },
  { id: 'uncial',     label: 'Uncial Antiqua', sample: 'High Roller Society', css: "'Uncial Antiqua', cursive" },
  { id: 'medievalsharp', label: 'MedievalSharp', sample: 'High Roller Society', css: "'MedievalSharp', serif" },
  { id: 'almendra',   label: 'Almendra',    sample: 'High Roller Society',  css: "'Almendra', serif" },
  { id: 'im_fell',    label: 'IM Fell English', sample: 'High Roller Society', css: "'IM Fell English', serif" },
]

const PHASE_THEMES = {
  phase1: { label: 'Phase 1 — T4 / Karazhan',     accent: '#c8a84b', bg: '#0d0a04', preview: ['#1a1208','#c8a84b','#f0d080'], desc: 'Goldenes Klassik-Theme' },
  phase2: { label: 'Phase 2 — T5 / SSC & TK',     accent: '#38b8c8', bg: '#050e12', preview: ['#08141a','#38b8c8','#7ae0ee'], desc: 'Türkis & Cyan — Unterwasser' },
  phase3: { label: 'Phase 3 — T6 / Black Temple',  accent: '#48c848', bg: '#040a04', preview: ['#080f08','#48c848','#88ee88'], desc: 'Fel-Grün — Teufelskraft' },
  phase4: { label: 'Phase 4 — T6.5 / Sunwell',    accent: '#e87830', bg: '#0d0502', preview: ['#180a04','#e87830','#f8b060'], desc: 'Feuerrot & Orange — Sunwell' },
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: '1.2rem' }}>
      <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: '#c8a84b', letterSpacing: 2, fontWeight: 600 }}>{children}</div>
      {sub && <div style={{ fontSize: 11, color: '#4a3820', marginTop: 3, fontStyle: 'italic' }}>{sub}</div>}
    </div>
  )
}

function Label({ children }) {
  return <div style={{ fontFamily: 'Cinzel,serif', fontSize: 8, letterSpacing: 2, color: '#3a2c18', textTransform: 'uppercase', marginBottom: 5 }}>{children}</div>
}

function Section({ children, style = {} }) {
  return (
    <div style={{ background: '#120e06', border: '1px solid #2e2210', borderRadius: 4, padding: '1.4rem', marginBottom: '1rem', ...style }}>
      {children}
    </div>
  )
}

function SaveBar({ onSave, saving, saved }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '1rem' }}>
      <button className="btn-primary" onClick={onSave} disabled={saving} style={{ fontSize: 11 }}>
        {saving ? 'Speichern...' : 'Speichern'}
      </button>
      {saved && <span style={{ fontSize: 11, color: '#4a9a5a', fontStyle: 'italic' }}>✓ Gespeichert</span>}
    </div>
  )
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────
export default function Website() {
  const { settings, saveSettings } = useAuth()

  // ── lokaler State ────────────────────────────────────────────────────────────
  const [identity, setIdentity] = useState({
    guildName1: settings.guildName1 || 'High Roller',
    guildName2: settings.guildName2 || 'Society',
    guildSub:   settings.guildSub   || '',
    realm:      settings.realm      || '',
    emoji:      settings.emoji      || '🎰',
    logoUrl:    settings.logoUrl    || '',
  })
  const [texts, setTexts] = useState({
    tagline: settings.tagline || '',
    footer:  settings.footer  || '',
    server:  settings.server  || '',
  })
  const [stats, setStats] = useState({
    stat1n: settings.stat1n || '', stat1l: settings.stat1l || '',
    stat2n: settings.stat2n || '', stat2l: settings.stat2l || '',
    stat3n: settings.stat3n || '', stat3l: settings.stat3l || '',
  })
  const [phase,     setPhase]     = useState(settings.phase    || 'phase1')
  const [accentColor, setAccentColor] = useState(settings.accentColor || '')
  const [font,      setFont]      = useState(settings.font     || 'cinzel')

  // ── Speicher-Status pro Sektion ───────────────────────────────────────────
  const [saving, setSaving] = useState({})
  const [saved,  setSaved]  = useState({})

  async function saveSection(key, data) {
    setSaving(s => ({ ...s, [key]: true }))
    await saveSettings({ ...settings, ...data }, Object.keys(data))
    setSaving(s => ({ ...s, [key]: false }))
    setSaved(s => ({ ...s, [key]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 2500)
  }

  // ── Icon-Upload ───────────────────────────────────────────────────────────
  const fileRef  = useRef()
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  async function handleIconUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setUploadErr('Nur Bilder erlaubt.'); return }
    if (file.size > 512 * 1024) { setUploadErr('Max. 512 KB.'); return }
    setUploading(true); setUploadErr('')
    try {
      const storage = getStorage()
      const storageRef = ref(storage, `guild/logo_${Date.now()}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setIdentity(prev => ({ ...prev, logoUrl: url, emoji: '' }))
      setUploadErr('')
    } catch (err) {
      setUploadErr('Upload fehlgeschlagen: ' + err.message)
    }
    setUploading(false)
  }

  // ── Akzentfarbe: wenn leer → Phase-Standard ──────────────────────────────
  const effectiveAccent = accentColor || PHASE_THEMES[phase]?.accent || '#c8a84b'

  return (
    <div>
      <div className="section-title">Webseite</div>
      <p style={{ fontSize: 12, color: '#5a4828', fontStyle: 'italic', marginBottom: '1.4rem' }}>
        Alle Einstellungen für die öffentliche Landing-Page an einem Ort.
      </p>

      {/* ── 1. IDENTITÄT ── */}
      <Section>
        <SectionTitle sub="Name, Untertitel und Logo der Gilde">Identität</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <Label>Gildenname — Zeile 1</Label>
            <input value={identity.guildName1} onChange={e => setIdentity({ ...identity, guildName1: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', fontSize: 13 }} />
          </div>
          <div>
            <Label>Gildenname — Zeile 2 (optional)</Label>
            <input value={identity.guildName2} onChange={e => setIdentity({ ...identity, guildName2: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', fontSize: 13 }} />
          </div>
          <div>
            <Label>Untertitel</Label>
            <input value={identity.guildSub} onChange={e => setIdentity({ ...identity, guildSub: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', fontSize: 13 }} />
          </div>
          <div>
            <Label>Realm-Tag</Label>
            <input value={identity.realm} onChange={e => setIdentity({ ...identity, realm: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', fontSize: 13 }} />
          </div>
        </div>

        {/* Logo */}
        <Label>Logo / Icon</Label>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Emoji-Auswahl */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, color: '#4a3820', marginBottom: 6, fontStyle: 'italic' }}>Emoji wählen:</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EMOJIS.map(e => (
                <span key={e} onClick={() => setIdentity({ ...identity, emoji: e, logoUrl: '' })}
                  style={{ fontSize: 22, cursor: 'pointer', padding: '4px 6px', borderRadius: 3, transition: 'all .15s',
                    border: `1px solid ${identity.emoji === e && !identity.logoUrl ? '#c8a84b' : 'transparent'}`,
                    background: identity.emoji === e && !identity.logoUrl ? 'rgba(200,168,75,.1)' : 'transparent' }}>
                  {e}
                </span>
              ))}
            </div>
          </div>

          {/* Bild-Upload */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: '#4a3820', marginBottom: 6, fontStyle: 'italic' }}>Eigenes Bild hochladen:</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {identity.logoUrl && (
                <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: '1px solid #3a2c18', flexShrink: 0 }}>
                  <img src={identity.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <button className="btn-ghost" style={{ fontSize: 10 }} onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Lädt hoch...' : identity.logoUrl ? 'Bild ändern' : '+ Bild hochladen'}
              </button>
              {identity.logoUrl && (
                <button className="btn-ghost" style={{ fontSize: 10, color: '#8a3020' }} onClick={() => setIdentity({ ...identity, logoUrl: '', emoji: '🎰' })}>
                  Entfernen
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleIconUpload} />
            </div>
            {uploadErr && <div style={{ fontSize: 10, color: '#e08080', marginTop: 4, fontStyle: 'italic' }}>{uploadErr}</div>}
            <div style={{ fontSize: 10, color: '#2e2210', marginTop: 4, fontStyle: 'italic' }}>Max. 512 KB · PNG/JPG/SVG</div>
          </div>
        </div>

        <SaveBar onSave={() => saveSection('identity', identity)} saving={saving.identity} saved={saved.identity} />
      </Section>

      {/* ── 2. TEXTE ── */}
      <Section>
        <SectionTitle sub="Tagline, Footer und Server-Info">Texte</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <Label>Tagline (Zeilenumbruch mit Enter)</Label>
            <textarea value={texts.tagline} onChange={e => setTexts({ ...texts, tagline: e.target.value })} style={{ minHeight: 80, width: '100%', boxSizing: 'border-box', fontSize: 13 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <Label>Footer-Text</Label>
              <input value={texts.footer} onChange={e => setTexts({ ...texts, footer: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', fontSize: 13 }} />
            </div>
            <div>
              <Label>Server-Tag</Label>
              <input value={texts.server} onChange={e => setTexts({ ...texts, server: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', fontSize: 13 }} />
            </div>
          </div>
        </div>
        <SaveBar onSave={() => saveSection('texts', texts)} saving={saving.texts} saved={saved.texts} />
      </Section>

      {/* ── 3. STATISTIKEN ── */}
      <Section>
        <SectionTitle sub="Die drei Kennzahlen auf der Landing-Page">Statistiken</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[['stat1n','stat1l'],['stat2n','stat2l'],['stat3n','stat3l']].map(([nk, lk], i) => (
            <div key={i} style={{ background: '#0d0a04', border: '1px solid #1e1808', borderRadius: 3, padding: '10px 12px' }}>
              <Label>Wert</Label>
              <input value={stats[nk]} onChange={e => setStats({ ...stats, [nk]: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'Cinzel,serif', fontSize: 18, color: '#f0d080', background: 'transparent', border: 'none', borderBottom: '1px solid #2e2210', textAlign: 'center', outline: 'none', marginBottom: 6 }} />
              <Label>Beschriftung</Label>
              <input value={stats[lk]} onChange={e => setStats({ ...stats, [lk]: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', fontSize: 11, color: '#7a6030', background: 'transparent', border: 'none', textAlign: 'center', outline: 'none', letterSpacing: 2, textTransform: 'uppercase' }} />
            </div>
          ))}
        </div>
        <SaveBar onSave={() => saveSection('stats', stats)} saving={saving.stats} saved={saved.stats} />
      </Section>

      {/* ── 4. PHASE & FARBE ── */}
      <Section>
        <SectionTitle sub="Farbschema passend zur aktuellen Spielphase">Phase & Farben</SectionTitle>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1.2rem' }}>
          {Object.entries(PHASE_THEMES).map(([key, theme]) => {
            const active    = phase === key
            const isCurrent = (settings.phase || 'phase1') === key
            return (
              <div key={key} onClick={() => { setPhase(key); setAccentColor('') }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 3, cursor: 'pointer', background: active ? '#1a1208' : '#0d0a04', border: `1px solid ${active ? theme.accent : '#1e1808'}`, transition: 'all .2s', boxShadow: active ? `0 0 12px ${theme.accent}18` : 'none' }}>
                {/* Farbvorschau */}
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  {theme.preview.map((c, i) => (
                    <div key={i} style={{ width: i === 0 ? 24 : 12, height: 24, borderRadius: 2, background: c }} />
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Cinzel,serif', fontSize: 11, color: active ? '#f0d080' : '#7a6030' }}>{theme.label}</span>
                    {isCurrent && <span style={{ fontSize: 9, color: theme.accent, background: `${theme.accent}20`, border: `1px solid ${theme.accent}40`, borderRadius: 2, padding: '1px 6px', fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>AKTIV</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#3a2c18', fontStyle: 'italic', marginTop: 2 }}>{theme.desc}</div>
                </div>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${active ? theme.accent : '#3a2c18'}`, background: active ? theme.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {active && <span style={{ color: '#0d0a04', fontSize: 9, fontWeight: 700 }}>✓</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Individuelle Akzentfarbe */}
        <div style={{ borderTop: '1px solid #1e1808', paddingTop: '1rem', marginTop: '0.2rem' }}>
          <Label>Akzentfarbe individuell anpassen (überschreibt Phase-Standard)</Label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="color" value={accentColor || PHASE_THEMES[phase]?.accent || '#c8a84b'}
              onChange={e => setAccentColor(e.target.value)}
              style={{ width: 48, height: 36, borderRadius: 3, border: '1px solid #2e2210', background: 'transparent', cursor: 'pointer', padding: 2 }} />
            <input value={accentColor} onChange={e => setAccentColor(e.target.value)}
              placeholder={PHASE_THEMES[phase]?.accent || '#c8a84b'}
              style={{ width: 100, fontSize: 12, fontFamily: 'monospace' }} />
            <div style={{ width: 36, height: 36, borderRadius: 3, background: effectiveAccent, border: '1px solid #2e2210', flexShrink: 0 }} />
            {accentColor && (
              <button className="btn-ghost" style={{ fontSize: 10 }} onClick={() => setAccentColor('')}>
                Zurücksetzen
              </button>
            )}
          </div>
          <div style={{ fontSize: 10, color: '#2e2210', marginTop: 6, fontStyle: 'italic' }}>
            Vorschau: <span style={{ color: effectiveAccent }}>■ {effectiveAccent}</span>
            {!accentColor && ' (Phase-Standard)'}
          </div>
        </div>

        <SaveBar onSave={() => saveSection('theme', { phase, accentColor })} saving={saving.theme} saved={saved.theme} />
      </Section>

      {/* ── 5. SCHRIFTART ── */}
      <Section>
        <SectionTitle sub="Überschriften und Titelschrift der Landing-Page">Schriftart</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {FONTS.map(f => (
            <div key={f.id} onClick={() => setFont(f.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', borderRadius: 3, cursor: 'pointer', background: font === f.id ? 'rgba(200,168,75,.06)' : '#0d0a04', border: `1px solid ${font === f.id ? '#c8a84b' : '#1e1808'}`, transition: 'all .2s' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: f.css, fontSize: 18, color: '#f0d080', marginBottom: 3 }}>{f.sample}</div>
                <div style={{ fontSize: 10, color: '#3a2c18', fontStyle: 'italic' }}>{f.label}</div>
              </div>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${font === f.id ? '#c8a84b' : '#3a2c18'}`, background: font === f.id ? '#c8a84b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {font === f.id && <span style={{ color: '#0d0a04', fontSize: 9, fontWeight: 700 }}>✓</span>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#3a2c18', fontStyle: 'italic', marginTop: 8 }}>
          💡 Google Fonts werden automatisch geladen. Die Schriftart gilt für Überschriften auf der Landing-Page.
        </div>
        <SaveBar onSave={() => saveSection('font', { font })} saving={saving.font} saved={saved.font} />
      </Section>

    </div>
  )
}
