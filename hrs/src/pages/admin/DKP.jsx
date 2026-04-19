import { useState } from 'react'
import { useDKP, DKP_TYPES } from '../../hooks/useDKP'
import { useUsers } from '../../hooks/useUsers'
import { useEvents } from '../../hooks/useEvents'
import Modal from '../../components/Modal'

const CLASS_COLORS = {
  'Death Knight': '#C41E3A', 'Druid': '#FF7C0A', 'Hunter': '#AAD372',
  'Mage': '#3FC7EB', 'Paladin': '#F48CBA', 'Priest': '#DDDDDD',
  'Rogue': '#FFF468', 'Shaman': '#0070DD', 'Warlock': '#8788EE', 'Warrior': '#C69B3A',
}

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' }) + ' ' + d.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' })
}

function isUpcoming(event) {
  return new Date(`${event.eventDate}T${event.eventTime || '00:00'}`) >= new Date()
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id:'leaderboard', label:'Rangliste' },
  { id:'attendance',  label:'Raid-Attendance' },
  { id:'loot',        label:'Loot vergeben' },
  { id:'manual',      label:'Manuelle Anpassung' },
  { id:'log',         label:'Gesamtverlauf' },
]

export default function DKPAdmin() {
  const { transactions, loading, getAllBalances, addTransaction, addRaidAttendance, addLoot, resetUser, deleteTransaction } = useDKP()
  const { users } = useUsers()
  const { events } = useEvents()
  const [tab, setTab]     = useState('leaderboard')
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState('')
  const [saved, setSaved] = useState('')

  // Attendance-State
  const [attEvent,    setAttEvent]    = useState('')
  const [attAmount,   setAttAmount]   = useState(10)
  const [attReason,   setAttReason]   = useState('')
  const [attSelected, setAttSelected] = useState([]) // userIds

  // Loot-State
  const [lootUser,   setLootUser]   = useState('')
  const [lootAmount, setLootAmount] = useState(10)
  const [lootItem,   setLootItem]   = useState('')
  const [lootEvent,  setLootEvent]  = useState('')

  // Manuelle Anpassung
  const [manUser,   setManUser]   = useState('')
  const [manType,   setManType]   = useState('BONUS')
  const [manAmount, setManAmount] = useState(5)
  const [manReason, setManReason] = useState('')

  // Confirm-Modal
  const [confirm, setConfirm] = useState(null) // { title, text, onOk }

  const activeUsers  = users.filter(u => u.active)
  const balances     = getAllBalances(users)
  const pastEvents   = events.filter(e => !isUpcoming(e)).slice(0, 20)
  const upcomingEvts = events.filter(isUpcoming).slice(0, 5)
  const allEvents    = [...upcomingEvts, ...pastEvents]

  function flash(msg) { setSaved(msg); setTimeout(() => setSaved(''), 2500) }

  // ── Attendance ──────────────────────────────────────────────────────────────
  async function handleAttendance() {
    if (attSelected.length === 0) { setErr('Keine Spieler ausgewählt.'); return }
    if (!attAmount || attAmount <= 0) { setErr('Betrag muss größer als 0 sein.'); return }
    setBusy(true); setErr('')
    try {
      const selectedEvent = allEvents.find(e => e.id === attEvent)
      await addRaidAttendance({
        userIds: attSelected, users: activeUsers,
        amount: attAmount,
        eventId:    selectedEvent?.id    || null,
        eventTitle: selectedEvent?.title || null,
        reason: attReason || selectedEvent?.title || 'Raid-Teilnahme',
      })
      setAttSelected([])
      flash(`+${attAmount} DKP an ${attSelected.length} Spieler vergeben`)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  function toggleAttUser(id) {
    setAttSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function selectAllAtt() {
    setAttSelected(attSelected.length === activeUsers.length ? [] : activeUsers.map(u => u.id))
  }

  // ── Loot ───────────────────────────────────────────────────────────────────
  async function handleLoot() {
    if (!lootUser)  { setErr('Spieler auswählen.'); return }
    if (!lootAmount || lootAmount <= 0) { setErr('Betrag muss größer als 0 sein.'); return }
    setBusy(true); setErr('')
    try {
      const user = activeUsers.find(u => u.id === lootUser)
      const evt  = allEvents.find(e => e.id === lootEvent)
      await addLoot({
        userId: lootUser, username: user?.name || '?',
        amount: lootAmount, item: lootItem,
        eventId: evt?.id || null, eventTitle: evt?.title || null,
      })
      setLootItem(''); setLootUser(''); setLootEvent('')
      flash(`-${lootAmount} DKP für ${user?.name} (${lootItem || 'Loot'})`)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  // ── Manuell ─────────────────────────────────────────────────────────────────
  async function handleManual() {
    if (!manUser)   { setErr('Spieler auswählen.'); return }
    if (!manAmount || manAmount <= 0) { setErr('Betrag muss größer als 0 sein.'); return }
    setBusy(true); setErr('')
    try {
      const user = activeUsers.find(u => u.id === manUser)
      await addTransaction({ userId: manUser, username: user?.name || '?', type: manType, amount: manAmount, reason: manReason })
      setManReason(''); setManUser('')
      const type = DKP_TYPES[manType]
      flash(`${type?.sign >= 0 ? '+' : '-'}${manAmount} DKP (${type?.label}) für ${user?.name}`)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  const ranked = activeUsers.map(u => ({ ...u, balance: balances[u.id] ?? 0 })).sort((a, b) => b.balance - a.balance)

  return (
    <div>
      <div className="section-title">DKP-Verwaltung</div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, borderBottom:'1px solid #2e2210', marginBottom:'1.2rem' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setErr('') }} style={{
            background:'transparent', border:'none',
            borderBottom: tab === t.id ? '2px solid #c8a84b' : '2px solid transparent',
            color: tab === t.id ? '#f0d080' : '#5a4828',
            fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2,
            textTransform:'uppercase', padding:'6px 14px', cursor:'pointer',
            transition:'all .15s', marginBottom:-1,
          }}>{t.label}</button>
        ))}
      </div>

      {saved && <div style={{ fontSize:12, color:'#4a9a5a', fontStyle:'italic', marginBottom:'0.8rem' }}>✓ {saved}</div>}
      {err   && <div style={{ fontSize:12, color:'#e08080', fontStyle:'italic', marginBottom:'0.8rem' }}>✕ {err}</div>}

      {/* ── Rangliste ── */}
      {tab === 'leaderboard' && (
        <div>
          {ranked.map((u, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null
            const userTx = transactions.filter(t => t.userId === u.id)
            return (
              <div key={u.id} style={{ display:'grid', gridTemplateColumns:'28px 1fr auto auto', alignItems:'center', gap:12, padding:'0.65rem 0.8rem', borderBottom:'1px solid #1a1208' }}>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:12, color: medal ? '#c8a84b' : '#3a2c18', textAlign:'center' }}>{medal || `${idx+1}`}</div>
                <div>
                  <span style={{ fontSize:13, color: CLASS_COLORS[u.cls] || '#c8a84b', fontFamily:'Cinzel,serif', fontWeight:600 }}>{u.name}</span>
                  <span style={{ fontSize:10, color:'#3a2c18', marginLeft:8 }}>{u.rank}</span>
                  <div style={{ fontSize:10, color:'#2e2210', marginTop:1 }}>{userTx.length} Transaktionen · {userTx.filter(t => t.type==='RAID_ATTENDANCE').length} Raids</div>
                </div>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:15, color: u.balance >= 0 ? '#c8a84b' : '#c04040', fontWeight:600 }}>
                  {u.balance > 0 ? '+' : ''}{u.balance} <span style={{ fontSize:9, color:'#3a2c18' }}>DKP</span>
                </div>
                <button className="btn-ghost" style={{ fontSize:9 }} onClick={() => setConfirm({
                  title: `DKP Reset — ${u.name}`,
                  text: `Setzt den DKP-Stand von ${u.name} auf 0. Alle bisherigen Transaktionen bleiben im Verlauf erhalten.`,
                  onOk: async () => { await resetUser(u.id, u.name); flash(`DKP von ${u.name} zurückgesetzt`) }
                })}>Reset</button>
              </div>
            )
          })}
          {ranked.length === 0 && <div style={{ textAlign:'center', padding:'2rem', color:'#3a2c18', fontStyle:'italic' }}>Noch keine Spieler.</div>}
        </div>
      )}

      {/* ── Raid-Attendance ── */}
      {tab === 'attendance' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase', marginBottom:5 }}>Event (optional)</div>
              <select value={attEvent} onChange={e => setAttEvent(e.target.value)} style={{ fontSize:12, width:'100%' }}>
                <option value="">— Kein Event —</option>
                {allEvents.map(e => <option key={e.id} value={e.id}>{e.title} ({e.eventDate})</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase', marginBottom:5 }}>DKP pro Spieler</div>
              <input type="number" min={1} max={999} value={attAmount} onChange={e => setAttAmount(Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
            </div>
          </div>
          <div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase', marginBottom:5 }}>Grund (optional)</div>
            <input value={attReason} onChange={e => setAttReason(e.target.value)} placeholder="z.B. Kara Clear · Pünktlichkeitsbonus" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
          </div>

          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase' }}>
                Anwesende Spieler ({attSelected.length}/{activeUsers.length} ausgewählt)
              </div>
              <button className="btn-ghost" style={{ fontSize:9 }} onClick={selectAllAtt}>
                {attSelected.length === activeUsers.length ? 'Alle abwählen' : 'Alle auswählen'}
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:4, maxHeight:260, overflowY:'auto' }}>
              {activeUsers.map(u => {
                const sel = attSelected.includes(u.id)
                return (
                  <div key={u.id} onClick={() => toggleAttUser(u.id)} style={{
                    display:'flex', alignItems:'center', gap:8, padding:'6px 10px',
                    borderRadius:3, cursor:'pointer',
                    background: sel ? 'rgba(200,168,75,.08)' : '#0d0a04',
                    border: `1px solid ${sel ? '#3a2c18' : '#1e1808'}`,
                    transition:'all .15s',
                  }}>
                    <div style={{ width:14, height:14, borderRadius:2, flexShrink:0, background: sel ? '#c8a84b' : 'transparent', border:`1px solid ${sel ? '#c8a84b' : '#3a2c18'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {sel && <span style={{ color:'#0d0a04', fontSize:9, fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:12, color: CLASS_COLORS[u.cls] || '#c8a84b', fontFamily:'Cinzel,serif' }}>{u.name}</span>
                    <span style={{ fontSize:10, color:'#3a2c18', marginLeft:'auto' }}>{balances[u.id] ?? 0} DKP</span>
                  </div>
                )
              })}
            </div>
          </div>

          <button className="btn-primary" style={{ fontSize:12, alignSelf:'flex-end' }} onClick={handleAttendance} disabled={busy || attSelected.length === 0}>
            {busy ? 'Speichern...' : `+${attAmount} DKP an ${attSelected.length} Spieler`}
          </button>
        </div>
      )}

      {/* ── Loot ── */}
      {tab === 'loot' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:480 }}>
          <div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase', marginBottom:5 }}>Spieler</div>
            <select value={lootUser} onChange={e => setLootUser(e.target.value)} style={{ fontSize:12, width:'100%' }}>
              <option value="">— Spieler wählen —</option>
              {activeUsers.sort((a,b) => (balances[b.id]??0)-(balances[a.id]??0)).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({balances[u.id] ?? 0} DKP)</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase', marginBottom:5 }}>Item / Loot-Beschreibung</div>
            <input value={lootItem} onChange={e => setLootItem(e.target.value)} placeholder="z.B. Netherblade, Shattered Hand Epaulets" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase', marginBottom:5 }}>DKP-Kosten</div>
              <input type="number" min={1} max={9999} value={lootAmount} onChange={e => setLootAmount(Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
            </div>
            <div>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase', marginBottom:5 }}>Event (optional)</div>
              <select value={lootEvent} onChange={e => setLootEvent(e.target.value)} style={{ fontSize:12, width:'100%' }}>
                <option value="">— Kein Event —</option>
                {allEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
          </div>
          {lootUser && (
            <div style={{ background:'rgba(192,57,43,.08)', border:'1px solid #3a1a1a', borderRadius:3, padding:'0.7rem', fontSize:12, color:'#e08080' }}>
              {activeUsers.find(u=>u.id===lootUser)?.name} hat aktuell <strong>{balances[lootUser] ?? 0} DKP</strong> → nach Loot: <strong>{(balances[lootUser] ?? 0) - lootAmount} DKP</strong>
            </div>
          )}
          <button className="btn-primary" style={{ fontSize:12, alignSelf:'flex-end' }} onClick={handleLoot} disabled={busy || !lootUser}>
            {busy ? 'Speichern...' : `Loot eintragen (−${lootAmount} DKP)`}
          </button>
        </div>
      )}

      {/* ── Manuelle Anpassung ── */}
      {tab === 'manual' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:480 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase', marginBottom:5 }}>Spieler</div>
              <select value={manUser} onChange={e => setManUser(e.target.value)} style={{ fontSize:12, width:'100%' }}>
                <option value="">— Spieler wählen —</option>
                {activeUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({balances[u.id] ?? 0} DKP)</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase', marginBottom:5 }}>Typ</div>
              <select value={manType} onChange={e => setManType(e.target.value)} style={{ fontSize:12, width:'100%' }}>
                {['BONUS','PENALTY','MANUAL'].map(t => (
                  <option key={t} value={t}>{DKP_TYPES[t].icon} {DKP_TYPES[t].label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase', marginBottom:5 }}>Betrag (DKP)</div>
            <input type="number" min={1} max={9999} value={manAmount} onChange={e => setManAmount(Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
          </div>
          <div>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase', marginBottom:5 }}>Grund (Pflicht)</div>
            <input value={manReason} onChange={e => setManReason(e.target.value)} placeholder="z.B. Gildenbank-Spende · Fehlzeiten" style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
          </div>
          <button className="btn-primary" style={{ fontSize:12, alignSelf:'flex-end' }} onClick={handleManual} disabled={busy || !manUser || !manReason}>
            {busy ? 'Speichern...' : `${DKP_TYPES[manType]?.sign >= 0 ? '+' : '-'}${manAmount} DKP eintragen`}
          </button>
        </div>
      )}

      {/* ── Gesamtverlauf ── */}
      {tab === 'log' && (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr>
                {['','Spieler','Typ','Betrag','Grund','Event','Datum',''].map((h,i) => (
                  <th key={i} style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'#3a2c18', textTransform:'uppercase', padding:'.5rem .6rem', borderBottom:'1px solid #2e2210', textAlign:'left', fontWeight:400, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ textAlign:'center', padding:'2rem', color:'#5a4828', fontStyle:'italic' }}>Lade...</td></tr>}
              {!loading && transactions.length === 0 && <tr><td colSpan={8} style={{ textAlign:'center', padding:'2rem', color:'#3a2c18', fontStyle:'italic' }}>Noch keine Transaktionen.</td></tr>}
              {transactions.map(t => {
                const type = DKP_TYPES[t.type]
                const sign = t.type === 'RESET' ? 0 : type?.sign ?? 1
                return (
                  <tr key={t.id} style={{ borderBottom:'1px solid #1a1208' }}>
                    <td style={{ padding:'.45rem .6rem', fontSize:16 }}>{type?.icon || '•'}</td>
                    <td style={{ padding:'.45rem .6rem', color: CLASS_COLORS[users.find(u=>u.id===t.userId)?.cls] || '#c8a84b', fontFamily:'Cinzel,serif', fontSize:11 }}>{t.username}</td>
                    <td style={{ padding:'.45rem .6rem', color: type?.color || '#5a4828', fontSize:10, fontFamily:'Cinzel,serif', letterSpacing:1 }}>{type?.label || t.type}</td>
                    <td style={{ padding:'.45rem .6rem', fontFamily:'Cinzel,serif', fontSize:12, color: t.type==='RESET' ? '#5a4828' : sign>=0 ? '#4a9a5a' : '#c04040', fontWeight:600 }}>
                      {t.type==='RESET' ? 'Reset' : `${sign>=0?'+':'-'}${t.amount}`}
                    </td>
                    <td style={{ padding:'.45rem .6rem', color:'#5a4828', fontStyle:'italic', maxWidth:160 }}>{t.reason || '—'}</td>
                    <td style={{ padding:'.45rem .6rem', color:'#3a2c18', fontSize:10 }}>{t.eventTitle || '—'}</td>
                    <td style={{ padding:'.45rem .6rem', color:'#2e2210', fontSize:10, whiteSpace:'nowrap' }}>{formatDate(t.createdAt)}</td>
                    <td style={{ padding:'.45rem .6rem' }}>
                      <button className="btn-icon danger" title="Löschen" onClick={() => setConfirm({
                        title: 'Transaktion löschen',
                        text: `Transaktion von ${t.username} (${type?.label}) wirklich löschen? Dies kann nicht rückgängig gemacht werden.`,
                        onOk: async () => { await deleteTransaction(t.id); flash('Transaktion gelöscht') }
                      })}>✕</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm-Modal */}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)} onOk={async () => { await confirm.onOk(); setConfirm(null) }} okLabel="Bestätigen">
          <p style={{ fontSize:13, color:'#7a6030' }}>{confirm.text}</p>
        </Modal>
      )}
    </div>
  )
}
