import { useState } from 'react'
import { useDKP, DKP_TYPES } from '../../hooks/useDKP'
import { useUsers } from '../../hooks/useUsers'
import { useEvents } from '../../hooks/useEvents'
import { useTheme } from '../../hooks/useTheme'
import Modal from '../../components/Modal'

const CLASS_COLORS = { 'Death Knight':'#C41E3A','Druid':'#FF7C0A','Hunter':'#AAD372','Mage':'#3FC7EB','Paladin':'#F48CBA','Priest':'#DDDDDD','Rogue':'#FFF468','Shaman':'#0070DD','Warlock':'#8788EE','Warrior':'#C69B3A' }

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})
}
function isUpcoming(event) { return new Date(`${event.eventDate}T${event.eventTime||'00:00'}`) >= new Date() }

const TABS = [
  { id:'leaderboard', label:'Rangliste' },
  { id:'attendance',  label:'Raid-Attendance' },
  { id:'loot',        label:'Loot vergeben' },
  { id:'manual',      label:'Manuelle Anpassung' },
  { id:'log',         label:'Gesamtverlauf' },
]

function Lbl({ children, t }) {
  return <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:t.textMuted, textTransform:'uppercase', marginBottom:5 }}>{children}</div>
}

export default function DKPAdmin() {
  const t = useTheme()
  const { transactions, loading, getAllBalances, addTransaction, addRaidAttendance, addLoot, resetUser, deleteTransaction } = useDKP()
  const { users } = useUsers()
  const { events } = useEvents()
  const [tab, setTab]   = useState('leaderboard')
  const [busy, setBusy] = useState(false)
  const [err, setErr]   = useState('')
  const [saved, setSaved] = useState('')
  const [confirm, setConfirm] = useState(null)

  const [attEvent,    setAttEvent]    = useState('')
  const [attAmount,   setAttAmount]   = useState(10)
  const [attReason,   setAttReason]   = useState('')
  const [attSelected, setAttSelected] = useState([])
  const [lootUser,   setLootUser]   = useState('')
  const [lootAmount, setLootAmount] = useState(10)
  const [lootItem,   setLootItem]   = useState('')
  const [lootEvent,  setLootEvent]  = useState('')
  const [manUser,   setManUser]   = useState('')
  const [manType,   setManType]   = useState('BONUS')
  const [manAmount, setManAmount] = useState(5)
  const [manReason, setManReason] = useState('')

  const activeUsers = users.filter(u=>u.active)
  const balances    = getAllBalances(users)
  const allEvents   = [...events.filter(isUpcoming).slice(0,5), ...events.filter(e=>!isUpcoming(e)).slice(0,20)]

  function flash(msg) { setSaved(msg); setTimeout(()=>setSaved(''),2500) }

  async function handleAttendance() {
    if(!attSelected.length){setErr('Keine Spieler ausgewählt.');return}
    if(!attAmount||attAmount<=0){setErr('Betrag >0.');return}
    setBusy(true);setErr('')
    try { const ev=allEvents.find(e=>e.id===attEvent); await addRaidAttendance({ userIds:attSelected, users:activeUsers, amount:attAmount, eventId:ev?.id||null, eventTitle:ev?.title||null, reason:attReason||ev?.title||'Raid-Teilnahme' }); setAttSelected([]); flash(`+${attAmount} DKP an ${attSelected.length} Spieler`) }
    catch(e){setErr(e.message)} setBusy(false)
  }
  async function handleLoot() {
    if(!lootUser){setErr('Spieler auswählen.');return}
    setBusy(true);setErr('')
    try { const u=activeUsers.find(x=>x.id===lootUser); const ev=allEvents.find(e=>e.id===lootEvent); await addLoot({ userId:lootUser,username:u?.name||'?',amount:lootAmount,item:lootItem,eventId:ev?.id||null,eventTitle:ev?.title||null }); setLootItem('');setLootUser('');setLootEvent(''); flash(`-${lootAmount} DKP für ${u?.name}`) }
    catch(e){setErr(e.message)} setBusy(false)
  }
  async function handleManual() {
    if(!manUser){setErr('Spieler auswählen.');return}
    setBusy(true);setErr('')
    try { const u=activeUsers.find(x=>x.id===manUser); await addTransaction({userId:manUser,username:u?.name||'?',type:manType,amount:manAmount,reason:manReason}); setManReason('');setManUser(''); flash(`DKP (${DKP_TYPES[manType]?.label}) für ${u?.name}`) }
    catch(e){setErr(e.message)} setBusy(false)
  }

  const ranked = activeUsers.map(u=>({...u,balance:balances[u.id]??0})).sort((a,b)=>b.balance-a.balance)

  const tabStyle = (id) => ({
    background:'transparent', border:'none',
    borderBottom: tab===id ? `2px solid ${t.accent}` : '2px solid transparent',
    color: tab===id ? t.accentSoft : t.accentDim,
    fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, textTransform:'uppercase',
    padding:'6px 14px', cursor:'pointer', transition:'all .15s', marginBottom:-1,
  })

  return (
    <div>
      <div className="section-title">DKP-Verwaltung</div>

      <div style={{ display:'flex', gap:2, borderBottom:`1px solid ${t.accentFade}`, marginBottom:'1.2rem' }}>
        {TABS.map(tb=><button key={tb.id} onClick={()=>{setTab(tb.id);setErr('')}} style={tabStyle(tb.id)}>{tb.label}</button>)}
      </div>

      {saved && <div style={{ fontSize:12, color:'#4a9a5a', fontStyle:'italic', marginBottom:'.8rem' }}>✓ {saved}</div>}
      {err   && <div style={{ fontSize:12, color:'#e08080', fontStyle:'italic', marginBottom:'.8rem' }}>✕ {err}</div>}

      {/* Rangliste */}
      {tab==='leaderboard' && (
        <div>
          {ranked.map((u,idx) => {
            const medal = idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':null
            const userTx = transactions.filter(tx=>tx.userId===u.id)
            return (
              <div key={u.id} style={{ display:'grid', gridTemplateColumns:'28px 1fr auto auto', alignItems:'center', gap:12, padding:'0.65rem 0.8rem', borderBottom:`1px solid ${t.accentFade}` }}>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:12, color:medal?t.accent:t.textMuted, textAlign:'center' }}>{medal||`${idx+1}`}</div>
                <div>
                  <span style={{ fontSize:13, color:CLASS_COLORS[u.cls]||t.accent, fontFamily:'Cinzel,serif', fontWeight:600 }}>{u.name}</span>
                  <span style={{ fontSize:10, color:t.textMuted, marginLeft:8 }}>{u.rank}</span>
                  <div style={{ fontSize:10, color:t.accentGhost, marginTop:1 }}>{userTx.length} Transaktionen · {userTx.filter(tx=>tx.type==='RAID_ATTENDANCE').length} Raids</div>
                </div>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:15, color:u.balance>=0?t.accent:'#c04040', fontWeight:600 }}>
                  {u.balance>0?'+':''}{u.balance} <span style={{ fontSize:9, color:t.textMuted }}>DKP</span>
                </div>
                <button className="btn-ghost" style={{ fontSize:9 }} onClick={()=>setConfirm({ title:`DKP Reset — ${u.name}`, text:`Setzt den DKP-Stand von ${u.name} auf 0. Alle bisherigen Transaktionen bleiben erhalten.`, onOk:async()=>{ await resetUser(u.id,u.name); flash(`DKP von ${u.name} zurückgesetzt`) } })}>Reset</button>
              </div>
            )
          })}
          {ranked.length===0 && <div style={{ textAlign:'center', padding:'2rem', color:t.textMuted, fontStyle:'italic' }}>Noch keine Spieler.</div>}
        </div>
      )}

      {/* Attendance */}
      {tab==='attendance' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><Lbl t={t}>Event (optional)</Lbl><select value={attEvent} onChange={e=>setAttEvent(e.target.value)} style={{ fontSize:12, width:'100%' }}><option value="">— Kein Event —</option>{allEvents.map(e=><option key={e.id} value={e.id}>{e.title} ({e.eventDate})</option>)}</select></div>
            <div><Lbl t={t}>DKP pro Spieler</Lbl><input type="number" min={1} max={999} value={attAmount} onChange={e=>setAttAmount(Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
          </div>
          <div><Lbl t={t}>Grund (optional)</Lbl><input value={attReason} onChange={e=>setAttReason(e.target.value)} placeholder="z.B. Kara Clear" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <Lbl t={t}>Anwesende Spieler ({attSelected.length}/{activeUsers.length} ausgewählt)</Lbl>
              <button className="btn-ghost" style={{ fontSize:9 }} onClick={()=>setAttSelected(attSelected.length===activeUsers.length?[]:activeUsers.map(u=>u.id))}>
                {attSelected.length===activeUsers.length?'Alle abwählen':'Alle auswählen'}
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:4, maxHeight:260, overflowY:'auto' }}>
              {activeUsers.map(u => {
                const sel = attSelected.includes(u.id)
                return (
                  <div key={u.id} onClick={()=>setAttSelected(prev=>prev.includes(u.id)?prev.filter(x=>x!==u.id):[...prev,u.id])}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:3, cursor:'pointer', background:sel?`${t.accent}10`:t.bgDark, border:`1px solid ${sel?t.accentFade:t.accentGhost}`, transition:'all .15s' }}>
                    <div style={{ width:14, height:14, borderRadius:2, flexShrink:0, background:sel?t.accent:'transparent', border:`1px solid ${sel?t.accent:t.accentFade}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {sel && <span style={{ color:t.bgDark, fontSize:9, fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:12, color:CLASS_COLORS[u.cls]||t.accent, fontFamily:'Cinzel,serif' }}>{u.name}</span>
                    <span style={{ fontSize:10, color:t.textMuted, marginLeft:'auto' }}>{balances[u.id]??0} DKP</span>
                  </div>
                )
              })}
            </div>
          </div>
          <button className="btn-primary" style={{ fontSize:12, alignSelf:'flex-end' }} onClick={handleAttendance} disabled={busy||attSelected.length===0}>{busy?'Speichern...':`+${attAmount} DKP an ${attSelected.length} Spieler`}</button>
        </div>
      )}

      {/* Loot */}
      {tab==='loot' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:480 }}>
          <div><Lbl t={t}>Spieler</Lbl><select value={lootUser} onChange={e=>setLootUser(e.target.value)} style={{ fontSize:12, width:'100%' }}><option value="">— Spieler wählen —</option>{activeUsers.sort((a,b)=>(balances[b.id]??0)-(balances[a.id]??0)).map(u=><option key={u.id} value={u.id}>{u.name} ({balances[u.id]??0} DKP)</option>)}</select></div>
          <div><Lbl t={t}>Item / Loot-Beschreibung</Lbl><input value={lootItem} onChange={e=>setLootItem(e.target.value)} placeholder="z.B. Netherblade" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><Lbl t={t}>DKP-Kosten</Lbl><input type="number" min={1} max={9999} value={lootAmount} onChange={e=>setLootAmount(Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
            <div><Lbl t={t}>Event (optional)</Lbl><select value={lootEvent} onChange={e=>setLootEvent(e.target.value)} style={{ fontSize:12, width:'100%' }}><option value="">— Kein Event —</option>{allEvents.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></div>
          </div>
          {lootUser && <div style={{ background:'rgba(192,57,43,.08)', border:'1px solid #3a1a1a', borderRadius:3, padding:'0.7rem', fontSize:12, color:'#e08080' }}>{activeUsers.find(u=>u.id===lootUser)?.name} hat aktuell <strong>{balances[lootUser]??0} DKP</strong> → nach Loot: <strong>{(balances[lootUser]??0)-lootAmount} DKP</strong></div>}
          <button className="btn-primary" style={{ fontSize:12, alignSelf:'flex-end' }} onClick={handleLoot} disabled={busy||!lootUser}>{busy?'Speichern...':`Loot eintragen (−${lootAmount} DKP)`}</button>
        </div>
      )}

      {/* Manual */}
      {tab==='manual' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:480 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><Lbl t={t}>Spieler</Lbl><select value={manUser} onChange={e=>setManUser(e.target.value)} style={{ fontSize:12, width:'100%' }}><option value="">— Spieler wählen —</option>{activeUsers.map(u=><option key={u.id} value={u.id}>{u.name} ({balances[u.id]??0} DKP)</option>)}</select></div>
            <div><Lbl t={t}>Typ</Lbl><select value={manType} onChange={e=>setManType(e.target.value)} style={{ fontSize:12, width:'100%' }}>{['BONUS','PENALTY','MANUAL'].map(tp=><option key={tp} value={tp}>{DKP_TYPES[tp].icon} {DKP_TYPES[tp].label}</option>)}</select></div>
          </div>
          <div><Lbl t={t}>Betrag (DKP)</Lbl><input type="number" min={1} max={9999} value={manAmount} onChange={e=>setManAmount(Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
          <div><Lbl t={t}>Grund (Pflicht)</Lbl><input value={manReason} onChange={e=>setManReason(e.target.value)} placeholder="z.B. Gildenbank-Spende" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
          <button className="btn-primary" style={{ fontSize:12, alignSelf:'flex-end' }} onClick={handleManual} disabled={busy||!manUser||!manReason}>{busy?'Speichern...':`${DKP_TYPES[manType]?.sign>=0?'+':'-'}${manAmount} DKP eintragen`}</button>
        </div>
      )}

      {/* Log */}
      {tab==='log' && (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead><tr>{['','Spieler','Typ','Betrag','Grund','Event','Datum',''].map((h,i)=><th key={i} style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:t.textMuted, textTransform:'uppercase', padding:'.5rem .6rem', borderBottom:`1px solid ${t.accentFade}`, textAlign:'left', fontWeight:400, whiteSpace:'nowrap' }}>{h}</th>)}</tr></thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ textAlign:'center', padding:'2rem', color:t.accentDim, fontStyle:'italic' }}>Lade...</td></tr>}
              {!loading&&transactions.length===0 && <tr><td colSpan={8} style={{ textAlign:'center', padding:'2rem', color:t.textMuted, fontStyle:'italic' }}>Noch keine Transaktionen.</td></tr>}
              {transactions.map(tx => {
                const type = DKP_TYPES[tx.type]
                const sign = tx.type==='RESET'?0:type?.sign??1
                return (
                  <tr key={tx.id} style={{ borderBottom:`1px solid ${t.accentFade}` }}>
                    <td style={{ padding:'.45rem .6rem', fontSize:16 }}>{type?.icon||'•'}</td>
                    <td style={{ padding:'.45rem .6rem', color:CLASS_COLORS[users.find(u=>u.id===tx.userId)?.cls]||t.accent, fontFamily:'Cinzel,serif', fontSize:11 }}>{tx.username}</td>
                    <td style={{ padding:'.45rem .6rem', color:type?.color||t.accentDim, fontSize:10, fontFamily:'Cinzel,serif', letterSpacing:1 }}>{type?.label||tx.type}</td>
                    <td style={{ padding:'.45rem .6rem', fontFamily:'Cinzel,serif', fontSize:12, color:tx.type==='RESET'?t.accentDim:sign>=0?'#4a9a5a':'#c04040', fontWeight:600 }}>{tx.type==='RESET'?'Reset':`${sign>=0?'+':'-'}${tx.amount}`}</td>
                    <td style={{ padding:'.45rem .6rem', color:t.textSecondary, fontStyle:'italic', maxWidth:160 }}>{tx.reason||'—'}</td>
                    <td style={{ padding:'.45rem .6rem', color:t.textMuted, fontSize:10 }}>{tx.eventTitle||'—'}</td>
                    <td style={{ padding:'.45rem .6rem', color:t.accentGhost, fontSize:10, whiteSpace:'nowrap' }}>{formatDate(tx.createdAt)}</td>
                    <td style={{ padding:'.45rem .6rem' }}><button className="btn-icon danger" onClick={()=>setConfirm({ title:'Transaktion löschen', text:`Transaktion von ${tx.username} wirklich löschen?`, onOk:async()=>{ await deleteTransaction(tx.id); flash('Transaktion gelöscht') } })}>✕</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirm && (
        <Modal title={confirm.title} onClose={()=>setConfirm(null)} onOk={async()=>{ await confirm.onOk(); setConfirm(null) }} okLabel="Bestätigen">
          <p style={{ fontSize:13, color:t.textSecondary }}>{confirm.text}</p>
        </Modal>
      )}
    </div>
  )
}
