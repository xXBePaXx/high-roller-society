import { useState } from 'react'
import { useDKP, DKP_TYPES } from '../../hooks/useDKP'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { useUsers } from '../../hooks/useUsers'
import { useEvents } from '../../hooks/useEvents'

const CLASS_COLORS = {
  'Death Knight': '#C41E3A', 'Druid': '#FF7C0A', 'Hunter': '#AAD372',
  'Mage': '#3FC7EB', 'Paladin': '#F48CBA', 'Priest': '#DDDDDD',
  'Rogue': '#FFF468', 'Shaman': '#0070DD', 'Warlock': '#8788EE', 'Warrior': '#C69B3A',
}

function SectionTitle({ children, t }) {
  return (
    <div style={{ fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:3, color:t?.accentDim||'#5a4828', textTransform:'uppercase', marginBottom:'1rem', paddingBottom:'0.5rem', borderBottom:`1px solid ${t?.accentFade||'#1e1808'}` }}>
      {children}
    </div>
  )
}

function Card({ children, t, style = {} }) {
  return (
    <div style={{ background:t?.bgMid||'#120e06', border:`1px solid ${t?.accentFade||'#2e2210'}`, borderRadius:4, padding:'1.4rem', ...style }}>
      {children}
    </div>
  )
}

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' }) + ' ' + d.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' })
}

// ─── DKP-Info Sektion ────────────────────────────────────────────────────────
function DKPInfo({ t }) {
  const [open, setOpen] = useState(false)
  return (
    <Card t={t}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }} onClick={() => setOpen(v => !v)}>
        <SectionTitle>Wie funktioniert DKP?</SectionTitle>
        <span style={{ color:'#3a2c18', fontSize:10, marginTop:-8 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <p style={{ fontSize:13, color:t?.accentDim||'#7a6030', lineHeight:1.7, margin:0 }}>
            <strong style={{ color:t?.accent||'#c8a84b', fontFamily:'Cinzel,serif', fontSize:11, letterSpacing:1 }}>DKP — Dragon Kill Points</strong> ist unser System zur fairen Loot-Verteilung. Wer regelmäßig raidet sammelt Punkte und bekommt beim Loot Vorrang.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
            {[
              { icon:'⚔️', title:'Raid-Teilnahme', text:'Für jeden Raid bei dem du dabei bist bekommst du DKP. Pünktlichkeit und Vorbereitung zahlen sich aus.' },
              { icon:'🎁', title:'Loot kaufen', text:'Wenn ein Item droppt bietest du DKP. Höchstes Gebot gewinnt. Die Punkte werden abgezogen.' },
              { icon:'⭐', title:'Bonus', text:'Außergewöhnliche Leistung, Gildenbank-Spenden oder besonderer Einsatz können mit Bonus-DKP belohnt werden.' },
              { icon:'⚠️', title:'Abzüge', text:'Wiederholtes Fehlen ohne Abmeldung, schlechte Vorbereitung oder Regelverstoß können zu Abzügen führen.' },
            ].map(item => (
              <div key={item.title} style={{ background:t?.bgDark||'#0d0a04', border:`1px solid ${t?.accentFade||'#1e1808'}`, borderRadius:3, padding:'0.8rem' }}>
                <div style={{ fontSize:18, marginBottom:6 }}>{item.icon}</div>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:1, color:t.accent, marginBottom:4 }}>{item.title}</div>
                <div style={{ fontSize:11, color:t?.accentDim||'#5a4828', lineHeight:1.6 }}>{item.text}</div>
              </div>
            ))}
          </div>
          <div style={{ background:`${t?.accent||'#c8a84b'}08`, border:`1px solid ${t?.accentFade||'#2e2210'}`, borderRadius:3, padding:'0.8rem', fontSize:12, color:t?.accentDim||'#5a4828', lineHeight:1.6 }}>
            💡 <strong style={{ color:'#7a6030' }}>Tipp:</strong> Melde dich im Kalender für jeden Raid an. Nur wer angemeldet und dabei ist bekommt volle Punkte. Abwesenheitsmeldungen schützen vor Abzügen.
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
function Leaderboard({ users, balances, currentUserId, t }) {
  const ranked = users
    .filter(u => u.active)
    .map(u => ({ ...u, balance: balances[u.id] ?? 0 }))
    .sort((a, b) => b.balance - a.balance)

  return (
    <Card t={t}>
      <SectionTitle t={t}>DKP-Rangliste</SectionTitle>
      {ranked.length === 0 ? (
        <div style={{ textAlign:'center', padding:'1.5rem', color:t?.accentGhost||'#3a2c18', fontStyle:'italic' }}>Noch keine DKP-Daten.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {ranked.map((u, idx) => {
            const isMe = u.id === currentUserId
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null
            return (
              <div key={u.id} style={{
                display:'grid', gridTemplateColumns:'28px 1fr auto',
                alignItems:'center', gap:10,
                padding:'0.6rem 0.8rem', borderRadius:3,
                background: isMe ? `${t?.accent||'#c8a84b'}10` : 'transparent',
                border: isMe ? `1px solid ${t?.accentFade||'#3a2c18'}` : '1px solid transparent',
                transition:'background .15s',
              }}>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:12, color: medal ? (t?.accent||'#c8a84b') : (t?.accentGhost||'#3a2c18'), textAlign:'center' }}>
                  {medal || `${idx+1}`}
                </div>
                <div>
                  <span style={{ fontSize:13, color: CLASS_COLORS[u.cls] || '#c8a84b', fontFamily:'Cinzel,serif', fontWeight:600 }}>{u.name}</span>
                  <span style={{ fontSize:10, color:t?.accentGhost||'#3a2c18', marginLeft:8 }}>{u.rank}</span>
                  {isMe && <span style={{ fontSize:9, color:t?.accent||'#c8a84b', marginLeft:6, fontFamily:'Cinzel,serif', letterSpacing:1 }}>DU</span>}
                </div>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:14, color: u.balance >= 0 ? (t?.accent||'#c8a84b') : '#c04040', fontWeight:600 }}>
                  {u.balance > 0 ? '+' : ''}{u.balance}
                  <span style={{ fontSize:9, color:t?.accentGhost||'#3a2c18', marginLeft:3 }}>DKP</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ─── Hauptkomponente ─────────────────────────────────────────────────────────
export default function DKP() {
  const { currentUser } = useAuth()
  const t = useTheme()
  const { transactions, loading, getBalance, getAllBalances } = useDKP()
  const { users } = useUsers()
  const [showAll, setShowAll] = useState(false)

  const perms = currentUser?.permissions || {}
  const canManage = currentUser?.role === 'admin' || perms.canManageDKP

  const balances    = getAllBalances(users)
  const myBalance   = currentUser?.id ? (balances[currentUser.id] ?? getBalance(currentUser.id)) : 0
  const myTx        = transactions.filter(t => t.userId === currentUser?.id)
  const displayedTx = showAll ? myTx : myTx.slice(0, 10)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

      {/* Header */}
      <Card t={t}>
        <div style={{ display:'flex', alignItems:'baseline', gap:'1rem', marginBottom:'0.8rem' }}>
          <h1 style={{ fontFamily:'Cinzel,serif', fontSize:20, fontWeight:600, color:t.accentSoft, margin:0, letterSpacing:1 }}>DKP</h1>
          <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:t.accentDim, letterSpacing:2 }}>DRAGON KILL POINTS</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'2rem' }}>
          <div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:32, color: myBalance >= 0 ? t.accent : '#c04040', fontWeight:600, lineHeight:1 }}>
              {myBalance > 0 ? '+' : ''}{myBalance}
            </div>
            <div style={{ fontSize:11, color:t.accentGhost, marginTop:4, fontStyle:'italic' }}>Dein aktueller Stand</div>
          </div>
          <div style={{ borderLeft:`1px solid ${t.accentFade}`, paddingLeft:'2rem' }}>
            <div style={{ fontSize:13, color:t.accentDim }}>{myTx.length} Transaktionen</div>
            <div style={{ fontSize:11, color:t.accentGhost, fontStyle:'italic', marginTop:2 }}>
              {myTx.filter(t => t.type === 'RAID_ATTENDANCE').length} Raids · {myTx.filter(t => t.type === 'LOOT').length} Loot
            </div>
          </div>
        </div>
      </Card>

      <DKPInfo t={t} />

      <Leaderboard users={users} balances={balances} currentUserId={currentUser?.id} t={t} />

      {/* Eigene Transaktionen */}
      <Card t={t}>
        <SectionTitle t={t}>Mein Verlauf</SectionTitle>
        {loading ? (
          <div style={{ textAlign:'center', padding:'2rem', color:t.accentDim, fontStyle:'italic' }}>Lade DKP-Daten...</div>
        ) : myTx.length === 0 ? (
          <div style={{ textAlign:'center', padding:'2rem', color:t.accentGhost, fontStyle:'italic' }}>Noch keine Transaktionen.</div>
        ) : (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
              {displayedTx.map(t => {
                const type = DKP_TYPES[t.type]
                const sign = t.type === 'RESET' ? 0 : type?.sign ?? 1
                const amount = sign >= 0 ? `+${t.amount}` : `-${t.amount}`
                return (
                  <div key={t.id} style={{ display:'grid', gridTemplateColumns:'28px 1fr auto auto', alignItems:'center', gap:10, padding:'0.5rem 0.4rem', borderBottom:`1px solid ${t.bgDark}` }}>
                    <span style={{ fontSize:16, textAlign:'center' }}>{type?.icon || '•'}</span>
                    <div>
                      <div style={{ fontSize:12, color:'#c8a84b' }}>{type?.label || t.type}</div>
                      {t.reason && <div style={{ fontSize:10, color:t.accentDim, fontStyle:'italic', marginTop:1 }}>{t.reason}</div>}
                    </div>
                    <div style={{ fontFamily:'Cinzel,serif', fontSize:13, color: t.type === 'RESET' ? '#5a4828' : sign >= 0 ? '#4a9a5a' : '#c04040', fontWeight:600, textAlign:'right' }}>
                      {t.type === 'RESET' ? 'Reset' : amount}
                    </div>
                    <div style={{ fontSize:10, color:'#3a2c18', textAlign:'right', whiteSpace:'nowrap' }}>{formatDate(t.createdAt)}</div>
                  </div>
                )
              })}
            </div>
            {myTx.length > 10 && (
              <button className="btn-ghost" style={{ fontSize:10, marginTop:10 }} onClick={() => setShowAll(v => !v)}>
                {showAll ? 'Weniger anzeigen' : `Alle ${myTx.length} anzeigen`}
              </button>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
