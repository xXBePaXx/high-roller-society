import { useAuth } from '../contexts/AuthContext'

// Identische Defaults wie in Landing.jsx und Website.jsx
const PHASE_DEFAULTS = {
  phase1:     { accent:'#c8a84b', accentSoft:'#f0d080', accentDim:'#7a6030', accentFade:'#4a3820', accentGhost:'#4a3820', bgDark:'#0d0a04', bgMid:'#1a1208', textColor:'#f0d080', font:'cinzel' },
  phase2:     { accent:'#38b8c8', accentSoft:'#7ae0ee', accentDim:'#2a7a88', accentFade:'#1a4858', accentGhost:'#3a7888', bgDark:'#050e12', bgMid:'#08141a', textColor:'#7ae0ee', font:'cinzel' },
  phase3:     { accent:'#48c848', accentSoft:'#88ee88', accentDim:'#2a7830', accentFade:'#1a3820', accentGhost:'#2a5830', bgDark:'#040a04', bgMid:'#080f08', textColor:'#88ee88', font:'cinzel' },
  phase4:     { accent:'#e87830', accentSoft:'#f8b060', accentDim:'#a04818', accentFade:'#602808', accentGhost:'#804828', bgDark:'#0d0502', bgMid:'#180a04', textColor:'#f8b060', font:'cinzel' },
  darkportal: { accent:'#58e830', accentSoft:'#90ff60', accentDim:'#2a6818', accentFade:'#6a1a08', accentGhost:'#4a3010', bgDark:'#0e0604', bgMid:'#1c0e08', textColor:'#90ff60', font:'cinzel' },
  custom1:    { accent:'#c8a84b', accentSoft:'#f0d080', accentDim:'#7a6030', accentFade:'#4a3820', accentGhost:'#4a3820', bgDark:'#0d0a04', bgMid:'#1a1208', textColor:'#f0d080', font:'cinzel' },
  custom2:    { accent:'#a848c8', accentSoft:'#d080f0', accentDim:'#6a3080', accentFade:'#3a1848', accentGhost:'#3a2848', bgDark:'#080410', bgMid:'#12081a', textColor:'#d080f0', font:'cinzel' },
  custom3:    { accent:'#c84848', accentSoft:'#f08080', accentDim:'#803030', accentFade:'#481818', accentGhost:'#482828', bgDark:'#100404', bgMid:'#1a0808', textColor:'#f08080', font:'cinzel' },
}

export function useTheme() {
  const { settings: s } = useAuth()
  const phase  = s.phase || 'phase1'
  const stored = s.phaseStyles?.[phase] || {}
  const def    = PHASE_DEFAULTS[phase] || PHASE_DEFAULTS.phase1

  const t = {
    accent:      stored.accent      || def.accent,
    accentSoft:  stored.accentSoft  || def.accentSoft,
    accentDim:   stored.accentDim   || def.accentDim,
    accentFade:  stored.accentFade  || def.accentFade,
    accentGhost: stored.accentGhost || def.accentGhost,
    bgDark:      stored.bgDark      || def.bgDark,
    bgMid:       stored.bgMid       || def.bgMid,
    textColor:   stored.textColor   || def.textColor,
    font:        stored.font        || def.font,
  }

  // Abgeleitete Werte
  t.gradBg  = `linear-gradient(180deg,${t.bgMid} 0%,${t.bgDark} 60%,${t.bgMid} 100%)`
  t.gradBar = `linear-gradient(90deg,transparent,${t.accent},${t.accentSoft},${t.accent},transparent)`
  t.pattern = `${t.accent}18`
  t.border  = `${t.accent}40`

  return t
}
