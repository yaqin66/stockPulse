import { useState, useEffect } from 'react'
import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'
import { getNewsData } from '../services/idxApi'
import clsx from 'clsx'

export default function NewsPage() {
  const [ticker] = useState('BBCA')
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchNews = async (targetTicker) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getNewsData(targetTicker)
      console.log('News data received:', data)
      setNews(data || [])
    } catch (err) {
      console.error('News fetch error:', err)
      setError(err.message || 'Gagal mengambil berita')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews(ticker)
  }, [ticker])



  // Statistik Sentimen
  const totalNews = news.length
  const bullishCount = news.filter(n => n.sentiment === 'Bullish').length
  const bearishCount = news.filter(n => n.sentiment === 'Bearish').length
  const neutralCount = news.filter(n => n.sentiment === 'Netral').length

  let overallSentiment = 'Netral'
  let overallColor = 'text-content-muted'
  if (bullishCount > bearishCount) {
    overallSentiment = 'Bullish (Positif)'
    overallColor = 'text-bull'
  } else if (bearishCount > bullishCount) {
    overallSentiment = 'Bearish (Negatif)'
    overallColor = 'text-bear'
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="card p-4">
        <h2 className="text-content font-semibold text-lg flex items-center gap-2">
          <Newspaper size={18} className="text-accent" /> AI News & Sentiment Analysis
          <span className="ml-auto text-xs text-content-muted font-normal font-mono">{ticker}.JK — Yahoo Finance</span>
        </h2>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-surface-border border-t-accent rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="bg-bear/10 border border-bear/20 p-4 rounded-xl text-center">
          <p className="text-bear">{error}</p>
        </div>
      )}

      {!loading && !error && news.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="stat-card border-surface-border">
              <p className="text-content-muted text-[10px] font-bold">Sentimen Keseluruhan</p>
              <p className={clsx("font-bold text-lg", overallColor)}>{overallSentiment}</p>
            </div>
            <div className="stat-card border-bull/30 bg-bull/5">
              <p className="text-bull text-[10px] font-bold">Total Bullish</p>
              <p className="text-bull font-bold font-mono text-xl">{bullishCount}</p>
            </div>
            <div className="stat-card border-bear/30 bg-bear/5">
              <p className="text-bear text-[10px] font-bold">Total Bearish</p>
              <p className="text-bear font-bold font-mono text-xl">{bearishCount}</p>
            </div>
            <div className="stat-card border-surface-border">
              <p className="text-content-muted text-[10px] font-bold">Total Netral</p>
              <p className="text-content font-bold font-mono text-xl">{neutralCount}</p>
            </div>
          </div>

          {/* News List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {news.map((item) => (
              <a 
                key={item.id} 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className={clsx(
                  "p-4 rounded-xl border transition-all hover:scale-[1.01] flex flex-col gap-2",
                  item.ui.bg
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-content font-semibold text-sm leading-snug">{item.title}</h3>
                  <div className={clsx("flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-bold border shrink-0", item.ui.color, item.ui.color === 'text-bull' ? 'border-bull/50 bg-bull/10' : item.ui.color === 'text-bear' ? 'border-bear/50 bg-bear/10' : 'border-muted/30 bg-surface')}>
                    {item.sentiment === 'Bullish' && <TrendingUp size={12} className="mr-1"/>}
                    {item.sentiment === 'Bearish' && <TrendingDown size={12} className="mr-1"/>}
                    {item.sentiment === 'Netral' && <Minus size={12} className="mr-1"/>}
                    {item.sentiment}
                  </div>
                </div>
                
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/5">
                  <p className="text-xs text-content-muted font-medium">{item.publisher}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] text-content-muted">{item.time}</p>
                    <ExternalLink size={12} className="text-content-muted" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {!loading && !error && news.length === 0 && (
        <div className="card p-10 text-center flex flex-col items-center justify-center border-dashed">
          <Newspaper size={40} className="text-content-muted mb-4 opacity-50" />
          <p className="text-content-muted">Tidak ada berita terbaru untuk saham ini di Yahoo Finance.</p>
        </div>
      )}
    </div>
  )
}
