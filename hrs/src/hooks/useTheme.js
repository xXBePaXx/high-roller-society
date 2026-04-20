import { useAuth } from '../contexts/AuthContext'

// Identische Defaults wie in Landing.jsx und Website.jsx
const PHASE_DEFAULTS = {
  phase1:     { accent:'#c8a84b', accentSoft:'#f0d080', accentDim:'#a07840', accentFade:'#4a3820', accentGhost:'#3a2c18', bgDark:'#0d0a04', bgMid:'#1a1208', textColor:'#f0d080', textPrimary:'#e8d090', textSecondary:'#a07840', textMuted:'#5a4828', cardBg:'#120e06', inputBg:'#1a1208', font:'cinzel' },
  phase2:     { accent:'#38b8c8', accentSoft:'#7ae0ee', accentDim:'#4a9aaa', accentFade:'#1a4858', accentGhost:'#0e2830', bgDark:'#050e12', bgMid:'#08141a', textColor:'#7ae0ee', textPrimary:'#90d8e8', textSecondary:'#4a9aaa', textMuted:'#2a5868', cardBg:'#0a1820', inputBg:'#08141a', font:'cinzel' },
  phase3:     { accent:'#48c848', accentSoft:'#88ee88', accentDim:'#4a9a4a', accentFade:'#1a3820', accentGhost:'#0e2010', bgDark:'#040a04', bgMid:'#080f08', textColor:'#88ee88', textPrimary:'#80e080', textSecondary:'#4a9a4a', textMuted:'#2a5830', cardBg:'#0a120a', inputBg:'#080f08', font:'cinzel' },
  phase4:     { accent:'#e87830', accentSoft:'#f8b060', accentDim:'#c06828', accentFade:'#602808', accentGhost:'#381808', bgDark:'#0d0502', bgMid:'#180a04', textColor:'#f8b060', textPrimary:'#f0a050', textSecondary:'#c06828', textMuted:'#804020', cardBg:'#160804', inputBg:'#180a04', font:'cinzel' },
  darkportal: { accent:'#58e830', accentSoft:'#90ff60', accentDim:'#58a830', accentFade:'#6a1a08', accentGhost:'#3a0e06', bgDark:'#0e0604', bgMid:'#1c0e08', textColor:'#90ff60', textPrimary:'#c0f090', textSecondary:'#58a830', textMuted:'#3a6820', cardBg:'#160a06', inputBg:'#1c0e08', font:'cinzel' },
  custom1:    { accent:'#c8a84b', accentSoft:'#f0d080', accentDim:'#a07840', accentFade:'#4a3820', accentGhost:'#3a2c18', bgDark:'#0d0a04', bgMid:'#1a1208', textColor:'#f0d080', textPrimary:'#e8d090', textSecondary:'#a07840', textMuted:'#5a4828', cardBg:'#120e06', inputBg:'#1a1208', font:'cinzel' },
  custom2:    { accent:'#a848c8', accentSoft:'#d080f0', accentDim:'#8048a8', accentFade:'#3a1848', accentGhost:'#220e30', bgDark:'#080410', bgMid:'#12081a', textColor:'#d080f0', textPrimary:'#c070e0', textSecondary:'#8048a8', textMuted:'#4a2868', cardBg:'#100618', inputBg:'#12081a', font:'cinzel' },
  custom3:    { accent:'#c84848', accentSoft:'#f08080', accentDim:'#a04040', accentFade:'#481818', accentGhost:'#300e0e', bgDark:'#100404', bgMid:'#1a0808', textColor:'#f08080', textPrimary:'#e07070', textSecondary:'#a04040', textMuted:'#602828', cardBg:'#160606', inputBg:'#1a0808', font:'cinzel' },
}

export function useTheme() {
  const { settings: s } = useAuth()
  const phase  = s.phase || 'phase1'
  const stored = s.phaseStyles?.[phase] || {}
  const def    = PHASE_DEFAULTS[phase] || PHASE_DEFAULTS.phase1

  const t = {
    accent:        stored.accent        || def.accent,
    accentSoft:    stored.accentSoft    || def.accentSoft,
    accentDim:     stored.accentDim     || def.accentDim,
    accentFade:    stored.accentFade    || def.accentFade,
    accentGhost:   stored.accentGhost   || def.accentGhost,
    bgDark:        stored.bgDark        || def.bgDark,
    bgMid:         stored.bgMid         || def.bgMid,
    textColor:     stored.textColor     || def.textColor,
    textPrimary:   stored.textPrimary   || def.textPrimary   || def.accentSoft,
    textSecondary: stored.textSecondary || def.textSecondary || def.accentDim,
    textMuted:     stored.textMuted     || def.textMuted     || def.accentGhost,
    cardBg:        stored.cardBg        || def.cardBg        || def.bgMid,
    inputBg:       stored.inputBg       || def.inputBg       || def.bgMid,
    font:          stored.font          || def.font,
  }

  // Abgeleitete Werte
  t.gradBg  = `linear-gradient(180deg,${t.bgMid} 0%,${t.bgDark} 60%,${t.bgMid} 100%)`
  t.gradBar = `linear-gradient(90deg,transparent,${t.accent},${t.accentSoft},${t.accent},transparent)`
  t.pattern = `${t.accent}18`
  t.border  = `${t.accent}40`

  return t
}
