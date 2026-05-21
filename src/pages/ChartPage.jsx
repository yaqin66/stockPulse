import { useMemo, useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, CartesianGrid,
} from 'recharts'
import { ChevronDown, Star, StarOff, TrendingUp, TrendingDown } from 'lucide-react'
import { generateCandleData, screenerStocks } from '../data/mockData'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

const timeframes = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M']
const indicators = ['RSI', 'MACD', 'MA20', 'MA50', 'EMA200', 'Bollinger']

const fmt = (n) => n?.toLocaleString('id-ID') ?? '-'

// Custom candle bar for recharts
const CandleBar = (props) => {
  const { x, y, width, height, open, close, low, high, chartHeight, yMin, yRange } = props
  if (!open || !close) return null
  const isBull = close >= open
  const color = isBull ? '#00d4aa' : '#ff4d6d'
  const bodyTop = Math.min(open, close)
  const bodyBottom = Math.max(open, close)
  const bodyH = Math.max(Math.abs(bodyTop - bodyBottom), 1)
  return (
    <g>
      {/* Wick */}
      <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height} stroke={color} strokeWidth={1} />
      {/* Body */}
      <rect
        x={x + 1}
        y={y + (bodyTop - props.low) * (height / (props.high - props.low))}
        width={Math.max(width - 2, 1)}
        height={Math.max(bodyH * (height / (props.high - props.low || 1)), 1)}
        fill={color}
        rx={1}
      />
    </g>
  )
}

const CustomCandleTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const bull = d.close >= d.open
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-3 text-xs font-mono space-y-1">
      <p className="text-content-muted">{d.date}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className="text-content-muted">Open</span><span className="text-content">{fmt(d.open)}</span>
        <span className="text-content-muted">High</span><span className="text-bull">{fmt(d.high)}</span>
        <span className="text-content-muted">Low</span><span className="text-bear">{fmt(d.low)}</span>
        <span className="text-content-muted">Close</span>
        <span className={bull ? 'text-bull' : 'text-bear'}>{fmt(d.close)}</span>
        <span className="text-content-muted">Volume</span>
        <span className="text-content">{(d.volume / 1_000_000).toFixed(1)}M</span>
      </div>
    </div>
  )
}

// Compute RSI from candle data
const computeRSI = (data, period = 14) => {
  const rsi = []
  let gains = 0; let losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close
    if (diff > 0) gains += diff; else losses -= diff
  }
  let avgGain = gains / period; let avgLoss = losses / period
  for (let i = 0; i < data.length; i++) {
    if (i < period) { rsi.push({ date: data[i].date, rsi: null }); continue }
    if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      rsi.push({ date: data[i].date, rsi: parseFloat((100 - 100 / (1 + rs)).toFixed(2)) })
      continue
    }
    const diff = data[i].close - data[i - 1].close
    const g = diff > 0 ? diff : 0; const l = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + g) / period
    avgLoss = (avgLoss * (period - 1) + l) / period
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    rsi.push({ date: data[i].date, rsi: parseFloat((100 - 100 / (1 + rs)).toFixed(2)) })
  }
  return rsi
}

// MACD
const computeEMA = (data, period) => {
  const k = 2 / (period + 1)
  const ema = []
  let prev = data[0]
  for (let i = 0; i < data.length; i++) {
    const val = i === 0 ? data[i] : data[i] * k + prev * (1 - k)
    ema.push(val)
    prev = val
  }
  return ema
}

const computeMACD = (data) => {
  const closes = data.map(d => d.close)
  const ema12 = computeEMA(closes, 12)
  const ema26 = computeEMA(closes, 26)
  const macdLine = ema12.map((v, i) => v - ema26[i])
  const signal = computeEMA(macdLine.slice(26), 9)
  return data.map((d, i) => ({
    date: d.date,
    macd: i >= 26 ? parseFloat(macdLine[i].toFixed(2)) : null,
    signal: i >= 35 ? parseFloat(signal[i - 26].toFixed(2)) : null,
    hist: i >= 35 ? parseFloat((macdLine[i] - signal[i - 26]).toFixed(2)) : null,
  }))
}

export default function ChartPage() {
  const { selectedTicker, setSelectedTicker, selectedTimeframe, setSelectedTimeframe,
    watchlist, addToWatchlist, removeFromWatchlist } = useStore()
  const [activeIndicators, setActiveIndicators] = useState(['RSI', 'MACD'])
  const [showTickerDropdown, setShowTickerDropdown] = useState(false)

  const candles = useMemo(() => generateCandleData(selectedTicker, 60), [selectedTicker])
  const rsiData = useMemo(() => computeRSI(candles), [candles])
  const macdData = useMemo(() => computeMACD(candles), [candles])

  const inWatchlist = watchlist.includes(selectedTicker)
  const lastCandle = candles[candles.length - 1]
  const prevCandle = candles[candles.length - 2]
  const priceChange = lastCandle.close - prevCandle.close
  const pricePct = (priceChange / prevCandle.close) * 100
  const bull = priceChange >= 0

  const toggleIndicator = (ind) => {
    setActiveIndicators(prev =>
      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
    )
  }

  const tickers = Object.keys(screenerStocks.reduce((a, s) => ({ ...a, [s.ticker]: 1 }), {}))
    .concat(['BBCA', 'TLKM', 'BBRI', 'ASII', 'BMRI'])

  // Add MA20 & MA50 to candles
  const candlesWithMA = useMemo(() => {
    return candles.map((c, i) => {
      const ma20 = i >= 19 ? candles.slice(i - 19, i + 1).reduce((s, d) => s + d.close, 0) / 20 : null
      const ma50 = i >= 49 ? candles.slice(i - 49, i + 1).reduce((s, d) => s + d.close, 0) / 50 : null
      return { ...c, ma20, ma50 }
    })
  }, [candles])

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Ticker & Controls */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        {/* Ticker Picker */}
        <div className="relative">
          <button
            onClick={() => setShowTickerDropdown(!showTickerDropdown)}
            className="flex items-center gap-2 bg-surface-hover border border-surface-border rounded-lg px-3 py-1.5 text-content font-mono font-bold hover:border-accent/50 transition-colors"
          >
            {selectedTicker} <ChevronDown size={14} />
          </button>
          {showTickerDropdown && (
            <div className="absolute top-10 left-0 z-50 bg-surface-card border border-surface-border rounded-xl shadow-2xl w-40 py-1 max-h-48 overflow-y-auto">
              {['BBCA', 'TLKM', 'BBRI', 'ASII', 'BMRI'].map(t => (
                <button
                  key={t}
                  onClick={() => { setSelectedTicker(t); setShowTickerDropdown(false) }}
                  className={clsx('w-full text-left px-3 py-2 text-sm font-mono hover:bg-surface-hover transition-colors',
                    t === selectedTicker ? 'text-accent' : 'text-content')}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-content">{fmt(lastCandle.close)}</span>
          <span className={clsx('flex items-center gap-1 text-sm font-mono', bull ? 'text-bull' : 'text-bear')}>
            {bull ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {priceChange > 0 ? '+' : ''}{priceChange.toFixed(0)} ({pricePct.toFixed(2)}%)
          </span>
        </div>

        {/* OHLC */}
        <div className="flex gap-4 text-xs font-mono ml-auto">
          {[['O', lastCandle.open], ['H', lastCandle.high], ['L', lastCandle.low], ['V', (lastCandle.volume / 1_000_000).toFixed(1) + 'M']].map(([k, v]) => (
            <div key={k} className="text-center">
              <p className="text-content-muted">{k}</p>
              <p className={clsx('text-content', k === 'H' && 'text-bull', k === 'L' && 'text-bear')}>{typeof v === 'number' ? fmt(v) : v}</p>
            </div>
          ))}
        </div>

        {/* Watchlist Toggle */}
        <button
          onClick={() => inWatchlist ? removeFromWatchlist(selectedTicker) : addToWatchlist(selectedTicker)}
          className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors text-xs',
            inWatchlist ? 'border-warning/30 text-warning bg-warning/10' : 'border-surface-border text-content-muted hover:border-white/30'
          )}
        >
          {inWatchlist ? <Star size={12} fill="currentColor" /> : <StarOff size={12} />}
          {inWatchlist ? 'In Watchlist' : 'Add Watchlist'}
        </button>
      </div>

      {/* Timeframe */}
      <div className="flex items-center gap-2">
        <span className="text-content-muted text-xs">Timeframe:</span>
        <div className="flex gap-1">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={clsx('px-2.5 py-1 rounded-md text-xs font-mono transition-colors',
                selectedTimeframe === tf ? 'bg-accent text-white font-bold' : 'text-content-muted hover:text-content hover:bg-surface-hover'
              )}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-content-muted text-xs">Indikator:</span>
          {indicators.map(ind => (
            <button
              key={ind}
              onClick={() => toggleIndicator(ind)}
              className={clsx('px-2 py-1 rounded-md text-xs transition-colors border',
                activeIndicators.includes(ind)
                  ? 'border-accent/30 text-accent bg-accent/10'
                  : 'border-surface-border text-content-muted hover:border-white/30'
              )}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart */}
      <div className="card p-4">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={candlesWithMA} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <XAxis dataKey="date" tickFormatter={v => v.slice(5)} tick={{ fill: '#64748B', fontSize: 9 }} tickLine={false} axisLine={false} interval={6} />
            <YAxis tick={{ fill: '#64748B', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => fmt(v)} domain={['auto', 'auto']} width={65} />
            <Tooltip content={<CustomCandleTooltip />} />
            {/* Volume */}
            <Bar dataKey="volume" fill="#21262d" yAxisId="vol" opacity={0.5} />
            {/* Price as line (simplified - real candlestick needs custom rendering) */}
            <Line type="monotone" dataKey="close" stroke={bull ? '#00d4aa' : '#ff4d6d'} strokeWidth={2} dot={false} />
            {activeIndicators.includes('MA20') &&
              <Line type="monotone" dataKey="ma20" stroke="#f7b731" strokeWidth={1} dot={false} strokeDasharray="4 2" />}
            {activeIndicators.includes('MA50') &&
              <Line type="monotone" dataKey="ma50" stroke="#00bfff" strokeWidth={1} dot={false} strokeDasharray="4 2" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sub Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* RSI */}
        {activeIndicators.includes('RSI') && (
          <div className="card p-4">
            <h3 className="text-xs text-content-muted mb-2 font-semibold">RSI (14)</h3>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={rsiData} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" hide />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 9 }} tickLine={false} axisLine={false} ticks={[30, 50, 70]} />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-surface-card border border-surface-border rounded px-2 py-1 text-xs font-mono">
                        <span className="text-accent">RSI: {payload[0].value}</span>
                      </div>
                    ) : null
                  }
                />
                <CartesianGrid strokeDasharray="2 4" stroke="#21262d" horizontal={true} vertical={false} />
                <Line type="monotone" dataKey="rsi" stroke="#f7b731" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-between text-[10px] font-mono mt-1">
              <span className="text-bear">Oversold &lt; 30</span>
              <span className="text-warning">RSI: {rsiData[rsiData.length - 1]?.rsi ?? '—'}</span>
              <span className="text-bull">Overbought &gt; 70</span>
            </div>
          </div>
        )}

        {/* MACD */}
        {activeIndicators.includes('MACD') && (
          <div className="card p-4">
            <h3 className="text-xs text-content-muted mb-2 font-semibold">MACD (12, 26, 9)</h3>
            <ResponsiveContainer width="100%" height={100}>
              <ComposedChart data={macdData} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" hide />
                <YAxis tick={{ fill: '#64748B', fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-surface-card border border-surface-border rounded px-2 py-1 text-xs font-mono space-y-0.5">
                        <p className="text-accent">MACD: {payload.find(p => p.dataKey === 'macd')?.value}</p>
                        <p className="text-bear">Signal: {payload.find(p => p.dataKey === 'signal')?.value}</p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="hist" fill="#00d4aa" opacity={0.6}
                  label={false}
                />
                <Line type="monotone" dataKey="macd" stroke="#00d4aa" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="signal" stroke="#ff4d6d" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
