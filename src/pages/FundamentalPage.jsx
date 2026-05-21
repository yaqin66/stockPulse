import { useState, useEffect } from 'react'
import { FileBarChart2, TrendingUp, Info, ShieldAlert, Zap, DollarSign, Briefcase, Search } from 'lucide-react'
import { getFundamentalData } from '../services/idxApi'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

const fmtNum = (n) => typeof n === 'number' ? n.toLocaleString('id-ID') : n
const fmtVal = (n) => {
  if (n == null) return '—'
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}M`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}Jt`
  return fmtNum(n)
}

const QUICK_TICKERS = ['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'GOTO', 'AMMN', 'BREN', 'ADRO', 'PTBA']

export default function FundamentalPage() {
  const { selectedFundamentalTicker, setSelectedFundamentalTicker } = useStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    const fetchFundamental = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await getFundamentalData(selectedFundamentalTicker)
        setData(result)
      } catch (err) {
        setError(err.message || 'Gagal mengambil data fundamental')
      } finally {
        setLoading(false)
      }
    }
    fetchFundamental()
  }, [selectedFundamentalTicker])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setSelectedFundamentalTicker(searchInput.trim().toUpperCase())
      setSearchInput('')
    }
  }

  const StatBox = ({ label, value, unit = '', color = 'text-content' }) => (
    <div className="stat-card">
      <p className="text-content-muted text-[10px] font-medium mb-0.5">{label}</p>
      <p className={clsx('font-mono font-bold text-sm', color)}>
        {value != null ? value : '-'}{value != null ? unit : ''}
      </p>
    </div>
  )

  const getSignalColor = (signal) => {
    switch (signal) {
      case 'Strong Buy': return 'bg-bull/20 text-bull border-bull/50'
      case 'Buy': return 'bg-bull/10 text-bull border-bull/30'
      case 'Hold': return 'bg-warning/10 text-warning border-warning/30'
      case 'Sell': return 'bg-bear/10 text-bear border-bear/30'
      case 'Strong Sell': return 'bg-bear/20 text-bear border-bear/50'
      default: return 'bg-surface border-surface-border text-content-muted'
    }
  }

  // Kalkulasi Harga Wajar (Graham Number)
  let fairValue = null;
  let marginOfSafety = null;
  if (data?.currentPrice && data?.forwardPE > 0) {
    const eps = data.currentPrice / data.forwardPE;
    const bvps = data.bookValue || (data.priceToBook > 0 ? data.currentPrice / data.priceToBook : 0);
    
    if (eps > 0 && bvps > 0) {
      const grahamSq = 22.5 * eps * bvps;
      if (grahamSq > 0) {
        fairValue = Math.sqrt(grahamSq);
        marginOfSafety = ((fairValue - data.currentPrice) / fairValue) * 100;
      }
    }
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Header & Selector */}
      <div className="card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-content font-semibold text-lg flex items-center gap-2">
            <FileBarChart2 size={18} className="text-accent" /> Data Fundamental & Analisis Valuasi
          </h2>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
              <input 
                type="text" 
                placeholder="Cari kode saham..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                className="input-dark pl-8 w-40 uppercase text-sm"
              />
            </div>
            <button type="submit" className="btn-primary text-xs px-3">Cari</button>
          </form>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {QUICK_TICKERS.map(t => (
            <button
              key={t}
              onClick={() => setSelectedFundamentalTicker(t)}
              className={clsx('text-xs px-3 py-1.5 rounded-md font-mono transition-colors border',
                selectedFundamentalTicker === t
                  ? 'bg-accent/10 border-accent/40 text-accent font-bold'
                  : 'bg-surface-hover border-surface-border text-content-muted hover:text-content'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="card p-10 flex flex-col justify-center items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
          <p className="text-content-muted text-sm">Menarik data fundamental dari Yahoo Finance...</p>
        </div>
      )}

      {error && !loading && (
        <div className="card p-6 bg-bear/5 border-bear/20 flex items-start gap-3">
          <ShieldAlert className="text-bear mt-0.5" size={20} />
          <div>
            <h3 className="text-bear font-bold">Terjadi Kesalahan</h3>
            <p className="text-bear/80 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {data && !loading && !error && (
        <>
          {/* Signal & Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Analisis Sinyal (Utama) */}
            <div className="card p-6 lg:col-span-1 border border-accent/20 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-10 -top-10 text-accent opacity-5">
                <Zap size={150} />
              </div>
              <div>
                <h3 className="text-content-muted text-sm font-semibold mb-2 uppercase tracking-widest">Sinyal Sistem</h3>
                <div className={clsx('w-fit px-4 py-2 rounded-lg border-2 font-bold text-2xl uppercase mb-6 shadow-lg', getSignalColor(data.analysis.signal))}>
                  {data.analysis.signal}
                </div>
                
                <h4 className="text-content text-xs font-bold mb-3 border-b border-surface-border pb-1">Alasan Analisis:</h4>
                <ul className="space-y-2 relative z-10">
                  {data.analysis.reasons.length > 0 ? (
                    data.analysis.reasons.map((reason, i) => (
                      <li key={i} className="text-sm text-content/90 flex items-start gap-2">
                        <span className="text-accent mt-0.5">•</span>
                        {reason}
                      </li>
                    ))
                  ) : (
                    <li className="text-content-muted text-sm italic">Sinyal netral, tidak ada katalis valuasi ekstrim.</li>
                  )}
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-surface-border flex justify-between items-center">
                <span className="text-content-muted text-xs">Total Score:</span>
                <span className="font-mono font-bold text-content text-lg">{data.analysis.score}</span>
              </div>
            </div>

            {/* Profil Perusahaan */}
            <div className="card p-6 lg:col-span-2">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-content flex items-center gap-2">
                    {data.ticker} <span className="text-accent text-sm bg-accent/10 px-2 py-0.5 rounded-md font-mono">{data.sector}</span>
                  </h2>
                  <p className="text-content-muted text-sm mt-1 flex items-center gap-2">
                    <Briefcase size={14} /> {data.industry}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-content-muted">Harga Terakhir</p>
                  <p className="text-xl font-mono font-bold text-content">Rp {fmtNum(data.currentPrice)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <div className="bg-surface-hover p-3 rounded-sm border border-surface-border flex flex-col justify-center">
                  <p className="text-[10px] text-content-muted mb-1">Harga Wajar (Graham)</p>
                  <p className="font-mono font-bold text-accent text-sm">
                    {fairValue ? `Rp ${fmtNum(Math.round(fairValue))}` : <span className="text-content-muted font-sans text-xs font-normal">Data Kurang</span>}
                  </p>
                  {fairValue && (
                    <p className={clsx("text-[10px] font-mono mt-0.5", marginOfSafety > 0 ? 'text-bull' : 'text-bear')}>
                      MoS: {marginOfSafety > 0 ? '+' : ''}{marginOfSafety.toFixed(1)}%
                    </p>
                  )}
                </div>
                <div className="bg-surface-hover p-3 rounded-sm border border-surface-border flex flex-col justify-center">
                  <p className="text-[10px] text-content-muted mb-1">Target Harga (High)</p>
                  <p className="font-mono font-bold text-bull text-sm">
                    {data.targetHighPrice ? `Rp ${fmtNum(data.targetHighPrice)}` : <span className="text-content-muted font-sans text-xs font-normal">Tidak Ada Analis</span>}
                  </p>
                </div>
                <div className="bg-surface-hover p-3 rounded-sm border border-surface-border flex flex-col justify-center">
                  <p className="text-[10px] text-content-muted mb-1">Target Harga (Low)</p>
                  <p className="font-mono font-bold text-bear text-sm">
                    {data.targetLowPrice ? `Rp ${fmtNum(data.targetLowPrice)}` : <span className="text-content-muted font-sans text-xs font-normal">Tidak Ada Analis</span>}
                  </p>
                </div>
                <div className="bg-surface-hover p-3 rounded-sm border border-surface-border flex flex-col justify-center">
                  <p className="text-[10px] text-content-muted mb-1">Total Kas</p>
                  <p className="font-mono font-bold text-content text-sm">{fmtVal(data.totalCash)}</p>
                </div>
                <div className="bg-surface-hover p-3 rounded-sm border border-surface-border flex flex-col justify-center">
                  <p className="text-[10px] text-content-muted mb-1">Total Hutang</p>
                  <p className="font-mono font-bold text-content text-sm">{fmtVal(data.totalDebt)}</p>
                </div>
              </div>

              <div className="text-xs text-content-muted leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                <span className="font-bold text-content">Deskripsi: </span>
                {data.description !== '-' ? data.description : 'Deskripsi tidak tersedia dari Yahoo Finance.'}
              </div>
            </div>
          </div>

          {/* Key Ratios Grid */}
          <div className="card p-5">
            <h3 className="text-content font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-accent" /> Rasio Keuangan Kunci (Valuasi)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <StatBox label="Forward P/E" value={data.forwardPE?.toFixed(2)} unit="x" color={data.forwardPE < 15 ? 'text-bull' : data.forwardPE > 25 ? 'text-bear' : 'text-content'} />
              <StatBox label="PEG Ratio" value={data.pegRatio?.toFixed(2)} unit="x" color={data.pegRatio < 1 ? 'text-bull' : 'text-content'} />
              <StatBox label="Price to Book (PBV)" value={data.priceToBook?.toFixed(2)} unit="x" color={data.priceToBook < 1.5 ? 'text-bull' : data.priceToBook > 3 ? 'text-bear' : 'text-content'} />
              <StatBox label="Return on Equity" value={data.returnOnEquity ? (data.returnOnEquity * 100).toFixed(2) : null} unit="%" color={data.returnOnEquity > 0.15 ? 'text-bull' : 'text-content'} />
              <StatBox label="Return on Assets" value={data.returnOnAssets ? (data.returnOnAssets * 100).toFixed(2) : null} unit="%" />
              <StatBox label="Dividend Yield" value={data.dividendYield ? (data.dividendYield * 100).toFixed(2) : null} unit="%" color="text-accent" />
              <StatBox label="Beta (Volatilitas)" value={data.beta?.toFixed(2)} unit="x" />
            </div>
          </div>

          {/* Technical Analysis 3M */}
          {data.technical && (
            <div className="card p-5">
              <h3 className="text-content font-semibold mb-4 flex items-center gap-2">
                <Zap size={16} className="text-accent" /> Analisis Teknikal (Riwayat 3 Bulan)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <StatBox label="Harga Tertinggi (3M)" value={fmtNum(data.technical.high3M)} color="text-bull" />
                <StatBox label="Harga Terendah (3M)" value={fmtNum(data.technical.low3M)} color="text-bear" />
                <StatBox label="Moving Average (MA20)" value={fmtNum(Math.round(data.technical.ma20))} color={data.currentPrice > data.technical.ma20 ? 'text-bull' : 'text-bear'} />
                <StatBox label="RSI (14 Hari)" value={data.technical.rsi?.toFixed(1)} color={data.technical.rsi < 30 ? 'text-bull' : data.technical.rsi > 70 ? 'text-bear' : 'text-content'} />
                <div className="stat-card">
                  <p className="text-content-muted text-[10px] font-medium mb-0.5">Tren Volume (OBV)</p>
                  <p className={clsx('font-mono font-bold text-sm', data.technical.isAccumulation ? 'text-bull' : 'text-bear')}>
                    {data.technical.isAccumulation ? 'Akumulasi' : 'Distribusi'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Income & Margins */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="text-content font-semibold mb-4 flex items-center gap-2">
                <DollarSign size={16} className="text-accent" /> Laporan Laba Rugi (TTM)
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-surface-hover rounded-lg">
                  <span className="text-content-muted text-sm">Total Pendapatan (Revenue)</span>
                  <span className="font-mono font-bold text-content">{fmtVal(data.totalRevenue)}</span>
                </div>
                <div className="flex justify-between p-3 bg-surface-hover rounded-lg">
                  <span className="text-content-muted text-sm">Laba Kotor (Gross Profit)</span>
                  <span className="font-mono font-bold text-content">{fmtVal(data.grossProfits)}</span>
                </div>
                <div className="flex justify-between p-3 bg-surface-hover rounded-lg">
                  <span className="text-content-muted text-sm">EBITDA</span>
                  <span className="font-mono font-bold text-content">{fmtVal(data.ebitda)}</span>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-content font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-accent" /> Efisiensi Margin
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-surface-hover rounded-lg">
                  <span className="text-content-muted text-sm">Margin Operasi</span>
                  <span className="font-mono font-bold text-bull">
                    {data.operatingMargins ? (data.operatingMargins * 100).toFixed(2) : '-'}%
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-surface-hover rounded-lg">
                  <span className="text-content-muted text-sm">Rekomendasi Analis</span>
                  <span className="font-mono font-bold uppercase text-accent">
                    {data.recommendationKey !== '-' ? data.recommendationKey.replace('_', ' ') : '-'}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-surface-hover rounded-lg">
                  <span className="text-content-muted text-sm">Enterprise Value</span>
                  <span className="font-mono font-bold text-content">{fmtVal(data.enterpriseValue)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
