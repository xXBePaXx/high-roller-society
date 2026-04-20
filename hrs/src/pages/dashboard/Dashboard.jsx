import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { useAnnouncements } from '../../hooks/useAnnouncements'
import { useEvents } from '../../hooks/useEvents'
import { useDKP } from '../../hooks/useDKP'
import { useUsers } from '../../hooks/useUsers'

const CLASS_COLORS = {
  'Death Knight':'#C41E3A','Druid':'#FF7C0A','Hunter':'#AAD372','Mage':'#3FC7EB',
  'Paladin':'#F48CBA','Priest':'#DDDDDD','Rogue':'#FFF468','Shaman':'#0070DD',
  'Warlock':'#8788EE','Warrior':'#C69B3A',
}

const TYPE_COLORS = { info:'#38b8c8', warning:'#e87830', success:'#48c848', important:'#c84848' }
const TYPE_ICONS  = { info:'📢', warning:'⚠️', success:'✅', important:'🔴' }

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' })
}
function formatEventDate(str) {
  if (!str) return '—'
  const d = new Date(str+'T12:00:00')
  return d.toLocaleDateString('de-DE', { weekday:'long', day:'2-digit', month:'2-digit' })
}
function timeUntil(dateStr, timeStr) {
  const target = new Date(`${dateStr}T${timeStr||'20:00'}`)
  const diff   = target - new Date()
  if (diff < 0) return null
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `in ${days} Tag${days!==1?'en':''}`
  if (hours > 0) return `in ${hours} Std.`
  return 'Bald!'
}

function Card({ children, t, style={} }) {
  return <div style={{ background:t.cardBg, border:`1px solid ${t.accentFade}`, borderRadius:4, padding:'1.2rem 1.4rem', ...style }}>{children}</div>
}
function STitle({ children, t }) {
  return <div style={{ fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:3, color:t.accentDim, textTransform:'uppercase', marginBottom:'0.8rem', paddingBottom:'0.5rem', borderBottom:`1px solid ${t.accentFade}` }}>{children}</div>
}

// ─── Ankündigung schreiben ────────────────────────────────────────────────────
function PostForm({ t, onPost, currentUser, canPin }) {
  const [title,   setTitle]   = useState('')
  const [text,    setText]    = useState('')
  const [type,    setType]    = useState('info')
  const [pinned,  setPinned]  = useState(false)
  const [open,    setOpen]    = useState(false)
  const [busy,    setBusy]    = useState(false)

  async function handlePost() {
    if (!title.trim() || !text.trim()) return
    setBusy(true)
    await onPost({ title, text, type, pinned, author: currentUser.username, authorRank: currentUser.rank || 'Mitglied' })
    setTitle(''); setText(''); setType('info'); setPinned(false); setOpen(false)
    setBusy(false)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ width:'100%', background:'none', border:`1px dashed ${t.accentFade}`, color:t.accentDim, fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:2, padding:'10px', cursor:'pointer', borderRadius:3, textTransform:'uppercase', transition:'all .15s' }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=t.accent;e.currentTarget.style.color=t.accent}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=t.accentFade;e.currentTarget.style.color=t.accentDim}}>
      + Mitteilung verfassen
    </button>
  )

  return (
    <div style={{ background:t.bgMid, border:`1px solid ${t.accentFade}`, borderRadius:3, padding:'1rem' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginBottom:8 }}>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titel der Mitteilung..." style={{ fontSize:13 }} />
        <select value={type} onChange={e=>setType(e.target.value)} style={{ fontSize:11, width:120 }}>
          <option value="info">📢 Info</option>
          <option value="warning">⚠️ Warnung</option>
          <option value="success">✅ Erfolg</option>
          <option value="important">🔴 Wichtig</option>
        </select>
      </div>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Nachricht schreiben... (max. 500 Zeichen)" maxLength={500} style={{ minHeight:80, width:'100%', boxSizing:'border-box', fontSize:13, marginBottom:8 }} />
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {canPin && (
          <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:11, color:t.accentDim }}>
            <div onClick={()=>setPinned(v=>!v)} style={{ width:14, height:14, borderRadius:2, background:pinned?t.accent:'transparent', border:`1px solid ${pinned?t.accent:t.accentFade}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {pinned && <span style={{ color:t.bgDark, fontSize:9, fontWeight:700 }}>✓</span>}
            </div>
            Anheften (für alle sichtbar)
          </label>
        )}
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button className="btn-ghost" style={{ fontSize:10 }} onClick={()=>setOpen(false)}>Abbrechen</button>
          <button className="btn-primary" style={{ fontSize:11 }} onClick={handlePost} disabled={busy||!title.trim()||!text.trim()}>
            {busy ? '...' : 'Veröffentlichen'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Einzelne Ankündigung ────────────────────────────────────────────────────
function AnnouncementCard({ a, t, canManage, onDelete, onTogglePin }) {
  const typeColor = TYPE_COLORS[a.type] || t.accent
  const clsColor  = CLASS_COLORS[a.authorCls] || t.accent

  return (
    <div style={{ border:`1px solid ${a.pinned ? typeColor+'60' : t.accentFade}`, borderLeft:`3px solid ${typeColor}`, borderRadius:3, background:a.pinned?`${typeColor}06`:t.bgDark, padding:'0.9rem 1rem', position:'relative' }}>
      {a.pinned && (
        <div style={{ position:'absolute', top:8, right:canManage?60:10, fontSize:9, color:typeColor, fontFamily:'Cinzel,serif', letterSpacing:1, background:`${typeColor}15`, padding:'2px 6px', borderRadius:2 }}>
          📌 ANGEHEFTET
        </div>
      )}

      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
        <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>{TYPE_ICONS[a.type]||'📢'}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'Cinzel,serif', fontSize:13, color:t.accentSoft, fontWeight:600, marginBottom:4 }}>{a.title}</div>
          <div style={{ fontSize:13, color:t.textPrimary, lineHeight:1.65, whiteSpace:'pre-line' }}>{a.text}</div>
          <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:10, color:clsColor, fontFamily:'Cinzel,serif' }}>{a.author}</span>
            <span style={{ fontSize:10, color:t.textMuted }}>·</span>
            <span style={{ fontSize:10, color:t.textMuted }}>{a.authorRank}</span>
            <span style={{ fontSize:10, color:t.textMuted }}>·</span>
            <span style={{ fontSize:10, color:t.textMuted }}>{formatDate(a.createdAt)}</span>
          </div>
        </div>
        {canManage && (
          <div style={{ display:'flex', gap:4, flexShrink:0 }}>
            <button className="btn-icon" title={a.pinned?'Lösen':'Anheften'} onClick={()=>onTogglePin(a.id,a.pinned)} style={{ fontSize:12 }}>{a.pinned?'📌':'📍'}</button>
            <button className="btn-icon danger" title="Löschen" onClick={()=>onDelete(a.id)} style={{ fontSize:12 }}>✕</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const { currentUser } = useAuth()
  const t = useTheme()
  const { pinned, regular, loading: annLoading, addAnnouncement, deleteAnnouncement, togglePin } = useAnnouncements()
  const { events } = useEvents()
  const { getAllBalances, transactions } = useDKP()
  const { users } = useUsers()

  const perms      = currentUser?.permissions || {}
  const isAdmin    = currentUser?.role === 'admin'
  const canPost    = isAdmin || perms.canManageEvents || perms.canManageDKP
  const canPin     = isAdmin
  const clsColor   = CLASS_COLORS[currentUser?.cls] || t.accent

  // Nächstes Event
  const now         = new Date()
  const upcoming    = events.filter(e => new Date(`${e.eventDate}T${e.eventTime||'00:00'}`) >= now).sort((a,b) => new Date(`${a.eventDate}T${a.eventTime||'00:00'}`) - new Date(`${b.eventDate}T${b.eventTime||'00:00'}`))
  const nextEvent   = upcoming[0] || null
  const countdown   = nextEvent ? timeUntil(nextEvent.eventDate, nextEvent.eventTime) : null

  // Eigene Stats
  const balances  = getAllBalances(users)
  const myBalance = currentUser?.id ? (balances[currentUser.id] ?? 0) : 0
  const myTxCount = transactions.filter(tx => tx.userId === currentUser?.id).length

  // Rang in DKP-Tabelle
  const activeUsers = users.filter(u => u.active)
  const ranked      = activeUsers.map(u => ({ ...u, balance: balances[u.id] ?? 0 })).sort((a,b) => b.balance-a.balance)
  const myRank      = ranked.findIndex(u => u.id === currentUser?.id) + 1

  // Meine Anmeldung zum nächsten Event
  const mySignup = nextEvent?.signups?.find(s => s.userId === currentUser?.id)

  const allAnnouncements = [...pinned, ...regular]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>

      {/* Willkommen */}
      <Card t={t} style={{ display:'flex', alignItems:'center', gap:'1.2rem' }}>
        <div style={{ width:52, height:52, borderRadius:4, background:t.bgDark, border:`1px solid ${clsColor}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
          {currentUser?.cls === 'Death Knight' ? '💀' : currentUser?.cls === 'Druid' ? '🌙' : currentUser?.cls === 'Hunter' ? '🏹' : currentUser?.cls === 'Mage' ? '🔮' : currentUser?.cls === 'Paladin' ? '⚔️' : currentUser?.cls === 'Priest' ? '✨' : currentUser?.cls === 'Rogue' ? '🗡️' : currentUser?.cls === 'Shaman' ? '⚡' : currentUser?.cls === 'Warlock' ? '🔥' : '🛡️'}
        </div>
        <div style={{ flex:1 }}>
          <h1 style={{ fontFamily:'Cinzel,serif', fontSize:20, fontWeight:600, color:clsColor, margin:0, letterSpacing:1 }}>
            Willkommen, {currentUser?.username}
          </h1>
          <div style={{ fontSize:12, color:t.textSecondary, marginTop:3 }}>
            {currentUser?.rank} · {currentUser?.cls}{currentUser?.race?` · ${currentUser.race}`:''}
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display:'flex', gap:'1.5rem', flexShrink:0 }}>
          {[
            { label:'DKP', value: myBalance > 0 ? `+${myBalance}` : `${myBalance}`, color: myBalance >= 0 ? t.accent : '#c04040' },
            { label:'Rang', value: myRank > 0 ? `#${myRank}` : '—', color: t.accentSoft },
            { label:'Raids', value: myTxCount, color: t.accentDim },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:18, fontWeight:600, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:9, color:t.textMuted, letterSpacing:2, textTransform:'uppercase', marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Nächstes Event */}
      {nextEvent && (
        <Card t={t}>
          <STitle t={t}>Nächster Raid</STitle>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <div style={{ fontSize:32, flexShrink:0 }}>⚔️</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:15, color:t.accentSoft, fontWeight:600 }}>{nextEvent.title}</div>
              <div style={{ fontSize:12, color:t.textSecondary, marginTop:3 }}>
                {formatEventDate(nextEvent.eventDate)} · {nextEvent.eventTime||'—'} Uhr
              </div>
              {nextEvent.description && <div style={{ fontSize:12, color:t.textMuted, fontStyle:'italic', marginTop:4 }}>{nextEvent.description}</div>}
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              {countdown && <div style={{ fontFamily:'Cinzel,serif', fontSize:16, color:t.accent, fontWeight:600 }}>{countdown}</div>}
              <div style={{ fontSize:10, color:t.textMuted, marginTop:2 }}>
                {nextEvent.signups?.length||0}{nextEvent.maxSignups>0?`/${nextEvent.maxSignups}`:''} Angemeldet
              </div>
              {mySignup
                ? <div style={{ fontSize:10, color:'#4a9a5a', marginTop:4, fontStyle:'italic' }}>✓ Du bist angemeldet ({mySignup.role})</div>
                : <div style={{ fontSize:10, color:'#e08080', marginTop:4, fontStyle:'italic' }}>Noch nicht angemeldet</div>
              }
            </div>
          </div>
        </Card>
      )}

      {/* Ankündigungen */}
      <Card t={t}>
        <STitle t={t}>Gildennachrichten</STitle>

        {canPost && (
          <div style={{ marginBottom:'1rem' }}>
            <PostForm t={t} onPost={data => addAnnouncement({ ...data })} currentUser={currentUser} canPin={canPin} />
          </div>
        )}

        {annLoading ? (
          <div style={{ textAlign:'center', padding:'1.5rem', color:t.accentDim, fontStyle:'italic' }}>Lade Nachrichten...</div>
        ) : allAnnouncements.length === 0 ? (
          <div style={{ textAlign:'center', padding:'2rem', color:t.textMuted, fontStyle:'italic' }}>
            Noch keine Gildennachrichten.{canPost ? ' Verfasse die erste Mitteilung!' : ''}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {allAnnouncements.map(a => (
              <AnnouncementCard key={a.id} a={a} t={t}
                canManage={isAdmin || (canPost && a.author === currentUser?.username)}
                onDelete={id => deleteAnnouncement(id, currentUser?.username)}
                onTogglePin={(id, p) => togglePin(id, p, currentUser?.username)}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
