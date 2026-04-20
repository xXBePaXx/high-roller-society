import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { logAudit } from '../utils/auditLog'

const DEFAULT_INFO = {
  rules: `# Gildenregeln

## Allgemeines
- Respektvoller Umgang miteinander ist Pflicht
- Keine Beleidigungen, kein Drama — weder im Spiel noch im Discord
- Inaktivität über 4 Wochen ohne Abmeldung kann zum Ausschluss führen

## Raiding
- Raidzeiten: **Mittwoch & Donnerstag 20:00–23:00 Uhr** (CEST)
- Erscheint **5 Minuten vor Raidbeginn** eingeloggt und am Eingang
- Bringt eigene Konsumables mit (Tränke, Flasks, Food)
- Abmeldungen bitte **24h vorher** im Kalender eintragen

## Loot & DKP
- Loot wird per **DKP-System** vergeben — höchstes Gebot gewinnt
- Hauptcharakter hat Vorrang vor Twinks
- Loot-Entscheidungen des Raidlead sind bindend

## Kommunikation
- Discord ist Pflicht — zumindest zum Zuhören während Raids
- Gildenbank steht allen zur Verfügung — bitte nicht übertreiben`,

  raidTimes: 'Mittwoch & Donnerstag · 20:00 – 23:00 Uhr CEST',
  discord:   '',
  contact:   '',
}

export function useGuildInfo() {
  const [info, setInfo]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'guildInfo'), snap => {
      setInfo(snap.exists() ? { ...DEFAULT_INFO, ...snap.data() } : DEFAULT_INFO)
      setLoading(false)
    })
    return unsub
  }, [])

  async function saveGuildInfo(data, author) {
    await setDoc(doc(db, 'config', 'guildInfo'), data, { merge: true })
    await logAudit('guild_info_update', author, {})
  }

  return { info: info || DEFAULT_INFO, loading, saveGuildInfo }
}
