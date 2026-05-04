import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from 'recharts'
import {
  BarChart2, TrendingUp, TrendingDown, RefreshCw,
  AlertCircle, Activity, Clock, ArrowUpRight, ArrowDownRight,
  Globe, Users, Zap, DollarSign,
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

const StatBox = ({ label, value, icon: Icon, color = 'text-white', sub }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between mb-1">
      <span className="text-muted text-xs">{label}</span>
      {Icon && <Icon size={14} className="text-muted" />}
    </div>
    <p className={clsx('font-mono font-bold text-lg leading-tight', color)}>{value}</p>
    {sub && <p className="text-muted text-[10px] mt-0.5">{sub}</p>}
  </div>
)

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs font-mono">
      <p className="text-muted">{label}</p>
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

  const QUICK_TICKERS = ['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'GOTO', 'ANTM', 'ADRO']

  const loadAll = useCallback(async (t, p) => {
    setLoading({ daily: true, history: true, chart: true })
    setUseMock(false)
    let anyMock = false

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

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
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
                  ticker === t ? 'bg-accent text-black font-bold' : 'bg-surface-hover text-muted hover:text-white'
                )}
              >{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Trade Harian ────────────────────────────────────────────────────── */}
      <div className="card p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Activity size={15} className="text-accent" /> Trade Harian — {ticker}
          {loading.daily && <RefreshCw size={12} className="animate-spin text-muted" />}
        </h3>

        {dailyNull ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-hover border border-surface-border">
            <AlertCircle size={18} className="text-warning flex-shrink-0" />
            <div>
              <p className="text-white text-sm font-medium">Data Tidak Tersedia</p>
              <p className="text-muted text-xs mt-0.5">Pasar mungkin sedang tutup atau libur. Data akan tersedia saat pasar buka (09:00–15:00 WIB, Senin–Jumat).</p>
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
                <p className="text-muted text-xs">Best Bid</p>
                <p className="text-bull font-mono font-bold text-lg">{fmtNum(daily.BestBidPrice)}</p>
                <p className="text-muted text-xs">{fmtNum(daily.BestBidVolume)} lot</p>
              </div>
              <TrendingUp size={28} className="text-bull/20" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-bear/5 border border-bear/10">
              <div>
                <p className="text-muted text-xs">Best Offer</p>
                <p className="text-bear font-mono font-bold text-lg">{fmtNum(daily.BestOfferPrice)}</p>
                <p className="text-muted text-xs">{fmtNum(daily.BestOfferVolume)} lot</p>
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
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Activity size={15} className="text-accent" /> Grafik Harga — {ticker}
              {loading.chart && <RefreshCw size={12} className="animate-spin text-muted" />}
            </h3>
            {chartData.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white font-mono font-bold text-xl">{fmtNum(chartLast)}</span>
                <span className={clsx('flex items-center gap-0.5 text-sm font-mono', chartUp ? 'text-bull' : 'text-bear')}>
                  {chartUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {chartUp ? '+' : ''}{((chartLast - chartFirst) / chartFirst * 100).toFixed(2)}%
                  <span className="text-muted text-xs ml-1">({period})</span>
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
                  period === p ? 'bg-accent text-black font-bold' : 'text-muted hover:text-white hover:bg-surface-hover'
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
            <XAxis dataKey="date" tick={{ fill: '#8b949e', fontSize: 9 }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 8)} />
            <YAxis tick={{ fill: '#8b949e', fontSize: 9 }} tickLine={false} axisLine={false}
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
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Clock size={15} className="text-accent" /> Riwayat Trading — {ticker}
            {loading.history && <RefreshCw size={12} className="animate-spin text-muted" />}
          </h3>
          <span className="text-muted text-xs">{historyReplies.length} hari terakhir</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface-hover">
              <tr className="text-muted">
                {['Tanggal', 'Open', 'High', 'Low', 'Close', 'Perubahan', 'Volume', 'Nilai', 'Freq', 'Foreign Buy', 'Foreign Sell'].map(h => (
                  <th key={h} className={clsx('py-2.5 px-3 font-medium whitespace-nowrap', h === 'Tanggal' ? 'text-left' : 'text-right')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historyReplies.map((r, i) => {
                const bull = r.Change >= 0
                return (
                  <tr key={r.IDStockSummary || i} className="border-t border-surface-border/50 hover:bg-surface-hover transition-colors">
                    <td className="py-2 px-3 font-mono text-white whitespace-nowrap">{fmtDate(r.Date)}</td>
                    <td className="text-right px-3 font-mono text-muted">{fmtNum(r.OpenPrice)}</td>
                    <td className="text-right px-3 font-mono text-bull">{fmtNum(r.High)}</td>
                    <td className="text-right px-3 font-mono text-bear">{fmtNum(r.Low)}</td>
                    <td className="text-right px-3 font-mono font-bold text-white">{fmtNum(r.Close)}</td>
                    <td className="text-right px-3">
                      <span className={clsx('flex items-center justify-end gap-0.5 font-mono font-bold', bull ? 'text-bull' : 'text-bear')}>
                        {bull ? '+' : ''}{fmtNum(r.Change)}
                      </span>
                    </td>
                    <td className="text-right px-3 font-mono text-muted">{fmtVal(r.Volume)}</td>
                    <td className="text-right px-3 font-mono text-muted">{fmtVal(r.Value)}</td>
                    <td className="text-right px-3 font-mono text-muted">{fmtNum(r.Frequency)}</td>
                    <td className="text-right px-3 font-mono text-bull">{fmtVal(r.ForeignBuy)}</td>
                    <td className="text-right px-3 font-mono text-bear">{fmtVal(r.ForeignSell)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
