import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { useShop, SHOP_CATEGORIES } from '../../hooks/useShop'
import { useEconomy } from '../../hooks/useEconomy'

function Card({ children, t, style={} }) {
  return <div style={{ background:t.cardBg, border:`1px solid ${t.accentFade}`, borderRadius:4, padding:'1.2rem 1.4rem', ...style }}>{children}</div>
}

export default function GuildShop() {
  const { currentUser } = useAuth()
  const t = useTheme()
  const { activeItems, loading, decreaseStock } = useShop()
  const { getBalance, purchaseItem, formatCoins, config } = useEconomy()
  const [filter,    setFilter]    = useState('ALL')
  const [buying,    setBuying]    = useState(null)
  const [busy,      setBusy]      = useState(false)
  const [message,   setMessage]   = useState(null) // { type: 'success'|'error', text }

  const balance = getBalance(currentUser?.id || '')

  const filtered = filter === 'ALL'
    ? activeItems
    : activeItems.filter(i => i.category === filter)

  const usedCats = [...new Set(activeItems.map(i => i.category))]

  async function handleBuy(item) {
    if (balance < item.price) {
      setMessage({ type:'error', text:'Nicht genug Coins! Zahle Gold in die Gildenbank ein und bitte den Admin dein Guthaben aufzuladen.' })
      setTimeout(() => setMessage(null), 4000)
      return
    }
    setBuying(item.id); setBusy(true)
    try {
      await purchaseItem({ userId: currentUser.id, username: currentUser.username, itemName: item.name, price: item.price })
      if (item.stock !== -1) await decreaseStock(item.id, item.stock)
      setMessage({ type:'success', text:`✓ "${item.name}" erfolgreich gekauft! Der Admin wird deinen Kauf bestätigen.` })
      setTimeout(() => setMessage(null), 4000)
    } catch(e) {
      setMessage({ type:'error', text:`Fehler: ${e.message}` })
      setTimeout(() => setMessage(null), 4000)
    }
    setBusy(false); setBuying(null)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>

      {/* Header */}
      <Card t={t} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontFamily:'Cinzel,serif', fontSize:20, fontWeight:600, color:t.accentSoft, margin:0, letterSpacing:1 }}>Gilden-Shop</h1>
          <div style={{ fontSize:12, color:t.textSecondary, marginTop:3 }}>Kaufe Items mit deinen Gilden-Talern</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:9, color:t.textMuted, fontFamily:'Cinzel,serif', letterSpacing:2, textTransform:'uppercase', marginBottom:3 }}>Dein Guthaben</div>
          <div style={{ fontFamily:'Cinzel,serif', fontSize:20, color:balance>=0?t.accent:'#c04040', fontWeight:600 }}>
            {formatCoins(balance)}
          </div>
        </div>
      </Card>

      {/* Nachricht */}
      {message && (
        <div style={{ padding:'0.8rem 1rem', borderRadius:3, border:`1px solid ${message.type==='success'?'#4a9a5a':'#c04040'}`, background:message.type==='success'?'#4a9a5a10':'#c0404010', fontSize:13, color:message.type==='success'?'#4a9a5a':'#e08080' }}>
          {message.text}
        </div>
      )}

      {/* Kategorie-Filter */}
      {usedCats.length > 1 && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[{id:'ALL',label:'Alle',icon:'📋'}, ...SHOP_CATEGORIES.filter(c=>usedCats.includes(c.id))].map(c => (
            <button key={c.id} onClick={() => setFilter(c.id)} style={{
              background: filter===c.id?`${t.accent}18`:'transparent',
              border: filter===c.id?`1px solid ${t.accent}`:`1px solid ${t.accentFade}`,
              color: filter===c.id?t.accentSoft:t.accentDim,
              borderRadius:2, fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:1,
              padding:'4px 10px', cursor:'pointer',
            }}>{c.icon} {c.label}</button>
          ))}
        </div>
      )}

      {/* Items */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:t.accentDim, fontStyle:'italic' }}>Lade Shop...</div>
      ) : filtered.length === 0 ? (
        <Card t={t}>
          <div style={{ textAlign:'center', padding:'2.5rem', color:t.textMuted, fontStyle:'italic' }}>
            {activeItems.length === 0
              ? 'Der Shop ist noch leer. Der Gildenmeister fügt bald Artikel hinzu!'
              : 'Keine Artikel in dieser Kategorie.'
            }
          </div>
        </Card>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'0.8rem' }}>
          {filtered.map(item => {
            const cat        = SHOP_CATEGORIES.find(c => c.id === item.category)
            const canAfford  = balance >= item.price
            const isBuying   = buying === item.id

            return (
              <div key={item.id} style={{
                background: t.cardBg,
                border: `1px solid ${canAfford ? t.accentFade : '#3a2a2a'}`,
                borderRadius: 4, padding:'1.2rem',
                opacity: canAfford ? 1 : 0.7,
                display:'flex', flexDirection:'column', gap:8,
                transition: 'border-color .2s, box-shadow .2s',
              }}
                onMouseEnter={e => { if(canAfford) e.currentTarget.style.boxShadow=`0 0 16px ${t.accent}15` }}
                onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
              >
                {/* Icon + Name */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <span style={{ fontSize:32, flexShrink:0 }}>{item.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Cinzel,serif', fontSize:14, color:t.accentSoft, fontWeight:600 }}>{item.name}</div>
                    <div style={{ fontSize:9, color:t.textMuted, background:`${t.accent}10`, display:'inline-block', padding:'1px 6px', borderRadius:2, marginTop:2 }}>
                      {cat?.icon} {cat?.label}
                    </div>
                  </div>
                </div>

                {/* Beschreibung */}
                {item.description && (
                  <div style={{ fontSize:12, color:t.textSecondary, fontStyle:'italic', lineHeight:1.5 }}>
                    {item.description}
                  </div>
                )}

                {/* Preis + Lager */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
                  <div style={{ fontFamily:'Cinzel,serif', fontSize:15, color:canAfford?t.accent:'#c04040', fontWeight:600 }}>
                    {formatCoins(item.price)}
                  </div>
                  {item.stock !== -1 && (
                    <div style={{ fontSize:10, color:t.textMuted }}>
                      {item.stock}x lagernd
                    </div>
                  )}
                </div>

                {!canAfford && (
                  <div style={{ fontSize:10, color:'#e08080', fontStyle:'italic' }}>
                    Fehlt: {formatCoins(item.price - balance)}
                  </div>
                )}

                {/* Kaufen-Button */}
                <button
                  onClick={() => handleBuy(item)}
                  disabled={busy || !canAfford}
                  style={{
                    width:'100%', padding:'9px', fontSize:11,
                    fontFamily:'Cinzel,serif', letterSpacing:2, textTransform:'uppercase',
                    background: canAfford ? `linear-gradient(135deg,${t.accentFade},${t.bgDark})` : 'transparent',
                    border: `1px solid ${canAfford ? t.accent : '#5a3a3a'}`,
                    color: canAfford ? t.accentSoft : '#6a4a4a',
                    borderRadius:2, cursor: canAfford ? 'pointer' : 'not-allowed',
                    transition:'all .2s',
                  }}
                  onMouseEnter={e => { if(canAfford&&!busy) { e.currentTarget.style.background=`linear-gradient(135deg,${t.accent}30,${t.accentFade})`; e.currentTarget.style.boxShadow=`0 0 16px ${t.accent}25` }}}
                  onMouseLeave={e => { e.currentTarget.style.background=canAfford?`linear-gradient(135deg,${t.accentFade},${t.bgDark})`:'transparent'; e.currentTarget.style.boxShadow='none' }}
                >
                  {isBuying ? 'Kaufe...' : canAfford ? 'Kaufen' : 'Nicht genug Coins'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Info */}
      <div style={{ fontSize:11, color:t.textMuted, fontStyle:'italic', textAlign:'center', lineHeight:1.6 }}>
        💡 Zum Aufladen deines Guthabens: Zahle Gold in die Gildenbank ein und informiere den Gildenmeister.<br/>
        Käufe werden vom Admin bestätigt und ausgegeben.
      </div>
    </div>
  )
}
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { useShop, SHOP_CATEGORIES } from '../../hooks/useShop'
import { useEconomy } from '../../hooks/useEconomy'

function Card({ children, t, style={} }) {
  return <div style={{ background:t.cardBg, border:`1px solid ${t.accentFade}`, borderRadius:4, padding:'1.2rem 1.4rem', ...style }}>{children}</div>
}

export default function GuildShop() {
  const { currentUser } = useAuth()
  const t = useTheme()
  const { activeItems, loading, decreaseStock } = useShop()
  const { getBalance, purchaseItem, formatCoins, config } = useEconomy()
  const [filter,    setFilter]    = useState('ALL')
  const [buying,    setBuying]    = useState(null)
  const [busy,      setBusy]      = useState(false)
  const [message,   setMessage]   = useState(null) // { type: 'success'|'error', text }

  const balance = getBalance(currentUser?.id || '')

  const filtered = filter === 'ALL'
    ? activeItems
    : activeItems.filter(i => i.category === filter)

  const usedCats = [...new Set(activeItems.map(i => i.category))]

  async function handleBuy(item) {
    if (balance < item.price) {
      setMessage({ type:'error', text:'Nicht genug Coins! Zahle Gold in die Gildenbank ein und bitte den Admin dein Guthaben aufzuladen.' })
      setTimeout(() => setMessage(null), 4000)
      return
    }
    setBuying(item.id); setBusy(true)
    try {
      await purchaseItem({ userId: currentUser.id, username: currentUser.username, itemName: item.name, price: item.price })
      if (item.stock !== -1) await decreaseStock(item.id, item.stock)
      setMessage({ type:'success', text:`✓ "${item.name}" erfolgreich gekauft! Der Admin wird deinen Kauf bestätigen.` })
      setTimeout(() => setMessage(null), 4000)
    } catch(e) {
      setMessage({ type:'error', text:`Fehler: ${e.message}` })
      setTimeout(() => setMessage(null), 4000)
    }
    setBusy(false); setBuying(null)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>

      {/* Header */}
      <Card t={t} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontFamily:'Cinzel,serif', fontSize:20, fontWeight:600, color:t.accentSoft, margin:0, letterSpacing:1 }}>Gilden-Shop</h1>
          <div style={{ fontSize:12, color:t.textSecondary, marginTop:3 }}>Kaufe Items mit deinen Gilden-Talern</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:9, color:t.textMuted, fontFamily:'Cinzel,serif', letterSpacing:2, textTransform:'uppercase', marginBottom:3 }}>Dein Guthaben</div>
          <div style={{ fontFamily:'Cinzel,serif', fontSize:20, color:balance>=0?t.accent:'#c04040', fontWeight:600 }}>
            {formatCoins(balance)}
          </div>
        </div>
      </Card>

      {/* Nachricht */}
      {message && (
        <div style={{ padding:'0.8rem 1rem', borderRadius:3, border:`1px solid ${message.type==='success'?'#4a9a5a':'#c04040'}`, background:message.type==='success'?'#4a9a5a10':'#c0404010', fontSize:13, color:message.type==='success'?'#4a9a5a':'#e08080' }}>
          {message.text}
        </div>
      )}

      {/* Kategorie-Filter */}
      {usedCats.length > 1 && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[{id:'ALL',label:'Alle',icon:'📋'}, ...SHOP_CATEGORIES.filter(c=>usedCats.includes(c.id))].map(c => (
            <button key={c.id} onClick={() => setFilter(c.id)} style={{
              background: filter===c.id?`${t.accent}18`:'transparent',
              border: filter===c.id?`1px solid ${t.accent}`:`1px solid ${t.accentFade}`,
              color: filter===c.id?t.accentSoft:t.accentDim,
              borderRadius:2, fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:1,
              padding:'4px 10px', cursor:'pointer',
            }}>{c.icon} {c.label}</button>
          ))}
        </div>
      )}

      {/* Items */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:t.accentDim, fontStyle:'italic' }}>Lade Shop...</div>
      ) : filtered.length === 0 ? (
        <Card t={t}>
          <div style={{ textAlign:'center', padding:'2.5rem', color:t.textMuted, fontStyle:'italic' }}>
            {activeItems.length === 0
              ? 'Der Shop ist noch leer. Der Gildenmeister fügt bald Artikel hinzu!'
              : 'Keine Artikel in dieser Kategorie.'
            }
          </div>
        </Card>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'0.8rem' }}>
          {filtered.map(item => {
            const cat        = SHOP_CATEGORIES.find(c => c.id === item.category)
            const canAfford  = balance >= item.price
            const isBuying   = buying === item.id

            return (
              <div key={item.id} style={{
                background: t.cardBg,
                border: `1px solid ${canAfford ? t.accentFade : '#3a2a2a'}`,
                borderRadius: 4, padding:'1.2rem',
                opacity: canAfford ? 1 : 0.7,
                display:'flex', flexDirection:'column', gap:8,
                transition: 'border-color .2s, box-shadow .2s',
              }}
                onMouseEnter={e => { if(canAfford) e.currentTarget.style.boxShadow=`0 0 16px ${t.accent}15` }}
                onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
              >
                {/* Icon + Name */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <span style={{ fontSize:32, flexShrink:0 }}>{item.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Cinzel,serif', fontSize:14, color:t.accentSoft, fontWeight:600 }}>{item.name}</div>
                    <div style={{ fontSize:9, color:t.textMuted, background:`${t.accent}10`, display:'inline-block', padding:'1px 6px', borderRadius:2, marginTop:2 }}>
                      {cat?.icon} {cat?.label}
                    </div>
                  </div>
                </div>

                {/* Beschreibung */}
                {item.description && (
                  <div style={{ fontSize:12, color:t.textSecondary, fontStyle:'italic', lineHeight:1.5 }}>
                    {item.description}
                  </div>
                )}

                {/* Preis + Lager */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
                  <div style={{ fontFamily:'Cinzel,serif', fontSize:15, color:canAfford?t.accent:'#c04040', fontWeight:600 }}>
                    {formatCoins(item.price)}
                  </div>
                  {item.stock !== -1 && (
                    <div style={{ fontSize:10, color:t.textMuted }}>
                      {item.stock}x lagernd
                    </div>
                  )}
                </div>

                {!canAfford && (
                  <div style={{ fontSize:10, color:'#e08080', fontStyle:'italic' }}>
                    Fehlt: {formatCoins(item.price - balance)}
                  </div>
                )}

                {/* Kaufen-Button */}
                <button
                  onClick={() => handleBuy(item)}
                  disabled={busy || !canAfford}
                  style={{
                    width:'100%', padding:'9px', fontSize:11,
                    fontFamily:'Cinzel,serif', letterSpacing:2, textTransform:'uppercase',
                    background: canAfford ? `linear-gradient(135deg,${t.accentFade},${t.bgDark})` : 'transparent',
                    border: `1px solid ${canAfford ? t.accent : '#5a3a3a'}`,
                    color: canAfford ? t.accentSoft : '#6a4a4a',
                    borderRadius:2, cursor: canAfford ? 'pointer' : 'not-allowed',
                    transition:'all .2s',
                  }}
                  onMouseEnter={e => { if(canAfford&&!busy) { e.currentTarget.style.background=`linear-gradient(135deg,${t.accent}30,${t.accentFade})`; e.currentTarget.style.boxShadow=`0 0 16px ${t.accent}25` }}}
                  onMouseLeave={e => { e.currentTarget.style.background=canAfford?`linear-gradient(135deg,${t.accentFade},${t.bgDark})`:'transparent'; e.currentTarget.style.boxShadow='none' }}
                >
                  {isBuying ? 'Kaufe...' : canAfford ? 'Kaufen' : 'Nicht genug Coins'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Info */}
      <div style={{ fontSize:11, color:t.textMuted, fontStyle:'italic', textAlign:'center', lineHeight:1.6 }}>
        💡 Zum Aufladen deines Guthabens: Zahle Gold in die Gildenbank ein und informiere den Gildenmeister.<br/>
        Käufe werden vom Admin bestätigt und ausgegeben.
      </div>
    </div>
  )
}
