import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, Activity, BarChart2, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import {
  marketIndices, sectorPerformance, topGainers, topLosers,
  generateIHSGData, runningTrades, heatmapData,
} from '../data/mockData'
import { useStore } from '../store/useStore'

const fmt = (n) => n.toLocaleString('id-ID')
const fmtPct = (n) => `${n > 0 ? '+' : ''}${n.toFixed(2)}%`

// Color for heatmap
const heatColor = (pct) => {
  if (pct > 5) return 'bg-bull text-black'
  if (pct > 2) return 'bg-bull/70 text-black'
  if (pct > 0) return 'bg-bull/30 text-bull'
  if (pct > -2) return 'bg-bear/30 text-bear'
  if (pct > -5) return 'bg-bear/60 text-white'
  return 'bg-bear text-white'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs font-mono">
      <p className="text-muted mb-1">{label}</p>
      <p className="text-accent font-semibold">{fmt(payload[0].value)}</p>
    </div>
  )
}

export default function Dashboard() {
  const { setActivePage, setSelectedTicker } = useStore()
  const ihsgData = useMemo(() => generateIHSGData(), [])
  const latestIHSG = ihsgData[ihsgData.length - 1]
  const prevIHSG = ihsgData[ihsgData.length - 2]
  const ihsgChange = latestIHSG.value - prevIHSG.value
  const ihsgChangePct = (ihsgChange / prevIHSG.value) * 100

  const handleStockClick = (ticker) => {
    setSelectedTicker(ticker)
    setActivePage('chart')
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Index Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {marketIndices.map((idx) => (
          <div key={idx.name} className={`stat-card ${idx.changePct >= 0 ? 'glow-bull' : 'glow-bear'}`}>
            <div className="flex items-start justify-between">
              <p className="text-muted text-xs font-medium">{idx.name}</p>
              {idx.changePct >= 0
                ? <TrendingUp size={14} className="text-bull" />
                : <TrendingDown size={14} className="text-bear" />
              }
            </div>
            <p className="text-xl font-bold font-mono text-white mt-1">{fmt(idx.value)}</p>
            <div className="flex items-center justify-between mt-1">
              <span className={idx.changePct >= 0 ? 'badge-bull' : 'badge-bear'}>
                {fmtPct(idx.changePct)}
              </span>
              <span className="text-muted text-xs font-mono">{idx.volume}</span>
            </div>
          </div>
        ))}
      </div>

      {/* IHSG Chart + Running Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* IHSG Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Activity size={16} className="text-accent" /> IHSG — Composite Index
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-bold font-mono text-white">
                  {fmt(latestIHSG.value)}
                </span>
                <span className={`flex items-center gap-1 text-sm font-mono ${ihsgChange >= 0 ? 'text-bull' : 'text-bear'}`}>
                  {ihsgChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {ihsgChange >= 0 ? '+' : ''}{ihsgChange.toFixed(2)} ({fmtPct(ihsgChangePct)})
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              {['1W', '1M', '3M', 'YTD'].map(tf => (
                <button key={tf} className="btn-ghost text-xs px-2 py-1">{tf}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ihsgData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ihsgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(v) => v.slice(5)}
                tick={{ fill: '#8b949e', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={14}
              />
              <YAxis
                tick={{ fill: '#8b949e', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v.toLocaleString('id-ID')}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#00d4aa"
                strokeWidth={2}
                fill="url(#ihsgGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Running Trades */}
        <div className="card p-5 flex flex-col">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-3">
            <BarChart2 size={16} className="text-accent" /> Running Trade
          </h2>
          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-72">
            {[...runningTrades, ...runningTrades].map((t, i) => (
              <div
                key={i}
                onClick={() => handleStockClick(t.ticker)}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.type === 'buy' ? 'bg-bull' : 'bg-bear'}`} />
                  <span className="font-mono text-xs font-semibold text-white">{t.ticker}</span>
                  <span className={`text-xs uppercase font-bold ${t.type === 'buy' ? 'text-bull' : 'text-bear'}`}>
                    {t.type}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-white">{fmt(t.price)}</p>
                  <p className="text-muted text-[10px]">{t.lot.toLocaleString()} lot</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sector + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Sector Performance */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Layers size={16} className="text-accent" /> Performa Sektoral
          </h2>
          <div className="space-y-2.5">
            {sectorPerformance.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-white font-medium">{s.name}</span>
                  <span className={`text-xs font-mono font-bold ${s.pct >= 0 ? 'text-bull' : 'text-bear'}`}>
                    {fmtPct(s.pct)}
                  </span>
                </div>
                <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${s.pct >= 0 ? 'bg-bull' : 'bg-bear'}`}
                    style={{ width: `${Math.min(Math.abs(s.pct) * 20, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Heatmap */}
        <div className="card p-5 lg:col-span-3">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Activity size={16} className="text-accent" /> Market Heatmap
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {heatmapData.map((h) => (
              <div
                key={h.ticker}
                onClick={() => handleStockClick(h.ticker)}
                className={`heatmap-cell ${heatColor(h.pct)} cursor-pointer rounded-lg`}
                style={{
                  width: `${Math.max(Math.sqrt(h.cap) * 4, 44)}px`,
                  height: `${Math.max(Math.sqrt(h.cap) * 4, 44)}px`,
                  maxWidth: '80px',
                  maxHeight: '80px',
                }}
                title={`${h.ticker}: ${fmtPct(h.pct)}`}
              >
                <div className="text-center p-1">
                  <p className="text-[10px] font-bold leading-none">{h.ticker}</p>
                  <p className="text-[9px] leading-none mt-0.5 opacity-80">{fmtPct(h.pct)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Gainers / Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gainers */}
        <div className="card p-5">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-bull" /> Top Gainers
          </h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted border-b border-surface-border">
                <th className="text-left py-1.5 font-medium">Saham</th>
                <th className="text-right py-1.5 font-medium">Harga</th>
                <th className="text-right py-1.5 font-medium">Perubahan</th>
                <th className="text-right py-1.5 font-medium">Volume</th>
              </tr>
            </thead>
            <tbody>
              {topGainers.map((g) => (
                <tr
                  key={g.ticker}
                  onClick={() => handleStockClick(g.ticker)}
                  className="border-b border-surface-border/50 hover:bg-surface-hover cursor-pointer transition-colors"
                >
                  <td className="py-2">
                    <p className="font-mono font-bold text-white">{g.ticker}</p>
                    <p className="text-muted text-[10px] truncate max-w-[120px]">{g.name}</p>
                  </td>
                  <td className="text-right font-mono text-white py-2">{fmt(g.price)}</td>
                  <td className="text-right py-2"><span className="badge-bull">+{g.change}%</span></td>
                  <td className="text-right font-mono text-muted py-2">{g.vol}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Losers */}
        <div className="card p-5">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <TrendingDown size={16} className="text-bear" /> Top Losers
          </h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted border-b border-surface-border">
                <th className="text-left py-1.5 font-medium">Saham</th>
                <th className="text-right py-1.5 font-medium">Harga</th>
                <th className="text-right py-1.5 font-medium">Perubahan</th>
                <th className="text-right py-1.5 font-medium">Volume</th>
              </tr>
            </thead>
            <tbody>
              {topLosers.map((l) => (
                <tr
                  key={l.ticker}
                  onClick={() => handleStockClick(l.ticker)}
                  className="border-b border-surface-border/50 hover:bg-surface-hover cursor-pointer transition-colors"
                >
                  <td className="py-2">
                    <p className="font-mono font-bold text-white">{l.ticker}</p>
                    <p className="text-muted text-[10px] truncate max-w-[120px]">{l.name}</p>
                  </td>
                  <td className="text-right font-mono text-white py-2">{fmt(l.price)}</td>
                  <td className="text-right py-2"><span className="badge-bear">{l.change}%</span></td>
                  <td className="text-right font-mono text-muted py-2">{l.vol}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
