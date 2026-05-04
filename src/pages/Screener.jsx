import { useState, useMemo } from 'react'
import { Search, Filter, Save, ChevronDown, TrendingUp, TrendingDown, X } from 'lucide-react'
import { screenerStocks } from '../data/mockData'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

const fmt = (n) => n?.toLocaleString('id-ID') ?? '-'

const signalBadge = {
  'Strong Buy': 'bg-bull text-black font-bold',
  'Buy': 'bg-bull/20 text-bull',
  'Accumulate': 'bg-accent/20 text-accent',
  'Hold': 'bg-white/10 text-muted',
  'Take Profit': 'bg-warning/20 text-warning',
  'Sell': 'bg-bear/20 text-bear',
}

export default function Screener() {
  const { screenerFilters, setScreenerFilters, savedPresets, savePreset, setActivePage, setSelectedTicker } = useStore()
  const [presetName, setPresetName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [sortBy, setSortBy] = useState({ key: 'rsi', dir: 'asc' })
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    return screenerStocks
      .filter(s => {
        const f = screenerFilters
        if (f.signal !== 'all' && s.signal !== f.signal) return false
        if (f.sector !== 'all' && s.sector !== f.sector) return false
        if (f.cap !== 'all' && s.cap !== f.cap) return false
        if (s.rsi > f.rsiMax) return false
        if (s.pe > f.peMax) return false
        if (s.roe < f.roeMin) return false
        if (s.divYield < f.divYieldMin) return false
        if (searchQuery && !s.ticker.includes(searchQuery.toUpperCase()) && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
        return true
      })
      .sort((a, b) => {
        const v = (x) => x[sortBy.key] ?? 0
        return sortBy.dir === 'asc' ? v(a) - v(b) : v(b) - v(a)
      })
  }, [screenerFilters, sortBy, searchQuery])

  const handleSort = (key) => {
    setSortBy(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }))
  }

  const handleStockClick = (ticker) => {
    setSelectedTicker(ticker)
    setActivePage('chart')
  }

  const sectors = ['all', ...new Set(screenerStocks.map(s => s.sector))]
  const signals = ['all', 'Strong Buy', 'Buy', 'Accumulate', 'Hold', 'Take Profit']

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Filter Panel */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Filter size={16} className="text-accent" /> Filter Parameter
          </h2>
          <div className="flex gap-2">
            {savedPresets.length > 0 && (
              <select className="input-dark text-xs">
                <option>Preset Tersimpan</option>
                {savedPresets.map(p => <option key={p.id}>{p.name}</option>)}
              </select>
            )}
            <button
              onClick={() => setShowSaveModal(true)}
              className="btn-ghost text-xs flex items-center gap-1"
            >
              <Save size={12} /> Simpan Preset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* RSI Max */}
          <div>
            <label className="text-muted text-xs mb-1.5 block">RSI Maks</label>
            <div className="space-y-1">
              <input
                type="range" min={0} max={100} step={5}
                value={screenerFilters.rsiMax}
                onChange={e => setScreenerFilters({ rsiMax: +e.target.value })}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted">0</span>
                <span className="text-accent font-bold">{screenerFilters.rsiMax}</span>
                <span className="text-muted">100</span>
              </div>
            </div>
          </div>

          {/* P/E Max */}
          <div>
            <label className="text-muted text-xs mb-1.5 block">P/E Ratio Maks</label>
            <div className="space-y-1">
              <input
                type="range" min={0} max={50} step={1}
                value={screenerFilters.peMax}
                onChange={e => setScreenerFilters({ peMax: +e.target.value })}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted">0</span>
                <span className="text-accent font-bold">{screenerFilters.peMax}x</span>
                <span className="text-muted">50</span>
              </div>
            </div>
          </div>

          {/* ROE Min */}
          <div>
            <label className="text-muted text-xs mb-1.5 block">ROE Min (%)</label>
            <div className="space-y-1">
              <input
                type="range" min={0} max={50} step={1}
                value={screenerFilters.roeMin}
                onChange={e => setScreenerFilters({ roeMin: +e.target.value })}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted">0</span>
                <span className="text-accent font-bold">{screenerFilters.roeMin}%</span>
                <span className="text-muted">50</span>
              </div>
            </div>
          </div>

          {/* Div Yield Min */}
          <div>
            <label className="text-muted text-xs mb-1.5 block">Div. Yield Min (%)</label>
            <div className="space-y-1">
              <input
                type="range" min={0} max={15} step={0.5}
                value={screenerFilters.divYieldMin}
                onChange={e => setScreenerFilters({ divYieldMin: +e.target.value })}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted">0</span>
                <span className="text-accent font-bold">{screenerFilters.divYieldMin}%</span>
                <span className="text-muted">15</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-surface-border">
          <div>
            <label className="text-muted text-xs mb-1 block">Sektor</label>
            <select
              className="input-dark text-xs"
              value={screenerFilters.sector}
              onChange={e => setScreenerFilters({ sector: e.target.value })}
            >
              {sectors.map(s => <option key={s} value={s}>{s === 'all' ? 'Semua Sektor' : s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-muted text-xs mb-1 block">Sinyal</label>
            <select
              className="input-dark text-xs"
              value={screenerFilters.signal}
              onChange={e => setScreenerFilters({ signal: e.target.value })}
            >
              {signals.map(s => <option key={s} value={s}>{s === 'all' ? 'Semua Sinyal' : s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-muted text-xs mb-1 block">Kapitalisasi</label>
            <select
              className="input-dark text-xs"
              value={screenerFilters.cap}
              onChange={e => setScreenerFilters({ cap: e.target.value })}
            >
              {['all', 'Large', 'Mid', 'Small'].map(s => <option key={s} value={s}>{s === 'all' ? 'Semua' : s + ' Cap'}</option>)}
            </select>
          </div>

          <button
            onClick={() => setScreenerFilters({ rsiMax: 100, peMax: 50, roeMin: 0, divYieldMin: 0, signal: 'all', sector: 'all', cap: 'all' })}
            className="self-end btn-ghost text-xs"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border">
          <span className="text-white font-semibold text-sm">
            Hasil: <span className="text-accent font-mono">{filtered.length}</span> saham
          </span>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Cari..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-dark pl-7 text-xs h-7 w-36"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface-hover">
              <tr className="text-muted">
                {[['ticker', 'Ticker'], ['price', 'Harga'], ['pe', 'P/E'], ['roe', 'ROE%'], ['rsi', 'RSI'], ['divYield', 'Div%'], ['signal', 'Sinyal']].map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={clsx('py-2.5 px-4 text-left font-medium cursor-pointer hover:text-white transition-colors',
                      key !== 'ticker' && 'text-right',
                      sortBy.key === key && 'text-accent'
                    )}
                  >
                    {label} {sortBy.key === key ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.ticker}
                  onClick={() => handleStockClick(s.ticker)}
                  className="border-t border-surface-border/50 hover:bg-surface-hover cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-4">
                    <p className="font-mono font-bold text-white">{s.ticker}</p>
                    <p className="text-muted text-[10px] truncate max-w-[140px]">{s.name}</p>
                  </td>
                  <td className="text-right px-4 font-mono text-white">{fmt(s.price)}</td>
                  <td className="text-right px-4 font-mono">
                    <span className={s.pe < 15 ? 'text-bull' : s.pe > 25 ? 'text-bear' : 'text-white'}>{s.pe}x</span>
                  </td>
                  <td className="text-right px-4 font-mono">
                    <span className={s.roe > 15 ? 'text-bull' : 'text-white'}>{s.roe}%</span>
                  </td>
                  <td className="text-right px-4 font-mono">
                    <span className={s.rsi < 30 ? 'text-bull font-bold' : s.rsi > 70 ? 'text-bear font-bold' : 'text-white'}>{s.rsi}</span>
                  </td>
                  <td className="text-right px-4 font-mono">
                    <span className={s.divYield > 5 ? 'text-bull' : 'text-white'}>{s.divYield}%</span>
                  </td>
                  <td className="text-right px-4 py-2.5">
                    <span className={clsx('px-2 py-0.5 rounded-md text-[10px] font-semibold', signalBadge[s.signal] || 'text-muted')}>
                      {s.signal}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted">
                    Tidak ada saham yang memenuhi kriteria filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 w-80 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Simpan Preset</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-muted hover:text-white"><X size={16} /></button>
            </div>
            <input
              type="text"
              placeholder="Nama preset (e.g. Value Stocks)"
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              className="input-dark w-full mb-4"
            />
            <button
              onClick={() => {
                if (presetName) { savePreset(presetName, screenerFilters); setPresetName(''); setShowSaveModal(false) }
              }}
              className="btn-primary w-full"
            >
              Simpan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
