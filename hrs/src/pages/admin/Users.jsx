import { useState } from 'react'
import { useUsers } from '../../hooks/useUsers'
import { useRanks } from '../../hooks/useRanks'
import { useTheme } from '../../hooks/useTheme'
import { RACES, PRIMARY_PROFS, SECONDARY_PROFS, PROFESSIONS } from '../../hooks/useMemberData'
import Modal from '../../components/Modal'
import { db } from '../../firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { hashPassword } from '../../utils/security'

const WOW_CLASSES = ['Death Knight','Druid','Hunter','Mage','Paladin','Priest','Rogue','Shaman','Warlock','Warrior']
const CLASS_COLORS = { 'Death Knight':'#C41E3A','Druid':'#FF7C0A','Hunter':'#AAD372','Mage':'#3FC7EB','Paladin':'#F48CBA','Priest':'#DDDDDD','Rogue':'#FFF468','Shaman':'#0070DD','Warlock':'#8788EE','Warrior':'#C69B3A' }
const CLASS_ICONS  = { 'Death Knight':'💀','Druid':'🌙','Hunter':'🏹','Mage':'🔮','Paladin':'⚔️','Priest':'✨','Rogue':'🗡️','Shaman':'⚡','Warlock':'🔥','Warrior':'🛡️' }

function Lbl({ children, t }) {
  return <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:t.textMuted, textTransform:'uppercase', marginBottom:5 }}>{children}</div>
}

function UserDetailPanel({ user, ranks, onClose, t }) {
  const [tab, setTab]     = useState('info')
  const [busy, setBusy]   = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr]     = useState('')
  const [cls,      setCls]      = useState(user.cls   || 'Warrior')
  const [race,     setRace]     = useState(user.race  || '')
  const [level,    setLevel]    = useState(user.level || 70)
  const [rank,     setRank]     = useState(user.rank  || '')
  const [charType, setCharType] = useState(user.characterType || 'main')
  const [profs,    setProfs]    = useState(user.professions || [])
  const [absFrom,   setAbsFrom]   = useState(user.absence?.from   || '')
  const [absUntil,  setAbsUntil]  = useState(user.absence?.until  || '')
  const [absReason, setAbsReason] = useState(user.absence?.reason || '')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  async function saveInfo() {
    setBusy(true); setErr('')
    try { await updateDoc(doc(db,'users',user.id), { cls, race, level:Number(level), rank, characterType:charType }); flash() }
    catch(e) { setErr(e.message) }
    setBusy(false)
  }
  async function saveProfs() {
    setBusy(true); setErr('')
    try { await updateDoc(doc(db,'users',user.id), { professions:profs }); flash() }
    catch(e) { setErr(e.message) }
    setBusy(false)
  }
  async function saveAbsence() {
    setBusy(true); setErr('')
    try { await updateDoc(doc(db,'users',user.id), { absence: absFrom ? { from:absFrom, until:absUntil, reason:absReason } : null }); flash() }
    catch(e) { setErr(e.message) }
    setBusy(false)
  }
  async function clearAbsence() {
    setBusy(true)
    await updateDoc(doc(db,'users',user.id), { absence:null })
    setAbsFrom(''); setAbsUntil(''); setAbsReason('')
    setBusy(false); flash()
  }
  async function savePw() {
    setErr('')
    if (newPw.length < 6) { setErr('Mind. 6 Zeichen.'); return }
    if (newPw !== confirmPw) { setErr('Passwörter stimmen nicht überein.'); return }
    setBusy(true)
    try { const passwordHash = await hashPassword(newPw); await updateDoc(doc(db,'users',user.id), { passwordHash, password:null }); setNewPw(''); setConfirmPw(''); flash() }
    catch(e) { setErr(e.message) }
    setBusy(false)
  }

  const clsColor = CLASS_COLORS[cls] || t.accent
  const clsIcon  = CLASS_ICONS[cls]  || '⚔️'
  const absence  = user.absence
  const TABS     = [{ id:'info', label:'Charakter' },{ id:'professions', label:'Berufe' },{ id:'absence', label:'Abwesenheit' },{ id:'password', label:'Passwort' }]
  const primaryCount    = profs.filter(p => PRIMARY_PROFS.includes(p.name)).length
  const canAddPrimary   = primaryCount < 2
  const canAddSecondary = profs.filter(p => SECONDARY_PROFS.includes(p.name)).length < SECONDARY_PROFS.length
  function addProf() { const used=profs.map(p=>p.name); const av=[...PRIMARY_PROFS,...SECONDARY_PROFS].find(p=>!used.includes(p)); if(!av) return; setProfs([...profs,{name:av,level:375,specialization:'Keine'}]) }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem' }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:t.cardBg, border:`1px solid ${t.accentFade}`, borderRadius:4, width:'100%', maxWidth:560, maxHeight:'88vh', display:'flex', flexDirection:'column', position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'60%', height:2, background:t.gradBar }} />

        {/* Header */}
        <div style={{ padding:'1.4rem 1.4rem 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1rem' }}>
            <div style={{ width:44, height:44, borderRadius:3, background:t.bgDark, border:`1px solid ${clsColor}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{clsIcon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:16, color:clsColor, fontWeight:600 }}>{user.name}</div>
              <div style={{ fontSize:11, color:t.textSecondary, marginTop:2 }}>{rank} · {cls}{race?` · ${race}`:''}{ user.level?` · Level ${user.level}`:''}</div>
              {absence && <div style={{ fontSize:10, color:'#e08080', marginTop:3 }}>🏖️ Abwesend {absence.from}{absence.until?` – ${absence.until}`:''}</div>}
            </div>
            <button onClick={onClose} style={{ background:'transparent', border:'none', color:t.accentDim, fontSize:18, cursor:'pointer', padding:'4px 8px' }}>✕</button>
          </div>
          <div style={{ display:'flex', gap:2, borderBottom:`1px solid ${t.accentFade}` }}>
            {TABS.map(tb => (
              <button key={tb.id} onClick={() => { setTab(tb.id); setErr('') }} style={{
                background:'transparent', border:'none',
                borderBottom: tab===tb.id ? `2px solid ${t.accent}` : '2px solid transparent',
                color: tab===tb.id ? t.accentSoft : t.accentDim,
                fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, textTransform:'uppercase',
                padding:'6px 12px', cursor:'pointer', transition:'all .15s', marginBottom:-1,
              }}>{tb.label}</button>
            ))}
          </div>
        </div>

        <div style={{ padding:'1.2rem 1.4rem', overflowY:'auto', flex:1 }}>
          {tab === 'info' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div><Lbl t={t}>Klasse</Lbl><select value={cls} onChange={e=>setCls(e.target.value)} style={{ fontSize:12, width:'100%' }}>{WOW_CLASSES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div><Lbl t={t}>Rasse</Lbl><select value={race} onChange={e=>setRace(e.target.value)} style={{ fontSize:12, width:'100%' }}><option value="">— Nicht gesetzt —</option><optgroup label="Allianz">{RACES.Allianz.map(r=><option key={r} value={r}>{r}</option>)}</optgroup><optgroup label="Horde">{RACES.Horde.map(r=><option key={r} value={r}>{r}</option>)}</optgroup></select></div>
                <div><Lbl t={t}>Level</Lbl><input type="number" min={1} max={70} value={level} onChange={e=>setLevel(Math.min(70,Math.max(1,Number(e.target.value))))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
                <div><Lbl t={t}>Rang</Lbl><select value={rank} onChange={e=>setRank(e.target.value)} style={{ fontSize:12, width:'100%' }}>{ranks.map(r=><option key={r.id} value={r.label}>{r.label}</option>)}</select></div>
              </div>
              <div><Lbl t={t}>Charakter-Typ</Lbl>
                <div style={{ display:'flex', gap:8 }}>
                  {[{id:'main',label:'⭐ Main'},{id:'twink',label:'🔄 Twink'}].map(opt => (
                    <button key={opt.id} onClick={()=>setCharType(opt.id)} style={{ flex:1, background:charType===opt.id?`${t.accent}18`:'transparent', border:charType===opt.id?`1px solid ${t.accent}`:`1px solid ${t.accentFade}`, borderRadius:3, padding:'8px', cursor:'pointer', fontFamily:'Cinzel,serif', fontSize:11, letterSpacing:1, color:charType===opt.id?t.accentSoft:t.accentDim, transition:'all .15s' }}>{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'professions' && (
            <div>
              {profs.length === 0
                ? <div style={{ textAlign:'center', padding:'1.5rem', color:t.textMuted, fontStyle:'italic', fontSize:12 }}>Keine Berufe eingetragen.</div>
                : profs.map((prof,idx) => {
                    const specs = PROFESSIONS[prof.name] || ['Keine']
                    return (
                      <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 70px 1fr auto', gap:8, alignItems:'center', padding:'0.5rem 0', borderBottom:`1px solid ${t.accentFade}` }}>
                        <select value={prof.name} onChange={e=>{const n=[...profs];n[idx]={...prof,name:e.target.value,specialization:'Keine'};setProfs(n)}} style={{ fontSize:11 }}>
                          <optgroup label="Hauptberufe">{PRIMARY_PROFS.map(p=><option key={p} value={p}>{p}</option>)}</optgroup>
                          <optgroup label="Nebenberufe">{SECONDARY_PROFS.map(p=><option key={p} value={p}>{p}</option>)}</optgroup>
                        </select>
                        <input type="number" min={1} max={375} value={prof.level} onChange={e=>{const n=[...profs];n[idx]={...prof,level:Number(e.target.value)};setProfs(n)}} style={{ fontSize:11, textAlign:'center' }} />
                        {specs.length > 1
                          ? <select value={prof.specialization||'Keine'} onChange={e=>{const n=[...profs];n[idx]={...prof,specialization:e.target.value};setProfs(n)}} style={{ fontSize:11 }}>{specs.map(s=><option key={s} value={s}>{s}</option>)}</select>
                          : <div style={{ fontSize:10, color:t.textMuted, fontStyle:'italic' }}>Keine Spezialisierung</div>
                        }
                        <button onClick={()=>setProfs(profs.filter((_,i)=>i!==idx))} style={{ background:'transparent', border:'none', color:t.accentDim, cursor:'pointer', fontSize:13 }} onMouseEnter={e=>e.target.style.color='#c04040'} onMouseLeave={e=>e.target.style.color=t.accentDim}>✕</button>
                      </div>
                    )
                  })
              }
              {(canAddPrimary||canAddSecondary) && <button className="btn-ghost" style={{ fontSize:10, marginTop:10 }} onClick={addProf}>+ Beruf hinzufügen</button>}
              <div style={{ fontSize:10, color:t.textMuted, fontStyle:'italic', marginTop:8 }}>{primaryCount}/2 Hauptberufe</div>
            </div>
          )}

          {tab === 'absence' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {user.absence && (
                <div style={{ background:'rgba(192,57,43,.08)', border:'1px solid #3a1a1a', borderRadius:3, padding:'0.8rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:12, color:'#e08080' }}>🏖️ {user.absence.from} – {user.absence.until||'offen'}{user.absence.reason&&<span style={{ color:'#6a3030', marginLeft:8, fontStyle:'italic' }}>{user.absence.reason}</span>}</div>
                  <button className="btn-ghost" style={{ fontSize:10, color:'#8a3020' }} onClick={clearAbsence} disabled={busy}>Löschen</button>
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div><Lbl t={t}>Von</Lbl><input type="date" value={absFrom} onChange={e=>setAbsFrom(e.target.value)} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
                <div><Lbl t={t}>Bis (optional)</Lbl><input type="date" value={absUntil} onChange={e=>setAbsUntil(e.target.value)} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
              </div>
              <div><Lbl t={t}>Grund (optional)</Lbl><input value={absReason} onChange={e=>setAbsReason(e.target.value)} placeholder="z.B. Urlaub" maxLength={80} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
            </div>
          )}

          {tab === 'password' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <p style={{ fontSize:12, color:t.textSecondary, fontStyle:'italic', margin:0 }}>Als Admin kannst du das Passwort direkt setzen ohne das alte zu kennen.</p>
              <div><Lbl t={t}>Neues Passwort</Lbl><input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Mind. 6 Zeichen" autoComplete="new-password" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
              <div><Lbl t={t}>Wiederholen</Lbl><input type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="••••••••" autoComplete="new-password" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
            </div>
          )}
          {err && <p style={{ fontSize:12, color:'#e08080', marginTop:10, fontStyle:'italic' }}>✕ {err}</p>}
        </div>

        <div style={{ padding:'1rem 1.4rem', borderTop:`1px solid ${t.accentFade}`, flexShrink:0, display:'flex', gap:8, justifyContent:'flex-end' }}>
          {saved && <span style={{ fontSize:11, color:'#4a9a5a', fontStyle:'italic', alignSelf:'center', marginRight:'auto' }}>✓ Gespeichert</span>}
          <button className="btn-ghost" style={{ fontSize:11 }} onClick={onClose}>Schließen</button>
          <button className="btn-primary" style={{ fontSize:11 }} disabled={busy} onClick={() => { if(tab==='info') saveInfo(); if(tab==='professions') saveProfs(); if(tab==='absence') saveAbsence(); if(tab==='password') savePw() }}>
            {busy ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Users() {
  const { users, loading, addUser, deleteUser, toggleActive } = useUsers()
  const { ranks } = useRanks()
  const t = useTheme()
  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState(null)
  const [detailUser, setDetailUser] = useState(null)
  const [form, setForm]           = useState({})
  const [busy, setBusy]           = useState(false)
  const [err, setErr]             = useState('')

  const filtered = users.filter(u => [u.name,u.rank,u.cls].some(v=>v?.toLowerCase().includes(search.toLowerCase())))

  function openAdd() { setErr(''); setForm({ name:'', password:'', rank:ranks[ranks.length-1]?.label||'Rookie', cls:'Warrior' }); setModal('add') }
  async function handleOk() {
    setErr(''); setBusy(true)
    try {
      if (modal==='add') {
        if (!form.name?.trim()) { setErr('Charaktername fehlt.'); setBusy(false); return }
        if (!form.password||form.password.length<6) { setErr('Passwort muss mind. 6 Zeichen haben.'); setBusy(false); return }
        await addUser(form)
      }
      setModal(null)
    } catch(e) { setErr(e.message) }
    setBusy(false)
  }

  const th = { fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, color:t.textSecondary, textTransform:'uppercase', padding:'.6rem .8rem', borderBottom:`1px solid ${t.accentFade}`, textAlign:'left', fontWeight:400, whiteSpace:'nowrap' }

  return (
    <div>
      <div className="section-title">Benutzerverwaltung</div>
      <div style={{ display:'flex', gap:10, marginBottom:'1rem', alignItems:'center' }}>
        <input placeholder="Name, Rang oder Klasse suchen..." value={search} onChange={e=>setSearch(e.target.value)} />
        <button className="btn-ghost" style={{ fontSize:10, whiteSpace:'nowrap' }} onClick={openAdd}>+ Anlegen</button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'2rem', color:t.accentDim, fontStyle:'italic' }}>Lade Benutzer...</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr>{['Status','Charakter','Klasse / Rasse','Rang','Seit','Aktionen'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:t.accentDim, fontStyle:'italic' }}>{search?'Keine Treffer.':'Noch keine Benutzer. Leg den ersten an!'}</td></tr>}
              {filtered.map(u => (
                <tr key={u.id} style={{ borderBottom:`1px solid ${t.accentFade}40`, cursor:'pointer', transition:'background .1s' }}
                  onMouseEnter={e=>e.currentTarget.style.background=`${t.accent}05`}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'.65rem .8rem' }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', display:'inline-block', marginRight:6, background:u.active?'#4a9a5a':t.accentFade }} />
                    <span style={{ fontSize:11, color:u.active?'#4a9a5a':t.accentDim }}>{u.active?'Aktiv':'Inaktiv'}</span>
                    {u.absence && <span style={{ fontSize:9, color:'#e08080', marginLeft:6 }}>🏖️</span>}
                  </td>
                  <td style={{ padding:'.65rem .8rem', fontWeight:500, color:CLASS_COLORS[u.cls]||t.accentSoft, fontFamily:'Cinzel,serif', fontSize:12 }}>{u.name}</td>
                  <td style={{ padding:'.65rem .8rem', fontSize:11, color:t.textSecondary }}>{u.cls}{u.race?` · ${u.race}`:''}{u.level?` · Lvl ${u.level}`:''}</td>
                  <td style={{ padding:'.65rem .8rem', fontSize:12, color:t.accentDim }}>{u.rank}</td>
                  <td style={{ padding:'.65rem .8rem', color:t.textMuted, fontSize:11, whiteSpace:'nowrap' }}>{u.createdAt?.toDate?u.createdAt.toDate().toLocaleDateString('de-DE'):'—'}</td>
                  <td style={{ padding:'.65rem .8rem', whiteSpace:'nowrap' }}>
                    <button className="btn-icon" onClick={()=>setDetailUser(u)}>✏️</button>
                    <button className="btn-icon" onClick={()=>toggleActive(u.id)}>{u.active?'⏸':'▶'}</button>
                    <button className="btn-icon danger" onClick={async()=>{ if(window.confirm(`${u.name} wirklich löschen?`)) await deleteUser(u.id) }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop:'.8rem', fontSize:11, color:t.textMuted, fontStyle:'italic' }}>{users.length} Benutzer gesamt</div>

      {modal==='add' && (
        <Modal title="Neuen Benutzer anlegen" onClose={()=>setModal(null)} onOk={handleOk} okLabel={busy?'Anlegen...':'Anlegen'}>
          <div className="field-group"><label className="field-label">Charaktername</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="z.B. Thunderstrike" autoComplete="off" /></div>
          <div className="field-group"><label className="field-label">Passwort (mind. 6 Zeichen)</label><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" autoComplete="new-password" /></div>
          <div className="field-group"><label className="field-label">Rang</label><select value={form.rank} onChange={e=>setForm({...form,rank:e.target.value})}>{ranks.map(r=><option key={r.id} value={r.label}>{r.label}</option>)}</select></div>
          <div className="field-group"><label className="field-label">Klasse</label><select value={form.cls} onChange={e=>setForm({...form,cls:e.target.value})}>{WOW_CLASSES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          {err && <p className="error-text">{err}</p>}
        </Modal>
      )}
      {detailUser && <UserDetailPanel user={users.find(u=>u.id===detailUser.id)||detailUser} ranks={ranks} onClose={()=>setDetailUser(null)} t={t} />}
    </div>
  )
}
