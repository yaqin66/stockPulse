import { useState, useEffect } from 'react'
import { Search, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useStore } from '../store/useStore'
import { getMarketStatus } from '../utils/marketCalendar'

const pageTitle = {
  dashboard: 'Market Dashboard',
  chart: 'Advanced Charting',
  screener: 'Stock Screener',
  fundamental: 'Data Fundamental',
  watchlist: 'Watchlist Saya',
  announcement: 'Pengumuman Emiten IDX',
  trading: 'Informasi Trading IDX',
}

export default function Topbar() {
  const { activePage } = useStore()
  const [now, setNow] = useState(new Date())

  // Live clock — update setiap detik
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Format waktu & tanggal dalam zona WIB
  const timeStr = now.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const dateStr = now.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Status pasar berdasarkan hari, jam, dan hari libur nasional
  const marketStatus = getMarketStatus(now)

  return (
    <header className="h-14 bg-surface-card border-b border-surface-border flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-content font-semibold text-lg">{pageTitle[activePage]}</h1>
        <div className="flex items-center gap-1.5 text-content-muted text-xs font-mono">
          <Clock size={12} />
          <span>{timeStr}</span>
          <span className="text-surface-border">|</span>
          <span>{dateStr}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            placeholder="Cari saham... (e.g. BBCA)"
            className="input-dark pl-8 w-56 text-xs h-8"
          />
        </div>

        {/* Market status — dinamis berdasarkan hari & jam */}
        {marketStatus.open ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bull/10 border border-bull/20">
            <span className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse-slow" />
            <span className="text-bull text-xs font-medium">Pasar Terbuka</span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-content-muted/10 border border-surface-border"
            title={marketStatus.reason}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-content-muted" />
            <span className="text-content-muted text-xs font-medium">
              Pasar Tutup
              {marketStatus.reason ? ` · ${marketStatus.reason}` : ''}
            </span>
          </div>
        )}


      </div>
    </header>
  )
}
