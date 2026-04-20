import { useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'

export default function ThemeInjector() {
  const t = useTheme()

  useEffect(() => {
    const root = document.documentElement
    // Akzent-Farben
    root.style.setProperty('--gold',        t.accent)
    root.style.setProperty('--gold-bright', t.accentSoft)
    root.style.setProperty('--gold-dim',    t.accentDim)
    root.style.setProperty('--gold-dark',   t.accentFade)
    root.style.setProperty('--gold-deeper', t.accentGhost)
    // Hintergründe
    root.style.setProperty('--bg',          t.bgDark)
    root.style.setProperty('--bg-mid',      t.bgMid)
    root.style.setProperty('--bg-card',     t.cardBg)
    root.style.setProperty('--bg-hover',    `${t.accent}0d`)
    root.style.setProperty('--border',      t.accentFade)
    // Texte
    root.style.setProperty('--text-primary',   t.textPrimary)
    root.style.setProperty('--text-secondary',  t.textSecondary)
    root.style.setProperty('--text-muted',      t.textMuted)
    // Inputs
    root.style.setProperty('--input-bg',    t.inputBg)
  }, [
    t.accent, t.accentSoft, t.accentDim, t.accentFade, t.accentGhost,
    t.bgDark, t.bgMid, t.cardBg, t.textPrimary, t.textSecondary,
    t.textMuted, t.inputBg,
  ])

  return null
}
