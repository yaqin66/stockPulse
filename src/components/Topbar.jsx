import { Search, Bell, Clock } from 'lucide-react'
import { useStore } from '../store/useStore'

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
  const { activePage, notifications } = useStore()
  const now = new Date('2026-05-03T09:31:00')
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <header className="h-14 bg-surface-card border-b border-surface-border flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-white font-semibold text-lg">{pageTitle[activePage]}</h1>
        <div className="flex items-center gap-1.5 text-muted text-xs font-mono">
          <Clock size={12} />
          <span>{timeStr}</span>
          <span className="text-surface-border">|</span>
          <span>{dateStr}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Cari saham... (e.g. BBCA)"
            className="input-dark pl-8 w-56 text-xs h-8"
          />
        </div>

        {/* Market status */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bull/10 border border-bull/20">
          <span className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse-slow"></span>
          <span className="text-bull text-xs font-medium">Pasar Terbuka</span>
        </div>

        {/* Notifications */}
        <button className="relative text-muted hover:text-white transition-colors">
          <Bell size={18} />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-bear text-white text-[10px] rounded-full flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
