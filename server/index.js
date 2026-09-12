import http from 'node:http'

const PORT = Number(process.env.API_PORT || 8787)
const CG = 'https://api.coingecko.com/api/v3'
const TTL_MS = 90_000

/** @type {Map<string, {at:number, data:any}>} */
const cache = new Map()

async function cgFetch(path) {
  const hit = cache.get(path)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data

  const res = await fetch(CG + path, {
    headers: { accept: 'application/json', 'user-agent': 'exchange-rank/1.0' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) {
    if (hit) return hit.data // serve stale rather than fail
    throw Object.assign(new Error(`CoinGecko ${res.status}`), { status: res.status })
  }
  const data = await res.json()
  cache.set(path, { at: Date.now(), data })
  return data
}

const routes = {
  '/api/exchanges': async () => {
    const [exchanges, btc] = await Promise.all([
      cgFetch('/exchanges?per_page=100&page=1'),
      cgFetch('/simple/price?ids=bitcoin&vs_currencies=usd'),
    ])
    const btcUsd = btc?.bitcoin?.usd ?? null
    return {
      btcUsd,
      updatedAt: new Date().toISOString(),
      exchanges: exchanges.map((e) => ({
        id: e.id,
        name: e.name,
        image: e.image,
        country: e.country,
        yearEstablished: e.year_established,
        url: e.url,
        trustScore: e.trust_score,
        trustRank: e.trust_score_rank,
        volumeBtc: e.trade_volume_24h_btc_normalized ?? e.trade_volume_24h_btc,
        volumeUsd:
          btcUsd == null
            ? null
            : (e.trade_volume_24h_btc_normalized ?? e.trade_volume_24h_btc) * btcUsd,
        centralized: e.centralized !== false,
        incentives: Boolean(e.has_trading_incentive),
      })),
    }
  },

  '/api/coins': async () => {
    const coins = await cgFetch(
      '/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h,7d',
    )
    return {
      updatedAt: new Date().toISOString(),
      coins: coins.map((c) => ({
        id: c.id,
        rank: c.market_cap_rank,
        name: c.name,
        symbol: (c.symbol || '').toUpperCase(),
        image: c.image,
        price: c.current_price,
        change24h: c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h,
        change7d: c.price_change_percentage_7d_in_currency,
        marketCap: c.market_cap,
        volume: c.total_volume,
        high24h: c.high_24h,
        low24h: c.low_24h,
        ath: c.ath,
        athChange: c.ath_change_percentage,
        supply: c.circulating_supply,
        maxSupply: c.max_supply,
        sparkline: (c.sparkline_in_7d?.price || []).filter((_, i) => i % 4 === 0),
      })),
    }
  },

  '/api/global': async () => {
    const g = (await cgFetch('/global'))?.data ?? {}
    return {
      updatedAt: new Date().toISOString(),
      marketCapUsd: g.total_market_cap?.usd ?? null,
      volumeUsd: g.total_volume?.usd ?? null,
      marketCapChange24h: g.market_cap_change_percentage_24h_usd ?? null,
      btcDominance: g.market_cap_percentage?.btc ?? null,
      ethDominance: g.market_cap_percentage?.eth ?? null,
      activeCoins: g.active_cryptocurrencies ?? null,
      markets: g.markets ?? null,
    }
  },

  '/api/health': async () => ({ ok: true, cached: cache.size }),
}

const server = http.createServer(async (req, res) => {
  const path = (req.url || '').split('?')[0]
  res.setHeader('access-control-allow-origin', '*')
  const handler = routes[path]
  if (!handler) {
    res.writeHead(404, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: 'not_found' }))
    return
  }
  try {
    const body = await handler()
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' })
    res.end(JSON.stringify(body))
  } catch (err) {
    res.writeHead(err.status === 429 ? 429 : 502, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: 'upstream_unavailable', message: String(err.message || err) }))
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[api] listening on http://0.0.0.0:${PORT}`)
})
