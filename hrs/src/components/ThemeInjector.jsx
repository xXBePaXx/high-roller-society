import { useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'

// Setzt CSS-Variablen aus dem aktiven Theme in :root
// Dadurch reagieren global.css Klassen (btn-primary, btn-ghost, inputs etc.)
// automatisch auf Theme-Wechsel ohne Code-Änderungen
export default function ThemeInjector() {
  const t = useTheme()

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--gold',        t.accent)
    root.style.setProperty('--gold-bright', t.accentSoft)
    root.style.setProperty('--gold-dim',    t.accentDim)
    root.style.setProperty('--gold-dark',   t.accentFade)
    root.style.setProperty('--gold-deeper', t.accentGhost)
    root.style.setProperty('--bg',          t.bgDark)
    root.style.setProperty('--bg-mid',      t.bgMid)
    root.style.setProperty('--bg-card',     t.bgMid)
    root.style.setProperty('--bg-hover',    `${t.accent}0d`)
    root.style.setProperty('--border',      t.accentFade)
  }, [t.accent, t.accentSoft, t.accentDim, t.accentFade, t.accentGhost, t.bgDark, t.bgMid])

  return null
}
