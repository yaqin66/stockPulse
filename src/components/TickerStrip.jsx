import { TrendingUp, TrendingDown } from 'lucide-react'
import { marketIndices, topGainers, topLosers } from '../data/mockData'

const tickers = [
  ...marketIndices.map(i => ({ label: i.name, price: i.value, pct: i.changePct, type: 'index' })),
  ...topGainers.map(g => ({ label: g.ticker, price: g.price, pct: g.change, type: 'stock' })),
  ...topLosers.map(l => ({ label: l.ticker, price: l.price, pct: l.change, type: 'stock' })),
]

const fmt = (n) => n.toLocaleString('id-ID')
const fmtPct = (n) => `${n > 0 ? '+' : ''}${n.toFixed(2)}%`

export default function TickerStrip() {
  return (
    <div className="bg-surface-card border-b border-surface-border overflow-hidden relative flex-shrink-0">
      <div className="flex">
        {/* Duplicate for seamless loop */}
        <div className="ticker-strip py-2 px-4">
          {[...tickers, ...tickers].map((t, i) => (
            <div key={i} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <span className={`text-xs font-mono font-semibold ${t.type === 'index' ? 'text-accent' : 'text-white'}`}>
                {t.label}
              </span>
              <span className="text-xs font-mono text-white">{fmt(t.price)}</span>
              <span className={`flex items-center gap-0.5 text-xs font-mono ${t.pct >= 0 ? 'text-bull' : 'text-bear'}`}>
                {t.pct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {fmtPct(t.pct)}
              </span>
              <span className="text-surface-border">|</span>
            </div>
          ))}
        </div>
      </div>
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-surface-card to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface-card to-transparent pointer-events-none" />
    </div>
  )
}
