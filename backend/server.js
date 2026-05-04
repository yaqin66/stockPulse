const express = require('express')
const cors = require('cors')
const puppeteer = require('puppeteer')

const app = express()
const PORT = 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())

// ─────────────────────────────────────────────────────────────────────────────
// Simple In-Memory Cache  (TTL per kategori)
// ─────────────────────────────────────────────────────────────────────────────
const cache = new Map()

const TTL = {
  announcement:    5  * 60 * 1000,   // 5 menit
  'trading-daily': 1  * 60 * 1000,   // 1 menit (data real-time)
  'trading-history': 10 * 60 * 1000, // 10 menit
  chart:           5  * 60 * 1000,   // 5 menit
}

function cacheGet(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null }
  return entry.data
}

function cacheSet(key, data, ttl) {
  cache.set(key, { data, expiresAt: Date.now() + ttl })
}

// ─────────────────────────────────────────────────────────────────────────────
// Browser Singleton — 1 Chromium untuk semua request
// ─────────────────────────────────────────────────────────────────────────────
let browser = null
let browserInitialized = false
let initPromise = null

const REAL_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Stealth script — jalankan di setiap page baru
const STEALTH_SCRIPT = () => {
  // Hapus tanda automation
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  delete navigator.__proto__.webdriver

  // Fake chrome object
  window.chrome = {
    runtime: {},
    loadTimes: () => ({}),
    csi: () => ({}),
    app: {},
  }

  // Fake plugins (browser asli punya plugins)
  Object.defineProperty(navigator, 'plugins', {
    get: () => {
      const plugins = [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
        { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
      ]
      plugins.refresh = () => {}
      return plugins
    },
  })

  // Bahasa Indonesia
  Object.defineProperty(navigator, 'languages', { get: () => ['id-ID', 'id', 'en-US', 'en'] })
  Object.defineProperty(navigator, 'language', { get: () => 'id-ID' })

  // Permissions API (Headless Chrome biasanya return 'denied' secara default)
  const originalQuery = window.navigator.permissions.query
  window.navigator.permissions.query = (params) =>
    params.name === 'notifications'
      ? Promise.resolve({ state: Notification.permission })
      : originalQuery(params)
}

async function initBrowser() {
  console.log('🌐 Launching Chromium browser (headless mode)...')

  browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1366,768',
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: { width: 1366, height: 768 },
  })

  // ── Warm-up: kunjungi idx.co.id untuk dapat cookies & session token ───────
  console.log('🍪 Warm-up session: membuka idx.co.id...')
  const warmPage = await browser.newPage()
  await warmPage.evaluateOnNewDocument(STEALTH_SCRIPT)
  await warmPage.setUserAgent(REAL_UA)

  try {
    await warmPage.goto('https://www.idx.co.id/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    // Tunggu sebentar supaya JavaScript IDX selesai set cookie
    await new Promise(r => setTimeout(r, 3000))
    const cookies = await warmPage.cookies()
    console.log(`✅ Warm-up selesai. Dapat ${cookies.length} cookies dari IDX.`)
  } catch (e) {
    console.warn('⚠️  Warm-up gagal:', e.message)
  } finally {
    await warmPage.close()
  }

  browserInitialized = true
}

initPromise = initBrowser().catch(e => {
  console.error('❌ Puppeteer gagal start:', e.message)
  process.exit(1)
})

// ─────────────────────────────────────────────────────────────────────────────
// fetchIDXJson — buka tab, navigate ke API URL, ambil JSON
// ─────────────────────────────────────────────────────────────────────────────
async function fetchIDXJson(url) {
  if (!browserInitialized) await initPromise

  const page = await browser.newPage()

  try {
    // Stealth di setiap page
    await page.evaluateOnNewDocument(STEALTH_SCRIPT)
    await page.setUserAgent(REAL_UA)
    await page.setViewport({ width: 1366, height: 768 })

    // Header seperti browser asli yang request AJAX dari idx.co.id
    await page.setExtraHTTPHeaders({
      Referer: 'https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/',
      Origin: 'https://www.idx.co.id',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'X-Requested-With': 'XMLHttpRequest',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    })

    // Tangkap JSON dari network response (lebih cepat daripada parse DOM)
    let capturedData = null
    const responseHandler = async (response) => {
      try {
        if (response.url() === url && response.status() === 200) {
          const ct = response.headers()['content-type'] || ''
          if (ct.includes('json') || ct.includes('text')) {
            capturedData = await response.json().catch(() => null)
          }
        }
      } catch {}
    }
    page.on('response', responseHandler)

    const res = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    if (res.status() === 403) {
      throw new Error(`IDX mengembalikan 403 — mungkin perlu warm-up ulang`)
    }

    // Kalau intercept berhasil
    if (capturedData) return capturedData

    // Fallback: ambil teks dari body
    const text = await page.evaluate(
      () => (document.body.innerText || document.body.textContent || '').trim()
    )
    return JSON.parse(text)
  } finally {
    page.removeAllListeners('response')
    await page.close()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware — tunggu browser siap
// ─────────────────────────────────────────────────────────────────────────────
app.use(async (_req, res, next) => {
  if (!browserInitialized) {
    try { await initPromise } catch {}
  }
  if (!browserInitialized) {
    return res.status(503).json({ success: false, error: 'Browser belum siap, tunggu beberapa detik' })
  }
  next()
})

const ok = (res, data) => res.json({ success: true, data })
const fail = (res, msg, code = 500) => res.status(code).json({ success: false, error: msg })

// ─────────────────────────────────────────────────────────────────────────────
// Helper: wrap dengan cache
// ─────────────────────────────────────────────────────────────────────────────
async function cachedFetch(cacheKey, category, urlFn, res) {
  const cached = cacheGet(cacheKey)
  if (cached) {
    console.log(`[cache HIT] ${cacheKey}`)
    return ok(res, cached)
  }

  try {
    const url = typeof urlFn === 'string' ? urlFn : urlFn()
    console.log(`[fetch] ${cacheKey}`)
    const data = await fetchIDXJson(url)
    cacheSet(cacheKey, data, TTL[category])
    ok(res, data)
  } catch (e) {
    console.error(`[${category}]`, e.message)
    fail(res, e.message)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PENGUMUMAN
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/announcement/:ticker', async (req, res) => {
  const { ticker } = req.params
  const { indexFrom = 0, pageSize = 10, keyword = '', lang = 'id', dateFrom, dateTo } = req.query

  const now = new Date()
  const toDate   = dateTo   || now.toISOString().slice(0, 10).replace(/-/g, '')
  const fromDate = dateFrom || (() => {
    const d = new Date(now); d.setFullYear(d.getFullYear() - 1)
    return d.toISOString().slice(0, 10).replace(/-/g, '')
  })()

  const params = new URLSearchParams({
    KodeEmiten: ticker.toUpperCase(), indexFrom, pageSize,
    dateFrom: fromDate, dateTo: toDate, lang, keyword,
  })
  const url = `https://www.idx.co.id/primary/ListedCompany/GetProfileAnnouncement?${params}`
  const key = `ann:${ticker.toUpperCase()}:${fromDate}:${toDate}:${indexFrom}:${keyword}`

  await cachedFetch(key, 'announcement', url, res)
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. TRADE HARIAN
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/trading-daily/:ticker', async (req, res) => {
  const { ticker } = req.params
  const url = `https://www.idx.co.id/primary/ListedCompany/GetTradingInfoDaily?code=${ticker.toUpperCase()}`
  const key = `daily:${ticker.toUpperCase()}`
  await cachedFetch(key, 'trading-daily', url, res)
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. HISTORY TRADING
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/trading-history/:ticker', async (req, res) => {
  const { ticker } = req.params
  const { start = 0, length = 100 } = req.query
  const url = `https://www.idx.co.id/primary/ListedCompany/GetTradingInfoSS?code=${ticker.toLowerCase()}&start=${start}&length=${length}`
  const key = `history:${ticker.toUpperCase()}:${start}:${length}`
  await cachedFetch(key, 'trading-history', url, res)
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. GRAFIK SAHAM
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/chart/:ticker/:period', async (req, res) => {
  const { ticker, period } = req.params
  const validPeriods = ['1D', '1W', '1M', '1Y']
  if (!validPeriods.includes(period.toUpperCase())) {
    return fail(res, `Period tidak valid. Pilih: ${validPeriods.join(', ')}`, 400)
  }
  const url = `https://www.idx.co.id/primary/Helper/GetStockChart?indexCode=${ticker.toUpperCase()}&period=${period.toUpperCase()}`
  const key = `chart:${ticker.toUpperCase()}:${period.toUpperCase()}`
  await cachedFetch(key, 'chart', url, res)
})

// ─────────────────────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'ok',
  browserReady: browserInitialized,
  cacheEntries: cache.size,
  time: new Date().toISOString(),
}))

// Clear cache manual
app.delete('/api/cache', (_, res) => {
  cache.clear()
  res.json({ success: true, msg: 'Cache dikosongkan' })
})

// ─────────────────────────────────────────────────────────────────────────────
// Graceful shutdown
// ─────────────────────────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n${signal} — menutup Chromium...`)
  if (browser) await browser.close()
  process.exit(0)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 StockPulse Backend  →  http://localhost:${PORT}`)
  console.log('   Engine   : Puppeteer (real Chromium browser)')
  console.log('   Strategy : Warm-up IDX session → fetch per tab → cache TTL\n')
})
