import { 
  LayoutDashboard, LineChart, Search, FileBarChart2, Star,
  Settings, ChevronLeft, ChevronRight, TrendingUp,
  Megaphone, BarChart2, DollarSign, Calculator, Newspaper
} from 'lucide-react'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Market Dashboard' },
  { id: 'fundamental', icon: FileBarChart2, label: 'Data Fundamental' },
  { id: 'news', icon: Newspaper, label: 'AI News Analysis' },
  { id: 'calculator', icon: Calculator, label: 'Kalkulator Saham' },
  { id: 'announcement', icon: Megaphone, label: 'Pengumuman' },
  { id: 'trading', icon: BarChart2, label: 'Info Trading IDX' },
]

export default function Sidebar() {
  const { activePage, setActivePage, sidebarCollapsed, toggleSidebar, openSettings, settings } = useStore()

  return (
    <aside className={clsx(
      'flex flex-col h-screen bg-surface-card border-r border-surface-border transition-all duration-300 flex-shrink-0',
      sidebarCollapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-surface-border">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-content" />
            </div>
            <span className="font-bold text-content text-lg tracking-tight">StockPulse</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="mx-auto w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-content" />
          </div>
        )}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="text-content-muted hover:text-content transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Collapsed toggle */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mt-2 text-content-muted hover:text-content transition-colors p-1"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActivePage(id)}
            className={clsx(
              'nav-item w-full',
              activePage === id && 'active',
              sidebarCollapsed && 'justify-center px-0'
            )}
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-4 border-t border-surface-border space-y-1">

        <button
          onClick={openSettings}
          id="sidebar-settings-btn"
          className={clsx(
            'nav-item w-full',
            sidebarCollapsed && 'justify-center px-0'
          )}
          title={sidebarCollapsed ? 'Pengaturan' : undefined}
        >
          <Settings size={18} />
          {!sidebarCollapsed && <span>Pengaturan</span>}
        </button>
      </div>

      {/* User */}
      {!sidebarCollapsed && (
        <div className="px-4 py-3 border-t border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
              {settings?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-content truncate">{settings?.displayName || 'User'}</p>
              <p className="text-xs text-content-muted truncate">{settings?.role || 'Trader'}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
