import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, doc, onSnapshot,
  query, orderBy, serverTimestamp, setDoc, writeBatch
} from 'firebase/firestore'
import { writeLog } from '../utils/auditLog'
import { useAuth } from '../contexts/AuthContext'

export const COIN_TYPES = {
  DEPOSIT:    { label: 'Gold-Einzahlung',    icon: '🏦', color: '#c8a84b', sign: +1 },
  BONUS:      { label: 'Bonus',              icon: '⭐', color: '#4a9a5a', sign: +1 },
  PURCHASE:   { label: 'Shop-Kauf',          icon: '🛒', color: '#C41E3A', sign: -1 },
  PENALTY:    { label: 'Abzug',              icon: '⚠️', color: '#c07040', sign: -1 },
  CASINO_IN:  { label: 'Casino-Einzahlung',  icon: '🎰', color: '#8788EE', sign: -1 },
  CASINO_OUT: { label: 'Casino-Auszahlung',  icon: '💎', color: '#38b8c8', sign: +1 },
  MANUAL:     { label: 'Manuelle Anpassung', icon: '✏️', color: '#8788EE', sign: +1 },
  RESET:      { label: 'Reset',              icon: '🔄', color: '#5a4828', sign:  0 },
}

export const DEFAULT_ECONOMY = {
  currencyName:    'Gilden-Taler',
  currencyIcon:    '🪙',
  silverName:      'Silbermünze',
  silverIcon:      '🥈',
  copperName:      'Kupferstück',
  copperIcon:      '🟤',
  copperPerSilver: 100,
  silverPerGold:   100,
  chipName:        'Casino-Perlen',
  chipIcon:        '🔮',
  chipsPerGold:    25,
  eventRate:       null,
  eventRateActive: false,
  eventRateLabel:  '',
  eventRateUntil:  '',
}

export function copperToCoins(totalCopper, config = DEFAULT_ECONOMY) {
  const cps = config.copperPerSilver || 100
  const spg = config.silverPerGold   || 100
  const gold   = Math.floor(totalCopper / (cps * spg))
  const silver = Math.floor((totalCopper % (cps * spg)) / cps)
  const copper = totalCopper % cps
  return { gold, silver, copper }
}

export function coinsToCopper(gold, silver, copper, config = DEFAULT_ECONOMY) {
  const cps = config.copperPerSilver || 100
  const spg = config.silverPerGold   || 100
  return (gold * spg * cps) + (silver * cps) + copper
}

export function formatCoins(totalCopper, config = DEFAULT_ECONOMY) {
  if (totalCopper === 0) return `0 ${config.currencyIcon}`
  const { gold, silver, copper } = copperToCoins(Math.abs(totalCopper), config)
  const parts = []
  if (gold   > 0) parts.push(`${gold} ${config.currencyIcon}`)
  if (silver > 0) parts.push(`${silver} ${config.silverIcon}`)
  if (copper > 0) parts.push(`${copper} ${config.copperIcon}`)
  return (totalCopper < 0 ? '-' : '') + parts.join(' ')
}

export function getChipRate(config = DEFAULT_ECONOMY) {
  if (config.eventRateActive && config.eventRate) {
    if (config.eventRateUntil) {
      if (new Date(config.eventRateUntil) > new Date())
        return { rate: config.eventRate, isEvent: true }
    } else {
      return { rate: config.eventRate, isEvent: true }
    }
  }
  return { rate: config.chipsPerGold || 25, isEvent: false }
}

export function useEconomy() {
  const [transactions, setTransactions] = useState([])
  const [config,       setConfig]       = useState(DEFAULT_ECONOMY)
  const [loading,      setLoading]      = useState(true)
  const { currentUser } = useAuth()
  const by = currentUser?.username || 'system'

  useEffect(() => {
    const q = query(collection(db, 'economy'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => { console.warn('Economy:', err.message); setLoading(false) })
  }, [])

  useEffect(() => {
    return onSnapshot(doc(db, 'config', 'economy'), snap => {
      if (snap.exists()) setConfig(prev => ({ ...DEFAULT_ECONOMY, ...prev, ...snap.data() }))
    })
  }, [])

  function getBalance(userId) {
    const sorted = [...transactions.filter(t => t.userId === userId)].reverse()
    let bal = 0
    for (const tx of sorted) {
      if (tx.type === 'RESET') { bal = 0; continue }
      const type = COIN_TYPES[tx.type]
      if (type) bal += tx.amount * type.sign
    }
    return bal
  }

  function getAllBalances(users) {
    const balances = {}
    users.forEach(u => { balances[u.id] = 0 })
    const sorted = [...transactions].reverse()
    sorted.forEach(tx => {
      if (!(tx.userId in balances)) return
      if (tx.type === 'RESET') { balances[tx.userId] = 0; return }
      const type = COIN_TYPES[tx.type]
      if (type) balances[tx.userId] += tx.amount * type.sign
    })
    return balances
  }

  function getChipBalance(userId) {
    return transactions
      .filter(t => t.userId === userId && t.chips != null)
      .reduce((sum, tx) => {
        if (tx.type === 'CASINO_IN')  return sum - tx.chips
        if (tx.type === 'CASINO_OUT') return sum + tx.chips
        return sum
      }, 0)
  }

  const addTransaction = useCallback(async ({ userId, username, type, amount, reason }) => {
    await addDoc(collection(db, 'economy'), {
      userId, username, type,
      amount:    Math.abs(amount),
      reason:    reason?.trim() || COIN_TYPES[type]?.label || '',
      createdBy: by,
      createdAt: serverTimestamp(),
    })
    await writeLog('ECONOMY_TX', { userId, username, type, amount, reason }, by)
  }, [by])

  const giveCoins = useCallback(async ({ userId, username, gold, silver, copper, type, reason }) => {
    const total = coinsToCopper(gold || 0, silver || 0, copper || 0, config)
    await addTransaction({ userId, username, type: type || 'MANUAL', amount: total, reason })
  }, [addTransaction, config])

  const bulkGive = useCallback(async ({ userIds, users, gold, silver, copper, reason }) => {
    const total = coinsToCopper(gold || 0, silver || 0, copper || 0, config)
    const batch = writeBatch(db)
    for (const userId of userIds) {
      const user = users.find(u => u.id === userId)
      if (!user) continue
      const ref = doc(collection(db, 'economy'))
      batch.set(ref, {
        userId, username: user.username || user.name,
        type: 'BONUS', amount: total,
        reason: reason || 'Bonus',
        createdBy: by, createdAt: serverTimestamp(),
      })
    }
    await batch.commit()
  }, [config, by])

  const purchaseItem = useCallback(async ({ userId, username, itemName, price }) => {
    await addTransaction({ userId, username, type: 'PURCHASE', amount: price, reason: `Shop: ${itemName}` })
  }, [addTransaction])

  const resetUser = useCallback(async (userId, username) => {
    await addDoc(collection(db, 'economy'), {
      userId, username, type: 'RESET', amount: 0,
      reason: 'Reset durch Admin', createdBy: by, createdAt: serverTimestamp(),
    })
  }, [by])

  const saveConfig = useCallback(async (newConfig) => {
    await setDoc(doc(db, 'config', 'economy'), newConfig, { merge: true })
    await writeLog('ECONOMY_CONFIG', { changed: Object.keys(newConfig) }, by)
  }, [by])

  return {
    transactions, config, loading,
    getBalance, getAllBalances, getChipBalance,
    addTransaction, giveCoins, bulkGive, purchaseItem, resetUser, saveConfig,
    formatCoins:   (copper) => formatCoins(copper, config),
    copperToCoins: (copper) => copperToCoins(copper, config),
    coinsToCopper: (g, s, c) => coinsToCopper(g, s, c, config),
    getChipRate:   () => getChipRate(config),
  }
}
