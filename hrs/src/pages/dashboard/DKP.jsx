import { useState } from 'react'
import { useDKP, DKP_TYPES } from '../../hooks/useDKP'
import { useAuth } from '../../contexts/AuthContext'
import { useUsers } from '../../hooks/useUsers'
import { useEvents } from '../../hooks/useEvents'

const CLASS_COLORS = {
  'Death Knight': '#C41E3A', 'Druid': '#FF7C0A', 'Hunter': '#AAD372',
  'Mage': '#3FC7EB', 'Paladin': '#F48CBA', 'Priest': '#DDDDDD',
  'Rogue': '#FFF468', 'Shaman': '#0070DD', 'Warlock': '#8788EE', 'Warrior': '#C69B3A',
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:3, color:'#5a4828', textTransform:'uppercase', marginBottom:'1rem', paddingBottom:'0.5rem', borderBottom:'1px solid #1e1808' }}>
      {children}
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background:'#120e06', border:'1px solid #2e2210', borderRadius:4, padding:'1.4rem', ...style }}>
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
function DKPInfo() {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }} onClick={() => setOpen(v => !v)}>
        <SectionTitle>Wie funktioniert DKP?</SectionTitle>
        <span style={{ color:'#3a2c18', fontSize:10, marginTop:-8 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <p style={{ fontSize:13, color:'#7a6030', lineHeight:1.7, margin:0 }}>
            <strong style={{ color:'#c8a84b', fontFamily:'Cinzel,serif', fontSize:11, letterSpacing:1 }}>DKP — Dragon Kill Points</strong> ist unser System zur fairen Loot-Verteilung. Wer regelmäßig raidet sammelt Punkte und bekommt beim Loot Vorrang.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
            {[
              { icon:'⚔️', title:'Raid-Teilnahme', text:'Für jeden Raid bei dem du dabei bist bekommst du DKP. Pünktlichkeit und Vorbereitung zahlen sich aus.' },
              { icon:'🎁', title:'Loot kaufen', text:'Wenn ein Item droppt bietest du DKP. Höchstes Gebot gewinnt. Die Punkte werden abgezogen.' },
              { icon:'⭐', title:'Bonus', text:'Außergewöhnliche Leistung, Gildenbank-Spenden oder besonderer Einsatz können mit Bonus-DKP belohnt werden.' },
              { icon:'⚠️', title:'Abzüge', text:'Wiederholtes Fehlen ohne Abmeldung, schlechte Vorbereitung oder Regelverstoß können zu Abzügen führen.' },
            ].map(item => (
              <div key={item.title} style={{ background:'#0d0a04', border:'1px solid #1e1808', borderRadius:3, padding:'0.8rem' }}>
                <div style={{ fontSize:18, marginBottom:6 }}>{item.icon}</div>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:1, color:'#c8a84b', marginBottom:4 }}>{item.title}</div>
                <div style={{ fontSize:11, color:'#5a4828', lineHeight:1.6 }}>{item.text}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(200,168,75,.05)', border:'1px solid #2e2210', borderRadius:3, padding:'0.8rem', fontSize:12, color:'#5a4828', lineHeight:1.6 }}>
            💡 <strong style={{ color:'#7a6030' }}>Tipp:</strong> Melde dich im Kalender für jeden Raid an. Nur wer angemeldet und dabei ist bekommt volle Punkte. Abwesenheitsmeldungen schützen vor Abzügen.
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
function Leaderboard({ users, balances, currentUserId }) {
  const ranked = users
    .filter(u => u.active)
    .map(u => ({ ...u, balance: balances[u.id] ?? 0 }))
    .sort((a, b) => b.balance - a.balance)

  return (
    <Card>
      <SectionTitle>DKP-Rangliste</SectionTitle>
      {ranked.length === 0 ? (
        <div style={{ textAlign:'center', padding:'1.5rem', color:'#3a2c18', fontStyle:'italic' }}>Noch keine DKP-Daten.</div>
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
                background: isMe ? 'rgba(200,168,75,.06)' : 'transparent',
                border: isMe ? '1px solid #3a2c18' : '1px solid transparent',
                transition:'background .15s',
              }}>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:12, color: medal ? '#c8a84b' : '#3a2c18', textAlign:'center' }}>
                  {medal || `${idx+1}`}
                </div>
                <div>
                  <span style={{ fontSize:13, color: CLASS_COLORS[u.cls] || '#c8a84b', fontFamily:'Cinzel,serif', fontWeight:600 }}>{u.name}</span>
                  <span style={{ fontSize:10, color:'#3a2c18', marginLeft:8 }}>{u.rank}</span>
                  {isMe && <span style={{ fontSize:9, color:'#c8a84b', marginLeft:6, fontFamily:'Cinzel,serif', letterSpacing:1 }}>DU</span>}
                </div>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:14, color: u.balance >= 0 ? '#c8a84b' : '#c04040', fontWeight:600 }}>
                  {u.balance > 0 ? '+' : ''}{u.balance}
                  <span style={{ fontSize:9, color:'#3a2c18', marginLeft:3 }}>DKP</span>
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
      <Card>
        <div style={{ display:'flex', alignItems:'baseline', gap:'1rem', marginBottom:'0.8rem' }}>
          <h1 style={{ fontFamily:'Cinzel,serif', fontSize:20, fontWeight:600, color:'#f0d080', margin:0, letterSpacing:1 }}>DKP</h1>
          <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'#5a4828', letterSpacing:2 }}>DRAGON KILL POINTS</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'2rem' }}>
          <div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:32, color: myBalance >= 0 ? '#c8a84b' : '#c04040', fontWeight:600, lineHeight:1 }}>
              {myBalance > 0 ? '+' : ''}{myBalance}
            </div>
            <div style={{ fontSize:11, color:'#3a2c18', marginTop:4, fontStyle:'italic' }}>Dein aktueller Stand</div>
          </div>
          <div style={{ borderLeft:'1px solid #2e2210', paddingLeft:'2rem' }}>
            <div style={{ fontSize:13, color:'#7a6030' }}>{myTx.length} Transaktionen</div>
            <div style={{ fontSize:11, color:'#3a2c18', fontStyle:'italic', marginTop:2 }}>
              {myTx.filter(t => t.type === 'RAID_ATTENDANCE').length} Raids · {myTx.filter(t => t.type === 'LOOT').length} Loot
            </div>
          </div>
        </div>
      </Card>

      <DKPInfo />

      <Leaderboard users={users} balances={balances} currentUserId={currentUser?.id} />

      {/* Eigene Transaktionen */}
      <Card>
        <SectionTitle>Mein Verlauf</SectionTitle>
        {loading ? (
          <div style={{ textAlign:'center', padding:'2rem', color:'#5a4828', fontStyle:'italic' }}>Lade DKP-Daten...</div>
        ) : myTx.length === 0 ? (
          <div style={{ textAlign:'center', padding:'2rem', color:'#3a2c18', fontStyle:'italic' }}>Noch keine Transaktionen.</div>
        ) : (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
              {displayedTx.map(t => {
                const type = DKP_TYPES[t.type]
                const sign = t.type === 'RESET' ? 0 : type?.sign ?? 1
                const amount = sign >= 0 ? `+${t.amount}` : `-${t.amount}`
                return (
                  <div key={t.id} style={{ display:'grid', gridTemplateColumns:'28px 1fr auto auto', alignItems:'center', gap:10, padding:'0.5rem 0.4rem', borderBottom:'1px solid #0d0a04' }}>
                    <span style={{ fontSize:16, textAlign:'center' }}>{type?.icon || '•'}</span>
                    <div>
                      <div style={{ fontSize:12, color:'#c8a84b' }}>{type?.label || t.type}</div>
                      {t.reason && <div style={{ fontSize:10, color:'#4a3820', fontStyle:'italic', marginTop:1 }}>{t.reason}</div>}
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
