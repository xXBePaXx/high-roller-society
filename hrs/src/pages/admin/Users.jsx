import { useState } from 'react'
import { useUsers } from '../../hooks/useUsers'
import { useRanks } from '../../hooks/useRanks'
import Modal from '../../components/Modal'

const WOW_CLASSES = ['Death Knight','Druid','Hunter','Mage','Paladin','Priest','Rogue','Shaman','Warlock','Warrior']

export default function Users() {
  const { users, loading, addUser, deleteUser, updateRank, updateClass, toggleActive, updateNote, updatePassword } = useUsers()
  const { ranks } = useRanks()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(null)
  const [form, setForm]     = useState({})
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState('')

  const filtered = users.filter(u =>
    [u.name, u.rank, u.cls].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  function openAdd() {
    setErr('')
    setForm({ name:'', password:'', rank: ranks[ranks.length - 1]?.label || 'Rookie', cls:'Warrior' })
    setModal('add')
  }
  function openNote(u)  { setForm({ note: u.note || '' }); setModal({ type:'note', user: u }) }
  function openPw(u)    { setForm({ password:'' }); setModal({ type:'pw', user: u }) }

  async function handleOk() {
    setErr('')
    setBusy(true)
    try {
      if (modal === 'add') {
        if (!form.name?.trim()) { setErr('Charaktername fehlt.'); setBusy(false); return }
        if (!form.password || form.password.length < 6) { setErr('Passwort muss mind. 6 Zeichen haben.'); setBusy(false); return }
        await addUser(form)
      } else if (modal?.type === 'note') {
        await updateNote(modal.user.id, form.note)
      } else if (modal?.type === 'pw') {
        if (!form.password || form.password.length < 6) { setErr('Passwort muss mind. 6 Zeichen haben.'); setBusy(false); return }
        await updatePassword(modal.user.id, form.password)
      }
      setModal(null)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  const Dot = ({ active }) => (
    <span style={{ width:7, height:7, borderRadius:'50%', display:'inline-block', marginRight:6, background: active ? '#4a9a5a' : '#4a3820', flexShrink:0 }} />
  )

  const InlineSel = ({ value, options, onChange }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ background:'#1a1208', border:'1px solid #2e2210', color:'#c8a84b', fontFamily:'Crimson Text,serif', fontSize:12, padding:'3px 6px', borderRadius:2, outline:'none', width:'auto' }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  return (
    <div>
      <div className="section-title">Benutzerverwaltung</div>

      <div style={{ display:'flex', gap:10, marginBottom:'1rem', alignItems:'center' }}>
        <input placeholder="Name, Rang oder Klasse suchen..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn-ghost" style={{ fontSize:10, whiteSpace:'nowrap' }} onClick={openAdd}>+ Anlegen</button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'2rem', color:'#7a6030', fontStyle:'italic' }}>Lade Benutzer...</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>
                {['Status','Charakter','Rang','Klasse','Seit','Aktionen'].map(h => (
                  <th key={h} style={{ fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, color:'#5a4828', textTransform:'uppercase', padding:'.6rem .8rem', borderBottom:'1px solid #2e2210', textAlign:'left', fontWeight:400, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'#5a4828', fontStyle:'italic' }}>
                  {search ? 'Keine Treffer.' : 'Noch keine Benutzer. Leg den ersten an!'}
                </td></tr>
              )}
              {filtered.map(u => (
                <tr key={u.id} style={{ borderBottom:'1px solid rgba(46,34,16,.5)' }}>
                  <td style={{ padding:'.65rem .8rem' }}>
                    <Dot active={u.active} />
                    <span style={{ fontSize:11, color: u.active ? '#4a9a5a' : '#5a4828' }}>{u.active ? 'Aktiv' : 'Inaktiv'}</span>
                  </td>
                  <td style={{ padding:'.65rem .8rem', fontWeight:500, color:'#f0d080' }}>{u.name}</td>
                  <td style={{ padding:'.65rem .8rem' }}>
                    <InlineSel value={u.rank} options={ranks.map(r => r.label)} onChange={v => updateRank(u.id, v)} />
                  </td>
                  <td style={{ padding:'.65rem .8rem' }}>
                    <InlineSel value={u.cls} options={WOW_CLASSES} onChange={v => updateClass(u.id, v)} />
                  </td>
                  <td style={{ padding:'.65rem .8rem', color:'#4a3820', fontSize:11, whiteSpace:'nowrap' }}>
                    {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString('de-DE') : '—'}
                  </td>
                  <td style={{ padding:'.65rem .8rem', whiteSpace:'nowrap' }}>
                    <button className="btn-icon" title={u.active ? 'Deaktivieren' : 'Aktivieren'} onClick={() => toggleActive(u.id)}>{u.active ? '⏸' : '▶'}</button>
                    <button className="btn-icon" title="Notiz" onClick={() => openNote(u)}>📝</button>
                    <button className="btn-icon" title="Passwort ändern" onClick={() => openPw(u)}>🔑</button>
                    <button className="btn-icon danger" title="Löschen" onClick={async () => {
                      if (window.confirm(`${u.name} wirklich löschen? Dies kann nicht rückgängig gemacht werden.`))
                        await deleteUser(u.id)
                    }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop:'.8rem', fontSize:11, color:'#3a2c18', fontStyle:'italic' }}>
        {users.length} Benutzer gesamt
      </div>

      {/* Modals */}
      {modal === 'add' && (
        <Modal title="Neuen Benutzer anlegen" onClose={() => setModal(null)} onOk={handleOk} okLabel={busy ? 'Anlegen...' : 'Anlegen'}>
          <div className="field-group"><label className="field-label">Charaktername</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="z.B. Thunderstrike" autoComplete="off" /></div>
          <div className="field-group"><label className="field-label">Passwort (mind. 6 Zeichen)</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" autoComplete="new-password" /></div>
          <div className="field-group"><label className="field-label">Rang</label>
            <select value={form.rank} onChange={e => setForm({ ...form, rank: e.target.value })}>
              {ranks.map(r => <option key={r.id} value={r.label}>{r.label}</option>)}
            </select></div>
          <div className="field-group"><label className="field-label">Klasse</label>
            <select value={form.cls} onChange={e => setForm({ ...form, cls: e.target.value })}>
              {WOW_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
          {err && <p className="error-text">{err}</p>}
        </Modal>
      )}
      {modal?.type === 'note' && (
        <Modal title={`Notiz — ${modal.user.name}`} onClose={() => setModal(null)} onOk={handleOk}>
          <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} style={{ minHeight:100 }} placeholder="Interne Notiz (nur für Admins sichtbar)..." />
          {err && <p className="error-text">{err}</p>}
        </Modal>
      )}
      {modal?.type === 'pw' && (
        <Modal title={`Passwort ändern — ${modal.user.name}`} onClose={() => setModal(null)} onOk={handleOk} okLabel={busy ? 'Speichern...' : 'Speichern'}>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Neues Passwort (mind. 6 Zeichen)" autoComplete="new-password" />
          {err && <p className="error-text">{err}</p>}
        </Modal>
      )}
    </div>
  )
}
