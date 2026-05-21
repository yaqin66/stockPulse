import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import TickerStrip from './components/TickerStrip'
import SettingsModal from './components/SettingsModal'
import Dashboard from './pages/Dashboard'
import ChartPage from './pages/ChartPage'
import FundamentalPage from './pages/FundamentalPage'
import CalculatorPage from './pages/CalculatorPage'
import NewsPage from './pages/NewsPage'
import AnnouncementPage from './pages/AnnouncementPage'
import TradingInfoPage from './pages/TradingInfoPage'
import YfPricePage from './pages/YfPricePage'
import { useStore } from './store/useStore'

const pages = {
  dashboard: Dashboard,
  chart: ChartPage,
  fundamental: FundamentalPage,
  news: NewsPage,
  calculator: CalculatorPage,
  announcement: AnnouncementPage,
  trading: TradingInfoPage,
  'yf-price': YfPricePage,
}

export default function App() {
  const { activePage } = useStore()
  const Page = pages[activePage] || Dashboard

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        {/* <TickerStrip /> */}
        <main className="flex-1 overflow-y-auto p-5">
          <Page />
        </main>
      </div>
      <SettingsModal />
    </div>
  )
}
