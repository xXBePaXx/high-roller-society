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

// Fallback-Defaults falls noch kein Theme gespeichert
const PHASE_DEFAULTS = {
  phase1: { accent:'#c8a84b', accentSoft:'#f0d080', accentDim:'#7a6030', accentFade:'#4a3820', accentGhost:'#2e2210', bgDark:'#0d0a04', bgMid:'#1a1208', textColor:'#f0d080', font:'cinzel' },
  phase2: { accent:'#38b8c8', accentSoft:'#7ae0ee', accentDim:'#2a7a88', accentFade:'#1a4858', accentGhost:'#0e2830', bgDark:'#050e12', bgMid:'#08141a', textColor:'#7ae0ee', font:'cinzel' },
  phase3: { accent:'#48c848', accentSoft:'#88ee88', accentDim:'#2a7830', accentFade:'#1a3820', accentGhost:'#0e2010', bgDark:'#040a04', bgMid:'#080f08', textColor:'#88ee88', font:'cinzel' },
  phase4: { accent:'#e87830', accentSoft:'#f8b060', accentDim:'#a04818', accentFade:'#602808', accentGhost:'#381808', bgDark:'#0d0502', bgMid:'#180a04', textColor:'#f8b060', font:'cinzel' },
}

export default function Landing() {
  const { settings: s } = useAuth()
  const nav = useNavigate()

  const phase = s.phase || 'phase1'

  // Theme zusammenbauen: gespeicherter phaseStyles-Eintrag > eingebettete Felder > Default
  const stored = s.phaseStyles?.[phase] || {}
  const def    = PHASE_DEFAULTS[phase]
  const t = {
    accent:      stored.accent      || s.accent      || def.accent,
    accentSoft:  stored.accentSoft  || s.accentSoft  || def.accentSoft,
    accentDim:   stored.accentDim   || s.accentDim   || def.accentDim,
    accentFade:  stored.accentFade  || s.accentFade  || def.accentFade,
    accentGhost: stored.accentGhost || s.accentGhost || def.accentGhost,
    bgDark:      stored.bgDark      || s.bgDark      || def.bgDark,
    bgMid:       stored.bgMid       || s.bgMid       || def.bgMid,
    textColor:   stored.textColor   || s.textColor   || def.textColor,
    font:        stored.font        || s.font        || def.font,
  }

  const titleFont = FONT_MAP[t.font] || FONT_MAP.cinzel
  const fontUrl   = GOOGLE_FONTS_URL[t.font]

  if (fontUrl && typeof document !== 'undefined') {
    const id = `gfont-${t.font}`
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id = id; link.rel = 'stylesheet'; link.href = fontUrl
      document.head.appendChild(link)
    }
  }

  const gradBg  = `linear-gradient(180deg,${t.bgMid} 0%,${t.bgDark} 60%,${t.bgMid} 100%)`
  const gradBar = `linear-gradient(90deg,transparent,${t.accent},${t.accentSoft},${t.accent},transparent)`
  const gradLogo= `radial-gradient(circle,${t.bgMid},${t.bgDark})`
  const pattern = `${t.accent}18`

  const Corner = ({ style }) => (
    <div style={{ position:'absolute', width:28, height:28, opacity:.35, ...style }} />
  )

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', padding:'2.5rem 1.5rem 2rem', position:'relative', background:gradBg, overflow:'hidden' }}>

      {/* Hintergrund-Muster */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:`repeating-linear-gradient(45deg,transparent,transparent 40px,${pattern} 40px,${pattern} 41px),repeating-linear-gradient(-45deg,transparent,transparent 40px,${pattern} 40px,${pattern} 41px)` }} />

      {/* Balken */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:gradBar }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:gradBar }} />

      {/* Ecken */}
      <Corner style={{ top:10,    left:10,  borderTop:   `1px solid ${t.accent}`, borderLeft:  `1px solid ${t.accent}` }} />
      <Corner style={{ top:10,    right:10, borderTop:   `1px solid ${t.accent}`, borderRight: `1px solid ${t.accent}` }} />
      <Corner style={{ bottom:10, left:10,  borderBottom:`1px solid ${t.accent}`, borderLeft:  `1px solid ${t.accent}` }} />
      <Corner style={{ bottom:10, right:10, borderBottom:`1px solid ${t.accent}`, borderRight: `1px solid ${t.accent}` }} />

      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', width:'100%' }}>

        <div style={{ fontSize:18, letterSpacing:8, opacity:.6, marginBottom:'.6rem', color:t.accent }}>— ✦ —</div>

        {/* Logo */}
        <div style={{ width:96, height:96, border:`2px solid ${t.accent}`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.2rem', position:'relative', background:gradLogo }}>
          <div style={{ position:'absolute', inset:5, border:`1px solid ${t.accent}40`, borderRadius:'50%' }} />
          {s.logoUrl
            ? <img src={s.logoUrl} alt="Guild Logo" style={{ width:64, height:64, borderRadius:'50%', objectFit:'cover' }} />
            : <span style={{ fontSize:38, lineHeight:1 }}>{s.emoji}</span>
          }
        </div>

        <div style={{ fontSize:11, letterSpacing:4, color:t.accentDim, textTransform:'uppercase', marginBottom:'.3rem' }}>{s.realm}</div>

        <h1 style={{ fontFamily:titleFont, fontSize:30, fontWeight:700, color:t.accentSoft, textAlign:'center', letterSpacing:2, lineHeight:1.15, marginBottom:'.2rem' }}>
          {s.guildName1}{s.guildName2 && <><br />{s.guildName2}</>}
        </h1>

        <div style={{ fontFamily:'Cinzel,serif', fontSize:11, letterSpacing:5, color:t.accentDim, textTransform:'uppercase', marginBottom:'1.4rem' }}>{s.guildSub}</div>

        {/* Trennlinie */}
        <div style={{ maxWidth:360, width:'100%', marginBottom:'1.4rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${t.accentFade})` }} />
          <div style={{ width:6, height:6, background:t.accent, transform:'rotate(45deg)', flexShrink:0 }} />
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${t.accentFade},transparent)` }} />
        </div>

        <p style={{ fontSize:16, fontStyle:'italic', color:t.accentDim, textAlign:'center', lineHeight:1.65, maxWidth:320, marginBottom:'1.8rem' }}>
          {s.tagline?.split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length-1 && <br />}</span>
          ))}
        </p>

        {/* Stats */}
        <div style={{ display:'flex', gap:'2.2rem', marginBottom:'2rem', alignItems:'center' }}>
          {[[s.stat1n,s.stat1l],[s.stat2n,s.stat2l],[s.stat3n,s.stat3l]].map(([num,lbl],i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'2.2rem' }}>
              {i > 0 && <div style={{ width:1, height:40, background:`linear-gradient(180deg,transparent,${t.accentFade},transparent)` }} />}
              <div style={{ textAlign:'center' }}>
                <span style={{ fontFamily:'Cinzel,serif', fontSize:22, fontWeight:600, color:t.accentSoft, display:'block' }}>{num}</span>
                <span style={{ fontSize:10, letterSpacing:2, color:t.accentFade, textTransform:'uppercase' }}>{lbl}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Button */}
        <button onClick={() => nav('/login')} style={{
          fontSize:14, padding:'14px 52px', letterSpacing:3, minWidth:240,
          fontFamily:'Cinzel,serif', textTransform:'uppercase',
          background:`linear-gradient(135deg,${t.accentFade},${t.accentGhost})`,
          border:`1px solid ${t.accent}`, color:t.accentSoft,
          borderRadius:2, cursor:'pointer', transition:'all .2s',
          boxShadow:`0 0 20px ${t.accent}20`,
        }}
          onMouseEnter={e => { e.currentTarget.style.background=`linear-gradient(135deg,${t.accent}30,${t.accentFade})`; e.currentTarget.style.boxShadow=`0 0 30px ${t.accent}40` }}
          onMouseLeave={e => { e.currentTarget.style.background=`linear-gradient(135deg,${t.accentFade},${t.accentGhost})`; e.currentTarget.style.boxShadow=`0 0 20px ${t.accent}20` }}
        >
          Einloggen
        </button>

        {/* Trennlinie unten */}
        <div style={{ maxWidth:360, width:'100%', margin:'1.8rem 0 1rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${t.accentFade})` }} />
          <div style={{ width:6, height:6, background:t.accent, transform:'rotate(45deg)', flexShrink:0 }} />
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${t.accentFade},transparent)` }} />
        </div>

        <div style={{ fontSize:11, letterSpacing:2, color:t.accentGhost, textTransform:'uppercase' }}>{s.footer}</div>
        <div style={{ fontSize:11, letterSpacing:3, color:t.accentGhost, textTransform:'uppercase', marginTop:'.3rem' }}>{s.server}</div>
      </div>
    </div>
  )
}
