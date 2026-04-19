export default function Modal({ title, onClose, onOk, okLabel = 'Speichern', children, danger = false }) {
  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.78)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background:'#120e06', border:'1px solid #4a3820', borderRadius:4, padding:'2rem', width:'100%', maxWidth:400, position:'relative', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'50%', height:2, background:'linear-gradient(90deg,transparent,#c8a84b,transparent)' }} />
        <h3 style={{ fontFamily:'Cinzel,serif', fontSize:15, color:'#f0d080', marginBottom:'1.4rem' }}>{title}</h3>
        <div>{children}</div>
        <div style={{ display:'flex', gap:10, marginTop:'1.4rem' }}>
          <button className="btn-ghost" style={{ flex:1 }} onClick={onClose}>Abbrechen</button>
          {onOk && (
            <button
              className="btn-primary"
              style={{ flex:1, ...(danger ? { background:'linear-gradient(135deg,#a03030,#c04040,#a03030)', color:'#fff' } : {}) }}
              onClick={onOk}
            >{okLabel}</button>
          )}
        </div>
      </div>
    </div>
  )
}
