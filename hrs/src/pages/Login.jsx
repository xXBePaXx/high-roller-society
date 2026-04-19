import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isLockedOut, getLockoutRemaining } from '../utils/security'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { login, currentUser } = useAuth()
  const nav = useNavigate()

  // Nach Login: Redirect je nach Rolle
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
    setBusy(true)
    setError('')
    const res = await login(username, password)
    setBusy(false)
    if (res.ok) {
      // Redirect übernimmt der useEffect via currentUser.role
    } else {
      setError(res.error)
      if (res.locked) setCountdown(getLockoutRemaining())
    }
  }

  const locked = countdown > 0
  const mins = Math.floor(countdown / 60)
  const secs = countdown % 60

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0d0a04', padding:'2rem', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg,transparent,transparent 40px,rgba(200,168,75,.025) 40px,rgba(200,168,75,.025) 41px)', pointerEvents:'none' }} />

      <div style={{ background:'#120e06', border:'1px solid #4a3820', borderRadius:4, padding:'2.5rem 2rem', width:'100%', maxWidth:360, position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'60%', height:2, background:'linear-gradient(90deg,transparent,#c8a84b,transparent)' }} />

        <h2 style={{ fontFamily:'Cinzel,serif', fontSize:18, fontWeight:600, color:'#f0d080', textAlign:'center', marginBottom:'.3rem' }}>Zugang</h2>
        <p style={{ fontSize:13, color:'#7a6030', textAlign:'center', fontStyle:'italic', marginBottom:'1.8rem' }}>High Roller Society — Mitgliederbereich</p>

        {locked ? (
          <div style={{ background:'rgba(192,57,43,.1)', border:'1px solid #6a2020', borderRadius:2, padding:'1rem', textAlign:'center' }}>
            <div style={{ fontSize:13, color:'#e08080', marginBottom:'.5rem' }}>Zugang vorübergehend gesperrt.</div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:24, color:'#c8a84b' }}>
              {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
            </div>
            <div style={{ fontSize:12, color:'#7a6030', marginTop:'.4rem', fontStyle:'italic' }}>Bitte warten...</div>
          </div>
        ) : (
          <>
            <label className="field-label">Charaktername</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Dein Charaktername" style={{ marginBottom:'1.2rem' }} autoComplete="username" />

            <label className="field-label">Passwort</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={{ marginBottom:'1.4rem' }} autoComplete="current-password"
              onKeyDown={e => e.key==='Enter' && handleLogin()} />

            <button className="btn-primary" style={{ width:'100%', padding:12, fontSize:13 }} onClick={handleLogin} disabled={busy || locked}>
              {busy ? 'Einen Moment...' : 'Eintreten'}
            </button>
          </>
        )}

        {error && !locked && <p className="error-text" style={{ textAlign:'center', marginTop:'.8rem' }}>{error}</p>}

        <button className="btn-ghost" style={{ display:'block', margin:'1rem auto 0', border:'none', fontSize:13, color:'#5a4828' }} onClick={() => nav('/')}>
          ← Zurück
        </button>
      </div>
    </div>
  )
}
