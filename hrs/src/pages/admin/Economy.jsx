import { useState, useEffect } from 'react'
import { useEconomy, COIN_TYPES, DEFAULT_ECONOMY, coinsToCopper } from '../../hooks/useEconomy'
import { useUsers } from '../../hooks/useUsers'
import { useTheme } from '../../hooks/useTheme'

function Lbl({ children, t }) {
  return <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:t.textMuted, textTransform:'uppercase', marginBottom:5 }}>{children}</div>
}
function Card({ children, t, style={} }) {
  return <div style={{ background:t.cardBg, border:`1px solid ${t.accentFade}`, borderRadius:4, padding:'1.2rem 1.4rem', ...style }}>{children}</div>
}
function STitle({ children, t }) {
  return <div style={{ fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:3, color:t.accentDim, textTransform:'uppercase', marginBottom:'1rem', paddingBottom:'0.5rem', borderBottom:`1px solid ${t.accentFade}` }}>{children}</div>
}

function CurrencyConfig({ config, t, onSave }) {
  const [form, setForm] = useState({ ...DEFAULT_ECONOMY, ...config })
  const [busy, setBusy] = useState(false)
  const [saved,setSaved]= useState(false)
  useEffect(() => { setForm({ ...DEFAULT_ECONOMY, ...config }) }, [config])
  const upd = (k,v) => setForm(p => ({...p,[k]:v}))

  async function handleSave() {
    setBusy(true); await onSave(form); setBusy(false)
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Card t={t}>
      <STitle t={t}>💱 Währungskonfiguration</STitle>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        {[
          ['currencyName','currencyIcon','Gold (Hauptwährung)'],
          ['silverName','silverIcon','Silber'],
          ['copperName','copperIcon','Kupfer'],
        ].map(([nameKey, iconKey, label]) => (
          <div key={nameKey}>
            <div style={{ fontSize:10, color:t.accentSoft, fontFamily:'Cinzel,serif', marginBottom:6 }}>{label}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 52px', gap:6 }}>
              <input value={form[nameKey]} onChange={e=>upd(nameKey,e.target.value)} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
              <input value={form[iconKey]} onChange={e=>upd(iconKey,e.target.value)} style={{ fontSize:16, textAlign:'center', width:'100%', boxSizing:'border-box' }} maxLength={2} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:'1rem' }}>
        <div><Lbl t={t}>Silber pro Gold</Lbl><input type="number" min={1} value={form.silverPerGold} onChange={e=>upd('silverPerGold',Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
        <div><Lbl t={t}>Kupfer pro Silber</Lbl><input type="number" min={1} value={form.copperPerSilver} onChange={e=>upd('copperPerSilver',Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
      </div>

      <div style={{ borderTop:`1px solid ${t.accentFade}`, paddingTop:'1rem', marginBottom:'1rem' }}>
        <div style={{ fontSize:10, color:'#8788EE', fontFamily:'Cinzel,serif', marginBottom:8 }}>🎰 Casino-Chips</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 52px 1fr', gap:8 }}>
          <input value={form.chipName} onChange={e=>upd('chipName',e.target.value)} style={{ fontSize:12, boxSizing:'border-box' }} />
          <input value={form.chipIcon} onChange={e=>upd('chipIcon',e.target.value)} style={{ fontSize:16, textAlign:'center', boxSizing:'border-box' }} maxLength={2} />
          <div>
            <Lbl t={t}>Chips pro Gold-Einheit</Lbl>
            <input type="number" min={1} value={form.chipsPerGold} onChange={e=>upd('chipsPerGold',Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
          </div>
        </div>
      </div>

      {/* Event-Rate */}
      <div style={{ background:`${t.accent}06`, border:`1px solid ${t.accentFade}`, borderRadius:3, padding:'1rem', marginBottom:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: form.eventRateActive ? 10 : 0 }}>
          <div onClick={() => upd('eventRateActive', !form.eventRateActive)}
            style={{ width:16, height:16, borderRadius:3, background:form.eventRateActive?t.accent:'transparent', border:`1px solid ${form.eventRateActive?t.accent:t.accentFade}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
            {form.eventRateActive && <span style={{ color:t.bgDark, fontSize:10, fontWeight:700 }}>✓</span>}
          </div>
          <span style={{ fontSize:10, color:t.accentSoft, fontFamily:'Cinzel,serif' }}>🎉 Event-Kurs aktiv</span>
        </div>
        {form.eventRateActive && (
          <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 180px', gap:8 }}>
            <div><Lbl t={t}>Chips/Gold (Event)</Lbl><input type="number" min={1} value={form.eventRate||form.chipsPerGold} onChange={e=>upd('eventRate',Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
            <div><Lbl t={t}>Bezeichnung</Lbl><input value={form.eventRateLabel} onChange={e=>upd('eventRateLabel',e.target.value)} placeholder="z.B. Wochenend-Bonus! 🎉" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
            <div><Lbl t={t}>Aktiv bis</Lbl><input type="datetime-local" value={form.eventRateUntil} onChange={e=>upd('eventRateUntil',e.target.value)} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
          </div>
        )}
      </div>

      <div style={{ background:t.bgDark, border:`1px solid ${t.accentFade}`, borderRadius:3, padding:'0.7rem', marginBottom:'1rem', fontSize:11, color:t.textSecondary }}>
        Vorschau: 1 {form.currencyIcon} = {form.silverPerGold} {form.silverIcon} = {form.silverPerGold * form.copperPerSilver} {form.copperIcon}
        <span style={{ color:'#8788EE', marginLeft:12 }}>· 1 {form.currencyIcon} = {form.chipsPerGold} {form.chipIcon}</span>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, alignItems:'center' }}>
        {saved && <span style={{ fontSize:11, color:'#4a9a5a', fontStyle:'italic' }}>✓ Gespeichert</span>}
        <button className="btn-primary" style={{ fontSize:11 }} onClick={handleSave} disabled={busy}>{busy?'Speichern...':'Konfiguration speichern'}</button>
      </div>
    </Card>
  )
}

function CoinGiver({ users, config, t, onGive }) {
  const [selUser, setSelUser] = useState('')
  const [gold,    setGold]    = useState(0)
  const [silver,  setSilver]  = useState(0)
  const [copper,  setCopper]  = useState(0)
  const [type,    setType]    = useState('DEPOSIT')
  const [reason,  setReason]  = useState('')
  const [bulk,    setBulk]    = useState(false)
  const [selAll,  setSelAll]  = useState([])
  const [busy,    setBusy]    = useState(false)
  const [saved,   setSaved]   = useState('')
  const [err,     setErr]     = useState('')

  const active = users.filter(u => u.active)
  const allowedTypes = Object.entries(COIN_TYPES).filter(([k]) => ['DEPOSIT','BONUS','PENALTY','MANUAL'].includes(k))

  async function handleGive() {
    if (!bulk && !selUser) { setErr('User wählen.'); return }
    if (bulk && selAll.length === 0) { setErr('Mind. einen User wählen.'); return }
    if (gold === 0 && silver === 0 && copper === 0) { setErr('Betrag eingeben.'); return }
    setBusy(true); setErr('')
    try {
      if (bulk) {
        await onGive({ type:'BULK', userIds:selAll, users:active, gold, silver, copper, reason })
        setSaved(`${selAll.length} User erhalten Coins`)
      } else {
        const user = active.find(u => u.id === selUser)
        await onGive({ type, userId:selUser, username:user?.username||user?.name, gold, silver, copper, reason })
        setSaved(`✓ ${user?.username||user?.name}`)
      }
      setGold(0); setSilver(0); setCopper(0); setReason('')
    } catch(e) { setErr(e.message) }
    setBusy(false); setTimeout(() => setSaved(''), 3000)
  }

  return (
    <Card t={t}>
      <STitle t={t}>🏦 Coins vergeben / abziehen</STitle>

      <div style={{ display:'flex', gap:6, marginBottom:'1rem' }}>
        {[{id:false,label:'Einzelner User'},{id:true,label:'Mehrere / Alle'}].map(opt => (
          <button key={String(opt.id)} onClick={() => setBulk(opt.id)} style={{ flex:1, background:bulk===opt.id?`${t.accent}18`:'transparent', border:bulk===opt.id?`1px solid ${t.accent}`:`1px solid ${t.accentFade}`, color:bulk===opt.id?t.accentSoft:t.accentDim, borderRadius:3, fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:1, padding:'7px', cursor:'pointer' }}>{opt.label}</button>
        ))}
      </div>

      {!bulk ? (
        <div style={{ marginBottom:'1rem' }}>
          <Lbl t={t}>User</Lbl>
          <select value={selUser} onChange={e => setSelUser(e.target.value)} style={{ fontSize:12, width:'100%' }}>
            <option value="">— Bitte wählen —</option>
            {active.map(u => <option key={u.id} value={u.id}>{u.username||u.name} ({u.rank})</option>)}
          </select>
        </div>
      ) : (
        <div style={{ marginBottom:'1rem' }}>
          <Lbl t={t}>User auswählen</Lbl>
          <div style={{ maxHeight:140, overflowY:'auto', border:`1px solid ${t.accentFade}`, borderRadius:3, padding:'0.5rem' }}>
            <div style={{ display:'flex', gap:6, marginBottom:4 }}>
              <button className="btn-ghost" style={{ fontSize:9 }} onClick={() => setSelAll(active.map(u=>u.id))}>Alle</button>
              <button className="btn-ghost" style={{ fontSize:9 }} onClick={() => setSelAll([])}>Keine</button>
            </div>
            {active.map(u => (
              <label key={u.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'3px 0', cursor:'pointer' }}>
                <div onClick={() => setSelAll(p => p.includes(u.id) ? p.filter(id=>id!==u.id) : [...p,u.id])}
                  style={{ width:13, height:13, borderRadius:2, background:selAll.includes(u.id)?t.accent:'transparent', border:`1px solid ${selAll.includes(u.id)?t.accent:t.accentFade}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}>
                  {selAll.includes(u.id) && <span style={{ color:t.bgDark, fontSize:9, fontWeight:700 }}>✓</span>}
                </div>
                <span style={{ fontSize:12, color:t.accentSoft, fontFamily:'Cinzel,serif' }}>{u.username||u.name}</span>
                <span style={{ fontSize:10, color:t.textMuted }}>{u.rank}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns: bulk ? '1fr' : '1fr 1fr', gap:8, marginBottom:'1rem' }}>
        {!bulk && (
          <div>
            <Lbl t={t}>Typ</Lbl>
            <select value={type} onChange={e=>setType(e.target.value)} style={{ fontSize:12, width:'100%' }}>
              {allowedTypes.map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
          </div>
        )}
        <div>
          <Lbl t={t}>Grund (optional)</Lbl>
          <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="z.B. Gildenbank-Einzahlung" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
        </div>
      </div>

      <div style={{ marginBottom:'1rem' }}>
        <Lbl t={t}>Betrag</Lbl>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {[[gold,setGold,config.currencyIcon||'🪙',config.currencyName||'Gold'],[silver,setSilver,config.silverIcon||'🥈',config.silverName||'Silber'],[copper,setCopper,config.copperIcon||'🟤',config.copperName||'Kupfer']].map(([val,setter,icon,label],i) => (
            <div key={i}>
              <div style={{ fontSize:9, color:t.textMuted, marginBottom:3 }}>{icon} {label}</div>
              <input type="number" min={0} value={val} onChange={e=>setter(Math.max(0,Number(e.target.value)))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
            </div>
          ))}
        </div>
      </div>

      {err   && <div style={{ fontSize:11, color:'#e08080', fontStyle:'italic', marginBottom:8 }}>✕ {err}</div>}
      {saved && <div style={{ fontSize:11, color:'#4a9a5a', fontStyle:'italic', marginBottom:8 }}>✓ {saved}</div>}

      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button className="btn-primary" style={{ fontSize:11 }} onClick={handleGive} disabled={busy}>
          {busy ? 'Buchen...' : bulk ? `Coins an ${selAll.length} User` : 'Coins buchen'}
        </button>
      </div>
    </Card>
  )
}

function RecentTx({ transactions, config, t, formatCoins }) {
  const recent = transactions.slice(0, 40)
  function formatDate(ts) {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})
  }
  return (
    <Card t={t}>
      <STitle t={t}>📋 Letzte Transaktionen</STitle>
      <div style={{ maxHeight:300, overflowY:'auto' }}>
        {recent.length === 0
          ? <div style={{ textAlign:'center', padding:'1.5rem', color:t.textMuted, fontStyle:'italic', fontSize:12 }}>Keine Transaktionen.</div>
          : recent.map(tx => {
              const type = COIN_TYPES[tx.type]
              const sign = tx.type==='RESET' ? 0 : type?.sign ?? 1
              return (
                <div key={tx.id} style={{ display:'grid', gridTemplateColumns:'22px 1fr auto auto', gap:8, padding:'0.4rem 0.2rem', borderBottom:`1px solid ${t.accentFade}`, alignItems:'center' }}>
                  <span style={{ fontSize:13 }}>{type?.icon||'•'}</span>
                  <div>
                    <span style={{ fontSize:11, color:t.accentSoft, fontFamily:'Cinzel,serif' }}>{tx.username}</span>
                    {tx.reason && <span style={{ fontSize:10, color:t.textMuted, fontStyle:'italic', marginLeft:6 }}>{tx.reason}</span>}
                  </div>
                  <div style={{ fontFamily:'Cinzel,serif', fontSize:12, color:sign>=0?'#4a9a5a':'#c04040', fontWeight:600, whiteSpace:'nowrap' }}>
                    {tx.type==='RESET' ? 'Reset' : `${sign>=0?'+':'-'}${formatCoins(tx.amount)}`}
                  </div>
                  <div style={{ fontSize:9, color:t.textMuted, whiteSpace:'nowrap' }}>{formatDate(tx.createdAt)}</div>
                </div>
              )
            })
        }
      </div>
    </Card>
  )
}

export default function Economy() {
  const t = useTheme()
  const { users } = useUsers()
  const { transactions, config, loading, giveCoins, bulkGive, saveConfig, formatCoins, getChipRate } = useEconomy()
  const chipRate = getChipRate()

  async function handleGive(opts) {
    if (opts.type === 'BULK') await bulkGive(opts)
    else await giveCoins({ ...opts, type: opts.type || 'MANUAL' })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div className="section-title">Wirtschaft & Währung</div>
        {chipRate.isEvent && (
          <span style={{ fontSize:11, color:t.accent, fontFamily:'Cinzel,serif', background:`${t.accent}18`, padding:'2px 10px', borderRadius:2 }}>
            🎉 Event-Rate: 1 {config.currencyIcon} = {chipRate.rate} {config.chipIcon}
          </span>
        )}
      </div>
      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:t.accentDim, fontStyle:'italic' }}>Lade...</div>
      ) : (
        <>
          <CurrencyConfig config={config} t={t} onSave={saveConfig} />
          <CoinGiver users={users} config={config} t={t} onGive={handleGive} />
          <RecentTx transactions={transactions} config={config} t={t} formatCoins={formatCoins} />
        </>
      )}
    </div>
  )
}
