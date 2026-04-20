import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const EMOJIS = ['🎰','⚔️','🛡️','🐉','💀','🔥','👑','💎','🎲','🗡️','🏹','🧙']

// ─── Phasen-Definitionen (gespiegelt von Landing.jsx) ─────────────────────────
const PHASE_THEMES = {
  phase1: {
    label:   'Phase 1 — T4 / Karazhan',
    accent:  '#c8a84b',
    preview: ['#1a1208', '#c8a84b', '#f0d080'],
    desc:    'Goldenes Klassik-Theme — mystisch & arcane',
  },
  phase2: {
    label:   'Phase 2 — T5 / SSC & TK',
    accent:  '#38b8c8',
    preview: ['#08141a', '#38b8c8', '#7ae0ee'],
    desc:    'Türkis & Cyan — Unterwasser, Arcane Blaustich',
  },
  phase3: {
    label:   'Phase 3 — T6 / Black Temple',
    accent:  '#48c848',
    preview: ['#080f08', '#48c848', '#88ee88'],
    desc:    'Fel-Grün — dunkel, bedrohlich, Teufelskraft',
  },
  phase4: {
    label:   'Phase 4 — T6.5 / Sunwell',
    accent:  '#e87830',
    preview: ['#180a04', '#e87830', '#f8b060'],
    desc:    'Feuerrot & Orange — Sunwell, brennend intensiv',
  },
}

function SectionTitle({ children }) {
  return <div className="section-title">{children}</div>
}
function FieldGroup({ label, children }) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}
function SaveRow({ onSave, flash, busy }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '.4rem' }}>
      <button className="btn-primary" onClick={onSave} disabled={busy}>
        {busy ? 'Speichern...' : 'Speichern'}
      </button>
      <span className={`save-flash ${flash ? 'on' : ''}`}>✓ Gespeichert & geloggt</span>
    </div>
  )
}

// ── IDENTITÄT ─────────────────────────────────────────────────────────────────
export function Identity() {
  const { settings, saveSettings } = useAuth()
  const [f, setF]         = useState({ ...settings })
  const [flash, setFlash] = useState(false)
  const [busy, setBusy]   = useState(false)

  async function save() {
    setBusy(true)
    const changed = ['guildName1','guildName2','guildSub','realm','emoji'].filter(k => f[k] !== settings[k])
    await saveSettings(f, changed)
    setBusy(false)
    setFlash(true)
    setTimeout(() => setFlash(false), 2200)
  }

  return (
    <div>
      <SectionTitle>Gilden-Identität</SectionTitle>
      <FieldGroup label="Gildenname — Zeile 1">
        <input value={f.guildName1 || ''} onChange={e => setF({ ...f, guildName1: e.target.value })} placeholder="High Roller" />
      </FieldGroup>
      <FieldGroup label="Gildenname — Zeile 2 (optional)">
        <input value={f.guildName2 || ''} onChange={e => setF({ ...f, guildName2: e.target.value })} placeholder="Society" />
      </FieldGroup>
      <FieldGroup label="Untertitel">
        <input value={f.guildSub || ''} onChange={e => setF({ ...f, guildSub: e.target.value })} />
      </FieldGroup>
      <FieldGroup label="Realm-Tag">
        <input value={f.realm || ''} onChange={e => setF({ ...f, realm: e.target.value })} />
      </FieldGroup>
      <FieldGroup label="Logo-Icon">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '.4rem' }}>
          {EMOJIS.map(e => (
            <span key={e} onClick={() => setF({ ...f, emoji: e })}
              style={{ fontSize: 26, cursor: 'pointer', padding: '4px 8px', borderRadius: 4, transition: 'all .15s',
                border: `1px solid ${f.emoji === e ? '#c8a84b' : 'transparent'}`,
                background: f.emoji === e ? 'rgba(200,168,75,.1)' : 'transparent' }}>
              {e}
            </span>
          ))}
        </div>
      </FieldGroup>
      <SaveRow onSave={save} flash={flash} busy={busy} />
    </div>
  )
}

// ── TEXTE ─────────────────────────────────────────────────────────────────────
export function Texts() {
  const { settings, saveSettings } = useAuth()
  const [f, setF]         = useState({ ...settings })
  const [flash, setFlash] = useState(false)
  const [busy, setBusy]   = useState(false)

  async function save() {
    setBusy(true)
    const changed = ['tagline','footer','server'].filter(k => f[k] !== settings[k])
    await saveSettings(f, changed)
    setBusy(false)
    setFlash(true)
    setTimeout(() => setFlash(false), 2200)
  }

  return (
    <div>
      <SectionTitle>Texte &amp; Beschreibungen</SectionTitle>
      <FieldGroup label="Tagline (Zeilenumbruch mit Enter)">
        <textarea value={f.tagline || ''} onChange={e => setF({ ...f, tagline: e.target.value })} style={{ minHeight: 90 }} />
      </FieldGroup>
      <FieldGroup label="Footer-Text">
        <input value={f.footer || ''} onChange={e => setF({ ...f, footer: e.target.value })} />
      </FieldGroup>
      <FieldGroup label="Server-Tag">
        <input value={f.server || ''} onChange={e => setF({ ...f, server: e.target.value })} />
      </FieldGroup>
      <SaveRow onSave={save} flash={flash} busy={busy} />
    </div>
  )
}

// ── STATISTIKEN ───────────────────────────────────────────────────────────────
export function Stats() {
  const { settings, saveSettings } = useAuth()
  const [f, setF]         = useState({ ...settings })
  const [flash, setFlash] = useState(false)
  const [busy, setBusy]   = useState(false)

  async function save() {
    setBusy(true)
    await saveSettings(f, ['stat1n','stat1l','stat2n','stat2l','stat3n','stat3l'])
    setBusy(false)
    setFlash(true)
    setTimeout(() => setFlash(false), 2200)
  }

  const StatCard = ({ numKey, lblKey }) => (
    <div style={{ background: '#1a1208', border: '1px solid #3a2c18', borderRadius: 2, padding: 10 }}>
      <input value={f[numKey] || ''} onChange={e => setF({ ...f, [numKey]: e.target.value })}
        style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #3a2c18', color: '#f0d080', fontFamily: 'Cinzel,serif', fontSize: 20, textAlign: 'center', marginBottom: 4, borderRadius: 0, padding: '4px', width: '100%', boxSizing: 'border-box' }} />
      <input value={f[lblKey] || ''} onChange={e => setF({ ...f, [lblKey]: e.target.value })}
        style={{ background: 'transparent', border: 'none', color: '#7a6030', fontSize: 11, textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase', borderRadius: 0, padding: '2px', width: '100%', boxSizing: 'border-box' }} />
    </div>
  )

  return (
    <div>
      <SectionTitle>Statistik-Anzeigen</SectionTitle>
      <p style={{ fontSize: 13, color: '#7a6030', fontStyle: 'italic', marginBottom: '1.2rem' }}>
        Oberer Wert = die große Zahl, unterer Wert = die Beschriftung darunter.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: '1.4rem' }}>
        <StatCard numKey="stat1n" lblKey="stat1l" />
        <StatCard numKey="stat2n" lblKey="stat2l" />
        <StatCard numKey="stat3n" lblKey="stat3l" />
      </div>
      <SaveRow onSave={save} flash={flash} busy={busy} />
    </div>
  )
}

// ── THEME / PHASE ─────────────────────────────────────────────────────────────
export function Theme() {
  const { settings, saveSettings } = useAuth()
  const [selectedPhase, setSelectedPhase] = useState(settings.phase || 'phase1')
  const [flash, setFlash] = useState(false)
  const [busy, setBusy]   = useState(false)

  async function save() {
    setBusy(true)
    await saveSettings({ ...settings, phase: selectedPhase }, ['phase'])
    setBusy(false)
    setFlash(true)
    setTimeout(() => setFlash(false), 2200)
  }

  const current = settings.phase || 'phase1'

  return (
    <div>
      <SectionTitle>Phase &amp; Farbschema</SectionTitle>
      <p style={{ fontSize: 13, color: '#7a6030', fontStyle: 'italic', marginBottom: '1.4rem' }}>
        Wähle die aktuelle Spielphase. Das Farbschema der Landing-Page passt sich automatisch an.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.4rem' }}>
        {Object.entries(PHASE_THEMES).map(([key, theme]) => {
          const active = selectedPhase === key
          const isCurrent = current === key
          return (
            <div key={key} onClick={() => setSelectedPhase(key)} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', borderRadius: 3, cursor: 'pointer',
              background: active ? `${theme.preview[0]}` : '#1a1208',
              border: `1px solid ${active ? theme.accent : '#2e2210'}`,
              transition: 'all .2s',
              boxShadow: active ? `0 0 16px ${theme.accent}20` : 'none',
            }}>
              {/* Farbvorschau */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {theme.preview.map((c, i) => (
                  <div key={i} style={{ width: i === 0 ? 28 : 14, height: 28, borderRadius: 2, background: c, border: '1px solid rgba(255,255,255,.05)' }} />
                ))}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'Cinzel,serif', fontSize: 12, color: active ? theme.accentSoft || '#f0f0f0' : '#c8a84b', letterSpacing: 0.5 }}>
                    {theme.label}
                  </span>
                  {isCurrent && (
                    <span style={{ fontSize: 9, color: theme.accent, background: `${theme.accent}20`, border: `1px solid ${theme.accent}40`, borderRadius: 2, padding: '1px 6px', fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>
                      AKTIV
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#5a4828', fontStyle: 'italic', marginTop: 3 }}>{theme.desc}</div>
              </div>

              {/* Auswahl-Indikator */}
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${active ? theme.accent : '#3a2c18'}`,
                background: active ? theme.accent : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .2s',
              }}>
                {active && <span style={{ color: '#0d0a04', fontSize: 10, fontWeight: 700 }}>✓</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Vorschau-Hinweis */}
      <div style={{ background: 'rgba(200,168,75,.05)', border: '1px solid #2e2210', borderRadius: 3, padding: '0.8rem 1rem', marginBottom: '1.2rem', fontSize: 12, color: '#5a4828', fontStyle: 'italic' }}>
        💡 Nach dem Speichern siehst du das neue Theme sofort auf der Landing-Page. Mitglieder sehen die Änderung beim nächsten Seitenaufruf.
      </div>

      <SaveRow onSave={save} flash={flash} busy={busy} />
    </div>
  )
}

// ── ZUGANGSDATEN ──────────────────────────────────────────────────────────────
export function Credentials() {
  const { saveAdminCreds } = useAuth()
  const [f, setF]         = useState({ newUser: '', newPass: '', confPass: '' })
  const [flash, setFlash] = useState(false)
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState('')

  async function save() {
    setErr('')
    if (f.newPass && f.newPass !== f.confPass) { setErr('Passwörter stimmen nicht überein.'); return }
    if (f.newPass && f.newPass.length < 8) { setErr('Passwort muss mindestens 8 Zeichen lang sein.'); return }
    setBusy(true)
    await saveAdminCreds(f.newUser || undefined, f.newPass || undefined)
    setBusy(false)
    setF({ newUser: '', newPass: '', confPass: '' })
    setFlash(true)
    setTimeout(() => setFlash(false), 2200)
  }

  return (
    <div>
      <SectionTitle>Admin-Zugangsdaten ändern</SectionTitle>
      <div style={{ background: 'rgba(192,128,48,.08)', border: '1px solid #6a4010', borderRadius: 2, padding: '10px 14px', marginBottom: '1.4rem' }}>
        <p style={{ fontSize: 13, color: '#c08030' }}>
          Felder leer lassen = keine Änderung. Passwörter werden verschlüsselt gespeichert.
        </p>
      </div>
      <FieldGroup label="Neuer Benutzername">
        <input value={f.newUser} onChange={e => setF({ ...f, newUser: e.target.value })} placeholder="Leer lassen = keine Änderung" autoComplete="off" />
      </FieldGroup>
      <FieldGroup label="Neues Passwort (mind. 8 Zeichen)">
        <input type="password" value={f.newPass} onChange={e => setF({ ...f, newPass: e.target.value })} placeholder="••••••••" autoComplete="new-password" />
      </FieldGroup>
      <FieldGroup label="Passwort bestätigen">
        <input type="password" value={f.confPass} onChange={e => setF({ ...f, confPass: e.target.value })} placeholder="••••••••" autoComplete="new-password" />
      </FieldGroup>
      {err && <p className="error-text">{err}</p>}
      <SaveRow onSave={save} flash={flash} busy={busy} />
    </div>
  )
}
