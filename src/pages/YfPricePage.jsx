import { useState } from 'react'
import { Search, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'
import { getYfPrice } from '../services/idxApi'

const fmt = (n) => n?.toLocaleString('id-ID') ?? '-'
const fmtPct = (n) => `${n > 0 ? '+' : ''}${n?.toFixed(2)}%`

export default function YfPricePage() {
  const [ticker, setTicker] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!ticker.trim()) return

    setLoading(true)
    setError(null)
    setData(null)

    try {
      const res = await getYfPrice(ticker.trim())
      setData(res)
    } catch (err) {
      setError(err.message || 'Gagal mengambil data saham')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="card p-6">
        <h2 className="text-xl font-bold text-content mb-4 flex items-center gap-2">
          <Activity className="text-accent" /> Cek Harga Saham (IDX)
        </h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              placeholder="Masukkan kode saham (contoh: BBCA, TLKM, GOTO)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="input-dark w-full pl-9 uppercase"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Mencari...' : 'Cari'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-bear/20 border border-bear/50 rounded-lg text-bear text-sm">
            {error}
          </div>
        )}

        {data && !loading && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card bg-surface p-5 col-span-1 md:col-span-2 lg:col-span-4 flex items-center justify-between border border-surface-border">
              <div>
                <p className="text-2xl font-bold text-content">{data.ticker}</p>
                <p className="text-content-muted text-sm">{data.name}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-mono font-bold text-content">Rp {fmt(data.price)}</p>
                <p className={`font-mono text-lg flex items-center justify-end gap-1 ${data.change >= 0 ? 'text-bull' : 'text-bear'}`}>
                  {data.change >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  {data.change >= 0 ? '+' : ''}{fmt(data.change)} ({fmtPct(data.changePct)})
                </p>
              </div>
            </div>

            <div className="stat-card">
              <p className="text-content-muted text-xs mb-1">Pembukaan (Open)</p>
              <p className="font-mono text-lg text-content">{fmt(data.open)}</p>
            </div>
            <div className="stat-card">
              <p className="text-content-muted text-xs mb-1">Penutupan Sebelumnya</p>
              <p className="font-mono text-lg text-content">{fmt(data.prevClose)}</p>
            </div>
            <div className="stat-card">
              <p className="text-content-muted text-xs mb-1">Harga Tertinggi</p>
              <p className="font-mono text-lg text-content">{fmt(data.high)}</p>
            </div>
            <div className="stat-card">
              <p className="text-content-muted text-xs mb-1">Harga Terendah</p>
              <p className="font-mono text-lg text-content">{fmt(data.low)}</p>
            </div>
            <div className="stat-card">
              <p className="text-content-muted text-xs mb-1">Volume Trading</p>
              <p className="font-mono text-lg text-content">{fmt(data.volume)}</p>
            </div>
            <div className="stat-card">
              <p className="text-content-muted text-xs mb-1">Market Cap</p>
              <p className="font-mono text-lg text-content">{fmt(data.marketCap)}</p>
            </div>
            <div className="stat-card">
              <p className="text-content-muted text-xs mb-1">Trailing P/E</p>
              <p className="font-mono text-lg text-content">{data.pe ? data.pe.toFixed(2) + 'x' : '-'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
