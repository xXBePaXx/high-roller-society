import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'


const FONT_MAP = {
  cinzel:        "'Cinzel', serif",
  uncial:        "'Uncial Antiqua', cursive",
  medievalsharp: "'MedievalSharp', serif",
  almendra:      "'Almendra', serif",
  im_fell:       "'IM Fell English', serif",
}

const GOOGLE_FONTS_URL = {
  uncial:        'https://fonts.googleapis.com/css2?family=Uncial+Antiqua&display=swap',
  almendra:      'https://fonts.googleapis.com/css2?family=Almendra:ital,wght@0,400;0,700;1,400&display=swap',
  im_fell:       'https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap',
  medievalsharp: 'https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap',
}

// ─── Phasen-Themes ────────────────────────────────────────────────────────────
const PHASE_THEMES = {
  phase1: {
    label:      'Phase 1 — T4 / Karazhan',
    accent:     '#c8a84b',
    accentSoft: '#f0d080',
    accentDim:  '#7a6030',
    accentFade: '#4a3820',
    accentGhost:'#2e2210',
    bg1:        '#1a1208',
    bg2:        '#0d0a04',
    gradBar:    'linear-gradient(90deg,transparent,#c8a84b,#f0d080,#c8a84b,transparent)',
    gradBg:     'linear-gradient(180deg,#1a1208 0%,#0d0a04 60%,#1a1208 100%)',
    gradLogo:   'radial-gradient(circle,#2a1f08,#1a1208)',
    pattern:    'rgba(200,168,75,.025)',
  },
  phase2: {
    label:      'Phase 2 — T5 / SSC & TK',
    accent:     '#38b8c8',
    accentSoft: '#7ae0ee',
    accentDim:  '#2a7a88',
    accentFade: '#1a4858',
    accentGhost:'#0e2830',
    bg1:        '#08141a',
    bg2:        '#050e12',
    gradBar:    'linear-gradient(90deg,transparent,#38b8c8,#7ae0ee,#38b8c8,transparent)',
    gradBg:     'linear-gradient(180deg,#0a1e28 0%,#050e12 60%,#0a1e28 100%)',
    gradLogo:   'radial-gradient(circle,#0f2a38,#050e12)',
    pattern:    'rgba(56,184,200,.025)',
  },
  phase3: {
    label:      'Phase 3 — T6 / Black Temple',
    accent:     '#48c848',
    accentSoft: '#88ee88',
    accentDim:  '#2a7830',
    accentFade: '#1a3820',
    accentGhost:'#0e2010',
    bg1:        '#080f08',
    bg2:        '#040a04',
    gradBar:    'linear-gradient(90deg,transparent,#48c848,#88ee88,#48c848,transparent)',
    gradBg:     'linear-gradient(180deg,#0a180a 0%,#040a04 60%,#0a180a 100%)',
    gradLogo:   'radial-gradient(circle,#0f280f,#040a04)',
    pattern:    'rgba(72,200,72,.025)',
  },
  phase4: {
    label:      'Phase 4 — T6.5 / Sunwell',
    accent:     '#e87830',
    accentSoft: '#f8b060',
    accentDim:  '#a04818',
    accentFade: '#602808',
    accentGhost:'#381808',
    bg1:        '#180a04',
    bg2:        '#0d0502',
    gradBar:    'linear-gradient(90deg,transparent,#e87830,#f8b060,#e87830,transparent)',
    gradBg:     'linear-gradient(180deg,#201008 0%,#0d0502 60%,#201008 100%)',
    gradLogo:   'radial-gradient(circle,#2a1208,#0d0502)',
    pattern:    'rgba(232,120,48,.025)',
  },
}

export default function Landing() {
  const { settings: s } = useAuth()
  const nav = useNavigate()

  const phase       = s.phase || 'phase1'
  const baseTheme   = PHASE_THEMES[phase] || PHASE_THEMES.phase1
  const customAccent = s.accentColor || ''
  // Merge: custom accent overrides phase accent where used
  const t = customAccent ? {
    ...baseTheme,
    accent:     customAccent,
    accentSoft: customAccent,
    gradBar:    `linear-gradient(90deg,transparent,${customAccent},${customAccent}cc,${customAccent},transparent)`,
  } : baseTheme

  const titleFont = FONT_MAP[s.font] || FONT_MAP.cinzel
  const fontUrl   = GOOGLE_FONTS_URL[s.font]

  // Dynamisch Google Font laden
  if (fontUrl && typeof document !== 'undefined') {
    const id = `gfont-${s.font}`
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id = id; link.rel = 'stylesheet'; link.href = fontUrl
      document.head.appendChild(link)
    }
  }

  const Corner = ({ style }) => (
    <div style={{ position: 'absolute', width: 28, height: 28, opacity: .35, ...style }} />
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '2.5rem 1.5rem 2rem',
      position: 'relative', background: t.gradBg, overflow: 'hidden',
    }}>
      {/* Hintergrund-Muster */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `repeating-linear-gradient(45deg,transparent,transparent 40px,${t.pattern} 40px,${t.pattern} 41px),repeating-linear-gradient(-45deg,transparent,transparent 40px,${t.pattern} 40px,${t.pattern} 41px)`,
      }} />

      {/* Farbbalken oben/unten */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: t.gradBar }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: t.gradBar }} />

      {/* Ecken */}
      <Corner style={{ top: 10, left: 10, borderTop: `1px solid ${t.accent}`, borderLeft: `1px solid ${t.accent}` }} />
      <Corner style={{ top: 10, right: 10, borderTop: `1px solid ${t.accent}`, borderRight: `1px solid ${t.accent}` }} />
      <Corner style={{ bottom: 10, left: 10, borderBottom: `1px solid ${t.accent}`, borderLeft: `1px solid ${t.accent}` }} />
      <Corner style={{ bottom: 10, right: 10, borderBottom: `1px solid ${t.accent}`, borderRight: `1px solid ${t.accent}` }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

        <div style={{ fontSize: 18, letterSpacing: 8, opacity: .6, marginBottom: '.6rem', color: t.accent }}>— ✦ —</div>

        {/* Logo */}
        <div style={{
          width: 96, height: 96, border: `2px solid ${t.accent}`, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.2rem', position: 'relative', background: t.gradLogo,
        }}>
          <div style={{ position: 'absolute', inset: 5, border: `1px solid ${t.accent}40`, borderRadius: '50%' }} />
          <span style={{ fontSize: 38, lineHeight: 1 }}>{s.emoji}</span>
        </div>

        <div style={{ fontSize: 11, letterSpacing: 4, color: t.accentDim, textTransform: 'uppercase', marginBottom: '.3rem' }}>{s.realm}</div>

        <h1 style={{ fontFamily: titleFont, fontSize: 30, fontWeight: 700, color: t.accentSoft, textAlign: 'center', letterSpacing: 2, lineHeight: 1.15, marginBottom: '.2rem' }}>
          {s.guildName1}
          {s.guildName2 && <><br />{s.guildName2}</>}
        </h1>

        <div style={{ fontFamily: 'Cinzel,serif', fontSize: 11, letterSpacing: 5, color: t.accentDim, textTransform: 'uppercase', marginBottom: '1.4rem' }}>{s.guildSub}</div>

        {/* Trennlinie */}
        <div style={{ maxWidth: 360, width: '100%', marginBottom: '1.4rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${t.accentFade})` }} />
          <div style={{ width: 6, height: 6, background: t.accent, transform: 'rotate(45deg)', flexShrink: 0 }} />
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${t.accentFade},transparent)` }} />
        </div>

        <p style={{ fontSize: 16, fontStyle: 'italic', color: t.accentDim, textAlign: 'center', lineHeight: 1.65, maxWidth: 320, marginBottom: '1.8rem' }}>
          {s.tagline?.split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '2.2rem', marginBottom: '2rem', alignItems: 'center' }}>
          {[[s.stat1n, s.stat1l], [s.stat2n, s.stat2l], [s.stat3n, s.stat3l]].map(([num, lbl], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '2.2rem' }}>
              {i > 0 && <div style={{ width: 1, height: 40, background: `linear-gradient(180deg,transparent,${t.accentFade},transparent)` }} />}
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontFamily: 'Cinzel,serif', fontSize: 22, fontWeight: 600, color: t.accentSoft, display: 'block' }}>{num}</span>
                <span style={{ fontSize: 10, letterSpacing: 2, color: t.accentFade, textTransform: 'uppercase' }}>{lbl}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Button — Farbe per CSS-Variable wird überschrieben */}
        <button
          onClick={() => nav('/login')}
          style={{
            fontSize: 14, padding: '14px 52px', letterSpacing: 3, minWidth: 240,
            fontFamily: 'Cinzel,serif', textTransform: 'uppercase',
            background: `linear-gradient(135deg,${t.accentFade},${t.accentGhost})`,
            border: `1px solid ${t.accent}`,
            color: t.accentSoft,
            borderRadius: 2, cursor: 'pointer',
            transition: 'all .2s',
            boxShadow: `0 0 20px ${t.accent}20`,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg,${t.accent}30,${t.accentFade})`; e.currentTarget.style.boxShadow = `0 0 30px ${t.accent}40` }}
          onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg,${t.accentFade},${t.accentGhost})`; e.currentTarget.style.boxShadow = `0 0 20px ${t.accent}20` }}
        >
          Einloggen
        </button>

        {/* Trennlinie unten */}
        <div style={{ maxWidth: 360, width: '100%', margin: '1.8rem 0 1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${t.accentFade})` }} />
          <div style={{ width: 6, height: 6, background: t.accent, transform: 'rotate(45deg)', flexShrink: 0 }} />
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${t.accentFade},transparent)` }} />
        </div>

        <div style={{ fontSize: 11, letterSpacing: 2, color: t.accentGhost, textTransform: 'uppercase' }}>{s.footer}</div>
        <div style={{ fontSize: 11, letterSpacing: 3, color: t.accentGhost, textTransform: 'uppercase', marginTop: '.3rem' }}>{s.server}</div>
      </div>
    </div>
  )
}
