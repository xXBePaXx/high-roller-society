import { useState } from 'react'
import { useUsers } from '../../hooks/useUsers'
import { useRanks } from '../../hooks/useRanks'
import { useTheme } from '../../hooks/useTheme'
import { useDKP, DKP_TYPES } from '../../hooks/useDKP'
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

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' })
    + ' ' + d.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' })
}

// ─── Charakter-Editor ─────────────────────────────────────────────────────────
function CharEditor({ char, charIdx, total, t, onSave, onDelete, ranks }) {
  const [open,      setOpen]      = useState(false)
  const [busy,      setBusy]      = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [activeTab, setActiveTab] = useState('info')

  const [charRank, setCharRank] = useState(char.rank || '')
  const [cls,      setCls]      = useState(char.cls || 'Warrior')
  const [race,     setRace]     = useState(char.race || '')
  const [level,    setLevel]    = useState(char.level || 70)
  const [charType, setCharType] = useState(char.characterType || 'main')
  const [profs,    setProfs]    = useState(char.professions || [])
  const [absFrom,  setAbsFrom]  = useState(char.absence?.from || '')
  const [absUntil, setAbsUntil] = useState(char.absence?.until || '')
  const [absReason,setAbsReason]= useState(char.absence?.reason || '')

  const clsColor = CLASS_COLORS[cls] || t.accent
  const clsIcon  = CLASS_ICONS[cls]  || '⚔️'
  const primaryCount    = profs.filter(p => PRIMARY_PROFS.includes(p.name)).length
  const canAddPrimary   = primaryCount < 2
  const canAddSecondary = profs.filter(p => SECONDARY_PROFS.includes(p.name)).length < SECONDARY_PROFS.length

  function addProf() {
    const used = profs.map(p => p.name)
    const av   = [...PRIMARY_PROFS, ...SECONDARY_PROFS].find(p => !used.includes(p))
    if (!av) return
    setProfs([...profs, { name:av, level:375, specialization:'Keine' }])
  }

  async function handleSave() {
    setBusy(true)
    await onSave(charIdx, {
      cls, race, level:Number(level), characterType:charType,
      professions:profs,
      rank: charRank || undefined,
      absence: absFrom ? { from:absFrom, until:absUntil, reason:absReason } : null,
    })
    setBusy(false); setSaved(true); setTimeout(()=>setSaved(false), 2000)
  }

  const subTab = (id) => ({
    background:'transparent', border:'none', cursor:'pointer',
    borderBottom: activeTab===id ? `2px solid ${t.accent}` : '2px solid transparent',
    color: activeTab===id ? t.accentSoft : t.accentDim,
    fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2,
    textTransform:'uppercase', padding:'4px 10px', marginBottom:-1, transition:'all .15s',
  })

  return (
    <div style={{ border:`1px solid ${open?t.accent+'50':t.accentFade}`, borderRadius:3, overflow:'hidden', transition:'all .2s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0.7rem 0.9rem', background:open?`${t.accent}06`:t.bgDark, cursor:'pointer' }}
        onClick={()=>setOpen(v=>!v)}>
        <span style={{ fontSize:18, flexShrink:0 }}>{clsIcon}</span>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontFamily:'Cinzel,serif', fontSize:13, color:clsColor, fontWeight:600 }}>{char.name}</span>
            <span style={{ fontSize:9, color:charType==='main'?t.accent:t.textMuted, fontFamily:'Cinzel,serif', letterSpacing:1, background:charType==='main'?`${t.accent}18`:'transparent', padding:'1px 5px', borderRadius:2 }}>
              {charType==='main'?'⭐ MAIN':'🔄 TWINK'}
            </span>
            {(char.rank||charRank) && <span style={{ fontSize:9, color:t.accentDim, fontFamily:'Cinzel,serif', letterSpacing:1 }}>{char.rank||charRank}</span>}
          </div>
          <div style={{ fontSize:10, color:t.textSecondary, marginTop:2 }}>
            {cls}{race?` · ${race}`:''} · Level {level}
            {profs.length>0 && <span style={{ color:t.textMuted }}> · {profs.map(p=>p.name).join(', ')}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {saved && <span style={{ fontSize:9, color:'#4a9a5a' }}>✓</span>}
          {total>1 && <button className="btn-icon danger" style={{ fontSize:10 }} onClick={e=>{e.stopPropagation();if(window.confirm(`${char.name} wirklich löschen?`))onDelete(charIdx)}}>✕</button>}
          <span style={{ color:t.accentFade, fontSize:10 }}>{open?'▲':'▼'}</span>
        </div>
      </div>

      {open && (
        <div style={{ borderTop:`1px solid ${t.accentFade}`, background:t.cardBg }}>
          <div style={{ display:'flex', gap:2, padding:'0 0.9rem', borderBottom:`1px solid ${t.accentFade}` }}>
            {[['info','Charakter'],['professions','Berufe'],['absence','Abwesenheit']].map(([id,label])=>(
              <button key={id} onClick={()=>setActiveTab(id)} style={subTab(id)}>{label}</button>
            ))}
          </div>
          <div style={{ padding:'0.9rem' }}>
            {activeTab==='info' && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div><Lbl t={t}>Rang (für diesen Charakter)</Lbl>
                    <select value={charRank} onChange={e=>setCharRank(e.target.value)} style={{ fontSize:12, width:'100%' }}>
                      <option value="">— Account-Rang verwenden —</option>
                      {ranks.map(r=><option key={r.id} value={r.label}>{r.label}</option>)}
                    </select>
                  </div>
                  <div><Lbl t={t}>Charakter-Typ</Lbl>
                    <div style={{ display:'flex', gap:6 }}>
                      {[{id:'main',label:'⭐ Main'},{id:'twink',label:'🔄 Twink'}].map(opt=>(
                        <button key={opt.id} onClick={()=>setCharType(opt.id)} style={{ flex:1, background:charType===opt.id?`${t.accent}18`:'transparent', border:charType===opt.id?`1px solid ${t.accent}`:`1px solid ${t.accentFade}`, borderRadius:3, padding:'6px', cursor:'pointer', fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:1, color:charType===opt.id?t.accentSoft:t.accentDim, transition:'all .15s' }}>{opt.label}</button>
                      ))}
                    </div>
                  </div>
                  <div><Lbl t={t}>Klasse</Lbl>
                    <select value={cls} onChange={e=>setCls(e.target.value)} style={{ fontSize:12, width:'100%' }}>
                      {WOW_CLASSES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><Lbl t={t}>Rasse</Lbl>
                    <select value={race} onChange={e=>setRace(e.target.value)} style={{ fontSize:12, width:'100%' }}>
                      <option value="">— Nicht gesetzt —</option>
                      <optgroup label="Allianz">{RACES.Allianz.map(r=><option key={r} value={r}>{r}</option>)}</optgroup>
                      <optgroup label="Horde">{RACES.Horde.map(r=><option key={r} value={r}>{r}</option>)}</optgroup>
                    </select>
                  </div>
                  <div><Lbl t={t}>Level</Lbl>
                    <input type="number" min={1} max={70} value={level} onChange={e=>setLevel(Math.min(70,Math.max(1,Number(e.target.value))))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
                  </div>
                </div>
              </div>
            )}

            {activeTab==='professions' && (
              <div>
                {profs.length===0
                  ? <div style={{ color:t.textMuted, fontStyle:'italic', fontSize:12, padding:'0.5rem 0' }}>Keine Berufe eingetragen.</div>
                  : profs.map((prof,pidx)=>{
                      const specs = PROFESSIONS[prof.name]||['Keine']
                      return (
                        <div key={pidx} style={{ display:'grid', gridTemplateColumns:'1fr 60px 1fr auto', gap:6, alignItems:'center', padding:'0.4rem 0', borderBottom:`1px solid ${t.accentFade}` }}>
                          <select value={prof.name} onChange={e=>{const n=[...profs];n[pidx]={...prof,name:e.target.value,specialization:'Keine'};setProfs(n)}} style={{ fontSize:11 }}>
                            <optgroup label="Hauptberufe">{PRIMARY_PROFS.map(p=><option key={p} value={p}>{p}</option>)}</optgroup>
                            <optgroup label="Nebenberufe">{SECONDARY_PROFS.map(p=><option key={p} value={p}>{p}</option>)}</optgroup>
                          </select>
                          <input type="number" min={1} max={375} value={prof.level} onChange={e=>{const n=[...profs];n[pidx]={...prof,level:Number(e.target.value)};setProfs(n)}} style={{ fontSize:11, textAlign:'center' }} />
                          {specs.length>1
                            ? <select value={prof.specialization||'Keine'} onChange={e=>{const n=[...profs];n[pidx]={...prof,specialization:e.target.value};setProfs(n)}} style={{ fontSize:11 }}>{specs.map(s=><option key={s} value={s}>{s}</option>)}</select>
                            : <div style={{ fontSize:10, color:t.textMuted, fontStyle:'italic' }}>Keine Spezialisierung</div>
                          }
                          <button onClick={()=>setProfs(profs.filter((_,i)=>i!==pidx))} style={{ background:'transparent', border:'none', color:t.accentDim, cursor:'pointer', fontSize:13 }} onMouseEnter={e=>e.target.style.color='#c04040'} onMouseLeave={e=>e.target.style.color=t.accentDim}>✕</button>
                        </div>
                      )
                    })
                }
                {(canAddPrimary||canAddSecondary) && <button className="btn-ghost" style={{ fontSize:9, marginTop:8 }} onClick={addProf}>+ Beruf hinzufügen</button>}
                <div style={{ fontSize:10, color:t.textMuted, fontStyle:'italic', marginTop:6 }}>{primaryCount}/2 Hauptberufe</div>
              </div>
            )}

            {activeTab==='absence' && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {char.absence && (
                  <div style={{ background:'rgba(192,57,43,.08)', border:'1px solid #3a1a1a', borderRadius:3, padding:'0.6rem', fontSize:12, color:'#e08080' }}>
                    🏖️ {char.absence.from} – {char.absence.until||'offen'}{char.absence.reason&&<span style={{ marginLeft:6, fontStyle:'italic', color:'#8a4040' }}>{char.absence.reason}</span>}
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div><Lbl t={t}>Von</Lbl><input type="date" value={absFrom} onChange={e=>setAbsFrom(e.target.value)} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
                  <div><Lbl t={t}>Bis (optional)</Lbl><input type="date" value={absUntil} onChange={e=>setAbsUntil(e.target.value)} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
                </div>
                <div><Lbl t={t}>Grund (optional)</Lbl>
                  <input value={absReason} onChange={e=>setAbsReason(e.target.value)} placeholder="z.B. Urlaub" maxLength={80} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
                </div>
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10 }}>
              <button className="btn-primary" style={{ fontSize:10 }} onClick={handleSave} disabled={busy}>
                {busy ? 'Speichern...' : `${char.name} speichern`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DKP-Tab ─────────────────────────────────────────────────────────────────
function DKPTab({ user, t }) {
  const { transactions, addTransaction, addLoot, resetUser, deleteTransaction, getAllBalances } = useDKP()
  const { users } = useUsers()

  const [dkpTab,    setDkpTab]    = useState('overview')
  const [busy,      setBusy]      = useState(false)
  const [saved,     setSaved]     = useState('')
  const [err,       setErr]       = useState('')

  // Für alle Chars des Users
  const characters = user.characters || []

  // Hilfsfunktion: Transaktionen eines Charakters (per charName)
  function charTx(charName) {
    return transactions.filter(t =>
      t.userId === user.id && (t.charName === charName || (!t.charName && charName === (user.characters?.[0]?.name || user.name)))
    )
  }

  // Guthaben eines Charakters berechnen
  function charBalance(charName) {
    const txs = [...charTx(charName)].reverse()
    let bal = 0
    for (const tx of txs) {
      if (tx.type === 'RESET') { bal = 0; continue }
      const type = DKP_TYPES[tx.type]
      if (type) bal += tx.amount * type.sign
    }
    return bal
  }

  // Formular-State
  const [selChar,    setSelChar]    = useState(characters[0]?.name || '')
  const [txType,     setTxType]     = useState('BONUS')
  const [txAmount,   setTxAmount]   = useState(10)
  const [txReason,   setTxReason]   = useState('')

  function flash(msg) { setSaved(msg); setTimeout(()=>setSaved(''), 2500) }

  async function handleAdd() {
    if (!selChar) { setErr('Charakter wählen.'); return }
    if (!txAmount || txAmount <= 0) { setErr('Betrag > 0.'); return }
    setBusy(true); setErr('')
    try {
      await addTransaction({
        userId:    user.id,
        username:  selChar,
        charName:  selChar,
        type:      txType,
        amount:    txAmount,
        reason:    txReason || DKP_TYPES[txType]?.label,
      })
      setTxReason(''); setTxAmount(10)
      flash(`${DKP_TYPES[txType]?.sign >= 0 ? '+' : '-'}${txAmount} DKP für ${selChar}`)
    } catch(e) { setErr(e.message) }
    setBusy(false)
  }

  async function handleReset(charName) {
    if (!window.confirm(`DKP von ${charName} wirklich auf 0 setzen?`)) return
    setBusy(true)
    await resetUser(user.id, charName)
    flash(`${charName} zurückgesetzt`)
    setBusy(false)
  }

  const tabStyle = (id) => ({
    background:'transparent', border:'none', cursor:'pointer',
    borderBottom: dkpTab===id ? `2px solid ${t.accent}` : '2px solid transparent',
    color: dkpTab===id ? t.accentSoft : t.accentDim,
    fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2,
    textTransform:'uppercase', padding:'5px 10px', marginBottom:-1, transition:'all .15s',
  })

  // Alle Transaktionen dieses Users
  const allUserTx = transactions.filter(tx => tx.userId === user.id)

  return (
    <div>
      <div style={{ display:'flex', gap:2, borderBottom:`1px solid ${t.accentFade}`, marginBottom:'0.8rem' }}>
        {[['overview','Übersicht'],['add','Buchen'],['log','Verlauf']].map(([id,label])=>(
          <button key={id} onClick={()=>{setDkpTab(id);setErr('')}} style={tabStyle(id)}>{label}</button>
        ))}
      </div>

      {saved && <div style={{ fontSize:11, color:'#4a9a5a', fontStyle:'italic', marginBottom:8 }}>✓ {saved}</div>}
      {err   && <div style={{ fontSize:11, color:'#e08080', fontStyle:'italic', marginBottom:8 }}>✕ {err}</div>}

      {/* Übersicht */}
      {dkpTab === 'overview' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {characters.map((char, idx) => {
            const bal     = charBalance(char.name)
            const txCount = charTx(char.name).length
            const clsColor = CLASS_COLORS[char.cls] || t.accent
            const clsIcon  = CLASS_ICONS[char.cls]  || '⚔️'
            return (
              <div key={idx} style={{ display:'flex', alignItems:'center', gap:12, padding:'0.8rem 1rem', background:t.bgDark, border:`1px solid ${t.accentFade}`, borderRadius:3 }}>
                <span style={{ fontSize:20 }}>{clsIcon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'Cinzel,serif', fontSize:12, color:clsColor, fontWeight:600 }}>{char.name}</div>
                  <div style={{ fontSize:10, color:t.textMuted, marginTop:2 }}>{txCount} Transaktionen · {char.characterType==='main'?'⭐ Main':'🔄 Twink'}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'Cinzel,serif', fontSize:18, color:bal>=0?t.accent:'#c04040', fontWeight:600 }}>
                    {bal>0?'+':''}{bal} <span style={{ fontSize:10, color:t.textMuted }}>DKP</span>
                  </div>
                </div>
                <button className="btn-ghost" style={{ fontSize:9, color:'#c04040' }} onClick={()=>handleReset(char.name)} disabled={busy}>Reset</button>
              </div>
            )
          })}
          {characters.length === 0 && (
            <div style={{ textAlign:'center', padding:'1.5rem', color:t.textMuted, fontStyle:'italic', fontSize:12 }}>
              Kein characters-Array — altes System.<br/>DKP unter Account-ID gespeichert.
            </div>
          )}
        </div>
      )}

      {/* Buchen */}
      {dkpTab === 'add' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><Lbl t={t}>Charakter</Lbl>
              <select value={selChar} onChange={e=>setSelChar(e.target.value)} style={{ fontSize:12, width:'100%' }}>
                {characters.map((c,i)=><option key={i} value={c.name}>{c.name} ({charBalance(c.name)} DKP)</option>)}
              </select>
            </div>
            <div><Lbl t={t}>Typ</Lbl>
              <select value={txType} onChange={e=>setTxType(e.target.value)} style={{ fontSize:12, width:'100%' }}>
                {Object.entries(DKP_TYPES).filter(([k])=>k!=='RESET').map(([k,v])=>(
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:10 }}>
            <div><Lbl t={t}>Betrag (DKP)</Lbl>
              <input type="number" min={1} max={9999} value={txAmount} onChange={e=>setTxAmount(Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
            </div>
            <div><Lbl t={t}>Grund (optional)</Lbl>
              <input value={txReason} onChange={e=>setTxReason(e.target.value)} placeholder="z.B. Kara Clear · Loot: Netherblade" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
            </div>
          </div>

          {/* Vorschau */}
          {selChar && (
            <div style={{ background:t.bgDark, border:`1px solid ${t.accentFade}`, borderRadius:3, padding:'0.7rem', fontSize:12 }}>
              <span style={{ color:t.textSecondary }}>{selChar}: </span>
              <span style={{ color:t.accent, fontFamily:'Cinzel,serif' }}>{charBalance(selChar)}</span>
              <span style={{ color:t.textMuted }}> → </span>
              <span style={{ color: DKP_TYPES[txType]?.sign>=0 ? '#4a9a5a' : '#c04040', fontFamily:'Cinzel,serif', fontWeight:600 }}>
                {charBalance(selChar) + (DKP_TYPES[txType]?.sign||1) * txAmount} DKP
              </span>
              <span style={{ color:t.textMuted, marginLeft:8, fontSize:10 }}>
                ({DKP_TYPES[txType]?.sign>=0?'+':'-'}{txAmount})
              </span>
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="btn-primary" style={{ fontSize:11 }} onClick={handleAdd} disabled={busy||!selChar}>
              {busy ? 'Buchen...' : `${DKP_TYPES[txType]?.sign>=0?'+':'-'}${txAmount} DKP buchen`}
            </button>
          </div>
        </div>
      )}

      {/* Verlauf */}
      {dkpTab === 'log' && (
        <div style={{ maxHeight:320, overflowY:'auto' }}>
          {allUserTx.length === 0
            ? <div style={{ textAlign:'center', padding:'1.5rem', color:t.textMuted, fontStyle:'italic', fontSize:12 }}>Keine Transaktionen.</div>
            : allUserTx.map(tx => {
                const type = DKP_TYPES[tx.type]
                const sign = tx.type==='RESET' ? 0 : type?.sign ?? 1
                return (
                  <div key={tx.id} style={{ display:'grid', gridTemplateColumns:'24px 1fr auto auto 24px', alignItems:'center', gap:8, padding:'0.45rem 0.3rem', borderBottom:`1px solid ${t.accentFade}` }}>
                    <span style={{ fontSize:14, textAlign:'center' }}>{type?.icon||'•'}</span>
                    <div>
                      <div style={{ fontSize:11, color:tx.charName?CLASS_COLORS[characters.find(c=>c.name===tx.charName)?.cls]||t.accent:t.accent, fontFamily:'Cinzel,serif' }}>
                        {tx.charName||tx.username}
                      </div>
                      {tx.reason && <div style={{ fontSize:10, color:t.textMuted, fontStyle:'italic' }}>{tx.reason}</div>}
                    </div>
                    <div style={{ fontFamily:'Cinzel,serif', fontSize:12, color:tx.type==='RESET'?t.accentDim:sign>=0?'#4a9a5a':'#c04040', fontWeight:600, textAlign:'right' }}>
                      {tx.type==='RESET'?'Reset':`${sign>=0?'+':'-'}${tx.amount}`}
                    </div>
                    <div style={{ fontSize:9, color:t.textMuted, textAlign:'right', whiteSpace:'nowrap' }}>{formatDate(tx.createdAt)}</div>
                    <button className="btn-icon danger" style={{ fontSize:10 }} onClick={async()=>{if(window.confirm('Löschen?'))await deleteTransaction(tx.id)}}>✕</button>
                  </div>
                )
              })
          }
        </div>
      )}
    </div>
  )
}

// ─── Detail-Panel ─────────────────────────────────────────────────────────────
function UserDetailPanel({ user, ranks, onClose, t }) {
  const [tab, setTab]   = useState('characters')
  const [busy, setBusy] = useState(false)
  const [saved,setSaved]= useState(false)
  const [err,  setErr]  = useState('')
  const [rank, setRank] = useState(user.rank || '')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [newCharName, setNewCharName] = useState('')
  const [newCharCls,  setNewCharCls]  = useState('Warrior')
  const [addingChar,  setAddingChar]  = useState(false)

  const characters = user.characters || []
  function flash() { setSaved(true); setTimeout(()=>setSaved(false), 2500) }

  async function handleCharSave(charIdx, charData) {
    const chars = [...characters]; chars[charIdx] = { ...chars[charIdx], ...charData }
    await updateDoc(doc(db,'users',user.id), { characters:chars }); flash()
  }
  async function handleCharDelete(charIdx) {
    if (characters.length <= 1) return
    const chars = characters.filter((_,i)=>i!==charIdx)
    await updateDoc(doc(db,'users',user.id), { characters:chars }); flash()
  }
  async function handleAddChar() {
    if (!newCharName.trim()) { setErr('Charaktername fehlt.'); return }
    setErr(''); setBusy(true)
    const newChar = { name:newCharName.trim(), cls:newCharCls, race:'', level:70, characterType:'twink', professions:[], absence:null }
    await updateDoc(doc(db,'users',user.id), { characters:[...characters, newChar] })
    setNewCharName(''); setNewCharCls('Warrior'); setAddingChar(false); setBusy(false); flash()
  }
  async function saveRank() {
    setBusy(true); setErr('')
    try { await updateDoc(doc(db,'users',user.id), { rank }); flash() } catch(e) { setErr(e.message) }
    setBusy(false)
  }
  async function savePw() {
    setErr('')
    if (newPw.length < 6) { setErr('Mind. 6 Zeichen.'); return }
    if (newPw !== confirmPw) { setErr('Passwörter stimmen nicht überein.'); return }
    setBusy(true)
    try { const passwordHash=await hashPassword(newPw); await updateDoc(doc(db,'users',user.id),{passwordHash,password:null}); setNewPw(''); setConfirmPw(''); flash() }
    catch(e) { setErr(e.message) }
    setBusy(false)
  }

  const TABS = [
    { id:'characters', label:'Charaktere' },
    { id:'dkp',        label:'DKP' },
    { id:'account',    label:'Account' },
    { id:'password',   label:'Passwort' },
  ]
  const tabStyle = (id) => ({
    background:'transparent', border:'none',
    borderBottom: tab===id ? `2px solid ${t.accent}` : '2px solid transparent',
    color: tab===id ? t.accentSoft : t.accentDim,
    fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, textTransform:'uppercase',
    padding:'6px 12px', cursor:'pointer', transition:'all .15s', marginBottom:-1,
  })

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem' }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:t.cardBg, border:`1px solid ${t.accentFade}`, borderRadius:4, width:'100%', maxWidth:620, maxHeight:'90vh', display:'flex', flexDirection:'column', position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'60%', height:2, background:t.gradBar }} />

        <div style={{ padding:'1.2rem 1.4rem 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1rem' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:17, color:t.accentSoft, fontWeight:600 }}>{user.username||user.name}</div>
              <div style={{ fontSize:11, color:t.textSecondary, marginTop:2 }}>
                {user.rank} · {characters.length} Charakter{characters.length!==1?'e':''}
                <span style={{ marginLeft:8, fontSize:10, color:t.textMuted }}>Login: {user.username||user.name}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'transparent', border:'none', color:t.accentDim, fontSize:18, cursor:'pointer', padding:'4px 8px' }}>✕</button>
          </div>
          <div style={{ display:'flex', gap:2, borderBottom:`1px solid ${t.accentFade}` }}>
            {TABS.map(tb=><button key={tb.id} onClick={()=>{setTab(tb.id);setErr('')}} style={tabStyle(tb.id)}>{tb.label}</button>)}
          </div>
        </div>

        <div style={{ padding:'1rem 1.4rem', overflowY:'auto', flex:1 }}>

          {tab==='characters' && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {characters.map((char,idx)=>(
                <CharEditor key={idx} char={char} charIdx={idx} total={characters.length} t={t}
                  onSave={handleCharSave} onDelete={handleCharDelete} ranks={ranks} />
              ))}
              {!addingChar ? (
                <button onClick={()=>setAddingChar(true)} style={{ marginTop:4, background:'none', border:`1px dashed ${t.accentFade}`, color:t.accentDim, fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:2, padding:'10px', cursor:'pointer', borderRadius:3, textTransform:'uppercase', transition:'all .15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=t.accent;e.currentTarget.style.color=t.accent}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=t.accentFade;e.currentTarget.style.color=t.accentDim}}>
                  + Charakter hinzufügen
                </button>
              ) : (
                <div style={{ border:`1px solid ${t.accentFade}`, borderRadius:3, padding:'0.9rem', background:t.bgMid, display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ fontFamily:'Cinzel,serif', fontSize:10, color:t.accentDim, letterSpacing:1 }}>Neuer Charakter</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div><Lbl t={t}>Charaktername</Lbl><input value={newCharName} onChange={e=>setNewCharName(e.target.value)} placeholder="z.B. Grauhorn" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
                    <div><Lbl t={t}>Klasse</Lbl><select value={newCharCls} onChange={e=>setNewCharCls(e.target.value)} style={{ fontSize:12, width:'100%' }}>{WOW_CLASSES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                  </div>
                  {err && <div style={{ fontSize:11, color:'#e08080', fontStyle:'italic' }}>✕ {err}</div>}
                  <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <button className="btn-ghost" style={{ fontSize:10 }} onClick={()=>{setAddingChar(false);setErr('')}}>Abbrechen</button>
                    <button className="btn-primary" style={{ fontSize:10 }} onClick={handleAddChar} disabled={busy}>{busy?'...':'Hinzufügen'}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab==='dkp' && <DKPTab user={user} t={t} />}

          {tab==='account' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background:t.bgMid, border:`1px solid ${t.accentFade}`, borderRadius:3, padding:'0.8rem' }}>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:9, color:t.textMuted, letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>Login-Benutzername</div>
                <div style={{ color:t.accentSoft, fontFamily:'Cinzel,serif', fontSize:14 }}>{user.username||user.name}</div>
                <div style={{ fontSize:10, color:t.textMuted, marginTop:4, fontStyle:'italic' }}>Benutzername kann nur manuell in Firestore geändert werden.</div>
              </div>
              <div><Lbl t={t}>Account-Rang (Fallback wenn kein Charakter-Rang gesetzt)</Lbl>
                <select value={rank} onChange={e=>setRank(e.target.value)} style={{ fontSize:12, width:'100%' }}>
                  {ranks.map(r=><option key={r.id} value={r.label}>{r.label}</option>)}
                </select>
              </div>
              {err && <div style={{ fontSize:11, color:'#e08080', fontStyle:'italic' }}>✕ {err}</div>}
              {saved && <span style={{ fontSize:11, color:'#4a9a5a', fontStyle:'italic' }}>✓ Gespeichert</span>}
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button className="btn-primary" style={{ fontSize:11 }} onClick={saveRank} disabled={busy}>{busy?'Speichern...':'Rang speichern'}</button>
              </div>
            </div>
          )}

          {tab==='password' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <p style={{ fontSize:12, color:t.textSecondary, fontStyle:'italic', margin:0 }}>Als Admin kannst du das Passwort direkt setzen ohne das alte zu kennen.</p>
              <div><Lbl t={t}>Neues Passwort</Lbl><input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Mind. 6 Zeichen" autoComplete="new-password" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
              <div><Lbl t={t}>Wiederholen</Lbl><input type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="••••••••" autoComplete="new-password" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
              {err && <p style={{ fontSize:12, color:'#e08080', fontStyle:'italic', margin:0 }}>✕ {err}</p>}
              {saved && <span style={{ fontSize:11, color:'#4a9a5a', fontStyle:'italic' }}>✓ Gespeichert</span>}
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button className="btn-primary" style={{ fontSize:11 }} onClick={savePw} disabled={busy}>{busy?'Speichern...':'Passwort setzen'}</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:'0.8rem 1.4rem', borderTop:`1px solid ${t.accentFade}`, flexShrink:0, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn-ghost" style={{ fontSize:11 }} onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  )
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────
export default function Users() {
  const { users, loading, addUser, deleteUser, toggleActive } = useUsers()
  const { ranks }  = useRanks()
  const t          = useTheme()
  const [search,     setSearch]     = useState('')
  const [modal,      setModal]      = useState(null)
  const [detailUser, setDetailUser] = useState(null)
  const [form,       setForm]       = useState({})
  const [busy,       setBusy]       = useState(false)
  const [err,        setErr]        = useState('')

  const filtered = users.filter(u =>
    [u.username, u.name, u.rank, ...(u.characters||[]).map(c=>c.name)].some(v=>v?.toLowerCase().includes(search.toLowerCase()))
  )

  function openAdd() {
    setErr('')
    setForm({ username:'', charName:'', password:'', rank:ranks[ranks.length-1]?.label||'Rookie', cls:'Warrior' })
    setModal('add')
  }

  async function handleOk() {
    setErr(''); setBusy(true)
    try {
      if (modal==='add') {
        if (!form.username?.trim()) { setErr('Benutzername fehlt.'); setBusy(false); return }
        if (!form.charName?.trim()) { setErr('Charaktername fehlt.'); setBusy(false); return }
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
        <input placeholder="Benutzer, Charakter, Rang..." value={search} onChange={e=>setSearch(e.target.value)} />
        <button className="btn-ghost" style={{ fontSize:10, whiteSpace:'nowrap' }} onClick={openAdd}>+ Anlegen</button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'2rem', color:t.accentDim, fontStyle:'italic' }}>Lade Benutzer...</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr>{['Status','Benutzername / Charaktere','Rang','Chars','Seit','Aktionen'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:t.accentDim, fontStyle:'italic' }}>{search?'Keine Treffer.':'Noch keine Benutzer.'}</td></tr>}
              {filtered.map(u=>{
                const chars = u.characters||[]
                return (
                  <tr key={u.id} style={{ borderBottom:`1px solid ${t.accentFade}40`, cursor:'pointer', transition:'background .1s' }}
                    onMouseEnter={e=>e.currentTarget.style.background=`${t.accent}05`}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'.65rem .8rem' }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', display:'inline-block', marginRight:6, background:u.active?'#4a9a5a':t.accentFade }} />
                      <span style={{ fontSize:11, color:u.active?'#4a9a5a':t.accentDim }}>{u.active?'Aktiv':'Inaktiv'}</span>
                    </td>
                    <td style={{ padding:'.65rem .8rem' }}>
                      <div style={{ fontFamily:'Cinzel,serif', fontSize:12, color:t.accentSoft, fontWeight:500 }}>{u.username||u.name}</div>
                      {chars.length>0 && (
                        <div style={{ fontSize:10, color:t.textMuted, marginTop:2 }}>
                          {chars.map((c,i)=>(
                            <span key={i} style={{ color:CLASS_COLORS[c.cls]||t.textSecondary, marginRight:6 }}>
                              {CLASS_ICONS[c.cls]||'⚔️'} {c.name}{c.characterType==='main'?' ⭐':''}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding:'.65rem .8rem', fontSize:12, color:t.accentDim }}>{u.rank}</td>
                    <td style={{ padding:'.65rem .8rem', fontSize:11, color:t.textSecondary, textAlign:'center' }}>
                      <span style={{ fontFamily:'Cinzel,serif', fontSize:14, color:t.accent }}>{chars.length||1}</span>
                    </td>
                    <td style={{ padding:'.65rem .8rem', color:t.textMuted, fontSize:11, whiteSpace:'nowrap' }}>{u.createdAt?.toDate?u.createdAt.toDate().toLocaleDateString('de-DE'):'—'}</td>
                    <td style={{ padding:'.65rem .8rem', whiteSpace:'nowrap' }}>
                      <button className="btn-icon" onClick={()=>setDetailUser(u)}>✏️</button>
                      <button className="btn-icon" onClick={()=>toggleActive(u.id)}>{u.active?'⏸':'▶'}</button>
                      <button className="btn-icon danger" onClick={async()=>{if(window.confirm(`${u.username||u.name} wirklich löschen?`))await deleteUser(u.id)}}>✕</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop:'.8rem', fontSize:11, color:t.textMuted, fontStyle:'italic' }}>{users.length} Benutzer gesamt</div>

      {modal==='add' && (
        <Modal title="Neuen Benutzer anlegen" onClose={()=>setModal(null)} onOk={handleOk} okLabel={busy?'Anlegen...':'Anlegen'}>
          <p style={{ fontSize:12, color:'var(--text-secondary)', fontStyle:'italic', marginBottom:'1rem' }}>Benutzername = Login. Charaktername = Ingame-Name.</p>
          <div className="field-group"><label className="field-label">Benutzername (Login)</label><input value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="z.B. Reisebüro" autoComplete="off" /></div>
          <div className="field-group"><label className="field-label">Erster Charakter (Ingame)</label><input value={form.charName} onChange={e=>setForm({...form,charName:e.target.value})} placeholder="z.B. Thunderstrike" autoComplete="off" /></div>
          <div className="field-group"><label className="field-label">Passwort (mind. 6 Zeichen)</label><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" autoComplete="new-password" /></div>
          <div className="field-group"><label className="field-label">Rang</label><select value={form.rank} onChange={e=>setForm({...form,rank:e.target.value})}>{ranks.map(r=><option key={r.id} value={r.label}>{r.label}</option>)}</select></div>
          <div className="field-group"><label className="field-label">Klasse (erster Charakter)</label><select value={form.cls} onChange={e=>setForm({...form,cls:e.target.value})}>{WOW_CLASSES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          {err && <p className="error-text">{err}</p>}
        </Modal>
      )}

      {detailUser && (
        <UserDetailPanel user={users.find(u=>u.id===detailUser.id)||detailUser} ranks={ranks} onClose={()=>setDetailUser(null)} t={t} />
      )}
    </div>
  )
}
