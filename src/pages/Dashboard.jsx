import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Activity, BarChart2, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle } from 'lucide-react'
import { getMarketSummary } from '../services/idxApi'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

const fmt = (n) => n != null ? Number(n).toLocaleString('id-ID') : '-'
const fmtPct = (n) => n != null ? `${Number(n) > 0 ? '+' : ''}${Number(n).toFixed(2)}%` : '-'
const fmtVol = (n) => {
  if (!n) return '-'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}M lot`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}jt`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}rb`
  return String(n)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs font-mono">
      <p className="text-content-muted mb-1">{label}</p>
      <p className="text-accent font-semibold">{fmt(payload[0]?.value)}</p>
    </div>
  )
}

const Skeleton = ({ className }) => (
  <div className={clsx("animate-pulse bg-surface-hover rounded", className)} />
)

export default function Dashboard() {
  const { setActivePage, setSelectedTicker, setSelectedFundamentalTicker } = useStore()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMarketSummary()
      setSummary(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
    const interval = setInterval(fetchSummary, 3 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleStockClick = (ticker) => {
    setSelectedTicker(ticker)
    setActivePage('chart')
  }

  const handleFundamentalClick = (ticker) => {
    setSelectedFundamentalTicker(ticker)
    setActivePage('fundamental')
  }

  const ihsgData = summary?.ihsgChart || []
  const latestIHSG = ihsgData[ihsgData.length - 1]
  const prevIHSG = ihsgData[ihsgData.length - 2]
  const ihsgChange = latestIHSG && prevIHSG ? latestIHSG.value - prevIHSG.value : 0
  const ihsgChangePct = prevIHSG?.value ? (ihsgChange / prevIHSG.value) * 100 : 0

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-content font-bold text-xl">Market Dashboard</h1>
          <p className="text-content-muted text-xs mt-0.5">Data real-time dari Bursa Efek Indonesia (IDX)</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className="text-content-muted text-xs">Update: {lastUpdated.toLocaleTimeString('id-ID')}</p>
          )}
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="btn-ghost flex items-center gap-2 text-xs border border-surface-border px-3 py-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="bg-bear/10 border border-bear/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-bear shrink-0" />
          <div>
            <p className="text-bear font-semibold text-sm">Gagal memuat data pasar</p>
            <p className="text-bear/80 text-xs">{error}</p>
          </div>
          <button onClick={fetchSummary} className="ml-auto text-xs text-accent hover:underline">Coba Lagi</button>
        </div>
      )}

      {/* Index Cards — 6 indeks dari GetConstituent IDX */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {loading ? (
          [1,2,3,4,5,6].map(i => (
            <div key={i} className="stat-card flex flex-col gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))
        ) : summary?.indices?.length > 0 ? (
          summary.indices.map((idx) => (
            <div key={idx.name} className={`stat-card ${Number(idx.changePct) >= 0 ? 'glow-bull' : 'glow-bear'}`}>
              <div className="flex items-start justify-between mb-1">
                <p className="text-content-muted text-[10px] font-bold tracking-wide">{idx.name}</p>
                {Number(idx.changePct) >= 0
                  ? <TrendingUp size={12} className="text-bull shrink-0" />
                  : <TrendingDown size={12} className="text-bear shrink-0" />
                }
              </div>
              <p className="text-base font-bold font-mono text-content">{fmt(idx.value)}</p>
              <span className={clsx("text-xs font-bold font-mono", Number(idx.changePct) >= 0 ? 'text-bull' : 'text-bear')}>
                {Number(idx.changePct) > 0 ? '+' : ''}{Number(idx.changePct).toFixed(2)}%
              </span>
              {idx.high && idx.low && (
                <div className="flex justify-between mt-1 pt-1 border-t border-surface-border">
                  <span className="text-[9px] text-bull font-mono">H: {fmt(idx.high)}</span>
                  <span className="text-[9px] text-bear font-mono">L: {fmt(idx.low)}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="stat-card col-span-2 lg:col-span-6">
            <p className="text-content-muted text-xs text-center">Data indeks tidak tersedia</p>
          </div>
        )}
      </div>

      {/* IHSG Chart + Top Gainers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-content font-semibold flex items-center gap-2">
                <Activity size={16} className="text-accent" /> IHSG — Composite Index
              </h2>
              {loading ? (
                <Skeleton className="h-8 w-36 mt-1" />
              ) : (
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-bold font-mono text-content">{fmt(latestIHSG?.value)}</span>
                  <span className={clsx("flex items-center gap-1 text-sm font-mono", ihsgChange >= 0 ? 'text-bull' : 'text-bear')}>
                    {ihsgChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {ihsgChange >= 0 ? '+' : ''}{ihsgChange.toFixed(2)} ({fmtPct(ihsgChangePct)})
                  </span>
                </div>
              )}
            </div>
            <span className="text-content-muted text-xs">1 Bulan</span>
          </div>
          {loading ? (
            <Skeleton className="h-52 w-full" />
          ) : ihsgData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ihsgData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ihsgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(-5)} tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => Number(v).toLocaleString('id-ID')} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fill="url(#ihsgGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center">
              <p className="text-content-muted text-sm">Data grafik IHSG tidak tersedia saat ini.</p>
            </div>
          )}
        </div>

        {/* Top Gainers */}
        <div className="card p-5 flex flex-col h-full max-h-[320px]">
          <h2 className="text-content font-semibold flex items-center gap-2 mb-3 shrink-0">
            <TrendingUp size={16} className="text-bull" /> Top Gainers
          </h2>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {loading ? (
              [1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
            ) : summary?.topGainers?.length > 0 ? (
              summary.topGainers.map((g) => (
                <div key={g.ticker} onClick={() => handleStockClick(g.ticker)} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors">
                  <div>
                    <p className="font-mono text-xs font-bold text-content">{g.ticker}</p>
                    <p className="text-content-muted text-[10px] truncate max-w-[100px]">{g.name}</p>
                  </div>
                  <div className="text-right flex flex-col items-end justify-center">
                    <p className="font-mono text-xs text-content font-medium">{fmt(g.price)}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-bull text-[10px] font-mono font-medium">+{fmt(g.change)}</span>
                      <span className="badge-bull">{fmtPct(g.changePct)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-content-muted text-xs text-center mt-6">Data tidak tersedia</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Losers + Quick Fundamental */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5 flex flex-col h-full max-h-[360px]">
          <h2 className="text-content font-semibold mb-3 flex items-center gap-2 shrink-0">
            <TrendingDown size={16} className="text-bear" /> Top Losers
          </h2>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <table className="w-full text-xs relative">
            <thead className="sticky top-0 bg-surface-card z-10">
              <tr className="text-content-muted border-b border-surface-border">
                <th className="text-left py-1.5 font-medium">Saham</th>
                <th className="text-right py-1.5 font-medium">Harga</th>
                <th className="text-right py-1.5 font-medium">Perubahan</th>
                <th className="text-right py-1.5 font-medium">Volume</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => <tr key={i}><td colSpan={4} className="py-1.5"><Skeleton className="h-8 w-full" /></td></tr>)
              ) : summary?.topLosers?.length > 0 ? (
                summary.topLosers.map((l) => (
                  <tr key={l.ticker} onClick={() => handleStockClick(l.ticker)} className="border-b border-surface-border/50 hover:bg-surface-hover cursor-pointer transition-colors">
                    <td className="py-2">
                      <p className="font-mono font-bold text-content">{l.ticker}</p>
                      <p className="text-content-muted text-[10px] truncate max-w-[120px]">{l.name}</p>
                    </td>
                    <td className="text-right font-mono text-content py-2">{fmt(l.price)}</td>
                    <td className="text-right py-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-bear text-[10px] font-mono font-medium">{fmt(l.change)}</span>
                        <span className="badge-bear">{fmtPct(l.changePct)}</span>
                      </div>
                    </td>
                    <td className="text-right font-mono text-content-muted py-2">{fmtVol(l.volume)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="text-center text-content-muted py-6">Data tidak tersedia</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Quick Analisis Fundamental */}
        <div className="card p-5">
          <h2 className="text-content font-semibold mb-3 flex items-center gap-2">
            <BarChart2 size={16} className="text-accent" /> Analisis Cepat Saham Unggulan
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['BBCA','BBRI','BMRI','TLKM','ASII','GOTO','BREN','ADRO'].map(ticker => (
              <button
                key={ticker}
                onClick={() => handleFundamentalClick(ticker)}
                className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-surface-hover border border-surface-border hover:border-accent/40 hover:bg-accent/5 transition-all group"
              >
                <span className="font-mono font-bold text-sm text-content group-hover:text-accent">{ticker}</span>
                <span className="text-[10px] text-content-muted mt-0.5">Fundamental</span>
              </button>
            ))}
          </div>
          <p className="text-content-muted text-xs mt-4 text-center">
            Klik saham di atas untuk analisis fundamental + sinyal beli/jual
          </p>
        </div>
      </div>
    </div>
  )
}
