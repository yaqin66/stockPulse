import { Star, Trash2, TrendingUp, TrendingDown, BarChart2, Plus } from 'lucide-react'
import { screenerStocks } from '../data/mockData'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

const fmt = (n) => n?.toLocaleString('id-ID') ?? '-'

export default function Watchlist() {
  const { watchlist, removeFromWatchlist, setActivePage, setSelectedTicker } = useStore()

  const watchlistData = watchlist
    .map(ticker => screenerStocks.find(s => s.ticker === ticker))
    .filter(Boolean)

  const handleChart = (ticker) => {
    setSelectedTicker(ticker)
    setActivePage('chart')
  }

  const handleFundamental = (ticker) => {
    useStore.getState().setSelectedFundamentalTicker?.(ticker)
    setActivePage('fundamental')
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold flex items-center gap-2">
              <Star size={18} className="text-warning fill-warning" /> Watchlist Saya
            </h2>
            <p className="text-muted text-xs mt-1">{watchlistData.length} saham dipantau</p>
          </div>
          <button
            onClick={() => setActivePage('screener')}
            className="btn-ghost text-xs flex items-center gap-1"
          >
            <Plus size={12} /> Tambah Saham
          </button>
        </div>
      </div>

      {/* Watchlist Cards */}
      {watchlistData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {watchlistData.map(s => {
            const bull = Math.random() > 0.4
            const pct = (Math.random() * 8 - 3).toFixed(2)
            const priceChange = ((s.price * parseFloat(pct)) / 100).toFixed(0)

            return (
              <div key={s.ticker} className={clsx('card p-5 hover:border-accent/30 transition-all duration-200 group', parseFloat(pct) >= 0 ? 'glow-bull' : 'glow-bear')}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-lg">{s.ticker}</span>
                      <span className={clsx('badge-neutral text-[10px]', s.cap === 'Large' ? 'text-accent' : '')}>{s.cap} Cap</span>
                    </div>
                    <p className="text-muted text-xs truncate max-w-[180px]">{s.name}</p>
                  </div>
                  <button
                    onClick={() => removeFromWatchlist(s.ticker)}
                    className="text-muted hover:text-bear transition-colors opacity-0 group-hover:opacity-100"
                    title="Hapus dari watchlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold font-mono text-white">{fmt(s.price)}</span>
                  <span className={clsx('flex items-center gap-0.5 text-sm font-mono', parseFloat(pct) >= 0 ? 'text-bull' : 'text-bear')}>
                    {parseFloat(pct) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {parseFloat(pct) >= 0 ? '+' : ''}{pct}%
                  </span>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[['P/E', s.pe + 'x'], ['ROE', s.roe + '%'], ['RSI', s.rsi]].map(([k, v]) => (
                    <div key={k} className="text-center bg-surface-hover rounded-lg py-1.5">
                      <p className="text-muted text-[10px]">{k}</p>
                      <p className={clsx('font-mono font-bold text-xs',
                        k === 'RSI' ? (s.rsi < 30 ? 'text-bull' : s.rsi > 70 ? 'text-bear' : 'text-white') :
                        k === 'ROE' ? (s.roe > 15 ? 'text-bull' : 'text-white') : 'text-white'
                      )}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* Signal */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-muted text-xs">Sinyal Teknikal:</span>
                  <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-md',
                    s.signal === 'Strong Buy' ? 'bg-bull text-black' :
                    s.signal === 'Buy' ? 'bg-bull/20 text-bull' :
                    s.signal === 'Hold' ? 'bg-white/10 text-muted' : 'bg-bear/20 text-bear'
                  )}>{s.signal}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleChart(s.ticker)}
                    className="flex-1 btn-primary text-xs py-1.5"
                  >
                    Chart
                  </button>
                  <button
                    onClick={() => handleFundamental(s.ticker)}
                    className="flex-1 btn-ghost text-xs py-1.5"
                  >
                    Fundamental
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <Star size={40} className="text-muted mb-4" />
          <p className="text-white font-semibold mb-2">Watchlist Masih Kosong</p>
          <p className="text-muted text-sm mb-4">Tambahkan saham favorit Anda dari Screener atau Chart</p>
          <button onClick={() => setActivePage('screener')} className="btn-primary">
            Buka Screener
          </button>
        </div>
      )}

      {/* Summary Stats */}
      {watchlistData.length > 0 && (
        <div className="card p-5">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <BarChart2 size={14} className="text-accent" /> Ringkasan Portfolio Watchlist
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Rata-rata RSI', value: (watchlistData.reduce((a, s) => a + s.rsi, 0) / watchlistData.length).toFixed(1), color: 'text-warning' },
              { label: 'Rata-rata P/E', value: (watchlistData.reduce((a, s) => a + s.pe, 0) / watchlistData.length).toFixed(1) + 'x', color: 'text-white' },
              { label: 'Rata-rata ROE', value: (watchlistData.reduce((a, s) => a + s.roe, 0) / watchlistData.length).toFixed(1) + '%', color: 'text-bull' },
              { label: 'Avg Div Yield', value: (watchlistData.reduce((a, s) => a + s.divYield, 0) / watchlistData.length).toFixed(1) + '%', color: 'text-bull' },
            ].map(stat => (
              <div key={stat.label} className="bg-surface-hover rounded-xl p-3 text-center">
                <p className="text-muted text-xs mb-1">{stat.label}</p>
                <p className={clsx('font-mono font-bold text-lg', stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
