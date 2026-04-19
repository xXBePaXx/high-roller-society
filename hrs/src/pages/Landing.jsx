import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Landing() {
  const { settings: s } = useAuth()
  const nav = useNavigate()

  const Corner = ({ style }) => <div style={{ position:'absolute', width:28, height:28, opacity:.35, ...style }} />

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', padding:'2.5rem 1.5rem 2rem', position:'relative', background:'linear-gradient(180deg,#1a1208 0%,#0d0a04 60%,#1a1208 100%)', overflow:'hidden' }}>

      {/* Hintergrund-Rauten */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'repeating-linear-gradient(45deg,transparent,transparent 40px,rgba(200,168,75,.025) 40px,rgba(200,168,75,.025) 41px),repeating-linear-gradient(-45deg,transparent,transparent 40px,rgba(200,168,75,.025) 40px,rgba(200,168,75,.025) 41px)' }} />

      {/* Goldbalken */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,transparent,#c8a84b,#f0d080,#c8a84b,transparent)' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:'linear-gradient(90deg,transparent,#c8a84b,#f0d080,#c8a84b,transparent)' }} />

      {/* Ecken */}
      <Corner style={{ top:10, left:10, borderTop:'1px solid #c8a84b', borderLeft:'1px solid #c8a84b' }} />
      <Corner style={{ top:10, right:10, borderTop:'1px solid #c8a84b', borderRight:'1px solid #c8a84b' }} />
      <Corner style={{ bottom:10, left:10, borderBottom:'1px solid #c8a84b', borderLeft:'1px solid #c8a84b' }} />
      <Corner style={{ bottom:10, right:10, borderBottom:'1px solid #c8a84b', borderRight:'1px solid #c8a84b' }} />

      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', width:'100%' }}>

        <div style={{ fontSize:18, letterSpacing:8, opacity:.6, marginBottom:'.6rem' }}>— ✦ —</div>

        {/* Logo */}
        <div style={{ width:96, height:96, border:'2px solid #c8a84b', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.2rem', position:'relative', background:'radial-gradient(circle,#2a1f08,#1a1208)' }}>
          <div style={{ position:'absolute', inset:5, border:'1px solid rgba(200,168,75,.25)', borderRadius:'50%' }} />
          <span style={{ fontSize:38, lineHeight:1 }}>{s.emoji}</span>
        </div>

        <div style={{ fontSize:11, letterSpacing:4, color:'#7a6030', textTransform:'uppercase', marginBottom:'.3rem' }}>{s.realm}</div>

        <h1 style={{ fontFamily:'Cinzel,serif', fontSize:30, fontWeight:700, color:'#f0d080', textAlign:'center', letterSpacing:2, lineHeight:1.15, marginBottom:'.2rem' }}>
          {s.guildName1}
          {s.guildName2 && <><br />{s.guildName2}</>}
        </h1>

        <div style={{ fontFamily:'Cinzel,serif', fontSize:11, letterSpacing:5, color:'#7a6030', textTransform:'uppercase', marginBottom:'1.4rem' }}>{s.guildSub}</div>

        <div className="gold-divider" style={{ maxWidth:360, width:'100%', marginBottom:'1.4rem' }}>
          <div className="gold-divider-line" /><div className="gold-divider-diamond" /><div className="gold-divider-line" />
        </div>

        <p style={{ fontSize:16, fontStyle:'italic', color:'#8a7040', textAlign:'center', lineHeight:1.65, maxWidth:320, marginBottom:'1.8rem' }}>
          {s.tagline?.split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
        </p>

        {/* Stats */}
        <div style={{ display:'flex', gap:'2.2rem', marginBottom:'2rem', alignItems:'center' }}>
          {[[s.stat1n, s.stat1l], [s.stat2n, s.stat2l], [s.stat3n, s.stat3l]].map(([num, lbl], i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'2.2rem' }}>
              {i > 0 && <div style={{ width:1, height:40, background:'linear-gradient(180deg,transparent,#4a3820,transparent)' }} />}
              <div style={{ textAlign:'center' }}>
                <span style={{ fontFamily:'Cinzel,serif', fontSize:22, fontWeight:600, color:'#f0d080', display:'block' }}>{num}</span>
                <span style={{ fontSize:10, letterSpacing:2, color:'#4a3820', textTransform:'uppercase' }}>{lbl}</span>
              </div>
            </div>
          ))}
        </div>

        <button className="btn-primary" style={{ fontSize:14, padding:'14px 52px', letterSpacing:3, minWidth:240 }} onClick={() => nav('/login')}>
          Einloggen
        </button>

        <div className="gold-divider" style={{ maxWidth:360, width:'100%', margin:'1.8rem 0 1rem' }}>
          <div className="gold-divider-line" /><div className="gold-divider-diamond" /><div className="gold-divider-line" />
        </div>

        <div style={{ fontSize:11, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase' }}>{s.footer}</div>
        <div style={{ fontSize:11, letterSpacing:3, color:'#2e2210', textTransform:'uppercase', marginTop:'.3rem' }}>{s.server}</div>
      </div>
    </div>
  )
}
