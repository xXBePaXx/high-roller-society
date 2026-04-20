import { useState, useEffect } from 'react'
import { useMemberData, PROFESSIONS, PRIMARY_PROFS, SECONDARY_PROFS, ALL_RACES, RACES } from '../../hooks/useMemberData'
import { useTheme } from '../../hooks/useTheme'

const CLASS_COLORS = {
  'Death Knight':'#C41E3A','Druid':'#FF7C0A','Hunter':'#AAD372','Mage':'#3FC7EB',
  'Paladin':'#F48CBA','Priest':'#DDDDDD','Rogue':'#FFF468','Shaman':'#0070DD',
  'Warlock':'#8788EE','Warrior':'#C69B3A',
}
const CLASS_ICONS = {
  'Death Knight':'💀','Druid':'🌙','Hunter':'🏹','Mage':'🔮','Paladin':'⚔️',
  'Priest':'✨','Rogue':'🗡️','Shaman':'⚡','Warlock':'🔥','Warrior':'🛡️',
}

function useT() { return useTheme() }

function SectionTitle({ children, t }) {
  return <div style={{ fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:3, color:t.accentDim, textTransform:'uppercase', marginBottom:'1rem', paddingBottom:'0.5rem', borderBottom:`1px solid ${t.accentFade}` }}>{children}</div>
}
function Card({ children, t, style={} }) {
  return <div style={{ background:t.bgMid, border:`1px solid ${t.accentFade}`, borderRadius:4, padding:'1.4rem', ...style }}>{children}</div>
}
function SaveButton({ onClick, saving, saved, disabled, t }) {
  return (
    <button style={{ fontSize:11, padding:'7px 18px', marginLeft:'auto', fontFamily:'Cinzel,serif', letterSpacing:1, textTransform:'uppercase', cursor:'pointer', background:`linear-gradient(135deg,${t.accentFade},${t.bgDark})`, border:`1px solid ${t.accent}`, color:t.accentSoft, borderRadius:2, opacity: saving||disabled ? 0.6 : 1 }}
      onClick={onClick} disabled={saving||disabled}>
      {saving ? 'Speichern...' : saved ? '✓ Gespeichert' : 'Speichern'}
    </button>
  )
}

function CharTypeToggle({ value, onChange, saving, t }) {
  return (
    <div style={{ display:'flex', gap:8 }}>
      {[{id:'main',label:'Main',desc:'Dein Hauptcharakter',icon:'⭐'},{id:'twink',label:'Twink',desc:'Alternativer Charakter',icon:'🔄'}].map(opt => {
        const active = value === opt.id
        return (
          <button key={opt.id} onClick={() => !saving && onChange(opt.id)} disabled={saving}
            style={{ flex:1, background: active ? `${t.accent}18` : 'transparent', border: active ? `1px solid ${t.accent}` : `1px solid ${t.accentFade}`, borderRadius:3, padding:'0.9rem 1rem', cursor:saving?'not-allowed':'pointer', textAlign:'left', transition:'all .2s', opacity:saving?0.6:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:16 }}>{opt.icon}</span>
              <span style={{ fontFamily:'Cinzel,serif', fontSize:12, letterSpacing:1, color: active ? t.accentSoft : t.accentDim }}>{opt.label}</span>
              {active && <span style={{ marginLeft:'auto', fontSize:9, letterSpacing:1, color:t.accent, fontFamily:'Cinzel,serif', background:`${t.accent}20`, padding:'2px 6px', borderRadius:2 }}>AKTIV</span>}
            </div>
            <div style={{ fontSize:11, color:t.accentGhost, fontStyle:'italic' }}>{opt.desc}</div>
          </button>
        )
      })}
    </div>
  )
}

function ProfessionRow({ prof, onChange, onRemove, t }) {
  const specs = PROFESSIONS[prof.name] || ['Keine']
  const hasSpecs = specs.length > 1
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 1fr auto', gap:8, alignItems:'center', padding:'0.6rem 0', borderBottom:`1px solid ${t.bgDark}` }}>
      <select value={prof.name} onChange={e => onChange({ ...prof, name:e.target.value, specialization:'Keine' })} style={{ fontSize:12 }}>
        <optgroup label="Hauptberufe">{PRIMARY_PROFS.map(p => <option key={p} value={p}>{p}</option>)}</optgroup>
        <optgroup label="Nebenberufe">{SECONDARY_PROFS.map(p => <option key={p} value={p}>{p}</option>)}</optgroup>
      </select>
      <input type="number" min={1} max={375} value={prof.level} onChange={e => onChange({ ...prof, level:Math.min(375,Math.max(1,Number(e.target.value))) })} placeholder="375" style={{ fontSize:12, textAlign:'center' }} />
      {hasSpecs
        ? <select value={prof.specialization||'Keine'} onChange={e => onChange({ ...prof, specialization:e.target.value })} style={{ fontSize:12 }}>{specs.map(s => <option key={s} value={s}>{s}</option>)}</select>
        : <div style={{ fontSize:11, color:t.accentGhost, fontStyle:'italic', padding:'0 8px' }}>Keine Spezialisierung</div>
      }
      <button onClick={onRemove} style={{ background:'transparent', border:'none', color:t.accentFade, cursor:'pointer', fontSize:14, padding:'4px 6px', borderRadius:2, transition:'color .15s' }}
        onMouseEnter={e => e.target.style.color='#c04040'} onMouseLeave={e => e.target.style.color=t.accentFade}>✕</button>
    </div>
  )
}

export default function CharacterView() {
  const t = useT()
  const { memberData, loading, setCharacterType, setProfessions, setCharacterInfo, changePassword, setAbsence } = useMemberData()
  const [charTypeSaving, setCharTypeSaving] = useState(false)
  const [localProfs, setLocalProfs] = useState(null)
  const [profsSaving, setProfsSaving] = useState(false)
  const [profsSaved,  setProfsSaved]  = useState(false)
  const [localRace,  setLocalRace]  = useState('')
  const [localLevel, setLocalLevel] = useState(70)
  const [infoSaving, setInfoSaving] = useState(false)
  const [infoSaved,  setInfoSaved]  = useState(false)
  const [infoInit,   setInfoInit]   = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew,     setPwNew]     = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSaving,  setPwSaving]  = useState(false)
  const [pwMsg,     setPwMsg]     = useState(null)
  const [absFrom,   setAbsFrom]   = useState('')
  const [absUntil,  setAbsUntil]  = useState('')
  const [absReason, setAbsReason] = useState('')
  const [absSaving, setAbsSaving] = useState(false)
  const [absSaved,  setAbsSaved]  = useState(false)
  const [absInit,   setAbsInit]   = useState(false)

  useEffect(() => {
    if (!memberData) return
    if (localProfs === null) setLocalProfs(memberData.professions || [])
    if (!infoInit) { setLocalRace(memberData.race||''); setLocalLevel(memberData.level||70); setInfoInit(true) }
    if (!absInit) { setAbsFrom(memberData.absence?.from||''); setAbsUntil(memberData.absence?.until||''); setAbsReason(memberData.absence?.reason||''); setAbsInit(true) }
  }, [memberData])

  if (loading) return <div style={{ textAlign:'center', padding:'4rem', color:t.accentDim, fontStyle:'italic' }}>Charakterdaten werden geladen...</div>
  if (!memberData) return null

  const clsColor = CLASS_COLORS[memberData.cls] || t.accent
  const clsIcon  = CLASS_ICONS[memberData.cls]  || '⚔️'
  const charType = memberData.characterType || 'main'
  const profs    = localProfs ?? []
  const absence  = memberData.absence

  async function handleCharTypeChange(type) { setCharTypeSaving(true); await setCharacterType(type); setCharTypeSaving(false) }
  function addProfession() { const used=profs.map(p=>p.name); const av=[...PRIMARY_PROFS,...SECONDARY_PROFS].find(p=>!used.includes(p)); if(!av) return; setLocalProfs([...profs,{name:av,level:375,specialization:'Keine'}]) }
  async function saveProfs() { setProfsSaving(true); await setProfessions(profs); setProfsSaving(false); setProfsSaved(true); setTimeout(()=>setProfsSaved(false),2500) }
  async function saveInfo() { setInfoSaving(true); await setCharacterInfo({race:localRace,level:Number(localLevel)}); setInfoSaving(false); setInfoSaved(true); setTimeout(()=>setInfoSaved(false),2500) }
  async function handleChangePassword() {
    if (pwNew!==pwConfirm) { setPwMsg({ok:false,text:'Passwörter stimmen nicht überein.'}); return }
    setPwSaving(true); const res=await changePassword(pwCurrent,pwNew); setPwSaving(false)
    if(res.ok) { setPwMsg({ok:true,text:'Passwort erfolgreich geändert.'}); setPwCurrent(''); setPwNew(''); setPwConfirm(''); setTimeout(()=>setPwMsg(null),3000) }
    else setPwMsg({ok:false,text:res.error})
  }
  async function saveAbsence() { setAbsSaving(true); await setAbsence(absFrom?{from:absFrom,until:absUntil,reason:absReason}:null); setAbsSaving(false); setAbsSaved(true); setTimeout(()=>setAbsSaved(false),2500) }
  async function clearAbsence() { setAbsSaving(true); await setAbsence(null); setAbsFrom(''); setAbsUntil(''); setAbsReason(''); setAbsSaving(false) }

  const primaryCount    = profs.filter(p=>PRIMARY_PROFS.includes(p.name)).length
  const canAddPrimary   = primaryCount < 2
  const canAddSecondary = profs.filter(p=>SECONDARY_PROFS.includes(p.name)).length < SECONDARY_PROFS.length
  const canAdd = canAddPrimary || canAddSecondary

  const lbl = { fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:t.accentGhost, textTransform:'uppercase', marginBottom:6 }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

      <Card t={t}>
        <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
          <div style={{ width:64, height:64, borderRadius:4, background:t.bgDark, border:`1px solid ${clsColor}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>{clsIcon}</div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:'0.8rem', flexWrap:'wrap' }}>
              <h1 style={{ fontFamily:'Cinzel,serif', fontSize:22, fontWeight:600, color:clsColor, margin:0, letterSpacing:1 }}>{memberData.name}</h1>
              <span style={{ fontSize:11, color:t.accentDim, fontFamily:'Cinzel,serif', letterSpacing:2, textTransform:'uppercase' }}>{memberData.rank}</span>
            </div>
            <div style={{ marginTop:4, display:'flex', gap:'1rem', flexWrap:'wrap' }}>
              <span style={{ fontSize:12, color:t.accentDim }}>{memberData.cls}</span>
              {memberData.race && <><span style={{ fontSize:12, color:t.accentGhost }}>·</span><span style={{ fontSize:12, color:t.accentDim }}>{memberData.race}</span></>}
              {memberData.level && <><span style={{ fontSize:12, color:t.accentGhost }}>·</span><span style={{ fontSize:12, color:t.accentDim }}>Level {memberData.level}</span></>}
              <span style={{ fontSize:12, color:t.accentGhost }}>·</span>
              <span style={{ fontSize:12, color:t.accentDim }}>Spineshatter EU</span>
              <span style={{ fontSize:12, color:t.accentGhost }}>·</span>
              <span style={{ fontSize:11, color:charType==='main'?t.accent:t.accentDim, fontFamily:'Cinzel,serif', letterSpacing:1, textTransform:'uppercase' }}>{charType==='main'?'⭐ Main':'🔄 Twink'}</span>
            </div>
            {absence && <div style={{ marginTop:8, display:'inline-flex', alignItems:'center', gap:6, background:'rgba(192,57,43,.1)', border:'1px solid #6a2020', borderRadius:2, padding:'3px 10px', fontSize:11, color:'#e08080' }}>🏖️ Abwesend {absence.from} – {absence.until||'?'}{absence.reason && <span style={{ color:'#8a4040' }}>· {absence.reason}</span>}</div>}
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, color:memberData.active?'#4a9a5a':t.accentDim, fontFamily:'Cinzel,serif', letterSpacing:1, textTransform:'uppercase' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:memberData.active?'#4a9a5a':t.accentFade, display:'inline-block', flexShrink:0 }} />
              {memberData.active?'Aktiv':'Inaktiv'}
            </div>
            <div style={{ fontSize:10, color:t.accentGhost, marginTop:4, fontStyle:'italic' }}>Seit {memberData.createdAt?.toDate?memberData.createdAt.toDate().toLocaleDateString('de-DE'):'—'}</div>
          </div>
        </div>
      </Card>

      <Card t={t}><SectionTitle t={t}>Charakter-Typ</SectionTitle>
        <p style={{ fontSize:12, color:t.accentDim, fontStyle:'italic', marginBottom:'1rem', marginTop:0 }}>Lege fest ob dieser Charakter dein Main oder ein Twink ist.</p>
        <CharTypeToggle value={charType} onChange={handleCharTypeChange} saving={charTypeSaving} t={t} />
        {charTypeSaving && <div style={{ fontSize:11, color:t.accentDim, fontStyle:'italic', marginTop:'.6rem' }}>Wird gespeichert...</div>}
      </Card>

      <Card t={t}><SectionTitle t={t}>Rasse & Level</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:'1rem' }}>
          <div><div style={lbl}>Rasse</div>
            <select value={localRace} onChange={e=>setLocalRace(e.target.value)} style={{ fontSize:12, width:'100%' }}>
              <option value="">— Nicht gesetzt —</option>
              <optgroup label="Allianz">{RACES.Allianz.map(r=><option key={r} value={r}>{r}</option>)}</optgroup>
              <optgroup label="Horde">{RACES.Horde.map(r=><option key={r} value={r}>{r}</option>)}</optgroup>
            </select>
          </div>
          <div><div style={lbl}>Level</div><input type="number" min={1} max={70} value={localLevel} onChange={e=>setLocalLevel(Math.min(70,Math.max(1,Number(e.target.value))))} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end' }}><SaveButton onClick={saveInfo} saving={infoSaving} saved={infoSaved} t={t} /></div>
      </Card>

      <Card t={t}><SectionTitle t={t}>Abwesenheit</SectionTitle>
        <p style={{ fontSize:12, color:t.accentDim, fontStyle:'italic', marginBottom:'1rem', marginTop:0 }}>Trag ein wenn du vorübergehend nicht verfügbar bist.</p>
        {absence && (
          <div style={{ background:'rgba(192,57,43,.08)', border:'1px solid #3a1a1a', borderRadius:3, padding:'0.8rem 1rem', marginBottom:'1rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <div>
              <div style={{ fontSize:12, color:'#e08080', fontFamily:'Cinzel,serif' }}>🏖️ Abwesend: {absence.from} – {absence.until||'offen'}</div>
              {absence.reason && <div style={{ fontSize:11, color:'#6a3030', fontStyle:'italic', marginTop:3 }}>{absence.reason}</div>}
            </div>
            <button className="btn-ghost" style={{ fontSize:10, color:'#8a3020', flexShrink:0 }} onClick={clearAbsence} disabled={absSaving}>Löschen</button>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <div><div style={lbl}>Von</div><input type="date" value={absFrom} onChange={e=>setAbsFrom(e.target.value)} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
          <div><div style={lbl}>Bis (optional)</div><input type="date" value={absUntil} onChange={e=>setAbsUntil(e.target.value)} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
        </div>
        <div style={{ marginBottom:12 }}><div style={lbl}>Grund (optional)</div><input value={absReason} onChange={e=>setAbsReason(e.target.value)} placeholder="z.B. Urlaub · Prüfungswoche" maxLength={80} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} /></div>
        <div style={{ display:'flex', justifyContent:'flex-end' }}><SaveButton onClick={saveAbsence} saving={absSaving} saved={absSaved} disabled={!absFrom} t={t} /></div>
      </Card>

      <Card t={t}><SectionTitle t={t}>Berufe</SectionTitle>
        <p style={{ fontSize:12, color:t.accentDim, fontStyle:'italic', marginBottom:'1rem', marginTop:0 }}>Max. 2 Hauptberufe.</p>
        {profs.length === 0
          ? <div style={{ textAlign:'center', padding:'1.5rem', color:t.accentGhost, fontStyle:'italic', fontSize:13 }}>Noch keine Berufe eingetragen.</div>
          : <div style={{ marginBottom:'1rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 1fr auto', gap:8, padding:'0 0 0.4rem', borderBottom:`1px solid ${t.accentFade}`, marginBottom:4 }}>
                {['Beruf','Level','Spezialisierung',''].map((h,i) => <div key={i} style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:t.accentGhost, textTransform:'uppercase' }}>{h}</div>)}
              </div>
              {profs.map((prof,idx) => <ProfessionRow key={idx} prof={prof} t={t} onChange={updated=>{const next=[...profs];next[idx]=updated;setLocalProfs(next)}} onRemove={()=>setLocalProfs(profs.filter((_,i)=>i!==idx))} />)}
            </div>
        }
        <div style={{ display:'flex', gap:8, marginTop:'1rem', alignItems:'center' }}>
          {canAdd && <button className="btn-ghost" style={{ fontSize:10 }} onClick={addProfession}>+ Beruf hinzufügen</button>}
          <SaveButton onClick={saveProfs} saving={profsSaving} saved={profsSaved} t={t} />
        </div>
        <div style={{ marginTop:'0.8rem', fontSize:11, color:t.accentGhost, fontStyle:'italic' }}>{primaryCount}/2 Hauptberufe · {profs.filter(p=>SECONDARY_PROFS.includes(p.name)).length} Nebenberufe</div>
      </Card>

      <Card t={t}><SectionTitle t={t}>Passwort ändern</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:380 }}>
          {[['Aktuelles Passwort',pwCurrent,setPwCurrent,'current-password'],['Neues Passwort',pwNew,setPwNew,'new-password'],['Neues Passwort wiederholen',pwConfirm,setPwConfirm,'new-password']].map(([label,val,setter,ac],i) => (
            <div key={i}><div style={lbl}>{label}</div><input type="password" value={val} onChange={e=>setter(e.target.value)} placeholder="••••••••" autoComplete={ac} style={{ fontSize:12, width:'100%', boxSizing:'border-box' }} onKeyDown={i===2?e=>e.key==='Enter'&&handleChangePassword():undefined} /></div>
          ))}
          {pwMsg && <div style={{ fontSize:12, color:pwMsg.ok?'#4a9a5a':'#e08080', fontStyle:'italic' }}>{pwMsg.ok?'✓ ':'✕ '}{pwMsg.text}</div>}
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button style={{ fontSize:11, padding:'7px 18px', fontFamily:'Cinzel,serif', letterSpacing:1, textTransform:'uppercase', cursor:'pointer', background:`linear-gradient(135deg,${t.accentFade},${t.bgDark})`, border:`1px solid ${t.accent}`, color:t.accentSoft, borderRadius:2, opacity:pwSaving||!pwCurrent||!pwNew||!pwConfirm?0.6:1 }}
              onClick={handleChangePassword} disabled={pwSaving||!pwCurrent||!pwNew||!pwConfirm}>
              {pwSaving?'Speichern...':'Passwort ändern'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
