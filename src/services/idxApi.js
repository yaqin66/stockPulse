// Semua panggilan ke backend proxy melalui Vite dev proxy (/api → localhost:3001)
const BASE = '/api'


async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Server error')
  return json.data
}

// ── Pengumuman ─────────────────────────────────────────────────────────────────
export async function getAnnouncements(ticker, { indexFrom = 0, pageSize = 10, dateFrom, dateTo, keyword = '' } = {}) {
  const params = new URLSearchParams({ indexFrom, pageSize, keyword })
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)
  return fetchJSON(`${BASE}/announcement/${ticker}?${params}`)
}

// ── Trade Harian ───────────────────────────────────────────────────────────────
export async function getTradingDaily(ticker) {
  return fetchJSON(`${BASE}/trading-daily/${ticker}`)
}

// ── History Trading ────────────────────────────────────────────────────────────
export async function getTradingHistory(ticker, { start = 0, length = 100 } = {}) {
  return fetchJSON(`${BASE}/trading-history/${ticker}?start=${start}&length=${length}`)
}

// ── Grafik Saham ───────────────────────────────────────────────────────────────
export async function getStockChart(ticker, period = '1Y') {
  return fetchJSON(`${BASE}/chart/${ticker}/${period}`)
}
