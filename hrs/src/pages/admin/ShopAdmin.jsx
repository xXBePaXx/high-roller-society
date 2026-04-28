import { useState } from 'react'
import { useShop, SHOP_CATEGORIES } from '../../hooks/useShop'
import { useEconomy, coinsToCopper, copperToCoins } from '../../hooks/useEconomy'
import { useOrders, ORDER_STATUS, DELIVERY_TYPES } from '../../hooks/useOrders'
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

const EMPTY_FORM = { name:'', description:'', gold:0, silver:0, copper:0, category:'special', icon:'📦', stock:-1, active:true, deliveryType:'ingame' }

// ── Item-Formular ─────────────────────────────────────────────────────────────
function ItemForm({ t, config, initial, onSave, onCancel, busy }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const upd = (k,v) => setForm(p => ({...p,[k]:v}))
  const totalCopper = coinsToCopper(form.gold||0, form.silver||0, form.copper||0, config)

  return (
    <div style={{ background:t.bgDark, border:`1px solid ${t.accentFade}`, borderRadius:3, padding:'1rem', display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'grid', gridTemplateColumns:'60px 1fr 1fr', gap:8 }}>
        <div><Lbl t={t}>Icon</Lbl><input value={form.icon} onChange={e=>upd('icon',e.target.value)} style={{ fontSize:20, width:'100%', textAlign:'center', boxSizing:'border-box' }} maxLength={2} /></div>
        <div><Lbl t={t}>Name</Lbl><input value={form.name} onChange={e=>upd('name',e.target.value)} placeholder="z.B. Flask of Supreme Power" style={{ fontSize:13, width:'100%', boxSizing:'border-box' }} /></div>
        <div><Lbl t={t}>Kategorie</Lbl>
          <select value={form.category} onChange={e=>upd('category',e.target.value)} style={{ fontSize:12, width:'100%' }}>
            {SHOP_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>
      </div>

      <div><Lbl t={t}>Beschreibung</Lbl>
        <textarea value={form.description} onChange={e=>upd('description',e.target.value)} placeholder="Was bekommt der Käufer?" style={{ fontSize:12, width:'100%', boxSizing:'border-box', minHeight:60 }} />
      </div>

      {/* Lieferart */}
      <div>
        <Lbl t={t}>Lieferart</Lbl>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:6 }}>
          {DELIVERY_TYPES.map(d => (
            <label key={d.id} onClick={() => upd('deliveryType', d.id)}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:3, cursor:'pointer', background:form.deliveryType===d.id?`${t.accent}10`:'transparent', border:`1px solid ${form.deliveryType===d.id?t.accent:t.accentFade}`, transition:'all .15s' }}>
              <div style={{ width:12, height:12, borderRadius:'50%', border:`2px solid ${form.deliveryType===d.id?t.accent:t.accentFade}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {form.deliveryType===d.id && <div style={{ width:5, height:5, borderRadius:'50%', background:t.accent }} />}
              </div>
              <span style={{ fontSize:14 }}>{d.icon}</span>
              <div>
                <div style={{ fontSize:11, color:form.deliveryType===d.id?t.accentSoft:t.textSecondary, fontFamily:'Cinzel,serif' }}>{d.label}</div>
                <div style={{ fontSize:9, color:t.textMuted, fontStyle:'italic' }}>{d.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8 }}>
        {[
          [form.gold,   v=>upd('gold',v),   config.currencyIcon||'🪙', config.currencyName||'Gold'],
          [form.silver, v=>upd('silver',v), config.silverIcon||'🥈',   config.silverName||'Silber'],
          [form.copper, v=>upd('copper',v), config.copperIcon||'🟤',   config.copperName||'Kupfer'],
        ].map(([val, setter, icon, label], i) => (
          <div key={i}>
            <div style={{ fontSize:9, color:t.textMuted, marginBottom:3 }}>{icon} {label}</div>
            <input type="number" min={0} value={val} onChange={e=>setter(Math.max(0,Number(e.target.value)))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
          </div>
        ))}
        <div>
          <div style={{ fontSize:9, color:t.textMuted, marginBottom:3 }}>📦 Lager (-1 = ∞)</div>
          <input type="number" min={-1} value={form.stock} onChange={e=>upd('stock',Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
        </div>
      </div>

      {totalCopper > 0 && (
        <div style={{ fontSize:11, color:t.textMuted, fontStyle:'italic' }}>
          Preis: {config.currencyIcon} {form.gold} · {config.silverIcon} {form.silver} · {config.copperIcon} {form.copper}
        </div>
      )}

      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button className="btn-ghost" style={{ fontSize:10 }} onClick={onCancel}>Abbrechen</button>
        <button className="btn-primary" style={{ fontSize:11 }} onClick={() => onSave({ ...form, price: totalCopper })} disabled={busy || !form.name.trim() || totalCopper === 0}>
          {busy ? '...' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}

// ── Bestellkarte (Admin) ──────────────────────────────────────────────────────
function AdminOrderCard({ order, t, formatCoins, onDeliver, onConfirmCancel }) {
  const [adminNote, setAdminNote] = useState(order.adminNote || '')
  const [busy, setBusy]           = useState(false)
  const [open, setOpen]           = useState(false)
  const status   = ORDER_STATUS[order.status] || ORDER_STATUS.pending
  const delivery = DELIVERY_TYPES.find(d => d.id === order.deliveryType)
  const isUrgent = order.status === 'cancel_requested'

  function formatDate(ts) {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'2-digit'}) + ' ' + d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})
  }

  async function handleDeliver() {
    setBusy(true)
    await onDeliver(order.id, adminNote)
    setBusy(false)
  }

  return (
    <div style={{ border:`1px solid ${isUrgent?'#e8783050':status.color+'30'}`, borderLeft:`3px solid ${isUrgent?'#e87830':status.color}`, borderRadius:3, background:t.bgDark, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0.8rem 1rem', cursor:'pointer' }} onClick={() => setOpen(v=>!v)}>
        <span style={{ fontSize:22, flexShrink:0 }}>{order.itemIcon || '📦'}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontFamily:'Cinzel,serif', fontSize:12, color:t.accentSoft, fontWeight:600 }}>{order.itemName}</span>
            <span style={{ fontSize:9, color:status.color, background:`${status.color}15`, padding:'1px 6px', borderRadius:2 }}>{status.icon} {status.label}</span>
            {isUrgent && <span style={{ fontSize:9, color:'#e87830', fontWeight:700 }}>⚠️ Stornierung!</span>}
          </div>
          <div style={{ fontSize:10, color:t.textSecondary, marginTop:2 }}>
            <span style={{ color:t.accentDim, fontFamily:'Cinzel,serif' }}>{order.username}</span>
            <span style={{ color:t.textMuted, marginLeft:6 }}>·</span>
            <span style={{ color:t.accent, fontFamily:'Cinzel,serif', marginLeft:6 }}>{formatCoins(order.price)}</span>
            {delivery && <span style={{ color:t.textMuted, marginLeft:6 }}>{delivery.icon} {delivery.label}</span>}
            <span style={{ color:t.textMuted, marginLeft:6 }}>{formatDate(order.createdAt)}</span>
          </div>
        </div>
        <span style={{ color:t.accentFade, fontSize:10, flexShrink:0 }}>{open?'▲':'▼'}</span>
      </div>

      {open && (
        <div style={{ borderTop:`1px solid ${t.accentFade}`, padding:'0.8rem 1rem', display:'flex', flexDirection:'column', gap:8 }}>
          {order.note && (
            <div style={{ fontSize:12, color:t.textSecondary, padding:'8px 10px', background:`${t.accent}06`, borderRadius:2, fontStyle:'italic' }}>
              💬 User-Notiz: {order.note}
            </div>
          )}

          {order.status === 'pending' && (
            <>
              <div>
                <Lbl t={t}>Admin-Notiz an den User (optional)</Lbl>
                <input value={adminNote} onChange={e=>setAdminNote(e.target.value)} placeholder="z.B. Item wurde gesendet, kommt morgen an..." style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
              </div>
              <button className="btn-primary" style={{ fontSize:11, background:`linear-gradient(135deg,#4a9a5a30,${t.bgDark})`, borderColor:'#4a9a5a', color:'#4a9a5a' }} onClick={handleDeliver} disabled={busy}>
                {busy ? '...' : '✅ Als ausgegeben markieren'}
              </button>
            </>
          )}

          {order.status === 'cancel_requested' && (
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn-ghost" style={{ flex:1, fontSize:11, color:'#c04040', borderColor:'#c04040' }} onClick={() => onConfirmCancel(order.id)} disabled={busy}>
                ❌ Stornierung genehmigen
              </button>
              <button className="btn-primary" style={{ flex:1, fontSize:11 }} onClick={handleDeliver} disabled={busy}>
                ✅ Doch ausgegeben
              </button>
            </div>
          )}

          {order.status === 'delivered' && order.deliveredAt && (
            <div style={{ fontSize:11, color:'#4a9a5a', fontStyle:'italic' }}>Ausgegeben: {formatDate(order.deliveredAt)}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────
export default function ShopAdmin() {
  const t = useTheme()
  const { items, loading: shopLoading, addItem, updateItem, deleteItem, toggleActive } = useShop()
  const { config, formatCoins } = useEconomy()
  const { orders, loading: ordersLoading, pendingCount, markDelivered, confirmCancel } = useOrders()

  const [view,    setView]    = useState('orders') // 'orders' | 'items'
  const [adding,  setAdding]  = useState(false)
  const [editing, setEditing] = useState(null)
  const [busy,    setBusy]    = useState(false)
  const [filter,  setFilter]  = useState('ALL')
  const [orderFilter, setOrderFilter] = useState('pending')

  async function handleAdd(form) { setBusy(true); await addItem(form); setBusy(false); setAdding(false) }
  async function handleEdit(form) { setBusy(true); await updateItem(editing.id, form); setBusy(false); setEditing(null) }

  const filteredItems = filter === 'ALL' ? items : items.filter(i => i.category === filter)
  const filteredOrders = orderFilter === 'ALL'
    ? orders
    : orderFilter === 'pending'
      ? orders.filter(o => o.status === 'pending' || o.status === 'cancel_requested')
      : orders.filter(o => o.status === orderFilter)

  const tabStyle = (id) => ({
    fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:2, textTransform:'uppercase',
    padding:'8px 16px', cursor:'pointer', transition:'all .15s', border:'none',
    background: view===id?`${t.accent}18`:'transparent',
    borderBottom: view===id?`2px solid ${t.accent}`:'2px solid transparent',
    color: view===id?t.accentSoft:t.accentDim, position:'relative',
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>
      <div className="section-title">Gilden-Shop</div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${t.accentFade}` }}>
        <button onClick={() => setView('orders')} style={{ ...tabStyle('orders') }}>
          📦 Bestellungen
          {pendingCount > 0 && <span style={{ marginLeft:6, background:t.accent, color:t.bgDark, fontSize:9, fontWeight:700, borderRadius:10, padding:'1px 6px' }}>{pendingCount}</span>}
        </button>
        <button onClick={() => setView('items')} style={tabStyle('items')}>🛒 Artikel verwalten</button>
      </div>

      {/* ── Bestellungen ── */}
      {view === 'orders' && (
        <>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {[
              ['pending', '🟡 Offen'],
              ['cancel_requested', '🔄 Stornierungen'],
              ['delivered', '✅ Ausgegeben'],
              ['cancelled', '❌ Storniert'],
              ['ALL', '📋 Alle'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => setOrderFilter(id)} style={{ background:orderFilter===id?`${t.accent}18`:'transparent', border:orderFilter===id?`1px solid ${t.accent}`:`1px solid ${t.accentFade}`, color:orderFilter===id?t.accentSoft:t.accentDim, borderRadius:2, fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:1, padding:'4px 10px', cursor:'pointer' }}>{label}</button>
            ))}
          </div>

          {ordersLoading ? (
            <div style={{ textAlign:'center', padding:'3rem', color:t.accentDim, fontStyle:'italic' }}>Lade...</div>
          ) : filteredOrders.length === 0 ? (
            <Card t={t}><div style={{ textAlign:'center', padding:'2rem', color:t.textMuted, fontStyle:'italic' }}>Keine Bestellungen in dieser Kategorie.</div></Card>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {filteredOrders.map(order => (
                <AdminOrderCard key={order.id} order={order} t={t} formatCoins={formatCoins}
                  onDeliver={markDelivered} onConfirmCancel={confirmCancel} />
              ))}
            </div>
          )}
          <div style={{ fontSize:11, color:t.textMuted, fontStyle:'italic' }}>{orders.length} Bestellungen gesamt</div>
        </>
      )}

      {/* ── Artikel verwalten ── */}
      {view === 'items' && (
        <>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            {[{id:'ALL',label:'Alle',icon:'📋'}, ...SHOP_CATEGORIES].map(c => (
              <button key={c.id} onClick={() => setFilter(c.id)} style={{ background:filter===c.id?`${t.accent}18`:'transparent', border:filter===c.id?`1px solid ${t.accent}`:`1px solid ${t.accentFade}`, color:filter===c.id?t.accentSoft:t.accentDim, borderRadius:2, fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:1, padding:'4px 10px', cursor:'pointer' }}>{c.icon} {c.label}</button>
            ))}
            <button className="btn-ghost" style={{ fontSize:10, marginLeft:'auto' }} onClick={() => { setAdding(true); setEditing(null) }}>+ Artikel hinzufügen</button>
          </div>

          {adding && <ItemForm t={t} config={config} onSave={handleAdd} onCancel={() => setAdding(false)} busy={busy} />}

          {shopLoading ? (
            <div style={{ textAlign:'center', padding:'3rem', color:t.accentDim, fontStyle:'italic' }}>Lade...</div>
          ) : filteredItems.length === 0 ? (
            <Card t={t}><div style={{ textAlign:'center', padding:'2rem', color:t.textMuted, fontStyle:'italic' }}>Noch keine Artikel. Füge deinen ersten hinzu!</div></Card>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {filteredItems.map(item => {
                const cat      = SHOP_CATEGORIES.find(c => c.id === item.category)
                const delivery = DELIVERY_TYPES.find(d => d.id === (item.deliveryType || 'ingame'))
                return (
                  <div key={item.id}>
                    {editing?.id === item.id ? (
                      <ItemForm t={t} config={config}
                        initial={{ ...item, ...copperToCoins(item.price, config) }}
                        onSave={handleEdit} onCancel={() => setEditing(null)} busy={busy} />
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'0.8rem 1rem', background:item.active?t.cardBg:t.bgDark, border:`1px solid ${item.active?t.accentFade:'#3a2a2a'}`, borderRadius:3, opacity:item.active?1:0.6 }}>
                        <span style={{ fontSize:24, flexShrink:0 }}>{item.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                            <span style={{ fontFamily:'Cinzel,serif', fontSize:13, color:t.accentSoft, fontWeight:600 }}>{item.name}</span>
                            <span style={{ fontSize:9, color:t.textMuted, background:`${t.accent}10`, padding:'1px 6px', borderRadius:2 }}>{cat?.icon} {cat?.label}</span>
                            <span style={{ fontSize:9, color:t.textMuted, background:`${t.accent}08`, padding:'1px 6px', borderRadius:2 }}>{delivery?.icon} {delivery?.label}</span>
                            {!item.active && <span style={{ fontSize:9, color:'#c04040', fontStyle:'italic' }}>Inaktiv</span>}
                          </div>
                          {item.description && <div style={{ fontSize:11, color:t.textSecondary, marginTop:2, fontStyle:'italic' }}>{item.description}</div>}
                          <div style={{ fontSize:11, color:t.accent, fontFamily:'Cinzel,serif', marginTop:3 }}>
                            {formatCoins(item.price)}
                            <span style={{ color:t.textMuted, marginLeft:8, fontFamily:'inherit', fontSize:10 }}>{item.stock===-1?'∞ Lager':`${item.stock}x lagernd`}</span>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                          <button className="btn-icon" onClick={() => setEditing(item)}>✏️</button>
                          <button className="btn-icon" onClick={() => toggleActive(item.id, item.active)}>{item.active?'⏸':'▶'}</button>
                          <button className="btn-icon danger" onClick={async()=>{if(window.confirm(`"${item.name}" löschen?`))await deleteItem(item.id)}}>✕</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ fontSize:11, color:t.textMuted, fontStyle:'italic' }}>{items.length} Artikel gesamt · {items.filter(i=>i.active).length} aktiv</div>
        </>
      )}
    </div>
  )
}
