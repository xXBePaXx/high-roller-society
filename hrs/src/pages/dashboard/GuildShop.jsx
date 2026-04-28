import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { useShop, SHOP_CATEGORIES } from '../../hooks/useShop'
import { useEconomy } from '../../hooks/useEconomy'
import { useOrders, ORDER_STATUS, DELIVERY_TYPES } from '../../hooks/useOrders'

function Card({ children, t, style={} }) {
  return <div style={{ background:t.cardBg, border:`1px solid ${t.accentFade}`, borderRadius:4, padding:'1.2rem 1.4rem', ...style }}>{children}</div>
}

// ── Kaufdialog ────────────────────────────────────────────────────────────────
function BuyDialog({ item, t, onConfirm, onCancel, busy, formatCoins, config }) {
  const deliveryOptions = DELIVERY_TYPES.filter(d =>
    item.deliveryType === 'both' ? true : d.id === item.deliveryType
  )
  const [selectedDelivery, setSelectedDelivery] = useState(deliveryOptions[0]?.id || 'ingame')
  const [note, setNote] = useState('')

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:'1rem' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ background:'#1a1208', border:`1px solid ${t.accentFade}`, borderRadius:4, width:'100%', maxWidth:440, position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'60%', height:2, background:`linear-gradient(90deg,transparent,${t.accent},transparent)` }} />

        <div style={{ padding:'1.4rem' }}>
          {/* Item-Info */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1.2rem' }}>
            <span style={{ fontSize:36 }}>{item.icon}</span>
            <div>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:16, color:t.accentSoft, fontWeight:600 }}>{item.name}</div>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:14, color:t.accent, marginTop:3 }}>{formatCoins(item.price)}</div>
            </div>
          </div>

          {/* Lieferart wählen */}
          {deliveryOptions.length > 1 && (
            <div style={{ marginBottom:'1rem' }}>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:t.textMuted, textTransform:'uppercase', marginBottom:8 }}>Lieferart</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {deliveryOptions.map(d => (
                  <label key={d.id} onClick={() => setSelectedDelivery(d.id)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:3, cursor:'pointer', background:selectedDelivery===d.id?`${t.accent}10`:'transparent', border:`1px solid ${selectedDelivery===d.id?t.accent:t.accentFade}`, transition:'all .15s' }}>
                    <div style={{ width:14, height:14, borderRadius:'50%', border:`2px solid ${selectedDelivery===d.id?t.accent:t.accentFade}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {selectedDelivery===d.id && <div style={{ width:6, height:6, borderRadius:'50%', background:t.accent }} />}
                    </div>
                    <span style={{ fontSize:16 }}>{d.icon}</span>
                    <div>
                      <div style={{ fontSize:12, color:selectedDelivery===d.id?t.accentSoft:t.textSecondary, fontFamily:'Cinzel,serif' }}>{d.label}</div>
                      <div style={{ fontSize:10, color:t.textMuted, fontStyle:'italic' }}>{d.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Lieferart-Info wenn nur eine Option */}
          {deliveryOptions.length === 1 && (
            <div style={{ marginBottom:'1rem', padding:'8px 10px', background:`${t.accent}06`, border:`1px solid ${t.accentFade}`, borderRadius:3, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:18 }}>{deliveryOptions[0].icon}</span>
              <div>
                <div style={{ fontSize:12, color:t.accentSoft, fontFamily:'Cinzel,serif' }}>Lieferart: {deliveryOptions[0].label}</div>
                <div style={{ fontSize:10, color:t.textMuted, fontStyle:'italic' }}>{deliveryOptions[0].desc}</div>
              </div>
            </div>
          )}

          {/* Notizfeld */}
          <div style={{ marginBottom:'1.2rem' }}>
            <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:t.textMuted, textTransform:'uppercase', marginBottom:6 }}>
              Notiz / Frage an den Admin (optional)
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="z.B. Charaktername für Übergabe, Größe bei Postversand, Fragen..."
              maxLength={300}
              style={{ width:'100%', boxSizing:'border-box', minHeight:80, fontSize:12, lineHeight:1.5, resize:'vertical' }}
            />
            <div style={{ fontSize:10, color:t.textMuted, textAlign:'right', marginTop:3 }}>{note.length}/300</div>
          </div>

          {/* Buttons */}
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-ghost" style={{ flex:1, fontSize:11 }} onClick={onCancel} disabled={busy}>Abbrechen</button>
            <button className="btn-primary" style={{ flex:2, fontSize:11 }} onClick={() => onConfirm({ deliveryType: selectedDelivery, note })} disabled={busy}>
              {busy ? 'Kaufe...' : `${formatCoins(item.price)} bezahlen`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Bestellkarte ──────────────────────────────────────────────────────────────
function OrderCard({ order, t, formatCoins, onCancel, onRequestCancel, canSelfCancel }) {
  const [showNote,  setShowNote]  = useState(false)
  const [countdown, setCountdown] = useState(null)
  const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending
  const delivery = DELIVERY_TYPES.find(d => d.id === order.deliveryType)

  // Countdown für Sofort-Stornierung
  useEffect(() => {
    if (order.status !== 'pending') return
    const tick = () => {
      if (!order.createdAt) return
      const created = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt)
      const remaining = Math.max(0, 180 - Math.floor((Date.now() - created.getTime()) / 1000))
      setCountdown(remaining)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [order.createdAt, order.status])

  function formatDate(ts) {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' })
      + ' · ' + d.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' })
  }

  const canCancel = order.status === 'pending' || order.status === 'cancel_requested'
  const selfCancel = canSelfCancel(order)

  return (
    <div style={{ border:`1px solid ${status.color}30`, borderLeft:`3px solid ${status.color}`, borderRadius:3, background:t.bgDark, padding:'0.9rem 1rem' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
        <span style={{ fontSize:24, flexShrink:0 }}>{order.itemIcon || '📦'}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontFamily:'Cinzel,serif', fontSize:13, color:t.accentSoft, fontWeight:600 }}>{order.itemName}</span>
            <span style={{ fontSize:10, color:status.color, background:`${status.color}15`, padding:'1px 7px', borderRadius:2, fontFamily:'Cinzel,serif' }}>
              {status.icon} {status.label}
            </span>
            {delivery && <span style={{ fontSize:10, color:t.textMuted }}>{delivery.icon} {delivery.label}</span>}
          </div>
          <div style={{ fontSize:11, color:t.accent, fontFamily:'Cinzel,serif', marginTop:3 }}>{formatCoins(order.price)}</div>
          <div style={{ fontSize:10, color:t.textMuted, marginTop:3 }}>{formatDate(order.createdAt)}</div>

          {/* Notiz des Users */}
          {order.note && (
            <div style={{ fontSize:11, color:t.textSecondary, fontStyle:'italic', marginTop:6, padding:'6px 8px', background:`${t.accent}06`, borderRadius:2 }}>
              💬 {order.note}
            </div>
          )}

          {/* Admin-Notiz */}
          {order.adminNote && (
            <div style={{ fontSize:11, color:'#4a9a5a', marginTop:6, padding:'6px 8px', background:'#4a9a5a10', borderRadius:2 }}>
              ✉️ Admin: {order.adminNote}
            </div>
          )}

          {/* Lieferdatum */}
          {order.deliveredAt && (
            <div style={{ fontSize:10, color:'#4a9a5a', marginTop:4, fontStyle:'italic' }}>
              Ausgegeben: {formatDate(order.deliveredAt)}
            </div>
          )}
        </div>

        {/* Stornieren */}
        {canCancel && order.status !== 'cancel_requested' && (
          <div style={{ flexShrink:0, textAlign:'right' }}>
            {selfCancel && countdown !== null && countdown > 0 ? (
              <div>
                <button className="btn-ghost" style={{ fontSize:9, color:'#c04040', borderColor:'#c04040' }} onClick={() => onCancel(order.id)}>
                  Stornieren
                </button>
                <div style={{ fontSize:9, color:t.textMuted, marginTop:3 }}>
                  noch {Math.floor(countdown/60)}:{String(countdown%60).padStart(2,'0')}
                </div>
              </div>
            ) : (
              <button className="btn-ghost" style={{ fontSize:9, color:'#e87830', borderColor:'#e87830' }} onClick={() => onRequestCancel(order.id)}>
                Anfrage stornieren
              </button>
            )}
          </div>
        )}
        {order.status === 'cancel_requested' && (
          <div style={{ fontSize:10, color:'#e87830', fontStyle:'italic', flexShrink:0 }}>Wartet auf Admin</div>
        )}
      </div>
    </div>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────
export default function GuildShop() {
  const { currentUser } = useAuth()
  const t = useTheme()
  const { activeItems, loading: shopLoading, decreaseStock } = useShop()
  const { getBalance, purchaseItem, formatCoins, config } = useEconomy()
  const { orders, loading: ordersLoading, createOrder, cancelImmediate, requestCancel, canSelfCancel } = useOrders()

  const [view,      setView]      = useState('shop')  // 'shop' | 'orders'
  const [filter,    setFilter]    = useState('ALL')
  const [buyItem,   setBuyItem]   = useState(null)    // Item das gekauft wird
  const [busy,      setBusy]      = useState(false)
  const [message,   setMessage]   = useState(null)

  const balance   = getBalance(currentUser?.id || '')
  const myOrders  = orders.filter(o => o.userId === currentUser?.id)
  const openCount = myOrders.filter(o => o.status === 'pending' || o.status === 'cancel_requested').length

  const filtered = filter === 'ALL' ? activeItems : activeItems.filter(i => i.category === filter)
  const usedCats = [...new Set(activeItems.map(i => i.category))]

  function showMsg(type, text) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  async function handleConfirmBuy({ deliveryType, note }) {
    if (!buyItem) return
    if (balance < buyItem.price) {
      showMsg('error', 'Nicht genug Coins!')
      setBuyItem(null)
      return
    }
    setBusy(true)
    try {
      // Coins abziehen
      await purchaseItem({ userId: currentUser.id, username: currentUser.username, itemName: buyItem.name, price: buyItem.price })
      // Lager reduzieren
      if (buyItem.stock !== -1) await decreaseStock(buyItem.id, buyItem.stock)
      // Bestellung anlegen
      await createOrder({
        userId:       currentUser.id,
        username:     currentUser.username,
        itemId:       buyItem.id,
        itemName:     buyItem.name,
        itemIcon:     buyItem.icon,
        price:        buyItem.price,
        deliveryType,
        note,
      })
      showMsg('success', `✓ "${buyItem.name}" bestellt! Sieh deinen Status unter "Meine Bestellungen".`)
      setBuyItem(null)
      setView('orders')
    } catch(e) {
      showMsg('error', `Fehler: ${e.message}`)
    }
    setBusy(false)
  }

  async function handleCancel(orderId) {
    if (!window.confirm('Bestellung sofort stornieren?')) return
    await cancelImmediate(orderId)
  }

  async function handleRequestCancel(orderId) {
    if (!window.confirm('Stornierungsanfrage stellen? Der Admin muss dies genehmigen.')) return
    await requestCancel(orderId)
  }

  const tabStyle = (id) => ({
    fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:2, textTransform:'uppercase',
    padding:'8px 16px', cursor:'pointer', transition:'all .15s', border:'none',
    background: view===id ? `${t.accent}18` : 'transparent',
    borderBottom: view===id ? `2px solid ${t.accent}` : '2px solid transparent',
    color: view===id ? t.accentSoft : t.accentDim,
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>

      {/* Header */}
      <Card t={t} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.4rem' }}>
        <div>
          <h1 style={{ fontFamily:'Cinzel,serif', fontSize:20, fontWeight:600, color:t.accentSoft, margin:0, letterSpacing:1 }}>Gilden-Shop</h1>
          <div style={{ fontSize:12, color:t.textSecondary, marginTop:3 }}>Kaufe Items mit deinen {config.currencyName || 'Gilden-Talern'}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:9, color:t.textMuted, fontFamily:'Cinzel,serif', letterSpacing:2, textTransform:'uppercase', marginBottom:3 }}>Dein Guthaben</div>
          <div style={{ fontFamily:'Cinzel,serif', fontSize:20, color:balance>=0?t.accent:'#c04040', fontWeight:600 }}>{formatCoins(balance)}</div>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${t.accentFade}` }}>
        <button onClick={() => setView('shop')} style={tabStyle('shop')}>🛒 Shop</button>
        <button onClick={() => setView('orders')} style={{ ...tabStyle('orders'), position:'relative' }}>
          📦 Meine Bestellungen
          {openCount > 0 && (
            <span style={{ position:'absolute', top:4, right:4, background:t.accent, color:t.bgDark, fontSize:9, fontWeight:700, borderRadius:'50%', width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace' }}>{openCount}</span>
          )}
        </button>
      </div>

      {/* Nachricht */}
      {message && (
        <div style={{ padding:'0.8rem 1rem', borderRadius:3, border:`1px solid ${message.type==='success'?'#4a9a5a':'#c04040'}`, background:message.type==='success'?'#4a9a5a10':'#c0404010', fontSize:13, color:message.type==='success'?'#4a9a5a':'#e08080' }}>
          {message.text}
        </div>
      )}

      {/* ── Shop-Ansicht ── */}
      {view === 'shop' && (
        <>
          {usedCats.length > 1 && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[{id:'ALL',label:'Alle',icon:'📋'}, ...SHOP_CATEGORIES.filter(c=>usedCats.includes(c.id))].map(c => (
                <button key={c.id} onClick={() => setFilter(c.id)} style={{ background:filter===c.id?`${t.accent}18`:'transparent', border:filter===c.id?`1px solid ${t.accent}`:`1px solid ${t.accentFade}`, color:filter===c.id?t.accentSoft:t.accentDim, borderRadius:2, fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:1, padding:'4px 10px', cursor:'pointer' }}>{c.icon} {c.label}</button>
              ))}
            </div>
          )}

          {shopLoading ? (
            <div style={{ textAlign:'center', padding:'3rem', color:t.accentDim, fontStyle:'italic' }}>Lade Shop...</div>
          ) : filtered.length === 0 ? (
            <Card t={t}><div style={{ textAlign:'center', padding:'2.5rem', color:t.textMuted, fontStyle:'italic' }}>{activeItems.length===0?'Der Shop ist noch leer.':'Keine Artikel in dieser Kategorie.'}</div></Card>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'0.8rem' }}>
              {filtered.map(item => {
                const cat       = SHOP_CATEGORIES.find(c => c.id === item.category)
                const canAfford = balance >= item.price
                const delivery  = DELIVERY_TYPES.find(d => d.id === (item.deliveryType || 'ingame'))

                return (
                  <div key={item.id} style={{ background:t.cardBg, border:`1px solid ${canAfford?t.accentFade:'#3a2a2a'}`, borderRadius:4, padding:'1.2rem', opacity:canAfford?1:0.7, display:'flex', flexDirection:'column', gap:8, transition:'border-color .2s, box-shadow .2s' }}
                    onMouseEnter={e => { if(canAfford) e.currentTarget.style.boxShadow=`0 0 16px ${t.accent}15` }}
                    onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>

                    <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                      <span style={{ fontSize:32, flexShrink:0 }}>{item.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:'Cinzel,serif', fontSize:14, color:t.accentSoft, fontWeight:600 }}>{item.name}</div>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:3 }}>
                          <span style={{ fontSize:9, color:t.textMuted, background:`${t.accent}10`, padding:'1px 6px', borderRadius:2 }}>{cat?.icon} {cat?.label}</span>
                          {delivery && <span style={{ fontSize:9, color:t.textMuted, background:`${t.accent}08`, padding:'1px 6px', borderRadius:2 }}>{delivery.icon} {delivery.label}</span>}
                        </div>
                      </div>
                    </div>

                    {item.description && <div style={{ fontSize:12, color:t.textSecondary, fontStyle:'italic', lineHeight:1.5 }}>{item.description}</div>}

                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
                      <div style={{ fontFamily:'Cinzel,serif', fontSize:15, color:canAfford?t.accent:'#c04040', fontWeight:600 }}>{formatCoins(item.price)}</div>
                      {item.stock !== -1 && <div style={{ fontSize:10, color:t.textMuted }}>{item.stock}x lagernd</div>}
                    </div>

                    {!canAfford && <div style={{ fontSize:10, color:'#e08080', fontStyle:'italic' }}>Fehlt: {formatCoins(item.price - balance)}</div>}

                    <button onClick={() => setBuyItem(item)} disabled={!canAfford || busy}
                      style={{ width:'100%', padding:'9px', fontSize:11, fontFamily:'Cinzel,serif', letterSpacing:2, textTransform:'uppercase', background:canAfford?`linear-gradient(135deg,${t.accentFade},${t.bgDark})`:'transparent', border:`1px solid ${canAfford?t.accent:'#5a3a3a'}`, color:canAfford?t.accentSoft:'#6a4a4a', borderRadius:2, cursor:canAfford?'pointer':'not-allowed', transition:'all .2s' }}
                      onMouseEnter={e => { if(canAfford) { e.currentTarget.style.background=`linear-gradient(135deg,${t.accent}30,${t.accentFade})`; e.currentTarget.style.boxShadow=`0 0 16px ${t.accent}25` }}}
                      onMouseLeave={e => { e.currentTarget.style.background=canAfford?`linear-gradient(135deg,${t.accentFade},${t.bgDark})`:'transparent'; e.currentTarget.style.boxShadow='none' }}>
                      {canAfford ? 'Kaufen' : 'Nicht genug Coins'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ fontSize:11, color:t.textMuted, fontStyle:'italic', textAlign:'center', lineHeight:1.6 }}>
            💡 Guthaben aufladen: Gold in die Gildenbank einzahlen und den Gildenmeister informieren.
          </div>
        </>
      )}

      {/* ── Bestellungen-Ansicht ── */}
      {view === 'orders' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {ordersLoading ? (
            <div style={{ textAlign:'center', padding:'3rem', color:t.accentDim, fontStyle:'italic' }}>Lade...</div>
          ) : myOrders.length === 0 ? (
            <Card t={t}><div style={{ textAlign:'center', padding:'2.5rem', color:t.textMuted, fontStyle:'italic' }}>Noch keine Bestellungen. Stöber im Shop!</div></Card>
          ) : (
            myOrders.map(order => (
              <OrderCard key={order.id} order={order} t={t} formatCoins={formatCoins}
                onCancel={handleCancel} onRequestCancel={handleRequestCancel} canSelfCancel={canSelfCancel} />
            ))
          )}
        </div>
      )}

      {/* Kaufdialog */}
      {buyItem && (
        <BuyDialog item={buyItem} t={t} onConfirm={handleConfirmBuy} onCancel={() => setBuyItem(null)} busy={busy} formatCoins={formatCoins} config={config} />
      )}
    </div>
  )
}
