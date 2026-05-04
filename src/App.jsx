import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import TickerStrip from './components/TickerStrip'
import Dashboard from './pages/Dashboard'
import ChartPage from './pages/ChartPage'
import Screener from './pages/Screener'
import FundamentalPage from './pages/FundamentalPage'
import Watchlist from './pages/Watchlist'
import AnnouncementPage from './pages/AnnouncementPage'
import TradingInfoPage from './pages/TradingInfoPage'
import { useStore } from './store/useStore'

const pages = {
  dashboard: Dashboard,
  chart: ChartPage,
  screener: Screener,
  fundamental: FundamentalPage,
  watchlist: Watchlist,
  announcement: AnnouncementPage,
  trading: TradingInfoPage,
}

export default function App() {
  const { activePage } = useStore()
  const Page = pages[activePage] || Dashboard

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <TickerStrip />
        <main className="flex-1 overflow-y-auto p-5">
          <Page />
        </main>
      </div>
    </div>
  )
}
