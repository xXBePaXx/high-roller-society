import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { isLockedOut, getLockoutRemaining } from '../utils/security'

export default function Login() {
  const [username,  setUsername]  = useState('')
  const [password,  setPassword]  = useState('')
  const [error,     setError]     = useState('')
  const [busy,      setBusy]      = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { login, currentUser } = useAuth()
  const nav = useNavigate()
  const t   = useTheme()

  useEffect(() => {
    if (currentUser?.role === 'admin')  nav('/admin',     { replace: true })
    if (currentUser?.role === 'member') nav('/dashboard', { replace: true })
  }, [currentUser, nav])

  useEffect(() => {
    if (isLockedOut()) setCountdown(getLockoutRemaining())
    const id = setInterval(() => {
      if (isLockedOut()) setCountdown(getLockoutRemaining())
      else { setCountdown(0); setError('') }
    }, 1000)
    return () => clearInterval(id)
  }, [])

  async function handleLogin() {
    if (!username || !password || busy) return
    setBusy(true); setError('')
    const res = await login(username, password)
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      if (res.locked) setCountdown(getLockoutRemaining())
    }
  }

  const locked = countdown > 0
  const mins   = Math.floor(countdown / 60)
  const secs   = countdown % 60

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: t.gradBg, padding: '2rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Hintergrund-Muster */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:`repeating-linear-gradient(45deg,transparent,transparent 40px,${t.pattern} 40px,${t.pattern} 41px)` }} />

      {/* Farbbalken */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:t.gradBar }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:t.gradBar }} />

      <div style={{
        background: t.bgMid, border: `1px solid ${t.accentFade}`,
        borderRadius: 4, padding: '2.5rem 2rem', width: '100%', maxWidth: 360, position: 'relative',
        boxShadow: `0 0 40px ${t.accent}10`,
      }}>
        {/* Akzent-Linie oben */}
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'60%', height:2, background:t.gradBar }} />

        <h2 style={{ fontFamily:'Cinzel,serif', fontSize:18, fontWeight:600, color:t.accentSoft, textAlign:'center', marginBottom:'.3rem' }}>
          Zugang
        </h2>
        <p style={{ fontSize:13, color:t.accentDim, textAlign:'center', fontStyle:'italic', marginBottom:'1.8rem' }}>
          High Roller Society — Mitgliederbereich
        </p>

        {locked ? (
          <div style={{ background:`${t.accent}08`, border:`1px solid ${t.accentFade}`, borderRadius:2, padding:'1rem', textAlign:'center' }}>
            <div style={{ fontSize:13, color:'#e08080', marginBottom:'.5rem' }}>Zugang vorübergehend gesperrt.</div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:24, color:t.accent }}>
              {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
            </div>
            <div style={{ fontSize:12, color:t.accentDim, marginTop:'.4rem', fontStyle:'italic' }}>Bitte warten...</div>
          </div>
        ) : (
          <>
            <label className="field-label">Charaktername</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Dein Charaktername"
              style={{ marginBottom:'1.2rem' }} autoComplete="username" />

            <label className="field-label">Passwort</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" style={{ marginBottom:'1.4rem' }} autoComplete="current-password"
              onKeyDown={e => e.key==='Enter' && handleLogin()} />

            <button style={{
              width:'100%', padding:12, fontSize:13, letterSpacing:2,
              fontFamily:'Cinzel,serif', textTransform:'uppercase', cursor:'pointer',
              background:`linear-gradient(135deg,${t.accentFade},${t.bgDark})`,
              border:`1px solid ${t.accent}`, color:t.accentSoft,
              borderRadius:2, transition:'all .2s',
              boxShadow:`0 0 16px ${t.accent}15`,
              opacity: busy || locked ? 0.6 : 1,
            }}
              onClick={handleLogin} disabled={busy || locked}
              onMouseEnter={e => { if(!busy) { e.currentTarget.style.background=`linear-gradient(135deg,${t.accent}30,${t.accentFade})`; e.currentTarget.style.boxShadow=`0 0 24px ${t.accent}30` }}}
              onMouseLeave={e => { e.currentTarget.style.background=`linear-gradient(135deg,${t.accentFade},${t.bgDark})`; e.currentTarget.style.boxShadow=`0 0 16px ${t.accent}15` }}
            >
              {busy ? 'Einen Moment...' : 'Eintreten'}
            </button>
          </>
        )}

        {error && !locked && (
          <p style={{ textAlign:'center', marginTop:'.8rem', fontSize:12, color:'#e08080', fontStyle:'italic' }}>{error}</p>
        )}

        <button style={{
          display:'block', margin:'1rem auto 0', background:'transparent', border:'none',
          fontSize:13, color:t.accentDim, cursor:'pointer', fontFamily:'Cinzel,serif',
          letterSpacing:1, transition:'color .15s',
        }}
          onMouseEnter={e => e.target.style.color=t.accent}
          onMouseLeave={e => e.target.style.color=t.accentDim}
          onClick={() => nav('/')}
        >
          ← Zurück
        </button>
      </div>
    </div>
  )
}
