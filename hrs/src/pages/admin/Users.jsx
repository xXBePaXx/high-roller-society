import { useState } from 'react'
import { useUsers } from '../../hooks/useUsers'
import { useRanks } from '../../hooks/useRanks'
import { useTheme } from '../../hooks/useTheme'
import { useDKP, DKP_TYPES } from '../../hooks/useDKP'
import { useEconomy, COIN_TYPES } from '../../hooks/useEconomy'
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

// ─── CoinsTab ─────────────────────────────────────────────────────────────────
function CoinsTab({ user, t }) {
  const {
    transactions, config,
    giveCoins, resetUser,
    getBalance, getChipBalance,
    formatCoins, coinsToCopper, getChipRate,
  } = useEconomy()

  const [subTab, setSubTab] = useState('overview')
  const [type,   setType]   = useState('MANUAL')
  const [gold,   setGold]   = useState(0)
  const [silver, setSilver] = useState(0)
  const [copper, setCopper] = useState(0)
  const [reason, setReason] = useState('')
  const [busy,   setBusy]   = useState(false)
  const [saved,  setSaved]  = useState('')
  const [err,    setErr]    = useState('')

  // Casino-Perlen manuell anpassen
  const [chipAmount, setChipAmount] = useState(0)
  const [chipReason, setChipReason] = useState('')

  const [casinoBusy, setCasinoBusy] = useState(false)

  const balance     = getBalance(user.id)
  const chipBalance = getChipBalance(user.id)
  const chipRate    = getChipRate()
  const userTx      = transactions.filter(tx => tx.userId === user.id)

  function flash(msg) { setSaved(msg); setTimeout(() => setSaved(''), 2500) }

  async function handleAddCoins() {
    if (gold === 0 && silver === 0 && copper === 0) { setErr('Betrag eingeben.'); return }
    setBusy(true); setErr('')
    try {
      await giveCoins({ userId: user.id, username: user.username || user.name, gold, silver, copper, type, reason })
      setGold(0); setSilver(0); setCopper(0); setReason('')
      flash('Coins gebucht')
    } catch(e) { setErr(e.message) }
    setBusy(false)
  }

  async function handleAddChips(sign) {
    if (!chipAmount || chipAmount <= 0) { setErr('Betrag > 0 eingeben.'); return }
    setBusy(true); setErr('')
    try {
      // Chips direkt als spezielle Transaktion eintragen
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('../../firebase')
      const { writeLog } = await import('../../utils/auditLog')
      await addDoc(collection(db, 'economy'), {
        userId:    user.id,
        username:  user.username || user.name,
        type:      sign > 0 ? 'CASINO_OUT' : 'CASINO_IN',
        amount:    0,
        chips:     chipAmount,
        reason:    chipReason || (sign > 0 ? 'Perlen gutgeschrieben (Admin)' : 'Perlen abgezogen (Admin)'),
        createdBy: 'admin',
        createdAt: serverTimestamp(),
      })
      setChipAmount(0); setChipReason('')
      flash(`${sign > 0 ? '+' : '-'}${chipAmount} ${config.chipIcon} gebucht`)
    } catch(e) { setErr(e.message) }
    setBusy(false)
  }

  async function handleReset() {
    if (!window.confirm(`Coins von ${user.username || user.name} auf 0 setzen?`)) return
    setBusy(true)
    await resetUser(user.id, user.username || user.name)
    flash('Reset durchgeführt')
    setBusy(false)
  }

  async function toggleCasino() {
    setCasinoBusy(true)
    try {
      await updateDoc(doc(db, 'users', user.id), { casinoEnabled: !user.casinoEnabled })
      flash(user.casinoEnabled ? 'Casino deaktiviert' : '🎰 Casino aktiviert')
    } catch(e) { setErr(e.message) }
    setCasinoBusy(false)
  }

  const allowedTypes = Object.entries(COIN_TYPES).filter(([k]) => ['DEPOSIT','BONUS','PENALTY','MANUAL'].includes(k))

  const tabStyle = (id) => ({
    background:'transparent', border:'none', cursor:'pointer',
    borderBottom: subTab===id ? `2px solid ${t.accent}` : '2px solid transparent',
    color: subTab===id ? t.accentSoft : t.accentDim,
    fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2,
    textTransform:'uppercase', padding:'5px 10px', marginBottom:-1, transition:'all .15s',
  })

  function formatDateShort(ts) {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'}) + ' ' + d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})
  }

  return (
    <div>
      <div style={{ display:'flex', gap:2, borderBottom:`1px solid ${t.accentFade}`, marginBottom:'0.8rem' }}>
        {[['overview','Übersicht'],['coins','Coins'],['chips','Perlen'],['casino','Casino']].map(([id,label]) => (
          <button key={id} onClick={() => { setSubTab(id); setErr('') }} style={tabStyle(id)}>{label}</button>
        ))}
      </div>

      {saved && <div style={{ fontSize:11, color:'#4a9a5a', fontStyle:'italic', marginBottom:8 }}>✓ {saved}</div>}
      {err   && <div style={{ fontSize:11, color:'#e08080', fontStyle:'italic', marginBottom:8 }}>✕ {err}</div>}

      {/* ── Übersicht ── */}
      {subTab === 'overview' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {/* Coins */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div style={{ padding:'1rem', background:t.bgDark, border:`1px solid ${t.accentFade}`, borderRadius:3 }}>
              <div style={{ fontSize:9, color:t.textMuted, fontFamily:'Cinzel,serif', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>Guthaben</div>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:20, color:balance>=0?t.accent:'#c04040', fontWeight:600 }}>
                {formatCoins(balance)}
              </div>
              <div style={{ fontSize:10, color:t.textMuted, marginTop:4 }}>{userTx.filter(tx=>tx.chips==null).length} Transaktionen</div>
            </div>
            <div style={{ padding:'1rem', background:t.bgDark, border:`1px solid #8788EE40`, borderRadius:3 }}>
              <div style={{ fontSize:9, color:'#8788EE', fontFamily:'Cinzel,serif', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>{config.chipName}</div>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:20, color:'#8788EE', fontWeight:600 }}>
                {chipBalance} {config.chipIcon}
              </div>
              <div style={{ fontSize:10, color:t.textMuted, marginTop:4 }}>
                Kurs: 1 {config.currencyIcon} = {chipRate.rate} {config.chipIcon}
                {chipRate.isEvent && <span style={{ color:t.accent, marginLeft:6 }}>🎉 Event</span>}
              </div>
            </div>
          </div>

          {/* Casino-Status */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'0.8rem 1rem', background:t.bgDark, border:`1px solid ${user.casinoEnabled?'#8788EE40':t.accentFade}`, borderRadius:3 }}>
            <span style={{ fontSize:20 }}>🎰</span>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:12, color:user.casinoEnabled?'#8788EE':t.accentDim }}>Casino-Zugang</div>
              <div style={{ fontSize:10, color:t.textMuted, marginTop:2 }}>{user.casinoEnabled ? 'Freigeschaltet' : 'Gesperrt'}</div>
            </div>
            <div onClick={!casinoBusy ? toggleCasino : undefined}
              style={{ width:44, height:24, borderRadius:12, cursor:'pointer', transition:'all .25s', background:user.casinoEnabled?'#8788EE':t.accentFade, position:'relative', opacity:casinoBusy?0.5:1 }}>
              <div style={{ position:'absolute', top:3, transition:'all .25s', left:user.casinoEnabled?22:3, width:18, height:18, borderRadius:'50%', background:'#fff' }} />
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="btn-ghost" style={{ fontSize:9, color:'#c04040' }} onClick={handleReset} disabled={busy}>Coins reset</button>
          </div>
        </div>
      )}

      {/* ── Coins buchen ── */}
      {subTab === 'coins' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <Lbl t={t}>Typ</Lbl>
              <select value={type} onChange={e => setType(e.target.value)} style={{ fontSize:12, width:'100%' }}>
                {allowedTypes.map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <div>
              <Lbl t={t}>Grund (optional)</Lbl>
              <input value={reason} onChange={e => setReason(e.target.value)} placeholder="z.B. Gildenbank-Einzahlung" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
            </div>
          </div>

          <div>
            <Lbl t={t}>Betrag</Lbl>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {[
                [gold,   setGold,   config.currencyIcon||'🪙', config.currencyName||'Gold'],
                [silver, setSilver, config.silverIcon||'🥈',   config.silverName||'Silber'],
                [copper, setCopper, config.copperIcon||'🟤',   config.copperName||'Kupfer'],
              ].map(([val, setter, icon, label], i) => (
                <div key={i}>
                  <div style={{ fontSize:9, color:t.textMuted, marginBottom:3 }}>{icon} {label}</div>
                  <input type="number" min={0} value={val} onChange={e => setter(Math.max(0, Number(e.target.value)))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Vorschau */}
          <div style={{ background:t.bgDark, border:`1px solid ${t.accentFade}`, borderRadius:3, padding:'0.6rem', fontSize:12 }}>
            <span style={{ color:t.textSecondary }}>Aktuell: </span>
            <span style={{ color:t.accent, fontFamily:'Cinzel,serif' }}>{formatCoins(balance)}</span>
            <span style={{ color:t.textMuted }}> → </span>
            <span style={{ color: COIN_TYPES[type]?.sign >= 0 ? '#4a9a5a' : '#c04040', fontFamily:'Cinzel,serif', fontWeight:600 }}>
              {formatCoins(balance + (COIN_TYPES[type]?.sign || 1) * coinsToCopper(gold, silver, copper))}
            </span>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="btn-primary" style={{ fontSize:11 }} onClick={handleAddCoins} disabled={busy}>
              {busy ? 'Buchen...' : 'Coins buchen'}
            </button>
          </div>

          {/* Verlauf */}
          <div style={{ borderTop:`1px solid ${t.accentFade}`, paddingTop:10, marginTop:4 }}>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:t.textMuted, textTransform:'uppercase', marginBottom:8 }}>Verlauf</div>
            <div style={{ maxHeight:200, overflowY:'auto' }}>
              {userTx.filter(tx => tx.chips == null).length === 0
                ? <div style={{ color:t.textMuted, fontStyle:'italic', fontSize:12 }}>Keine Transaktionen.</div>
                : userTx.filter(tx => tx.chips == null).map(tx => {
                    const type = COIN_TYPES[tx.type]
                    const sign = tx.type === 'RESET' ? 0 : type?.sign ?? 1
                    return (
                      <div key={tx.id} style={{ display:'grid', gridTemplateColumns:'22px 1fr auto auto', gap:8, padding:'0.35rem 0', borderBottom:`1px solid ${t.accentFade}`, alignItems:'center' }}>
                        <span style={{ fontSize:12 }}>{type?.icon||'•'}</span>
                        <div style={{ fontSize:10, color:t.textMuted, fontStyle:'italic' }}>{tx.reason}</div>
                        <div style={{ fontFamily:'Cinzel,serif', fontSize:11, color:sign>=0?'#4a9a5a':'#c04040', fontWeight:600, whiteSpace:'nowrap' }}>
                          {tx.type==='RESET'?'Reset':`${sign>=0?'+':'-'}${formatCoins(tx.amount)}`}
                        </div>
                        <div style={{ fontSize:9, color:t.textMuted, whiteSpace:'nowrap' }}>{formatDateShort(tx.createdAt)}</div>
                      </div>
                    )
                  })
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Casino-Perlen ── */}
      {subTab === 'chips' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Aktueller Stand */}
          <div style={{ padding:'1rem', background:t.bgDark, border:`1px solid #8788EE40`, borderRadius:3, display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:28 }}>{config.chipIcon}</span>
            <div>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:22, color:'#8788EE', fontWeight:600 }}>{chipBalance} {config.chipIcon}</div>
              <div style={{ fontSize:10, color:t.textMuted, marginTop:2 }}>{config.chipName} · Kurs: 1 {config.currencyIcon} = {chipRate.rate} {config.chipIcon}</div>
            </div>
          </div>

          {/* Manuell anpassen */}
          <div>
            <Lbl t={t}>Betrag ({config.chipName})</Lbl>
            <input type="number" min={0} value={chipAmount} onChange={e => setChipAmount(Math.max(0, Number(e.target.value)))} style={{ fontSize:12, width:'100%', boxSizing:'border-box', marginBottom:8 }} />
            <Lbl t={t}>Grund (optional)</Lbl>
            <input value={chipReason} onChange={e => setChipReason(e.target.value)} placeholder="z.B. Turniergewinn" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-primary" style={{ flex:1, fontSize:11, background:`linear-gradient(135deg,#4a9a5a30,${t.bgDark})`, borderColor:'#4a9a5a' }} onClick={() => handleAddChips(1)} disabled={busy}>
              + {config.chipIcon} gutschreiben
            </button>
            <button className="btn-ghost" style={{ flex:1, fontSize:11, color:'#c04040', borderColor:'#c04040' }} onClick={() => handleAddChips(-1)} disabled={busy}>
              − {config.chipIcon} abziehen
            </button>
          </div>

          {/* Perlen-Verlauf */}
          <div style={{ borderTop:`1px solid ${t.accentFade}`, paddingTop:10 }}>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:t.textMuted, textTransform:'uppercase', marginBottom:8 }}>Perlen-Verlauf</div>
            <div style={{ maxHeight:200, overflowY:'auto' }}>
              {userTx.filter(tx => tx.chips != null).length === 0
                ? <div style={{ color:t.textMuted, fontStyle:'italic', fontSize:12 }}>Keine Chip-Transaktionen.</div>
                : userTx.filter(tx => tx.chips != null).map(tx => {
                    const isOut = tx.type === 'CASINO_OUT'
                    return (
                      <div key={tx.id} style={{ display:'grid', gridTemplateColumns:'22px 1fr auto auto', gap:8, padding:'0.35rem 0', borderBottom:`1px solid ${t.accentFade}`, alignItems:'center' }}>
                        <span style={{ fontSize:12 }}>{config.chipIcon}</span>
                        <div style={{ fontSize:10, color:t.textMuted, fontStyle:'italic' }}>{tx.reason}</div>
                        <div style={{ fontFamily:'Cinzel,serif', fontSize:11, color:isOut?'#4a9a5a':'#c04040', fontWeight:600 }}>
                          {isOut ? '+' : '-'}{tx.chips} {config.chipIcon}
                        </div>
                        <div style={{ fontSize:9, color:t.textMuted, whiteSpace:'nowrap' }}>{formatDateShort(tx.createdAt)}</div>
                      </div>
                    )
                  })
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Casino-Zugang ── */}
      {subTab === 'casino' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:t.bgDark, border:`1px solid ${user.casinoEnabled?'#8788EE50':t.accentFade}`, borderRadius:3, padding:'1rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:28 }}>🎰</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:13, color:user.casinoEnabled?'#8788EE':t.accentDim, fontWeight:600 }}>
                  Casino-Zugang
                </div>
                <div style={{ fontSize:11, color:t.textSecondary, marginTop:3, fontStyle:'italic' }}>
                  {user.casinoEnabled
                    ? `${user.username||user.name} hat Zugang zum Casino.`
                    : `${user.username||user.name} hat keinen Casino-Zugang.`
                  }
                </div>
              </div>
              <div>
                <div onClick={!casinoBusy ? toggleCasino : undefined}
                  style={{ width:44, height:24, borderRadius:12, cursor:'pointer', transition:'all .25s', background:user.casinoEnabled?'#8788EE':t.accentFade, position:'relative', opacity:casinoBusy?0.5:1 }}>
                  <div style={{ position:'absolute', top:3, transition:'all .25s', left:user.casinoEnabled?22:3, width:18, height:18, borderRadius:'50%', background:'#fff' }} />
                </div>
                <div style={{ fontSize:9, color:user.casinoEnabled?'#8788EE':t.textMuted, textAlign:'center', marginTop:3, fontFamily:'Cinzel,serif', letterSpacing:1 }}>
                  {user.casinoEnabled ? 'AN' : 'AUS'}
                </div>
              </div>
            </div>
          </div>
          <div style={{ fontSize:11, color:t.textMuted, fontStyle:'italic', lineHeight:1.6 }}>
            💡 Casino-Zugang kann auch über Ränge für ganze Rang-Gruppen freigegeben werden.<br/>
            Diese Einstellung überschreibt den Rang-Standard für diesen einzelnen User.
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CharEditor ───────────────────────────────────────────────────────────────
function CharEditor({ char, charIdx, total, t, onSave, onDelete, ranks }) {
  const [open,      setOpen]      = useState(false)
  const [busy,      setBusy]      = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [charRank,  setCharRank]  = useState(char.rank || '')
  const [cls,       setCls]       = useState(char.cls || 'Warrior')
  const [race,      setRace]      = useState(char.race || '')
  const [level,     setLevel]     = useState(char.level || 70)
  const [charType,  setCharType]  = useState(char.characterType || 'main')
  const [profs,     setProfs]     = useState(char.professions || [])
  const [absFrom,   setAbsFrom]   = useState(char.absence?.from || '')
  const [absUntil,  setAbsUntil]  = useState(char.absence?.until || '')
  const [absReason, setAbsReason] = useState(char.absence?.reason || '')

  const clsColor = CLASS_COLORS[cls] || t.accent
  const clsIcon  = CLASS_ICONS[cls]  || '⚔️'
  const primaryCount = profs.filter(p => PRIMARY_PROFS.includes(p.name)).length
  const canAddPrimary = primaryCount < 2

  function addProf() {
    const used = profs.map(p => p.name)
    const av   = [...PRIMARY_PROFS, ...SECONDARY_PROFS].find(p => !used.includes(p))
    if (!av) return
    setProfs([...profs, { name:av, level:375, specialization:'Keine' }])
  }

  async function handleSave() {
    setBusy(true)
    await onSave(charIdx, { cls, race, level:Number(level), characterType:charType, professions:profs, rank:charRank||undefined, absence:absFrom?{from:absFrom,until:absUntil,reason:absReason}:null })
    setBusy(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const subTab = (id) => ({ background:'transparent', border:'none', cursor:'pointer', borderBottom:activeTab===id?`2px solid ${t.accent}`:'2px solid transparent', color:activeTab===id?t.accentSoft:t.accentDim, fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, textTransform:'uppercase', padding:'4px 10px', marginBottom:-1, transition:'all .15s' })

  return (
    <div style={{ border:`1px solid ${open?t.accent+'50':t.accentFade}`, borderRadius:3, overflow:'hidden', transition:'all .2s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0.7rem 0.9rem', background:open?`${t.accent}06`:t.bgDark, cursor:'pointer' }} onClick={() => setOpen(v=>!v)}>
        <span style={{ fontSize:18, flexShrink:0 }}>{clsIcon}</span>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontFamily:'Cinzel,serif', fontSize:13, color:clsColor, fontWeight:600 }}>{char.name}</span>
            <span style={{ fontSize:9, color:charType==='main'?t.accent:t.textMuted, fontFamily:'Cinzel,serif', letterSpacing:1, background:charType==='main'?`${t.accent}18`:'transparent', padding:'1px 5px', borderRadius:2 }}>{charType==='main'?'⭐ MAIN':'🔄 TWINK'}</span>
            {(char.rank||charRank) && <span style={{ fontSize:9, color:t.accentDim, fontFamily:'Cinzel,serif', letterSpacing:1 }}>{char.rank||charRank}</span>}
          </div>
          <div style={{ fontSize:10, color:t.textSecondary, marginTop:2 }}>{cls}{race?` · ${race}`:''} · Level {level}{profs.length>0&&<span style={{ color:t.textMuted }}> · {profs.map(p=>p.name).join(', ')}</span>}</div>
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
            {[['info','Charakter'],['professions','Berufe'],['absence','Abwesenheit']].map(([id,label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={subTab(id)}>{label}</button>
            ))}
          </div>
          <div style={{ padding:'0.9rem' }}>
            {activeTab==='info' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div><Lbl t={t}>Rang</Lbl>
                  <select value={charRank} onChange={e=>setCharRank(e.target.value)} style={{ fontSize:12, width:'100%' }}>
                    <option value="">— Account-Rang —</option>
                    {ranks.map(r=><option key={r.id} value={r.label}>{r.label}</option>)}
                  </select>
                </div>
                <div><Lbl t={t}>Typ</Lbl>
                  <div style={{ display:'flex', gap:6 }}>
                    {[{id:'main',label:'⭐ Main'},{id:'twink',label:'🔄 Twink'}].map(opt => (
                      <button key={opt.id} onClick={()=>setCharType(opt.id)} style={{ flex:1, background:charType===opt.id?`${t.accent}18`:'transparent', border:charType===opt.id?`1px solid ${t.accent}`:`1px solid ${t.accentFade}`, borderRadius:3, padding:'6px', cursor:'pointer', fontFamily:'Cinzel,serif', fontSize:10, color:charType===opt.id?t.accentSoft:t.accentDim, transition:'all .15s' }}>{opt.label}</button>
                    ))}
                  </div>
                </div>
                <div><Lbl t={t}>Klasse</Lbl><select value={cls} onChange={e=>setCls(e.target.value)} style={{ fontSize:12, width:'100%' }}>{WOW_CLASSES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div><Lbl t={t}>Rasse</Lbl>
                  <select value={race} onChange={e=>setRace(e.target.value)} style={{ fontSize:12, width:'100%' }}>
                    <option value="">— Nicht gesetzt —</option>
                    <optgroup label="Allianz">{RACES.Allianz.map(r=><option key={r} value={r}>{r}</option>)}</optgroup>
                    <optgroup label="Horde">{RACES.Horde.map(r=><option key={r} value={r}>{r}</option>)}</optgroup>
                  </select>
                </div>
                <div><Lbl t={t}>Level</Lbl><input type="number" min={1} max={70} value={level} onChange={e=>setLevel(Math.min(70,Math.max(1,Number(e.target.value))))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
              </div>
            )}
            {activeTab==='professions' && (
              <div>
                {profs.length===0 ? <div style={{ color:t.textMuted, fontStyle:'italic', fontSize:12, padding:'0.5rem 0' }}>Keine Berufe.</div>
                  : profs.map((prof,pidx) => {
                      const specs = PROFESSIONS[prof.name]||['Keine']
                      return (
                        <div key={pidx} style={{ display:'grid', gridTemplateColumns:'1fr 60px 1fr auto', gap:6, alignItems:'center', padding:'0.4rem 0', borderBottom:`1px solid ${t.accentFade}` }}>
                          <select value={prof.name} onChange={e=>{const n=[...profs];n[pidx]={...prof,name:e.target.value,specialization:'Keine'};setProfs(n)}} style={{ fontSize:11 }}>
                            <optgroup label="Hauptberufe">{PRIMARY_PROFS.map(p=><option key={p} value={p}>{p}</option>)}</optgroup>
                            <optgroup label="Nebenberufe">{SECONDARY_PROFS.map(p=><option key={p} value={p}>{p}</option>)}</optgroup>
                          </select>
                          <input type="number" min={1} max={375} value={prof.level} onChange={e=>{const n=[...profs];n[pidx]={...prof,level:Number(e.target.value)};setProfs(n)}} style={{ fontSize:11, textAlign:'center' }} />
                          {specs.length>1 ? <select value={prof.specialization||'Keine'} onChange={e=>{const n=[...profs];n[pidx]={...prof,specialization:e.target.value};setProfs(n)}} style={{ fontSize:11 }}>{specs.map(s=><option key={s} value={s}>{s}</option>)}</select> : <div style={{ fontSize:10, color:t.textMuted, fontStyle:'italic' }}>Keine Spezialisierung</div>}
                          <button onClick={()=>setProfs(profs.filter((_,i)=>i!==pidx))} style={{ background:'transparent', border:'none', color:t.accentDim, cursor:'pointer', fontSize:13 }} onMouseEnter={e=>e.target.style.color='#c04040'} onMouseLeave={e=>e.target.style.color=t.accentDim}>✕</button>
                        </div>
                      )
                    })
                }
                {canAddPrimary && <button className="btn-ghost" style={{ fontSize:9, marginTop:8 }} onClick={addProf}>+ Beruf hinzufügen</button>}
                <div style={{ fontSize:10, color:t.textMuted, fontStyle:'italic', marginTop:6 }}>{primaryCount}/2 Hauptberufe</div>
              </div>
            )}
            {activeTab==='absence' && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {char.absence && <div style={{ background:'rgba(192,57,43,.08)', border:'1px solid #3a1a1a', borderRadius:3, padding:'0.6rem', fontSize:12, color:'#e08080' }}>🏖️ {char.absence.from} – {char.absence.until||'offen'}</div>}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div><Lbl t={t}>Von</Lbl><input type="date" value={absFrom} onChange={e=>setAbsFrom(e.target.value)} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
                  <div><Lbl t={t}>Bis</Lbl><input type="date" value={absUntil} onChange={e=>setAbsUntil(e.target.value)} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
                </div>
                <div><Lbl t={t}>Grund</Lbl><input value={absReason} onChange={e=>setAbsReason(e.target.value)} placeholder="z.B. Urlaub" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10 }}>
              <button className="btn-primary" style={{ fontSize:10 }} onClick={handleSave} disabled={busy}>{busy?'Speichern...':`${char.name} speichern`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DKP-Tab ──────────────────────────────────────────────────────────────────
function DKPTab({ user, t }) {
  const { transactions, addTransaction, resetUser, deleteTransaction } = useDKP()
  const characters = user.characters || []
  const [dkpTab,   setDkpTab]   = useState('overview')
  const [busy,     setBusy]     = useState(false)
  const [saved,    setSaved]    = useState('')
  const [err,      setErr]      = useState('')
  const [selChar,  setSelChar]  = useState(characters[0]?.name || '')
  const [txType,   setTxType]   = useState('BONUS')
  const [txAmount, setTxAmount] = useState(10)
  const [txReason, setTxReason] = useState('')

  function charTx(charName) { return transactions.filter(t => t.userId === user.id && (t.charName === charName || (!t.charName && charName === (characters[0]?.name || user.name)))) }
  function charBalance(charName) {
    let bal = 0
    for (const tx of [...charTx(charName)].reverse()) {
      if (tx.type==='RESET') { bal=0; continue }
      const type = DKP_TYPES[tx.type]
      if (type) bal += tx.amount * type.sign
    }
    return bal
  }
  function flash(msg) { setSaved(msg); setTimeout(()=>setSaved(''),2500) }

  async function handleAdd() {
    if (!selChar) { setErr('Charakter wählen.'); return }
    if (!txAmount||txAmount<=0) { setErr('Betrag > 0.'); return }
    setBusy(true); setErr('')
    try { await addTransaction({ userId:user.id, username:selChar, charName:selChar, type:txType, amount:txAmount, reason:txReason||DKP_TYPES[txType]?.label }); setTxReason(''); setTxAmount(10); flash(`${DKP_TYPES[txType]?.sign>=0?'+':'-'}${txAmount} DKP`) } catch(e) { setErr(e.message) }
    setBusy(false)
  }

  const tabStyle = (id) => ({ background:'transparent', border:'none', cursor:'pointer', borderBottom:dkpTab===id?`2px solid ${t.accent}`:'2px solid transparent', color:dkpTab===id?t.accentSoft:t.accentDim, fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, textTransform:'uppercase', padding:'5px 10px', marginBottom:-1, transition:'all .15s' })
  const allUserTx = transactions.filter(tx => tx.userId === user.id)

  return (
    <div>
      <div style={{ display:'flex', gap:2, borderBottom:`1px solid ${t.accentFade}`, marginBottom:'0.8rem' }}>
        {[['overview','Übersicht'],['add','Buchen'],['log','Verlauf']].map(([id,label]) => <button key={id} onClick={()=>{setDkpTab(id);setErr('')}} style={tabStyle(id)}>{label}</button>)}
      </div>
      {saved && <div style={{ fontSize:11, color:'#4a9a5a', fontStyle:'italic', marginBottom:8 }}>✓ {saved}</div>}
      {err   && <div style={{ fontSize:11, color:'#e08080', fontStyle:'italic', marginBottom:8 }}>✕ {err}</div>}

      {dkpTab==='overview' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {characters.map((char,idx) => {
            const bal=charBalance(char.name); const clsColor=CLASS_COLORS[char.cls]||t.accent; const clsIcon=CLASS_ICONS[char.cls]||'⚔️'
            return (
              <div key={idx} style={{ display:'flex', alignItems:'center', gap:12, padding:'0.8rem 1rem', background:t.bgDark, border:`1px solid ${t.accentFade}`, borderRadius:3 }}>
                <span style={{ fontSize:20 }}>{clsIcon}</span>
                <div style={{ flex:1 }}><div style={{ fontFamily:'Cinzel,serif', fontSize:12, color:clsColor, fontWeight:600 }}>{char.name}</div><div style={{ fontSize:10, color:t.textMuted, marginTop:2 }}>{char.characterType==='main'?'⭐ Main':'🔄 Twink'}</div></div>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:18, color:bal>=0?t.accent:'#c04040', fontWeight:600 }}>{bal>0?'+':''}{bal} <span style={{ fontSize:10, color:t.textMuted }}>DKP</span></div>
                <button className="btn-ghost" style={{ fontSize:9, color:'#c04040' }} onClick={async()=>{if(window.confirm(`DKP von ${char.name} auf 0?`)){setBusy(true);await resetUser(user.id,char.name);flash(`${char.name} reset`);setBusy(false)}}} disabled={busy}>Reset</button>
              </div>
            )
          })}
        </div>
      )}

      {dkpTab==='add' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><Lbl t={t}>Charakter</Lbl><select value={selChar} onChange={e=>setSelChar(e.target.value)} style={{ fontSize:12, width:'100%' }}>{characters.map((c,i)=><option key={i} value={c.name}>{c.name} ({charBalance(c.name)} DKP)</option>)}</select></div>
            <div><Lbl t={t}>Typ</Lbl><select value={txType} onChange={e=>setTxType(e.target.value)} style={{ fontSize:12, width:'100%' }}>{Object.entries(DKP_TYPES).filter(([k])=>k!=='RESET').map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:10 }}>
            <div><Lbl t={t}>Betrag</Lbl><input type="number" min={1} max={9999} value={txAmount} onChange={e=>setTxAmount(Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
            <div><Lbl t={t}>Grund</Lbl><input value={txReason} onChange={e=>setTxReason(e.target.value)} placeholder="z.B. Kara Clear" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
          </div>
          {selChar && <div style={{ background:t.bgDark, border:`1px solid ${t.accentFade}`, borderRadius:3, padding:'0.7rem', fontSize:12 }}><span style={{ color:t.textSecondary }}>{selChar}: </span><span style={{ color:t.accent, fontFamily:'Cinzel,serif' }}>{charBalance(selChar)}</span><span style={{ color:t.textMuted }}> → </span><span style={{ color:DKP_TYPES[txType]?.sign>=0?'#4a9a5a':'#c04040', fontFamily:'Cinzel,serif', fontWeight:600 }}>{charBalance(selChar)+(DKP_TYPES[txType]?.sign||1)*txAmount} DKP</span></div>}
          <div style={{ display:'flex', justifyContent:'flex-end' }}><button className="btn-primary" style={{ fontSize:11 }} onClick={handleAdd} disabled={busy||!selChar}>{busy?'Buchen...':'DKP buchen'}</button></div>
        </div>
      )}

      {dkpTab==='log' && (
        <div style={{ maxHeight:320, overflowY:'auto' }}>
          {allUserTx.length===0 ? <div style={{ textAlign:'center', padding:'1.5rem', color:t.textMuted, fontStyle:'italic', fontSize:12 }}>Keine Transaktionen.</div>
            : allUserTx.map(tx => {
                const type=DKP_TYPES[tx.type]; const sign=tx.type==='RESET'?0:type?.sign??1
                return (
                  <div key={tx.id} style={{ display:'grid', gridTemplateColumns:'24px 1fr auto auto 24px', alignItems:'center', gap:8, padding:'0.45rem 0.3rem', borderBottom:`1px solid ${t.accentFade}` }}>
                    <span style={{ fontSize:14, textAlign:'center' }}>{type?.icon||'•'}</span>
                    <div><div style={{ fontSize:11, color:t.accent, fontFamily:'Cinzel,serif' }}>{tx.charName||tx.username}</div>{tx.reason&&<div style={{ fontSize:10, color:t.textMuted, fontStyle:'italic' }}>{tx.reason}</div>}</div>
                    <div style={{ fontFamily:'Cinzel,serif', fontSize:12, color:tx.type==='RESET'?t.accentDim:sign>=0?'#4a9a5a':'#c04040', fontWeight:600, textAlign:'right' }}>{tx.type==='RESET'?'Reset':`${sign>=0?'+':'-'}${tx.amount}`}</div>
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

// ─── UserDetailPanel ──────────────────────────────────────────────────────────
function UserDetailPanel({ user, ranks, onClose, t }) {
  const [tab,       setTab]       = useState('characters')
  const [busy,      setBusy]      = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [err,       setErr]       = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [newCharName, setNewCharName] = useState('')
  const [newCharCls,  setNewCharCls]  = useState('Warrior')
  const [addingChar,  setAddingChar]  = useState(false)

  const characters = user.characters || []
  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  async function handleCharSave(charIdx, charData) {
    const chars = [...characters]; chars[charIdx] = { ...chars[charIdx], ...charData }
    await updateDoc(doc(db,'users',user.id), { characters:chars }); flash()
  }
  async function handleCharDelete(charIdx) {
    if (characters.length <= 1) return
    await updateDoc(doc(db,'users',user.id), { characters:characters.filter((_,i)=>i!==charIdx) }); flash()
  }
  async function handleAddChar() {
    if (!newCharName.trim()) { setErr('Charaktername fehlt.'); return }
    setErr(''); setBusy(true)
    await updateDoc(doc(db,'users',user.id), { characters:[...characters, { name:newCharName.trim(), cls:newCharCls, race:'', level:70, characterType:'twink', professions:[], absence:null }] })
    setNewCharName(''); setNewCharCls('Warrior'); setAddingChar(false); setBusy(false); flash()
  }
  async function savePw() {
    setErr('')
    if (newPw.length < 6) { setErr('Mind. 6 Zeichen.'); return }
    if (newPw !== confirmPw) { setErr('Passwörter stimmen nicht überein.'); return }
    setBusy(true)
    try { await updateDoc(doc(db,'users',user.id),{passwordHash:await hashPassword(newPw),password:null}); setNewPw(''); setConfirmPw(''); flash() } catch(e) { setErr(e.message) }
    setBusy(false)
  }

  const TABS = [
    { id:'characters', label:'Charaktere' },
    { id:'dkp',        label:'DKP' },
    { id:'coins',      label:'Coins & 🎰' },
    { id:'account',    label:'Account' },
    { id:'password',   label:'Passwort' },
  ]
  const tabStyle = (id) => ({ background:'transparent', border:'none', borderBottom:tab===id?`2px solid ${t.accent}`:'2px solid transparent', color:tab===id?t.accentSoft:t.accentDim, fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, textTransform:'uppercase', padding:'6px 12px', cursor:'pointer', transition:'all .15s', marginBottom:-1 })

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem' }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:t.cardBg, border:`1px solid ${t.accentFade}`, borderRadius:4, width:'100%', maxWidth:640, maxHeight:'90vh', display:'flex', flexDirection:'column', position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'60%', height:2, background:t.gradBar }} />

        <div style={{ padding:'1.2rem 1.4rem 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1rem' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:17, color:t.accentSoft, fontWeight:600 }}>{user.username||user.name}</div>
              <div style={{ fontSize:11, color:t.textSecondary, marginTop:2 }}>
                {user.rank} · {characters.length} Char{characters.length!==1?'e':''}
                {user.casinoEnabled && <span style={{ marginLeft:8, fontSize:10, color:'#8788EE' }}>🎰 Casino</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background:'transparent', border:'none', color:t.accentDim, fontSize:18, cursor:'pointer', padding:'4px 8px' }}>✕</button>
          </div>
          <div style={{ display:'flex', gap:2, borderBottom:`1px solid ${t.accentFade}`, overflowX:'auto' }}>
            {TABS.map(tb => <button key={tb.id} onClick={() => { setTab(tb.id); setErr('') }} style={tabStyle(tb.id)}>{tb.label}</button>)}
          </div>
        </div>

        <div style={{ padding:'1rem 1.4rem', overflowY:'auto', flex:1 }}>
          {tab==='characters' && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {characters.map((char,idx) => <CharEditor key={idx} char={char} charIdx={idx} total={characters.length} t={t} onSave={handleCharSave} onDelete={handleCharDelete} ranks={ranks} />)}
              {!addingChar ? (
                <button onClick={() => setAddingChar(true)} style={{ marginTop:4, background:'none', border:`1px dashed ${t.accentFade}`, color:t.accentDim, fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:2, padding:'10px', cursor:'pointer', borderRadius:3, textTransform:'uppercase', transition:'all .15s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor=t.accent;e.currentTarget.style.color=t.accent}} onMouseLeave={e=>{e.currentTarget.style.borderColor=t.accentFade;e.currentTarget.style.color=t.accentDim}}>+ Charakter hinzufügen</button>
              ) : (
                <div style={{ border:`1px solid ${t.accentFade}`, borderRadius:3, padding:'0.9rem', background:t.bgMid, display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div><Lbl t={t}>Charaktername</Lbl><input value={newCharName} onChange={e=>setNewCharName(e.target.value)} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
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

          {tab==='dkp'   && <DKPTab   user={user} t={t} />}
          {tab==='coins' && <CoinsTab user={user} t={t} />}

          {tab==='account' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background:t.bgMid, border:`1px solid ${t.accentFade}`, borderRadius:3, padding:'1rem' }}>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:9, color:t.textMuted, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Account-Infos</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12, color:t.textSecondary }}>
                  <div>Login: <span style={{ color:t.accentSoft, fontFamily:'Cinzel,serif' }}>{user.username||user.name}</span></div>
                  <div>Status: <span style={{ color:user.active?'#4a9a5a':'#c04040' }}>{user.active?'Aktiv':'Inaktiv'}</span></div>
                  <div>Rang: <span style={{ color:t.accentDim }}>{user.rank}</span></div>
                  <div>Charaktere: <span style={{ color:t.accent, fontFamily:'Cinzel,serif' }}>{characters.length}</span></div>
                  <div>Erstellt: <span style={{ color:t.accentDim }}>{user.createdAt?.toDate?user.createdAt.toDate().toLocaleDateString('de-DE'):'—'}</span></div>
                  <div>Casino: <span style={{ color:user.casinoEnabled?'#8788EE':t.textMuted }}>{user.casinoEnabled?'🎰 Freigeschaltet':'Gesperrt'}</span></div>
                </div>
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
              <div style={{ display:'flex', justifyContent:'flex-end' }}><button className="btn-primary" style={{ fontSize:11 }} onClick={savePw} disabled={busy}>{busy?'Speichern...':'Passwort setzen'}</button></div>
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
  const { ranks } = useRanks()
  const t         = useTheme()
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
      if (!form.username?.trim()) { setErr('Benutzername fehlt.'); setBusy(false); return }
      if (!form.charName?.trim()) { setErr('Charaktername fehlt.'); setBusy(false); return }
      if (!form.password||form.password.length<6) { setErr('Passwort mind. 6 Zeichen.'); setBusy(false); return }
      await addUser(form)
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
              {filtered.map(u => {
                const chars = u.characters||[]
                return (
                  <tr key={u.id} style={{ borderBottom:`1px solid ${t.accentFade}40`, cursor:'pointer', transition:'background .1s' }} onMouseEnter={e=>e.currentTarget.style.background=`${t.accent}05`} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'.65rem .8rem' }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', display:'inline-block', marginRight:6, background:u.active?'#4a9a5a':t.accentFade }} />
                      <span style={{ fontSize:11, color:u.active?'#4a9a5a':t.accentDim }}>{u.active?'Aktiv':'Inaktiv'}</span>
                    </td>
                    <td style={{ padding:'.65rem .8rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ fontFamily:'Cinzel,serif', fontSize:12, color:t.accentSoft, fontWeight:500 }}>{u.username||u.name}</div>
                        {u.casinoEnabled && <span style={{ fontSize:10 }} title="Casino freigeschaltet">🎰</span>}
                      </div>
                      {chars.length>0 && <div style={{ fontSize:10, color:t.textMuted, marginTop:2 }}>{chars.map((c,i)=><span key={i} style={{ color:CLASS_COLORS[c.cls]||t.textSecondary, marginRight:6 }}>{CLASS_ICONS[c.cls]||'⚔️'} {c.name}{c.characterType==='main'?' ⭐':''}</span>)}</div>}
                    </td>
                    <td style={{ padding:'.65rem .8rem', fontSize:12, color:t.accentDim }}>{u.rank}</td>
                    <td style={{ padding:'.65rem .8rem', fontSize:11, textAlign:'center' }}><span style={{ fontFamily:'Cinzel,serif', fontSize:14, color:t.accent }}>{chars.length||1}</span></td>
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
          <div className="field-group"><label className="field-label">Klasse</label><select value={form.cls} onChange={e=>setForm({...form,cls:e.target.value})}>{WOW_CLASSES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          {err && <p className="error-text">{err}</p>}
        </Modal>
      )}

      {detailUser && (
        <UserDetailPanel user={users.find(u=>u.id===detailUser.id)||detailUser} ranks={ranks} onClose={()=>setDetailUser(null)} t={t} />
      )}
    </div>
  )
}
