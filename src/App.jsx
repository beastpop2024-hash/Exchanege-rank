import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { theme } from './theme.js'
import { fmtNum, fmtPct, fmtTime, fmtUsd } from './format.js'
import { Delta, Logo, ScorePill, SkeletonRows, Sparkline, Tag } from './ui.jsx'

const REFRESH_MS = 120_000

function useEndpoint(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true })

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const res = await fetch(path, { headers: { accept: 'application/json' } })
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const data = await res.json()
        setState({ data, error: null, loading: false })
      } catch (err) {
        setState((s) => ({ data: s.data, error: err.message || 'Request failed', loading: false }))
      }
    },
    [path],
  )

  useEffect(() => {
    load()
    const id = setInterval(() => load(true), REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  return { ...state, reload: () => load(false) }
}

const card = {
  background: theme.surface,
  border: `1px solid ${theme.borderSoft}`,
  borderRadius: 14,
}

const th = {
  padding: '12px 16px',
  textAlign: 'left',
  color: theme.textMuted,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  background: theme.bgSoft,
  position: 'sticky',
  top: 0,
}

const td = { padding: '14px 16px', fontSize: 14, whiteSpace: 'nowrap' }
const num = { ...td, fontVariantNumeric: 'tabular-nums' }

function SortHeader({ label, field, sort, setSort, align = 'left', width }) {
  const active = sort.field === field
  return (
    <th style={{ ...th, textAlign: align, width }}>
      <button
        className="sortable"
        onClick={() => setSort({ field, dir: active && sort.dir === 'desc' ? 'asc' : 'desc' })}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          font: 'inherit',
          letterSpacing: 'inherit',
          textTransform: 'inherit',
          color: active ? theme.text : theme.textMuted,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
        }}
        aria-label={`Sort by ${label}`}
      >
        {label}
        <span style={{ fontSize: 9, opacity: active ? 1 : 0.35 }}>{active && sort.dir === 'asc' ? '▲' : '▼'}</span>
      </button>
    </th>
  )
}

function StatCard({ label, value, sub, delta }) {
  return (
    <div style={{ ...card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <span style={{ color: theme.textMuted, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <strong style={{ fontSize: 22, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>{value}</strong>
      <span style={{ fontSize: 12, color: theme.textFaint, display: 'flex', gap: 8, alignItems: 'center' }}>
        {delta != null && <Delta value={delta} size={12} />}
        {sub}
      </span>
    </div>
  )
}

function Notice({ message, onRetry }) {
  return (
    <div
      role="alert"
      style={{
        ...card,
        borderColor: `${theme.warn}55`,
        background: `${theme.warn}12`,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        fontSize: 13,
      }}
    >
      <span style={{ color: theme.warn }}>
        Live data unavailable: {message}. Showing the last values we received.
      </span>
      <button
        onClick={onRetry}
        style={{
          background: theme.surfaceAlt,
          border: `1px solid ${theme.border}`,
          color: theme.text,
          padding: '6px 12px',
          borderRadius: 8,
          fontSize: 13,
        }}
      >
        Retry
      </button>
    </div>
  )
}

function ExchangesTable({ rows, loading }) {
  const [sort, setSort] = useState({ field: 'trustRank', dir: 'asc' })

  const sorted = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = a[sort.field]
      const bv = b[sort.field]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'string') return av.localeCompare(bv) * dir
      return (av - bv) * dir
    })
  }, [rows, sort])

  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <SortHeader label="Rank" field="trustRank" sort={sort} setSort={setSort} width={88} />
              <SortHeader label="Exchange" field="name" sort={sort} setSort={setSort} />
              <SortHeader label="Trust score" field="trustScore" sort={sort} setSort={setSort} />
              <SortHeader label="24h volume" field="volumeUsd" sort={sort} setSort={setSort} align="right" />
              <SortHeader label="24h volume (BTC)" field="volumeBtc" sort={sort} setSort={setSort} align="right" />
              <SortHeader label="Founded" field="yearEstablished" sort={sort} setSort={setSort} align="right" />
              <th style={th}>Country</th>
              <th style={{ ...th, textAlign: 'right' }}>Type</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && <SkeletonRows rows={10} cols={8} />}
            {sorted.map((e) => (
              <tr key={e.id} className="row-hover" style={{ borderTop: `1px solid ${theme.borderSoft}` }}>
                <td style={{ ...num, color: theme.textFaint }}>#{e.trustRank ?? '—'}</td>
                <td style={td}>
                  <a
                    href={e.url || '#'}
                    target="_blank"
                    rel="noreferrer noopener"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
                  >
                    <Logo src={e.image} alt={e.name} size={28} />
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 600 }}>{e.name}</span>
                      <span style={{ fontSize: 11, color: theme.textFaint }}>{e.id}</span>
                    </span>
                  </a>
                </td>
                <td style={td}>
                  <ScorePill score={e.trustScore} />
                </td>
                <td style={{ ...num, textAlign: 'right', fontWeight: 600 }}>{fmtUsd(e.volumeUsd, { compact: true })}</td>
                <td style={{ ...num, textAlign: 'right', color: theme.textMuted }}>
                  {fmtNum(e.volumeBtc, { compact: true, maximumFractionDigits: 2 })} BTC
                </td>
                <td style={{ ...num, textAlign: 'right', color: theme.textMuted }}>{e.yearEstablished ?? '—'}</td>
                <td style={{ ...td, color: theme.textMuted }}>{e.country || 'Not disclosed'}</td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <Tag tone={e.centralized ? theme.textMuted : theme.up}>{e.centralized ? 'CEX' : 'DEX'}</Tag>
                </td>
              </tr>
            ))}
            {!loading && sorted.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', color: theme.textFaint }}>
                  No exchanges match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CoinsTable({ rows, loading }) {
  const [sort, setSort] = useState({ field: 'rank', dir: 'asc' })

  const sorted = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = a[sort.field]
      const bv = b[sort.field]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'string') return av.localeCompare(bv) * dir
      return (av - bv) * dir
    })
  }, [rows, sort])

  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <SortHeader label="#" field="rank" sort={sort} setSort={setSort} width={64} />
              <SortHeader label="Asset" field="name" sort={sort} setSort={setSort} />
              <SortHeader label="Price" field="price" sort={sort} setSort={setSort} align="right" />
              <SortHeader label="24h" field="change24h" sort={sort} setSort={setSort} align="right" />
              <SortHeader label="7d" field="change7d" sort={sort} setSort={setSort} align="right" />
              <SortHeader label="Market cap" field="marketCap" sort={sort} setSort={setSort} align="right" />
              <SortHeader label="24h volume" field="volume" sort={sort} setSort={setSort} align="right" />
              <th style={{ ...th, textAlign: 'right' }}>7d trend</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && <SkeletonRows rows={10} cols={8} />}
            {sorted.map((c) => (
              <tr key={c.id} className="row-hover" style={{ borderTop: `1px solid ${theme.borderSoft}` }}>
                <td style={{ ...num, color: theme.textFaint }}>{c.rank ?? '—'}</td>
                <td style={td}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Logo src={c.image} alt={c.name} size={26} rounded={999} />
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: theme.textFaint, letterSpacing: '0.04em' }}>{c.symbol}</span>
                    </span>
                  </span>
                </td>
                <td style={{ ...num, textAlign: 'right', fontWeight: 600 }}>{fmtUsd(c.price)}</td>
                <td style={{ ...num, textAlign: 'right' }}>
                  <Delta value={c.change24h} />
                </td>
                <td style={{ ...num, textAlign: 'right' }}>
                  <Delta value={c.change7d} />
                </td>
                <td style={{ ...num, textAlign: 'right' }}>{fmtUsd(c.marketCap, { compact: true })}</td>
                <td style={{ ...num, textAlign: 'right', color: theme.textMuted }}>
                  {fmtUsd(c.volume, { compact: true })}
                </td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <Sparkline points={c.sparkline} positive={(c.change7d ?? 0) >= 0} />
                </td>
              </tr>
            ))}
            {!loading && sorted.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', color: theme.textFaint }}>
                  No assets match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('exchanges')
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')

  const global = useEndpoint('/api/global')
  const exchanges = useEndpoint('/api/exchanges')
  const coins = useEndpoint('/api/coins')

  const exchangeRows = useMemo(() => {
    const list = exchanges.data?.exchanges ?? []
    const q = query.trim().toLowerCase()
    return list.filter((e) => {
      const matches = !q || e.name.toLowerCase().includes(q) || (e.country || '').toLowerCase().includes(q)
      const kindOk = kind === 'all' || (kind === 'cex' ? e.centralized : !e.centralized)
      return matches && kindOk
    })
  }, [exchanges.data, query, kind])

  const coinRows = useMemo(() => {
    const list = coins.data?.coins ?? []
    const q = query.trim().toLowerCase()
    return list.filter((c) => !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
  }, [coins.data, query])

  const g = global.data
  const active = tab === 'exchanges' ? exchanges : coins
  const topExchange = useMemo(
    () => (exchanges.data?.exchanges ?? []).slice().sort((a, b) => (a.trustRank ?? 999) - (b.trustRank ?? 999))[0],
    [exchanges.data],
  )
  const totalExchangeVolume = useMemo(
    () => (exchanges.data?.exchanges ?? []).reduce((sum, e) => sum + (e.volumeUsd || 0), 0),
    [exchanges.data],
  )

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 24px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              aria-hidden="true"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: `linear-gradient(160deg, ${theme.accent}, #2f6ee0)`,
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              ER
            </span>
            <h1 style={{ margin: 0, fontSize: 30, letterSpacing: '-0.02em' }}>Exchange Rank</h1>
          </span>
          <p style={{ margin: 0, color: theme.textMuted, fontSize: 14, maxWidth: 620 }}>
            Live trust scores, spot volume and market data for the top crypto exchanges and assets. Official logos and
            figures sourced directly from the CoinGecko public API.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: theme.textFaint }}>
            Updated {fmtTime(active.data?.updatedAt)}
          </span>
          <button
            onClick={() => {
              global.reload()
              exchanges.reload()
              coins.reload()
            }}
            style={{
              background: theme.accentSoft,
              border: `1px solid ${theme.accent}55`,
              color: theme.text,
              padding: '9px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {active.loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      <section
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}
        aria-label="Global market statistics"
      >
        <StatCard
          label="Global market cap"
          value={g ? fmtUsd(g.marketCapUsd, { compact: true }) : '—'}
          delta={g?.marketCapChange24h}
          sub="24h change"
        />
        <StatCard
          label="Global 24h volume"
          value={g ? fmtUsd(g.volumeUsd, { compact: true }) : '—'}
          sub={g ? `${fmtNum(g.markets)} tracked markets` : ''}
        />
        <StatCard
          label="BTC dominance"
          value={g?.btcDominance != null ? fmtPct(g.btcDominance).replace('+', '') : '—'}
          sub={g?.ethDominance != null ? `ETH ${g.ethDominance.toFixed(1)}%` : ''}
        />
        <StatCard
          label="Top 100 exchange volume"
          value={totalExchangeVolume ? fmtUsd(totalExchangeVolume, { compact: true }) : '—'}
          sub={exchanges.data?.btcUsd ? `BTC ${fmtUsd(exchanges.data.btcUsd)}` : ''}
        />
        <StatCard
          label="Highest trust score"
          value={topExchange ? topExchange.name : '—'}
          sub={topExchange?.trustScore != null ? `Score ${topExchange.trustScore.toFixed(1)} / 10` : ''}
        />
      </section>

      {active.error && <Notice message={active.error} onRetry={active.reload} />}

      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div role="tablist" aria-label="Data set" style={{ display: 'flex', gap: 6, background: theme.surface, border: `1px solid ${theme.borderSoft}`, padding: 4, borderRadius: 12 }}>
          {[
            ['exchanges', `Exchanges${exchanges.data ? ` (${exchanges.data.exchanges.length})` : ''}`],
            ['coins', `Assets${coins.data ? ` (${coins.data.coins.length})` : ''}`],
          ].map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              style={{
                background: tab === id ? theme.accentSoft : 'transparent',
                border: tab === id ? `1px solid ${theme.accent}55` : '1px solid transparent',
                color: tab === id ? theme.text : theme.textMuted,
                padding: '8px 16px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: '1 1 320px', justifyContent: 'flex-end' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === 'exchanges' ? 'Search exchange or country' : 'Search asset or symbol'}
            aria-label="Search"
            style={{
              flex: '1 1 240px',
              maxWidth: 360,
              padding: '10px 14px',
              background: theme.surface,
              border: `1px solid ${theme.borderSoft}`,
              borderRadius: 10,
              fontSize: 14,
            }}
          />
          {tab === 'exchanges' && (
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              aria-label="Exchange type"
              style={{
                padding: '10px 14px',
                background: theme.surface,
                border: `1px solid ${theme.borderSoft}`,
                borderRadius: 10,
                fontSize: 14,
              }}
            >
              <option value="all">All types</option>
              <option value="cex">Centralized only</option>
              <option value="dex">Decentralized only</option>
            </select>
          )}
        </div>
      </section>

      {tab === 'exchanges' ? (
        <ExchangesTable rows={exchangeRows} loading={exchanges.loading} />
      ) : (
        <CoinsTable rows={coinRows} loading={coins.loading} />
      )}

      <footer style={{ color: theme.textFaint, fontSize: 12, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <span>
          Data and logos: CoinGecko public API. Volume is 24h normalized spot volume; USD values use the live BTC price.
        </span>
        <span>Auto-refreshes every 2 minutes.</span>
      </footer>
    </div>
  )
}
