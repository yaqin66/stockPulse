import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from 'recharts'
import {
  BarChart2, TrendingUp, TrendingDown, RefreshCw,
  AlertCircle, Activity, Clock, ArrowUpRight, ArrowDownRight,
  Globe, Users, Zap, DollarSign, ChevronLeft, ChevronRight, Target
} from 'lucide-react'
import { getTradingDaily, getTradingHistory, getStockChart } from '../services/idxApi'
import clsx from 'clsx'

// ── Mock Data (sesuai contoh dari user) ───────────────────────────────────────
const MOCK_DAILY = {
  SecurityCode: 'BBCA', BoardCode: 'RG',
  PreviousPrice: 9050, OpeningPrice: 9075, HighestPrice: 9150,
  LowestPrice: 9025, ClosingPrice: 9100, Change: 50,
  TradedVolume: 28_450_000, TradedValue: 258_885_000_000, TradedFrequency: 12_438,
  BestBidPrice: 9100, BestBidVolume: 12_500,
  BestOfferPrice: 9125, BestOfferVolume: 8_700,
  IndividualIndex: 875.4, NumberForeigner: 62.3,
}

const MOCK_HISTORY = {
  KodeEmiten: 'BBCA',
  replies: Array.from({ length: 30 }, (_, i) => {
    const date = new Date('2026-05-03'); date.setDate(date.getDate() - i)
    const base = 9100; const chg = Math.floor((Math.random() - 0.45) * 200)
    const close = base + chg
    return {
      No: i + 1, IDStockSummary: 4000000 + i,
      Date: date.toISOString(),
      StockCode: 'BBCA', StockName: 'Bank Central Asia Tbk.',
      Previous: close - 50, OpenPrice: close - 25, FirstTrade: close - 20,
      High: close + 50, Low: close - 75, Close: close, Change: chg,
      Volume: Math.floor(Math.random() * 40_000_000 + 10_000_000),
      Value: Math.floor(Math.random() * 400_000_000_000 + 100_000_000_000),
      Frequency: Math.floor(Math.random() * 15_000 + 5_000),
      ForeignSell: Math.floor(Math.random() * 5_000_000 + 1_000_000),
      ForeignBuy: Math.floor(Math.random() * 5_000_000 + 1_000_000),
    }
  }),
}

const MOCK_CHART_1Y = {
  ChartData: Array.from({ length: 240 }, (_, i) => {
    const date = new Date('2026-05-03'); date.setDate(date.getDate() - (240 - i))
    const base = 8500; const chg = (Math.random() - 0.45) * 200
    return { Date: date.getTime(), XLabel: String(date.getDate()), Close: Math.max(7500, base + i * 2.5 + chg) }
  }),
}

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtNum = (n) => n != null ? Number(n).toLocaleString('id-ID') : '—'
const fmtVal = (n) => {
  if (n == null) return '—'
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}M`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}Jt`
  return fmtNum(n)
}
const fmtDate = (str) => {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PERIODS = ['1D', '1W', '1M', '1Y']

const StatBox = ({ label, value, icon: Icon, color = 'text-content', sub }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between mb-1">
      <span className="text-content-muted text-xs">{label}</span>
      {Icon && <Icon size={14} className="text-content-muted" />}
    </div>
    <p className={clsx('font-mono font-bold text-lg leading-tight', color)}>{value}</p>
    {sub && <p className="text-content-muted text-[10px] mt-0.5">{sub}</p>}
  </div>
)

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs font-mono">
      <p className="text-content-muted">{label}</p>
      <p className="text-accent font-bold">{fmtNum(payload[0].value)}</p>
    </div>
  )
}

export default function TradingInfoPage() {
  const [ticker, setTicker] = useState('BBCA')
  const [tickerInput, setTickerInput] = useState('BBCA')
  const [period, setPeriod] = useState('1Y')
  const [daily, setDaily] = useState(null)
  const [history, setHistory] = useState(null)
  const [chart, setChart] = useState(null)
  const [loading, setLoading] = useState({ daily: false, history: false, chart: false })
  const [useMock, setUseMock] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)

  const QUICK_TICKERS = ['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'GOTO', 'ANTM', 'ADRO']
  const ITEMS_PER_PAGE = 10

  const loadAll = useCallback(async (t, p) => {
    setLoading({ daily: true, history: true, chart: true })
    setUseMock(false)
    let anyMock = false
    setHistoryPage(1)

    // Daily
    try {
      const d = await getTradingDaily(t)
      setDaily(d?.ClosingPrice != null ? d : null)
      if (d?.ClosingPrice == null) { setDaily(MOCK_DAILY); anyMock = true }
    } catch { setDaily(MOCK_DAILY); anyMock = true }
    setLoading(l => ({ ...l, daily: false }))

    // History
    try {
      const h = await getTradingHistory(t, { length: 60 })
      setHistory(h?.replies?.length ? h : null)
      if (!h?.replies?.length) { setHistory(MOCK_HISTORY); anyMock = true }
    } catch { setHistory(MOCK_HISTORY); anyMock = true }
    setLoading(l => ({ ...l, history: false }))

    // Chart
    try {
      const c = await getStockChart(t, p)
      setChart(c?.ChartData?.length ? c : null)
      if (!c?.ChartData?.length) { setChart(MOCK_CHART_1Y); anyMock = true }
    } catch { setChart(MOCK_CHART_1Y); anyMock = true }
    setLoading(l => ({ ...l, chart: false }))

    if (anyMock) setUseMock(true)
  }, [])

  useEffect(() => { loadAll(ticker, period) }, [ticker, period, loadAll])

  const handleSearch = () => { setTicker(tickerInput.toUpperCase()) }

  // ── Prepare Chart Data ─────────────────────────────────────────────────────
  const chartData = (chart?.ChartData ?? []).map(d => ({
    date: new Date(d.Date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    close: d.Close,
  }))

  const historyReplies = history?.replies ?? []
  const chartFirst = chartData[0]?.close
  const chartLast = chartData[chartData.length - 1]?.close
  const chartUp = chartLast >= chartFirst

  // Daily null check
  const dailyNull = !daily || daily.ClosingPrice == null

  // Pagination logic
  const totalPages = Math.ceil(historyReplies.length / ITEMS_PER_PAGE)
  const currentHistoryPageData = historyReplies.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE)

  // Sinyal Logic
  let bandarSignal = { status: 'Netral', color: 'text-content-muted', bg: 'bg-surface-hover', border: 'border-surface-border', icon: Activity, desc: 'Aktivitas seimbang' }
  let volumeSignal = { status: 'Normal', color: 'text-content-muted', desc: 'Volume rata-rata' }
  let swing1W = { buy: 0, target: 0, sl: 0 }
  let swing1M = { buy: 0, target: 0, sl: 0 }

  if (historyReplies.length > 0 && chartLast) {
    const recent10 = historyReplies.slice(0, 10)
    let netForeign = 0
    let avgVol = 0
    
    recent10.forEach(r => {
      netForeign += (r.ForeignBuy || 0) - (r.ForeignSell || 0)
      avgVol += (r.Volume || 0)
    })
    avgVol /= 10
    const latestVol = historyReplies[0].Volume || 0

    if (netForeign > avgVol * 0.05) {
      bandarSignal = { status: 'Akumulasi Bandar', color: 'text-bull', bg: 'bg-bull/10', border: 'border-bull/30', icon: TrendingUp, desc: 'Asing / Bandar terdeteksi sedang mengumpulkan saham ini.' }
    } else if (netForeign < -avgVol * 0.05) {
      bandarSignal = { status: 'Distribusi Bandar', color: 'text-bear', bg: 'bg-bear/10', border: 'border-bear/30', icon: TrendingDown, desc: 'Asing / Bandar terdeteksi sedang mendistribusikan saham ini.' }
    }

    if (latestVol > avgVol * 1.5) {
      volumeSignal = { status: 'Lonjakan Volume', color: 'text-accent', desc: `Volume terbaru melonjak ${((latestVol - avgVol)/avgVol*100).toFixed(0)}% di atas rata-rata 10 hari.` }
    } else if (latestVol < avgVol * 0.5) {
      volumeSignal = { status: 'Volume Sepi', color: 'text-content-muted', desc: 'Volume transaksi jauh di bawah rata-rata.' }
    }

    // Target Swing (Simulasi simpel menggunakan 2% ATR estimasi)
    const currentPrice = chartLast
    const atr = currentPrice * 0.02

    swing1W = {
      buy: currentPrice,
      target: Math.round((currentPrice + (atr * 2.5)) / 5) * 5,
      sl: Math.round((currentPrice - (atr * 1.5)) / 5) * 5
    }

    swing1M = {
      buy: currentPrice,
      target: Math.round((currentPrice + (atr * 6)) / 5) * 5,
      sl: Math.round((currentPrice - (atr * 2.5)) / 5) * 5
    }
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="text-content font-semibold text-lg flex items-center gap-2">
            <BarChart2 size={18} className="text-accent" /> Informasi Trading IDX
          </h2>
          {useMock && (
            <span className="flex items-center gap-1 text-xs bg-warning/10 text-warning border border-warning/20 px-2 py-0.5 rounded-full">
              <AlertCircle size={10} /> Data Contoh (Backend belum aktif)
            </span>
          )}
          <button onClick={() => loadAll(ticker, period)} className="ml-auto btn-ghost text-xs flex items-center gap-1.5">
            <RefreshCw size={12} className={Object.values(loading).some(Boolean) ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Input + quick pick */}
          <div className="flex gap-2 items-center">
            <input
              type="text" value={tickerInput}
              onChange={e => setTickerInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Kode Saham"
              className="input-dark w-28 uppercase font-mono font-bold"
            />
            <button onClick={handleSearch} className="btn-primary text-xs px-3">Cari</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {QUICK_TICKERS.map(t => (
              <button key={t}
                onClick={() => { setTickerInput(t); setTicker(t) }}
                className={clsx('text-xs px-2 py-1 rounded-md font-mono transition-colors',
                  ticker === t ? 'bg-accent text-white font-bold' : 'bg-surface-hover text-content-muted hover:text-content'
                )}
              >{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Trade Harian ────────────────────────────────────────────────────── */}
      <div className="card p-5">
        <h3 className="text-content font-semibold mb-4 flex items-center gap-2">
          <Activity size={15} className="text-accent" /> Trade Harian — {ticker}
          {loading.daily && <RefreshCw size={12} className="animate-spin text-content-muted" />}
        </h3>

        {dailyNull ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-hover border border-surface-border">
            <AlertCircle size={18} className="text-warning flex-shrink-0" />
            <div>
              <p className="text-content text-sm font-medium">Data Tidak Tersedia</p>
              <p className="text-content-muted text-xs mt-0.5">Pasar mungkin sedang tutup atau libur. Data akan tersedia saat pasar buka (09:00–15:00 WIB, Senin–Jumat).</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox label="Harga Sebelumnya" value={fmtNum(daily.PreviousPrice)} icon={Clock} />
            <StatBox label="Harga Pembukaan" value={fmtNum(daily.OpeningPrice)} icon={ArrowUpRight} />
            <StatBox
              label="Harga Tertinggi"
              value={fmtNum(daily.HighestPrice)}
              color="text-bull" icon={TrendingUp}
            />
            <StatBox
              label="Harga Terendah"
              value={fmtNum(daily.LowestPrice)}
              color="text-bear" icon={TrendingDown}
            />
            <StatBox
              label="Harga Penutupan"
              value={fmtNum(daily.ClosingPrice)}
              color={daily.Change >= 0 ? 'text-bull' : 'text-bear'}
              sub={`Perubahan: ${daily.Change >= 0 ? '+' : ''}${fmtNum(daily.Change)}`}
              icon={DollarSign}
            />
            <StatBox
              label="Volume Transaksi"
              value={fmtVal(daily.TradedVolume)}
              icon={BarChart2}
              sub="lembar saham"
            />
            <StatBox
              label="Nilai Transaksi"
              value={fmtVal(daily.TradedValue)}
              icon={Zap}
              sub="rupiah"
            />
            <StatBox
              label="Frekuensi"
              value={fmtNum(daily.TradedFrequency)}
              icon={Activity}
              sub="kali transaksi"
            />
          </div>
        )}

        {/* Bid / Offer */}
        {!dailyNull && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-bull/5 border border-bull/10">
              <div>
                <p className="text-content-muted text-xs">Best Bid</p>
                <p className="text-bull font-mono font-bold text-lg">{fmtNum(daily.BestBidPrice)}</p>
                <p className="text-content-muted text-xs">{fmtNum(daily.BestBidVolume)} lot</p>
              </div>
              <TrendingUp size={28} className="text-bull/20" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-bear/5 border border-bear/10">
              <div>
                <p className="text-content-muted text-xs">Best Offer</p>
                <p className="text-bear font-mono font-bold text-lg">{fmtNum(daily.BestOfferPrice)}</p>
                <p className="text-content-muted text-xs">{fmtNum(daily.BestOfferVolume)} lot</p>
              </div>
              <TrendingDown size={28} className="text-bear/20" />
            </div>
          </div>
        )}
      </div>

      {/* ── Grafik Harga IDX ─────────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-content font-semibold flex items-center gap-2">
              <Activity size={15} className="text-accent" /> Grafik Harga — {ticker}
              {loading.chart && <RefreshCw size={12} className="animate-spin text-content-muted" />}
            </h3>
            {chartData.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-content font-mono font-bold text-xl">{fmtNum(chartLast)}</span>
                <span className={clsx('flex items-center gap-0.5 text-sm font-mono', chartUp ? 'text-bull' : 'text-bear')}>
                  {chartUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {chartUp ? '+' : ''}{((chartLast - chartFirst) / chartFirst * 100).toFixed(2)}%
                  <span className="text-content-muted text-xs ml-1">({period})</span>
                </span>
              </div>
            )}
          </div>
          {/* Period switcher */}
          <div className="flex gap-1">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx('px-3 py-1 rounded-md text-xs font-mono transition-colors',
                  period === p ? 'bg-accent text-white font-bold' : 'text-content-muted hover:text-content hover:bg-surface-hover'
                )}
              >{p}</button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartUp ? '#00d4aa' : '#ff4d6d'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartUp ? '#00d4aa' : '#ff4d6d'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 9 }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 8)} />
            <YAxis tick={{ fill: '#64748B', fontSize: 9 }} tickLine={false} axisLine={false}
              tickFormatter={v => fmtNum(v)} domain={['auto', 'auto']} width={60} />
            <Tooltip content={<ChartTooltip />} />
            <CartesianGrid strokeDasharray="2 6" stroke="#21262d" vertical={false} />
            <Area
              type="monotone" dataKey="close"
              stroke={chartUp ? '#00d4aa' : '#ff4d6d'} strokeWidth={2}
              fill="url(#chartGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── History Trading Table ──────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h3 className="text-content font-semibold flex items-center gap-2">
            <Clock size={15} className="text-accent" /> Riwayat Trading — {ticker}
            {loading.history && <RefreshCw size={12} className="animate-spin text-content-muted" />}
          </h3>
          <span className="text-content-muted text-xs">Total {historyReplies.length} hari</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface-hover">
              <tr className="text-content-muted">
                {['Tanggal', 'Open', 'High', 'Low', 'Close', 'Perubahan', 'Volume', 'Nilai', 'Freq', 'Foreign Buy', 'Foreign Sell'].map(h => (
                  <th key={h} className={clsx('py-2.5 px-3 font-medium whitespace-nowrap', h === 'Tanggal' ? 'text-left' : 'text-right')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentHistoryPageData.map((r, i) => {
                const bull = r.Change >= 0
                return (
                  <tr key={r.IDStockSummary || i} className="border-t border-surface-border/50 hover:bg-surface-hover transition-colors">
                    <td className="py-2 px-3 font-mono text-content whitespace-nowrap">{fmtDate(r.Date)}</td>
                    <td className="text-right px-3 font-mono text-content-muted">{fmtNum(r.OpenPrice)}</td>
                    <td className="text-right px-3 font-mono text-bull">{fmtNum(r.High)}</td>
                    <td className="text-right px-3 font-mono text-bear">{fmtNum(r.Low)}</td>
                    <td className="text-right px-3 font-mono font-bold text-content">{fmtNum(r.Close)}</td>
                    <td className="text-right px-3">
                      <span className={clsx('flex items-center justify-end gap-0.5 font-mono font-bold', bull ? 'text-bull' : 'text-bear')}>
                        {bull ? '+' : ''}{fmtNum(r.Change)}
                      </span>
                    </td>
                    <td className="text-right px-3 font-mono text-content-muted">{fmtVal(r.Volume)}</td>
                    <td className="text-right px-3 font-mono text-content-muted">{fmtVal(r.Value)}</td>
                    <td className="text-right px-3 font-mono text-content-muted">{fmtNum(r.Frequency)}</td>
                    <td className="text-right px-3 font-mono text-bull">{fmtVal(r.ForeignBuy)}</td>
                    <td className="text-right px-3 font-mono text-bear">{fmtVal(r.ForeignSell)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {historyReplies.length === 0 && !loading.history && (
            <div className="p-8 text-center text-content-muted">Data riwayat tidak ditemukan.</div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-surface-border bg-surface/50">
            <span className="text-xs text-content-muted">
              Menampilkan {((historyPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(historyPage * ITEMS_PER_PAGE, historyReplies.length)} dari {historyReplies.length}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className="p-1 rounded bg-surface-hover text-content disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-mono text-content">Hal {historyPage} / {totalPages}</span>
              <button 
                onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                disabled={historyPage === totalPages}
                className="p-1 rounded bg-surface-hover text-content disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Sinyal Analisis & Swing ──────────────────────────────────────────── */}
      {historyReplies.length > 0 && chartLast > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Panel Analisis Bandar & Volume */}
          <div className="card p-5">
            <h3 className="text-content font-semibold mb-4 flex items-center gap-2">
              <Activity size={16} className="text-accent" /> Analisis Bandar & Volume
            </h3>
            
            <div className="flex flex-col gap-3">
              <div className={clsx("p-4 border rounded-xl flex items-start gap-4", bandarSignal.bg, bandarSignal.border)}>
                <bandarSignal.icon size={24} className={bandarSignal.color} />
                <div>
                  <p className={clsx("font-bold text-sm", bandarSignal.color)}>{bandarSignal.status}</p>
                  <p className="text-content-muted text-xs mt-1">{bandarSignal.desc}</p>
                </div>
              </div>
              
              <div className="p-4 border border-surface-border bg-surface-hover/30 rounded-xl flex items-start gap-4">
                <BarChart2 size={24} className={volumeSignal.color} />
                <div>
                  <p className={clsx("font-bold text-sm text-content")}>{volumeSignal.status}</p>
                  <p className="text-content-muted text-xs mt-1">{volumeSignal.desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Swing Trading */}
          <div className="card p-5">
            <h3 className="text-content font-semibold mb-4 flex items-center gap-2">
              <Target size={16} className="text-accent" /> Sinyal Swing Trading
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Swing 1 Minggu */}
              <div className="border border-surface-border bg-surface-hover/30 p-4 rounded-xl">
                <p className="text-content font-bold text-sm mb-3">Swing 1 Minggu</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-content-muted">Area Beli (Buy)</span>
                    <span className="font-mono text-content font-bold">{fmtNum(swing1W.buy)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">Target (TP)</span>
                    <span className="font-mono text-bull font-bold">{fmtNum(swing1W.target)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">Stop Loss (SL)</span>
                    <span className="font-mono text-bear font-bold">{fmtNum(swing1W.sl)}</span>
                  </div>
                </div>
              </div>

              {/* Swing 1-3 Bulan */}
              <div className="border border-surface-border bg-surface-hover/30 p-4 rounded-xl">
                <p className="text-content font-bold text-sm mb-3">Swing 1-3 Bulan</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-content-muted">Area Beli (Buy)</span>
                    <span className="font-mono text-content font-bold">{fmtNum(swing1M.buy)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">Target (TP)</span>
                    <span className="font-mono text-bull font-bold">{fmtNum(swing1M.target)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">Stop Loss (SL)</span>
                    <span className="font-mono text-bear font-bold">{fmtNum(swing1M.sl)}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-content-muted mt-3 italic">*Sinyal dihitung berdasarkan volatilitas harga (ATR) dan hanya sebagai referensi, bukan saran investasi mutlak.</p>
          </div>

        </div>
      )}

    </div>
  )
}
