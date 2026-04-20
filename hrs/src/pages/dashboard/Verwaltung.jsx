import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useEvents, EVENT_TYPES, ROLES } from '../../hooks/useEvents'
import { useDKP, DKP_TYPES } from '../../hooks/useDKP'
import { useUsers } from '../../hooks/useUsers'
import { useTheme } from '../../hooks/useTheme'
import Modal from '../../components/Modal'

function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr+'T12:00:00')
  return d.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'})+(timeStr?` · ${timeStr}`:'')
}
function isUpcoming(event) { return new Date(`${event.eventDate}T${event.eventTime||'00:00'}`) >= new Date() }

function SectionTitle({ children, t }) {
  return <div style={{ fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:3, color:t.accentDim, textTransform:'uppercase', marginBottom:'1rem', paddingBottom:'0.5rem', borderBottom:`1px solid ${t.accentFade}` }}>{children}</div>
}
function Card({ children, t, style={} }) {
  return <div style={{ background:t.cardBg, border:`1px solid ${t.accentFade}`, borderRadius:4, padding:'1.4rem', ...style }}>{children}</div>
}
function Lbl({ children, t }) {
  return <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:t.textMuted, textTransform:'uppercase', marginBottom:5 }}>{children}</div>
}

const EMPTY_EVENT = { title:'', type:'raid', eventDate:'', eventTime:'20:00', description:'', maxSignups:0 }
const CLASS_COLORS = { 'Death Knight':'#C41E3A','Druid':'#FF7C0A','Hunter':'#AAD372','Mage':'#3FC7EB','Paladin':'#F48CBA','Priest':'#DDDDDD','Rogue':'#FFF468','Shaman':'#0070DD','Warlock':'#8788EE','Warrior':'#C69B3A' }

function EventsPanel({ t }) {
  const { events, loading, createEvent, deleteEvent, updateEvent } = useEvents()
  const [modal, setModal] = useState(null)
  const [form, setForm]   = useState(EMPTY_EVENT)
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState('')

  const upcoming = events.filter(isUpcoming)
  const past     = events.filter(e=>!isUpcoming(e))

  function openAdd() { setErr(''); const next=new Date(); next.setDate(next.getDate()+((3-next.getDay()+7)%7||7)); setForm({...EMPTY_EVENT,eventDate:next.toISOString().split('T')[0]}); setModal('add') }
  function openEdit(event) { setErr(''); setForm({title:event.title,type:event.type,eventDate:event.eventDate,eventTime:event.eventTime||'20:00',description:event.description||'',maxSignups:event.maxSignups||0}); setModal({type:'edit',event}) }
  async function handleOk() {
    setErr(''); if(!form.title?.trim()){setErr('Titel fehlt.');return} if(!form.eventDate){setErr('Datum fehlt.');return}
    setBusy(true)
    try { if(modal==='add') await createEvent(form); else if(modal?.type==='edit') await updateEvent(modal.event.id,form); setModal(null) }
    catch(e){setErr(e.message)} setBusy(false)
  }

  return (
    <Card t={t}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
        <SectionTitle t={t}>Events & Raids</SectionTitle>
        <button className="btn-ghost" style={{ fontSize:10, marginTop:-8 }} onClick={openAdd}>+ Event anlegen</button>
      </div>
      {loading ? <div style={{ textAlign:'center', padding:'1.5rem', color:t.accentDim, fontStyle:'italic' }}>Lade Events...</div>
      : events.length===0 ? <div style={{ textAlign:'center', padding:'1.5rem', color:t.textMuted, fontStyle:'italic' }}>Noch keine Events.</div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {[...upcoming,...past].map(event => {
            const et = EVENT_TYPES.find(x=>x.id===event.type)||EVENT_TYPES[0]
            return (
              <div key={event.id} style={{ display:'grid', gridTemplateColumns:'24px 1fr auto auto auto', alignItems:'center', gap:10, padding:'0.55rem 0.6rem', borderRadius:3, background:t.bgDark, border:`1px solid ${t.accentFade}`, opacity:isUpcoming(event)?1:0.5 }}>
                <span style={{ fontSize:16, textAlign:'center' }}>{et.icon}</span>
                <div>
                  <div style={{ fontSize:12, color:t.accentSoft, fontFamily:'Cinzel,serif' }}>{event.title}</div>
                  <div style={{ fontSize:10, color:t.textMuted, marginTop:1 }}>{formatDateTime(event.eventDate,event.eventTime)}</div>
                </div>
                <span style={{ fontSize:10, color:t.textSecondary }}>{event.signups?.length||0}{event.maxSignups>0?`/${event.maxSignups}`:''} 👥</span>
                <button className="btn-icon" onClick={()=>openEdit(event)}>✏️</button>
                <button className="btn-icon danger" onClick={async()=>{ if(window.confirm(`"${event.title}" wirklich löschen?`)) await deleteEvent(event.id) }}>✕</button>
              </div>
            )
          })}
        </div>
      )}
      {(modal==='add'||modal?.type==='edit') && (
        <Modal title={modal==='add'?'Neues Event anlegen':`Bearbeiten — ${modal.event.title}`} onClose={()=>setModal(null)} onOk={handleOk} okLabel={busy?'Speichern...':modal==='add'?'Anlegen':'Speichern'}>
          <div className="field-group"><label className="field-label">Titel</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="z.B. Karazhan — Weekly" /></div>
          <div className="field-group"><label className="field-label">Typ</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{EVENT_TYPES.map(tp=><option key={tp.id} value={tp.id}>{tp.icon} {tp.label}</option>)}</select></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div className="field-group"><label className="field-label">Datum</label><input type="date" value={form.eventDate} onChange={e=>setForm({...form,eventDate:e.target.value})} /></div>
            <div className="field-group"><label className="field-label">Uhrzeit</label><input type="time" value={form.eventTime} onChange={e=>setForm({...form,eventTime:e.target.value})} /></div>
          </div>
          <div className="field-group"><label className="field-label">Beschreibung (optional)</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{ minHeight:60 }} /></div>
          <div className="field-group"><label className="field-label">Max. Anmeldungen (0 = unbegrenzt)</label><input type="number" min={0} max={100} value={form.maxSignups} onChange={e=>setForm({...form,maxSignups:parseInt(e.target.value)||0})} /></div>
          {err && <p className="error-text">{err}</p>}
        </Modal>
      )}
    </Card>
  )
}

function DKPPanel({ t }) {
  const { getAllBalances, addRaidAttendance, addLoot, addTransaction } = useDKP()
  const { users }  = useUsers()
  const { events } = useEvents()
  const [tab, setTab]     = useState('attendance')
  const [busy, setBusy]   = useState(false)
  const [saved, setSaved] = useState('')
  const [err, setErr]     = useState('')

  const activeUsers = users.filter(u=>u.active)
  const balances    = getAllBalances(users)
  const allEvents   = [...events.filter(isUpcoming).slice(0,5),...events.filter(e=>!isUpcoming(e)).slice(0,15)]

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

  function flash(msg) { setSaved(msg); setTimeout(()=>setSaved(''),2500) }

  async function handleAttendance() {
    if(!attSelected.length){setErr('Keine Spieler.');return} setBusy(true);setErr('')
    try { const ev=allEvents.find(e=>e.id===attEvent); await addRaidAttendance({userIds:attSelected,users:activeUsers,amount:attAmount,eventId:ev?.id||null,eventTitle:ev?.title||null,reason:attReason||ev?.title||'Raid-Teilnahme'}); setAttSelected([]); flash(`+${attAmount} DKP vergeben`) }
    catch(e){setErr(e.message)} setBusy(false)
  }
  async function handleLoot() {
    if(!lootUser){setErr('Spieler wählen.');return} setBusy(true);setErr('')
    try { const u=activeUsers.find(x=>x.id===lootUser); const ev=allEvents.find(e=>e.id===lootEvent); await addLoot({userId:lootUser,username:u?.name||'?',amount:lootAmount,item:lootItem,eventId:ev?.id||null,eventTitle:ev?.title||null}); setLootItem('');setLootUser(''); flash(`-${lootAmount} DKP für ${u?.name}`) }
    catch(e){setErr(e.message)} setBusy(false)
  }
  async function handleManual() {
    if(!manUser||!manReason){setErr('Spieler und Grund angeben.');return} setBusy(true);setErr('')
    try { const u=activeUsers.find(x=>x.id===manUser); await addTransaction({userId:manUser,username:u?.name||'?',type:manType,amount:manAmount,reason:manReason}); setManReason('');setManUser(''); flash(`DKP für ${u?.name}`) }
    catch(e){setErr(e.message)} setBusy(false)
  }

  const DKPTABS = [{id:'attendance',label:'Attendance'},{id:'loot',label:'Loot'},{id:'manual',label:'Anpassung'}]
  const tabStyle = (id) => ({ background:'transparent', border:'none', borderBottom:tab===id?`2px solid ${t.accent}`:'2px solid transparent', color:tab===id?t.accentSoft:t.accentDim, fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, textTransform:'uppercase', padding:'5px 12px', cursor:'pointer', transition:'all .15s', marginBottom:-1 })

  return (
    <Card t={t}>
      <SectionTitle t={t}>DKP-Verwaltung</SectionTitle>
      <div style={{ display:'flex', gap:2, borderBottom:`1px solid ${t.accentFade}`, marginBottom:'1rem' }}>
        {DKPTABS.map(tb=><button key={tb.id} onClick={()=>{setTab(tb.id);setErr('')}} style={tabStyle(tb.id)}>{tb.label}</button>)}
      </div>
      {saved && <div style={{ fontSize:11, color:'#4a9a5a', fontStyle:'italic', marginBottom:10 }}>✓ {saved}</div>}
      {err   && <div style={{ fontSize:11, color:'#e08080', fontStyle:'italic', marginBottom:10 }}>✕ {err}</div>}

      {tab==='attendance' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 100px', gap:10 }}>
            <div><Lbl t={t}>Event</Lbl><select value={attEvent} onChange={e=>setAttEvent(e.target.value)} style={{ fontSize:12, width:'100%' }}><option value="">— Kein Event —</option>{allEvents.map(e=><option key={e.id} value={e.id}>{e.title} ({e.eventDate})</option>)}</select></div>
            <div><Lbl t={t}>DKP</Lbl><input type="number" min={1} value={attAmount} onChange={e=>setAttAmount(Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
          </div>
          <div><Lbl t={t}>Grund (optional)</Lbl><input value={attReason} onChange={e=>setAttReason(e.target.value)} placeholder="z.B. Kara Clear" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <Lbl t={t}>Spieler ({attSelected.length} ausgewählt)</Lbl>
              <button className="btn-ghost" style={{ fontSize:9 }} onClick={()=>setAttSelected(attSelected.length===activeUsers.length?[]:activeUsers.map(u=>u.id))}>{attSelected.length===activeUsers.length?'Alle abwählen':'Alle'}</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:3, maxHeight:200, overflowY:'auto' }}>
              {activeUsers.map(u => {
                const sel = attSelected.includes(u.id)
                return (
                  <div key={u.id} onClick={()=>setAttSelected(prev=>prev.includes(u.id)?prev.filter(x=>x!==u.id):[...prev,u.id])}
                    style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 8px', borderRadius:3, cursor:'pointer', background:sel?`${t.accent}10`:t.bgDark, border:`1px solid ${sel?t.accentFade:t.accentGhost}`, transition:'all .15s' }}>
                    <div style={{ width:13, height:13, borderRadius:2, flexShrink:0, background:sel?t.accent:'transparent', border:`1px solid ${sel?t.accent:t.accentFade}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {sel && <span style={{ color:t.bgDark, fontSize:8, fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:11, color:CLASS_COLORS[u.cls]||t.accent, fontFamily:'Cinzel,serif' }}>{u.name}</span>
                    <span style={{ fontSize:9, color:t.textMuted, marginLeft:'auto' }}>{balances[u.id]??0}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <button className="btn-primary" style={{ fontSize:11, alignSelf:'flex-end' }} onClick={handleAttendance} disabled={busy||attSelected.length===0}>{busy?'...':`+${attAmount} DKP an ${attSelected.length} Spieler`}</button>
        </div>
      )}

      {tab==='loot' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div><Lbl t={t}>Spieler</Lbl><select value={lootUser} onChange={e=>setLootUser(e.target.value)} style={{ fontSize:12, width:'100%' }}><option value="">— Spieler wählen —</option>{activeUsers.sort((a,b)=>(balances[b.id]??0)-(balances[a.id]??0)).map(u=><option key={u.id} value={u.id}>{u.name} ({balances[u.id]??0} DKP)</option>)}</select></div>
          <div><Lbl t={t}>Item</Lbl><input value={lootItem} onChange={e=>setLootItem(e.target.value)} placeholder="z.B. Netherblade" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><Lbl t={t}>DKP-Kosten</Lbl><input type="number" min={1} value={lootAmount} onChange={e=>setLootAmount(Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
            <div><Lbl t={t}>Event</Lbl><select value={lootEvent} onChange={e=>setLootEvent(e.target.value)} style={{ fontSize:12, width:'100%' }}><option value="">— Kein Event —</option>{allEvents.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></div>
          </div>
          {lootUser && <div style={{ fontSize:11, color:'#e08080', background:'rgba(192,57,43,.08)', border:'1px solid #3a1a1a', borderRadius:3, padding:'0.6rem' }}>{activeUsers.find(u=>u.id===lootUser)?.name}: {balances[lootUser]??0} → {(balances[lootUser]??0)-lootAmount} DKP</div>}
          <button className="btn-primary" style={{ fontSize:11, alignSelf:'flex-end' }} onClick={handleLoot} disabled={busy||!lootUser}>{busy?'...':`Loot eintragen (−${lootAmount} DKP)`}</button>
        </div>
      )}

      {tab==='manual' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><Lbl t={t}>Spieler</Lbl><select value={manUser} onChange={e=>setManUser(e.target.value)} style={{ fontSize:12, width:'100%' }}><option value="">— Spieler wählen —</option>{activeUsers.map(u=><option key={u.id} value={u.id}>{u.name} ({balances[u.id]??0} DKP)</option>)}</select></div>
            <div><Lbl t={t}>Typ</Lbl><select value={manType} onChange={e=>setManType(e.target.value)} style={{ fontSize:12, width:'100%' }}>{['BONUS','PENALTY','MANUAL'].map(tp=><option key={tp} value={tp}>{DKP_TYPES[tp].icon} {DKP_TYPES[tp].label}</option>)}</select></div>
          </div>
          <div><Lbl t={t}>Betrag</Lbl><input type="number" min={1} value={manAmount} onChange={e=>setManAmount(Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
          <div><Lbl t={t}>Grund (Pflicht)</Lbl><input value={manReason} onChange={e=>setManReason(e.target.value)} placeholder="z.B. Gildenbank-Spende" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
          <button className="btn-primary" style={{ fontSize:11, alignSelf:'flex-end' }} onClick={handleManual} disabled={busy||!manUser||!manReason}>{busy?'...':`${DKP_TYPES[manType]?.sign>=0?'+':'-'}${manAmount} DKP eintragen`}</button>
        </div>
      )}
    </Card>
  )
}

export default function Verwaltung() {
  const { currentUser } = useAuth()
  const t = useTheme()
  const perms = currentUser?.permissions || {}
  const canEvents = perms.canManageEvents
  const canDKP    = perms.canManageDKP

  if (!canEvents && !canDKP) return <div style={{ textAlign:'center', padding:'4rem', color:t.accentDim, fontStyle:'italic' }}>Du hast keine Verwaltungsrechte.</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      <Card t={t}>
        <div style={{ display:'flex', alignItems:'baseline', gap:'1rem' }}>
          <h1 style={{ fontFamily:'Cinzel,serif', fontSize:20, fontWeight:600, color:t.accentSoft, margin:0, letterSpacing:1 }}>Verwaltung</h1>
          <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:t.accentDim, letterSpacing:2 }}>{currentUser.rank?.toUpperCase()}</span>
        </div>
        <div style={{ marginTop:'0.5rem', display:'flex', gap:8, flexWrap:'wrap' }}>
          {canEvents && <span style={{ fontSize:10, color:'#4a9a5a', background:'rgba(74,154,90,.1)', border:'1px solid #1e3020', borderRadius:2, padding:'2px 8px', fontFamily:'Cinzel,serif', letterSpacing:1 }}>✓ Events</span>}
          {canDKP    && <span style={{ fontSize:10, color:t.accent, background:`${t.accent}18`, border:`1px solid ${t.accentFade}`, borderRadius:2, padding:'2px 8px', fontFamily:'Cinzel,serif', letterSpacing:1 }}>✓ DKP</span>}
        </div>
      </Card>
      {canEvents && <EventsPanel t={t} />}
      {canDKP    && <DKPPanel t={t} />}
    </div>
  )
}
