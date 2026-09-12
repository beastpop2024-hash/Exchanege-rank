import React, { useMemo, useState } from 'react'

const EXCHANGES = [
  { name: 'Binance', score: 9.7, volume: 14_820_000_000, pairs: 1683, country: 'Global' },
  { name: 'Coinbase Exchange', score: 9.2, volume: 2_410_000_000, pairs: 412, country: 'United States' },
  { name: 'Kraken', score: 8.9, volume: 1_180_000_000, pairs: 638, country: 'United States' },
  { name: 'OKX', score: 8.7, volume: 3_960_000_000, pairs: 758, country: 'Seychelles' },
  { name: 'Bybit', score: 8.4, volume: 3_140_000_000, pairs: 604, country: 'UAE' },
  { name: 'Bitstamp', score: 8.1, volume: 286_000_000, pairs: 214, country: 'Luxembourg' },
  { name: 'Gemini', score: 7.8, volume: 94_000_000, pairs: 148, country: 'United States' },
  { name: 'KuCoin', score: 7.5, volume: 1_020_000_000, pairs: 1241, country: 'Seychelles' },
]

const usd = (value) =>
  '$' + new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value)

export default function App() {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('score')

  const rows = useMemo(() => {
    return EXCHANGES.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase())).sort(
      (a, b) => b[sortBy] - a[sortBy],
    )
  }, [query, sortBy])

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 32, letterSpacing: '-0.02em' }}>Exchange Rank</h1>
        <p style={{ margin: 0, color: '#5b6676', fontSize: 15 }}>
          Trust scores and 24h spot volume across major crypto exchanges.
        </p>
      </header>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exchanges"
          style={{
            flex: '1 1 240px',
            padding: '10px 14px',
            border: '1px solid #d7dde5',
            borderRadius: 8,
            fontSize: 14,
            background: '#fff',
          }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '10px 14px',
            border: '1px solid #d7dde5',
            borderRadius: 8,
            fontSize: 14,
            background: '#fff',
          }}
        >
          <option value="score">Sort by trust score</option>
          <option value="volume">Sort by 24h volume</option>
          <option value="pairs">Sort by pairs</option>
        </select>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e4e9ef', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f1f4f8', textAlign: 'left', color: '#5b6676' }}>
              <th style={{ padding: '12px 16px', width: 56 }}>#</th>
              <th style={{ padding: '12px 16px' }}>Exchange</th>
              <th style={{ padding: '12px 16px' }}>Trust score</th>
              <th style={{ padding: '12px 16px' }}>24h volume</th>
              <th style={{ padding: '12px 16px' }}>Pairs</th>
              <th style={{ padding: '12px 16px' }}>Jurisdiction</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.name} style={{ borderTop: '1px solid #edf1f5' }}>
                <td style={{ padding: '12px 16px', color: '#8b95a3' }}>{i + 1}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.name}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: row.score >= 9 ? '#e6f4ec' : row.score >= 8 ? '#eef2fb' : '#f4f1e8',
                      color: row.score >= 9 ? '#1d7a48' : row.score >= 8 ? '#2b4c9b' : '#7a5d1d',
                      fontWeight: 600,
                    }}
                  >
                    {row.score.toFixed(1)}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>{usd(row.volume)}</td>
                <td style={{ padding: '12px 16px' }}>{row.pairs}</td>
                <td style={{ padding: '12px 16px', color: '#5b6676' }}>{row.country}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: '#8b95a3' }}>
                  No exchanges match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
