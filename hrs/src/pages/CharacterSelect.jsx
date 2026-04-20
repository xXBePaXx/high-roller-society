import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../hooks/useTheme'

const CLASS_COLORS = {
  'Death Knight':'#C41E3A','Druid':'#FF7C0A','Hunter':'#AAD372','Mage':'#3FC7EB',
  'Paladin':'#F48CBA','Priest':'#DDDDDD','Rogue':'#FFF468','Shaman':'#0070DD',
  'Warlock':'#8788EE','Warrior':'#C69B3A',
}
const CLASS_ICONS = {
  'Death Knight':'💀','Druid':'🌙','Hunter':'🏹','Mage':'🔮','Paladin':'⚔️',
  'Priest':'✨','Rogue':'🗡️','Shaman':'⚡','Warlock':'🔥','Warrior':'🛡️',
}

export default function CharacterSelect() {
  const { pendingAccount, selectCharacter, cancelCharSelect } = useAuth()
  const t = useTheme()

  if (!pendingAccount) return null

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:t.gradBg, padding:'2rem', position:'relative', overflow:'hidden',
    }}>
      {/* Muster */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:`repeating-linear-gradient(45deg,transparent,transparent 40px,${t.pattern} 40px,${t.pattern} 41px)` }} />
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:t.gradBar }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:t.gradBar }} />

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:480 }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'1.8rem' }}>
          <div style={{ fontFamily:'Cinzel,serif', fontSize:11, color:t.accentDim, letterSpacing:4, textTransform:'uppercase', marginBottom:'0.5rem' }}>
            Willkommen zurück
          </div>
          <h1 style={{ fontFamily:'Cinzel,serif', fontSize:22, color:t.accentSoft, margin:0, letterSpacing:1 }}>
            {pendingAccount.username}
          </h1>
          <div style={{ fontSize:12, color:t.textSecondary, marginTop:'0.4rem' }}>
            Wähle deinen Charakter
          </div>
        </div>

        {/* Charakter-Karten */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem', marginBottom:'1.2rem' }}>
          {pendingAccount.characters.map((char, idx) => {
            const clsColor = CLASS_COLORS[char.cls] || t.accent
            const clsIcon  = CLASS_ICONS[char.cls]  || '⚔️'
            return (
              <button key={idx} onClick={() => selectCharacter(idx)} style={{
                display:'flex', alignItems:'center', gap:'1rem',
                background:t.cardBg, border:`1px solid ${t.accentFade}`,
                borderRadius:4, padding:'1rem 1.2rem', cursor:'pointer',
                textAlign:'left', transition:'all .2s', width:'100%',
              }}
                onMouseEnter={e => { e.currentTarget.style.border=`1px solid ${clsColor}60`; e.currentTarget.style.background=`${clsColor}08` }}
                onMouseLeave={e => { e.currentTarget.style.border=`1px solid ${t.accentFade}`; e.currentTarget.style.background=t.cardBg }}
              >
                {/* Klassen-Icon */}
                <div style={{ width:52, height:52, borderRadius:4, background:t.bgDark, border:`1px solid ${clsColor}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>
                  {clsIcon}
                </div>

                {/* Charakter-Info */}
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'Cinzel,serif', fontSize:16, color:clsColor, fontWeight:600, letterSpacing:0.5 }}>
                    {char.name}
                  </div>
                  <div style={{ fontSize:12, color:t.textSecondary, marginTop:3 }}>
                    {char.cls}{char.race ? ` · ${char.race}` : ''}{char.level ? ` · Level ${char.level}` : ''}
                  </div>
                  <div style={{ fontSize:10, color:t.textMuted, marginTop:2 }}>
                    {char.characterType === 'main' ? '⭐ Main' : '🔄 Twink'}
                    {char.rank && <span style={{ marginLeft:8, color:t.accentDim, fontFamily:'Cinzel,serif', letterSpacing:1 }}>· {char.rank}</span>}
                  </div>
                </div>

                {/* Pfeil */}
                <div style={{ color:t.accentFade, fontSize:16, flexShrink:0 }}>→</div>
              </button>
            )
          })}
        </div>

        {/* Abbrechen */}
        <div style={{ textAlign:'center' }}>
          <button onClick={cancelCharSelect} style={{
            background:'transparent', border:'none', color:t.accentDim,
            fontSize:12, cursor:'pointer', fontFamily:'Cinzel,serif',
            letterSpacing:1, transition:'color .15s',
          }}
            onMouseEnter={e => e.target.style.color=t.accent}
            onMouseLeave={e => e.target.style.color=t.accentDim}
          >
            ← Zurück zum Login
          </button>
        </div>
      </div>
    </div>
  )
}
