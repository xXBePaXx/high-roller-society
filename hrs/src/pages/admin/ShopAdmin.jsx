import { useState } from 'react'
import { useShop, SHOP_CATEGORIES } from '../../hooks/useShop'
import { useEconomy, coinsToCopper, copperToCoins, DEFAULT_ECONOMY } from '../../hooks/useEconomy'
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

const EMPTY_FORM = { name:'', description:'', gold:0, silver:0, copper:0, category:'special', icon:'📦', stock:-1, active:true }

function ItemForm({ t, config, initial, onSave, onCancel, busy }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const upd = (k,v) => setForm(p => ({...p,[k]:v}))

  const totalCopper = coinsToCopper(form.gold||0, form.silver||0, form.copper||0, config)

  return (
    <div style={{ background:t.bgDark, border:`1px solid ${t.accentFade}`, borderRadius:3, padding:'1rem', display:'flex', flexDirection:'column', gap:10 }}>

      <div style={{ display:'grid', gridTemplateColumns:'60px 1fr 120px', gap:8 }}>
        <div>
          <Lbl t={t}>Icon</Lbl>
          <input value={form.icon} onChange={e=>upd('icon',e.target.value)} style={{ fontSize:20, width:'100%', textAlign:'center', boxSizing:'border-box' }} maxLength={2} />
        </div>
        <div>
          <Lbl t={t}>Name</Lbl>
          <input value={form.name} onChange={e=>upd('name',e.target.value)} placeholder="z.B. Flask of Supreme Power" style={{ fontSize:13, width:'100%', boxSizing:'border-box' }} />
        </div>
        <div>
          <Lbl t={t}>Kategorie</Lbl>
          <select value={form.category} onChange={e=>upd('category',e.target.value)} style={{ fontSize:12, width:'100%' }}>
            {SHOP_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <Lbl t={t}>Beschreibung</Lbl>
        <textarea value={form.description} onChange={e=>upd('description',e.target.value)} placeholder="Was bekommt der Käufer?" style={{ fontSize:12, width:'100%', boxSizing:'border-box', minHeight:60 }} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8 }}>
        <div>
          <Lbl t={t}>{config.currencyIcon} {config.currencyName}</Lbl>
          <input type="number" min={0} value={form.gold} onChange={e=>upd('gold',Math.max(0,Number(e.target.value)))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
        </div>
        <div>
          <Lbl t={t}>{config.silverIcon} {config.silverName}</Lbl>
          <input type="number" min={0} value={form.silver} onChange={e=>upd('silver',Math.max(0,Number(e.target.value)))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
        </div>
        <div>
          <Lbl t={t}>{config.copperIcon} {config.copperName}</Lbl>
          <input type="number" min={0} value={form.copper} onChange={e=>upd('copper',Math.max(0,Number(e.target.value)))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
        </div>
        <div>
          <Lbl t={t}>Lager (-1 = ∞)</Lbl>
          <input type="number" min={-1} value={form.stock} onChange={e=>upd('stock',Number(e.target.value))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} />
        </div>
      </div>

      {totalCopper > 0 && (
        <div style={{ fontSize:11, color:t.textMuted, fontStyle:'italic' }}>
          Preis: {config.currencyIcon} {form.gold} · {config.silverIcon} {form.silver} · {config.copperIcon} {form.copper}
          <span style={{ marginLeft:8, color:t.accentDim }}>= {totalCopper} Kupfer gesamt</span>
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

export default function ShopAdmin() {
  const t = useTheme()
  const { items, loading, addItem, updateItem, deleteItem, toggleActive } = useShop()
  const { config, formatCoins } = useEconomy()

  const [adding,   setAdding]   = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [busy,     setBusy]     = useState(false)
  const [filter,   setFilter]   = useState('ALL')

  async function handleAdd(form) {
    setBusy(true)
    await addItem(form)
    setBusy(false); setAdding(false)
  }

  async function handleEdit(form) {
    setBusy(true)
    await updateItem(editing.id, form)
    setBusy(false); setEditing(null)
  }

  const filtered = filter === 'ALL' ? items : items.filter(i => i.category === filter)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>
      <div className="section-title">Gilden-Shop verwalten</div>

      {/* Filter + Neu-Button */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        {[{id:'ALL',label:'Alle',icon:'📋'}, ...SHOP_CATEGORIES].map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)} style={{
            background: filter===c.id ? `${t.accent}18` : 'transparent',
            border: filter===c.id ? `1px solid ${t.accent}` : `1px solid ${t.accentFade}`,
            color: filter===c.id ? t.accentSoft : t.accentDim,
            borderRadius:2, fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:1,
            padding:'4px 10px', cursor:'pointer',
          }}>{c.icon} {c.label}</button>
        ))}
        <button className="btn-ghost" style={{ fontSize:10, marginLeft:'auto' }} onClick={() => { setAdding(true); setEditing(null) }}>
          + Artikel hinzufügen
        </button>
      </div>

      {/* Neues Item */}
      {adding && (
        <ItemForm t={t} config={config} onSave={handleAdd} onCancel={() => setAdding(false)} busy={busy} />
      )}

      {/* Item-Liste */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:t.accentDim, fontStyle:'italic' }}>Lade...</div>
      ) : filtered.length === 0 ? (
        <Card t={t}>
          <div style={{ textAlign:'center', padding:'2rem', color:t.textMuted, fontStyle:'italic' }}>
            Noch keine Artikel. Füge deinen ersten Artikel hinzu!
          </div>
        </Card>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {filtered.map(item => {
            const cat = SHOP_CATEGORIES.find(c => c.id === item.category)
            return (
              <div key={item.id}>
                {editing?.id === item.id ? (
                  <ItemForm
                    t={t} config={config}
                    initial={{ ...item, ...copperToCoins(item.price, config), gold: copperToCoins(item.price, config).gold, silver: copperToCoins(item.price, config).silver, copper: copperToCoins(item.price, config).copper }}
                    onSave={handleEdit} onCancel={() => setEditing(null)} busy={busy}
                  />
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'0.8rem 1rem', background:item.active?t.cardBg:t.bgDark, border:`1px solid ${item.active?t.accentFade:'#3a2a2a'}`, borderRadius:3, opacity:item.active?1:0.6 }}>
                    <span style={{ fontSize:24, flexShrink:0 }}>{item.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontFamily:'Cinzel,serif', fontSize:13, color:t.accentSoft, fontWeight:600 }}>{item.name}</span>
                        <span style={{ fontSize:9, color:t.textMuted, background:`${t.accent}10`, padding:'1px 6px', borderRadius:2 }}>{cat?.icon} {cat?.label}</span>
                        {!item.active && <span style={{ fontSize:9, color:'#c04040', fontStyle:'italic' }}>Inaktiv</span>}
                      </div>
                      {item.description && <div style={{ fontSize:11, color:t.textSecondary, marginTop:2, fontStyle:'italic' }}>{item.description}</div>}
                      <div style={{ fontSize:11, color:t.accent, fontFamily:'Cinzel,serif', marginTop:3 }}>
                        {formatCoins(item.price)}
                        <span style={{ color:t.textMuted, marginLeft:8, fontFamily:'inherit', fontSize:10 }}>
                          {item.stock === -1 ? '∞ Lager' : `${item.stock}x lagernd`}
                        </span>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                      <button className="btn-icon" onClick={() => setEditing(item)} title="Bearbeiten">✏️</button>
                      <button className="btn-icon" onClick={() => toggleActive(item.id, item.active)} title={item.active?'Deaktivieren':'Aktivieren'}>
                        {item.active ? '⏸' : '▶'}
                      </button>
                      <button className="btn-icon danger" onClick={async () => { if(window.confirm(`"${item.name}" wirklich löschen?`)) await deleteItem(item.id) }} title="Löschen">✕</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ fontSize:11, color:t.textMuted, fontStyle:'italic' }}>{items.length} Artikel gesamt · {items.filter(i=>i.active).length} aktiv</div>
    </div>
  )
}
