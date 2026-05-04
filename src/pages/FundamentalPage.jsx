import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { FileBarChart2, TrendingUp, Calendar, Info, ChevronDown } from 'lucide-react'
import { screenerStocks, fundamentalData } from '../data/mockData'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

const fmt = (n) => typeof n === 'number' ? n.toLocaleString('id-ID') : n

const ratioColor = (key, val) => {
  if (key === 'pe') return val < 15 ? 'text-bull' : val > 25 ? 'text-bear' : 'text-white'
  if (key === 'roe') return val > 15 ? 'text-bull' : val < 10 ? 'text-bear' : 'text-white'
  if (key === 'divYield') return val > 5 ? 'text-bull' : 'text-white'
  return 'text-white'
}

const eventBadge = { Dividen: 'text-bull bg-bull/10', RUPS: 'text-accent bg-accent/10', Split: 'text-warning bg-warning/10' }

export default function FundamentalPage() {
  const { selectedFundamentalTicker, setSelectedFundamentalTicker, setActivePage, setSelectedTicker } = useStore()
  const [activeTab, setActiveTab] = useState('income')

  const tickerList = screenerStocks.map(s => s.ticker)
  const stock = fundamentalData[selectedFundamentalTicker] || fundamentalData['BBCA']
  const screenerInfo = screenerStocks.find(s => s.ticker === selectedFundamentalTicker) || screenerStocks[0]

  const incomeData = stock.years.map((y, i) => ({
    year: String(y),
    revenue: stock.revenue[i],
    netIncome: stock.netIncome[i],
  }))

  const ratios = [
    { key: 'pe', label: 'P/E Ratio', value: screenerInfo.pe, unit: 'x' },
    { key: 'pbv', label: 'P/BV Ratio', value: stock.pbv, unit: 'x' },
    { key: 'eps', label: 'EPS', value: fmt(stock.eps), unit: '' },
    { key: 'roe', label: 'ROE', value: screenerInfo.roe, unit: '%' },
    { key: 'der', label: 'DER', value: stock.der, unit: 'x' },
    { key: 'currentRatio', label: 'Current Ratio', value: stock.currentRatio, unit: 'x' },
    { key: 'divYield', label: 'Div. Yield', value: screenerInfo.divYield, unit: '%' },
    { key: 'cap', label: 'Market Cap', value: stock.marketCap, unit: '' },
  ]

  const handleChart = () => {
    setSelectedTicker(selectedFundamentalTicker)
    setActivePage('chart')
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Ticker Selector + Header */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                {selectedFundamentalTicker.slice(0, 2)}
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">{stock.name}</h2>
                <p className="text-muted text-xs">{stock.sector} · {stock.industry}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="input-dark text-sm"
              value={selectedFundamentalTicker}
              onChange={e => setSelectedFundamentalTicker(e.target.value)}
            >
              {tickerList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-white">{fmt(stock.price)}</p>
              <p className={clsx('text-sm font-mono', stock.change >= 0 ? 'text-bull' : 'text-bear')}>
                {stock.change >= 0 ? '+' : ''}{stock.change}%
              </p>
            </div>
            <button onClick={handleChart} className="btn-primary text-xs">
              Lihat Chart
            </button>
          </div>
        </div>

        {/* Key Ratios */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-5 pt-4 border-t border-surface-border">
          {ratios.map(r => (
            <div key={r.key} className="text-center">
              <p className="text-muted text-[10px] font-medium mb-0.5">{r.label}</p>
              <p className={clsx('font-mono font-bold text-sm', ratioColor(r.key, r.value))}>
                {r.value}{r.unit}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Financial Charts */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <FileBarChart2 size={16} className="text-accent" /> Laporan Keuangan (5 Tahun)
            </h3>
            <div className="flex gap-1">
              {[['income', 'Laba Rugi'], ['cashflow', 'Arus Kas']].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setActiveTab(k)}
                  className={clsx('text-xs px-2.5 py-1 rounded-md transition-colors',
                    activeTab === k ? 'bg-accent text-black font-bold' : 'text-muted hover:text-white'
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <XAxis dataKey="year" tick={{ fill: '#8b949e', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#8b949e', fontSize: 9 }} tickLine={false} axisLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}T`} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="bg-surface-card border border-surface-border rounded-lg p-3 text-xs font-mono space-y-1">
                      <p className="text-muted">{label}</p>
                      {payload.map(p => (
                        <p key={p.dataKey} style={{ color: p.fill }}>
                          {p.dataKey === 'revenue' ? 'Pendapatan' : 'Laba Bersih'}: {fmt(p.value)} M
                        </p>
                      ))}
                    </div>
                  ) : null
                }
              />
              <CartesianGrid strokeDasharray="2 4" stroke="#21262d" vertical={false} />
              <Bar dataKey="revenue" fill="#21262d" radius={[4, 4, 0, 0]} name="Pendapatan" />
              <Bar dataKey="netIncome" fill="#00d4aa" radius={[4, 4, 0, 0]} name="Laba Bersih" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-surface-hover" /> Pendapatan</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-accent" /> Laba Bersih</span>
          </div>
        </div>

        {/* Event Calendar */}
        <div className="card p-5">
          <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-accent" /> Event Calendar
          </h3>
          <div className="space-y-3">
            {stock.events.map((ev, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-surface-hover border border-surface-border">
                <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-md h-fit flex-shrink-0', eventBadge[ev.type])}>
                  {ev.type}
                </span>
                <div>
                  <p className="text-white text-xs font-medium leading-tight">{ev.desc}</p>
                  <p className="text-muted text-[10px] mt-0.5 font-mono">{ev.date}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-3 p-3 rounded-xl bg-surface-hover border border-surface-border opacity-40">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md h-fit text-warning bg-warning/10">Coming</span>
              <div>
                <p className="text-white text-xs font-medium">Tidak ada event berikutnya</p>
                <p className="text-muted text-[10px] mt-0.5 font-mono">—</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Tickers */}
      <div className="card p-5">
        <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
          <TrendingUp size={14} className="text-accent" /> Saham Lain — Klik untuk Detail Fundamental
        </h3>
        <div className="flex flex-wrap gap-2">
          {screenerStocks.map(s => (
            <button
              key={s.ticker}
              onClick={() => setSelectedFundamentalTicker(s.ticker)}
              className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-all',
                s.ticker === selectedFundamentalTicker
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-surface-border text-muted hover:border-white/20 hover:text-white'
              )}
            >
              <span className="font-mono font-bold">{s.ticker}</span>
              <span className={s.roe > 15 ? 'text-bull' : 'text-bear'}>ROE {s.roe}%</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
