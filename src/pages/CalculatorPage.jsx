import { useState, useEffect } from 'react'
import { Calculator, Save, Trash2, TrendingUp, TrendingDown, DollarSign, Target, ShieldAlert, BookOpen } from 'lucide-react'
import clsx from 'clsx'

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number)
}

// Define InputField OUTSIDE the main component to prevent re-mounting and losing focus
const InputField = ({ label, value, onChange, placeholder, icon, type="number" }) => (
  <div>
    <label className="text-xs text-content-muted mb-1 block">{label}</label>
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">{icon}</span>}
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className={clsx("input-dark w-full", icon && "pl-8")} 
      />
    </div>
  </div>
)

export default function CalculatorPage() {
  const [activeTab, setActiveTab] = useState('avg')
  const [savedHistory, setSavedHistory] = useState([])
  const [saveName, setSaveName] = useState('')

  // Load history on mount
  useEffect(() => {
    const history = localStorage.getItem('stockpulse_calc_history')
    if (history) {
      setSavedHistory(JSON.parse(history))
    }
  }, [])

  // Save history helper
  const saveToHistory = (type, data, result) => {
    if (!saveName.trim()) {
      alert("Harap masukkan nama simpanan terlebih dahulu!")
      return
    }
    const newEntry = {
      id: Date.now().toString(),
      name: saveName,
      type,
      date: new Date().toLocaleString('id-ID'),
      data,
      result
    }
    const updated = [newEntry, ...savedHistory]
    setSavedHistory(updated)
    localStorage.setItem('stockpulse_calc_history', JSON.stringify(updated))
    setSaveName('')
  }

  const deleteHistory = (id) => {
    const updated = savedHistory.filter(h => h.id !== id)
    setSavedHistory(updated)
    localStorage.setItem('stockpulse_calc_history', JSON.stringify(updated))
  }

  // 1. Avg Down / Up State
  const [avgData, setAvgData] = useState({ currentPrice: '', currentLot: '', newPrice: '', newLot: '' })
  const [avgResult, setAvgResult] = useState(null)

  const calcAvg = () => {
    const p1 = Number(avgData.currentPrice)
    const l1 = Number(avgData.currentLot)
    const p2 = Number(avgData.newPrice)
    const l2 = Number(avgData.newLot)
    
    // Rumus Avg: ((Harga1 * Lot1) + (Harga2 * Lot2)) / (Lot1 + Lot2)
    const totalModal1 = p1 * (l1 * 100)
    const totalModal2 = p2 * (l2 * 100)
    const totalLot = l1 + l2
    const totalModalFinal = totalModal1 + totalModal2
    const avgPrice = totalModalFinal / (totalLot * 100)
    
    setAvgResult({ avgPrice, totalLot, totalModalFinal })
  }

  // 2. Profit / Loss State
  const [plData, setPlData] = useState({ buyPrice: '', lot: '', sellPrice: '', feeBuy: '0.15', feeSell: '0.25' })
  const [plResult, setPlResult] = useState(null)

  const calcPL = () => {
    const b = Number(plData.buyPrice)
    const l = Number(plData.lot) * 100
    const s = Number(plData.sellPrice)
    const fb = Number(plData.feeBuy) / 100
    const fs = Number(plData.feeSell) / 100

    // Rumus:
    // Modal Awal = (Harga Beli * Lembar) * (1 + Fee Beli)
    // Hasil Jual = (Harga Jual * Lembar) * (1 - Fee Jual)
    // Profit Bersih = Hasil Jual - Modal Awal
    const modalAwal = (b * l) * (1 + fb)
    const hasilJual = (s * l) * (1 - fs)
    const netProfit = hasilJual - modalAwal
    const roi = (netProfit / modalAwal) * 100

    setPlResult({ modalAwal, hasilJual, netProfit, roi })
  }

  // 3. Dividen Yield State
  const [divData, setDivData] = useState({ lot: '', dps: '', buyPrice: '', isTaxed: true })
  const [divResult, setDivResult] = useState(null)

  const calcDiv = () => {
    const l = Number(divData.lot) * 100
    const dps = Number(divData.dps)
    const p = Number(divData.buyPrice)
    
    // Rumus:
    // Dividen Kotor = DPS * Lembar
    // Pajak = 10% (jika isTaxed true)
    // Personal Yield = (Dividen Bersih per lembar / Harga Beli) * 100%
    const gross = dps * l
    const tax = divData.isTaxed ? gross * 0.1 : 0
    const net = gross - tax
    const netDps = divData.isTaxed ? dps * 0.9 : dps
    const yieldPct = p > 0 ? (netDps / p) * 100 : 0

    setDivResult({ gross, tax, net, yieldPct })
  }

  // 4. Money Management (Risk) State
  const [mmData, setMmData] = useState({ equity: '', riskPct: '1', buyPrice: '', stopLoss: '' })
  const [mmResult, setMmResult] = useState(null)

  const calcMM = () => {
    const eq = Number(mmData.equity)
    const r = Number(mmData.riskPct) / 100
    const bp = Number(mmData.buyPrice)
    const sl = Number(mmData.stopLoss)

    // Rumus Risk Management:
    // Max Risk Nominal = Equity * % Risk
    // Jarak SL per lembar = Buy Price - Stop Loss Price
    // Max Lembar dibeli = Max Risk Nominal / Jarak SL
    const maxRisk = eq * r
    const riskPerShare = bp - sl

    if (riskPerShare <= 0) return alert("Harga Stop Loss harus lebih rendah dari Harga Beli!")
    
    const maxShares = Math.floor(maxRisk / riskPerShare)
    const maxLot = Math.floor(maxShares / 100)
    const modalRequired = maxLot * 100 * bp

    setMmResult({ maxRisk, riskPerShare, maxLot, modalRequired, warning: modalRequired > eq })
  }

  // 5. Target Price State
  const [tpData, setTpData] = useState({ buyPrice: '', stopLoss: '', rrRatio: '2' })
  const [tpResult, setTpResult] = useState(null)

  const calcTP = () => {
    const bp = Number(tpData.buyPrice)
    const sl = Number(tpData.stopLoss)
    const rr = Number(tpData.rrRatio)

    // Rumus RR:
    // Risk = Buy Price - Stop Loss Price
    // Reward = Risk * Rasio RR
    // Target Price = Buy Price + Reward
    const risk = bp - sl
    if (risk <= 0) return alert("Harga Stop Loss harus lebih rendah dari Harga Beli!")
    
    const reward = risk * rr
    const target = bp + reward

    setTpResult({ risk, reward, target, rr })
  }

  // 6. Passive Income Target State
  const [piData, setPiData] = useState({ target: '', period: 'month', dps: '', currentPrice: '' })
  const [piResult, setPiResult] = useState(null)

  const calcPI = () => {
    const t = Number(piData.target)
    const isMonthly = piData.period === 'month'
    const targetAnnual = isMonthly ? t * 12 : t
    const dps = Number(piData.dps)
    const p = Number(piData.currentPrice)

    if (dps <= 0) return alert("Dividen per lembar (DPS) harus lebih dari 0!")

    // Rumus Passive Income:
    // Target Tahunan = Target Bulanan * 12
    // Lembar Dibutuhkan = Target Tahunan / DPS
    // Modal Dibutuhkan = Lembar Dibutuhkan * Harga Saat Ini
    const sharesNeeded = Math.ceil(targetAnnual / dps)
    const lotsNeeded = Math.ceil(sharesNeeded / 100)
    const capitalNeeded = lotsNeeded * 100 * p

    setPiResult({ targetAnnual, lotsNeeded, capitalNeeded })
  }

  // 7. Fair Value (Valuasi) State
  const [fvData, setFvData] = useState({ eps: '', bvps: '', dps: '', g: '5', r: '10', avgPbv: '', avgPer: '' })
  const [fvResult, setFvResult] = useState(null)

  const calcFV = () => {
    const eps = Number(fvData.eps)
    const bvps = Number(fvData.bvps)
    const dps = Number(fvData.dps)
    const g = Number(fvData.g) / 100
    const r = Number(fvData.r) / 100
    const avgPbv = Number(fvData.avgPbv)
    const avgPer = Number(fvData.avgPer)

    let graham = 0
    if (eps > 0 && bvps > 0) {
      graham = Math.sqrt(22.5 * eps * bvps)
    }

    let ddm = 0
    if (dps > 0 && r > g) {
      ddm = (dps * (1 + g)) / (r - g)
    }

    const pbvFair = avgPbv > 0 ? avgPbv * bvps : 0
    const perFair = avgPer > 0 ? avgPer * eps : 0

    setFvResult({ graham, ddm, pbvFair, perFair })
  }

  const TABS = [
    { id: 'avg', label: 'Avg Up/Down', icon: <TrendingUp size={14}/> },
    { id: 'pl', label: 'Profit/Loss', icon: <DollarSign size={14}/> },
    { id: 'div', label: 'Dividen', icon: <DollarSign size={14}/> },
    { id: 'mm', label: 'Risk per Trade', icon: <ShieldAlert size={14}/> },
    { id: 'tp', label: 'Target Price', icon: <Target size={14}/> },
    { id: 'pi', label: 'Passive Income', icon: <BookOpen size={14}/> },
    { id: 'fv', label: 'Harga Wajar', icon: <Calculator size={14}/> },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-5 animate-fade-in h-full">
      {/* KIRI: Kalkulator (Flex-1) */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="card p-5">
          <h2 className="text-content font-semibold text-xl flex items-center gap-2 mb-4">
            <Calculator className="text-accent" /> Alat Kalkulator Saham
          </h2>
          
          <div className="flex flex-wrap gap-2 mb-6 border-b border-surface-border pb-4">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all border',
                  activeTab === tab.id
                    ? 'bg-accent/10 border-accent/40 text-accent font-bold'
                    : 'bg-surface-hover border-transparent text-content-muted hover:text-content'
                )}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* === CONTENT 1: AVG UP/DOWN === */}
          {activeTab === 'avg' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <InputField label="Harga Rata-Rata Saat Ini" placeholder="Misal: 1500" value={avgData.currentPrice} onChange={v => setAvgData({...avgData, currentPrice: v})} />
                <InputField label="Jumlah Lot Saat Ini" placeholder="Misal: 10" value={avgData.currentLot} onChange={v => setAvgData({...avgData, currentLot: v})} />
                <InputField label="Harga Beli Baru" placeholder="Misal: 1400" value={avgData.newPrice} onChange={v => setAvgData({...avgData, newPrice: v})} />
                <InputField label="Jumlah Lot Baru" placeholder="Misal: 20" value={avgData.newLot} onChange={v => setAvgData({...avgData, newLot: v})} />
              </div>
              <button onClick={calcAvg} className="btn-primary w-full mb-4">Hitung Average</button>
              
              {avgResult && (
                <div className="bg-surface-hover p-4 rounded-xl border border-surface-border mb-4">
                  <p className="text-content-muted text-xs mb-2">Hasil Perhitungan:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="stat-card">
                      <p className="text-content-muted text-[10px]">Harga Rata-Rata Baru</p>
                      <p className="text-content font-bold font-mono text-lg">{formatRupiah(avgResult.avgPrice)}</p>
                    </div>
                    <div className="stat-card">
                      <p className="text-content-muted text-[10px]">Total Lot Kepemilikan</p>
                      <p className="text-content font-bold font-mono text-lg">{avgResult.totalLot} Lot</p>
                    </div>
                    <div className="stat-card">
                      <p className="text-content-muted text-[10px]">Total Modal Keseluruhan</p>
                      <p className="text-content font-bold font-mono text-lg">{formatRupiah(avgResult.totalModalFinal)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === CONTENT 2: PROFIT/LOSS === */}
          {activeTab === 'pl' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <InputField label="Harga Beli" placeholder="1000" value={plData.buyPrice} onChange={v => setPlData({...plData, buyPrice: v})} />
                <InputField label="Jumlah Lot" placeholder="10" value={plData.lot} onChange={v => setPlData({...plData, lot: v})} />
                <InputField label="Harga Jual" placeholder="1200" value={plData.sellPrice} onChange={v => setPlData({...plData, sellPrice: v})} />
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="Fee Beli (%)" value={plData.feeBuy} onChange={v => setPlData({...plData, feeBuy: v})} />
                  <InputField label="Fee Jual (%)" value={plData.feeSell} onChange={v => setPlData({...plData, feeSell: v})} />
                </div>
              </div>
              <button onClick={calcPL} className="btn-primary w-full mb-4">Hitung Keuntungan Bersih</button>
              
              {plResult && (
                <div className="bg-surface-hover p-4 rounded-xl border border-surface-border mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="stat-card">
                      <p className="text-content-muted text-[10px]">Total Modal Awal (inc. Fee)</p>
                      <p className="text-content font-bold font-mono text-sm">{formatRupiah(plResult.modalAwal)}</p>
                    </div>
                    <div className="stat-card">
                      <p className="text-content-muted text-[10px]">Hasil Penjualan Bersih</p>
                      <p className="text-content font-bold font-mono text-sm">{formatRupiah(plResult.hasilJual)}</p>
                    </div>
                    <div className="stat-card col-span-2 md:col-span-1 border-t border-surface-border pt-2">
                      <p className="text-content-muted text-[10px]">Profit / Loss (Rupiah)</p>
                      <p className={clsx("font-bold font-mono text-xl", plResult.netProfit >= 0 ? "text-bull" : "text-bear")}>
                        {plResult.netProfit > 0 ? '+' : ''}{formatRupiah(plResult.netProfit)}
                      </p>
                    </div>
                    <div className="stat-card col-span-2 md:col-span-1 border-t border-surface-border pt-2">
                      <p className="text-content-muted text-[10px]">Return on Investment (ROI)</p>
                      <p className={clsx("font-bold font-mono text-xl", plResult.roi >= 0 ? "text-bull" : "text-bear")}>
                        {plResult.roi > 0 ? '+' : ''}{plResult.roi.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === CONTENT 3: DIVIDEN === */}
          {activeTab === 'div' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <InputField label="Jumlah Lot Kepemilikan" placeholder="100" value={divData.lot} onChange={v => setDivData({...divData, lot: v})} />
                <InputField label="Dividen per Lembar (DPS)" placeholder="Misal: 250" value={divData.dps} onChange={v => setDivData({...divData, dps: v})} />
                <InputField label="Harga Beli Saham (Avg)" placeholder="Untuk hitung personal yield" value={divData.buyPrice} onChange={v => setDivData({...divData, buyPrice: v})} />
                <div>
                  <label className="text-xs text-content-muted mb-1 block">Pajak Dividen PPh Final</label>
                  <button 
                    onClick={() => setDivData({...divData, isTaxed: !divData.isTaxed})}
                    className={clsx("w-full py-2 rounded-lg text-sm font-bold border transition-colors", divData.isTaxed ? "bg-bear/20 border-bear/50 text-bear" : "bg-bull/20 border-bull/50 text-bull")}
                  >
                    {divData.isTaxed ? 'Dipotong Pajak 10%' : 'Bebas Pajak 0% (Reinvestasi)'}
                  </button>
                </div>
              </div>
              <button onClick={calcDiv} className="btn-primary w-full mb-4">Hitung Dividen</button>

              {divResult && (
                <div className="bg-surface-hover p-4 rounded-xl border border-surface-border mb-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="stat-card">
                      <p className="text-content-muted text-[10px]">Dividen Kotor</p>
                      <p className="text-content font-bold font-mono">{formatRupiah(divResult.gross)}</p>
                    </div>
                    <div className="stat-card">
                      <p className="text-content-muted text-[10px]">Potongan Pajak</p>
                      <p className="text-bear font-bold font-mono">{formatRupiah(divResult.tax)}</p>
                    </div>
                    <div className="stat-card bg-accent/10 border-accent/20">
                      <p className="text-accent text-[10px]">Dividen Bersih Diterima</p>
                      <p className="text-accent font-bold font-mono text-lg">{formatRupiah(divResult.net)}</p>
                    </div>
                    <div className="stat-card">
                      <p className="text-content-muted text-[10px]">Personal Dividend Yield</p>
                      <p className="text-bull font-bold font-mono text-lg">{divResult.yieldPct.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === CONTENT 4: RISK MANAGEMENT === */}
          {activeTab === 'mm' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <InputField label="Total Modal Bersih (Equity)" placeholder="10000000" value={mmData.equity} onChange={v => setMmData({...mmData, equity: v})} />
                <InputField label="Batas Risiko per Trade (%)" placeholder="1 atau 2" value={mmData.riskPct} onChange={v => setMmData({...mmData, riskPct: v})} />
                <InputField label="Rencana Harga Beli" placeholder="Misal: 1500" value={mmData.buyPrice} onChange={v => setMmData({...mmData, buyPrice: v})} />
                <InputField label="Rencana Harga Cut Loss" placeholder="Misal: 1400" value={mmData.stopLoss} onChange={v => setMmData({...mmData, stopLoss: v})} />
              </div>
              <button onClick={calcMM} className="btn-primary w-full mb-4">Hitung Batas Aman Pembelian</button>

              {mmResult && (
                <div className="bg-surface-hover p-4 rounded-xl border border-surface-border mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="stat-card border-bear/30 bg-bear/5">
                      <p className="text-bear text-[10px] font-bold">Maksimal Nominal Kerugian (Risk)</p>
                      <p className="text-bear font-bold font-mono text-lg">{formatRupiah(mmResult.maxRisk)}</p>
                    </div>
                    <div className="stat-card border-bull/30 bg-bull/5">
                      <p className="text-bull text-[10px] font-bold">Maksimal Lot Saham Boleh Dibeli</p>
                      <p className="text-bull font-bold font-mono text-lg">{mmResult.maxLot} Lot</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <p className="text-content-muted text-[10px]">Modal yang Harus Disiapkan (Capital Required)</p>
                    <p className="text-content font-bold font-mono">{formatRupiah(mmResult.modalRequired)}</p>
                    {mmResult.warning && (
                      <p className="text-warning text-xs mt-1">⚠️ Peringatan: Modal yang disiapkan melebihi Total Equity Anda!</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === CONTENT 5: TARGET PRICE (RR) === */}
          {activeTab === 'tp' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <InputField label="Rencana Harga Beli" placeholder="1500" value={tpData.buyPrice} onChange={v => setTpData({...tpData, buyPrice: v})} />
                <InputField label="Rencana Harga Cut Loss" placeholder="1400" value={tpData.stopLoss} onChange={v => setTpData({...tpData, stopLoss: v})} />
                <div className="col-span-2">
                  <label className="text-xs text-content-muted mb-1 block">Rasio Risk to Reward</label>
                  <div className="flex gap-2">
                    {['1', '2', '3'].map(r => (
                      <button key={r} onClick={() => setTpData({...tpData, rrRatio: r})} className={clsx("flex-1 py-2 text-sm font-bold rounded border transition-colors", tpData.rrRatio === r ? "bg-accent/20 border-accent text-accent" : "bg-surface border-surface-border text-content-muted")}>
                        1 : {r}
                      </button>
                    ))}
                    <input type="number" placeholder="Custom" className="input-dark w-24" value={tpData.rrRatio} onChange={e => setTpData({...tpData, rrRatio: e.target.value})} />
                  </div>
                </div>
              </div>
              <button onClick={calcTP} className="btn-primary w-full mb-4">Hitung Target Take Profit</button>

              {tpResult && (
                <div className="bg-surface-hover p-4 rounded-xl border border-surface-border mb-4 grid grid-cols-3 gap-3">
                  <div className="stat-card">
                    <p className="text-content-muted text-[10px]">Jarak Risk (Rugi)</p>
                    <p className="text-bear font-bold font-mono">- {formatRupiah(tpResult.risk)} / lbr</p>
                  </div>
                  <div className="stat-card">
                    <p className="text-content-muted text-[10px]">Jarak Reward (Untung)</p>
                    <p className="text-bull font-bold font-mono">+ {formatRupiah(tpResult.reward)} / lbr</p>
                  </div>
                  <div className="stat-card bg-accent/10 border-accent/30">
                    <p className="text-accent text-[10px] font-bold">Harga Target (Take Profit)</p>
                    <p className="text-accent font-bold font-mono text-xl">{formatRupiah(tpResult.target)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === CONTENT 6: PASSIVE INCOME === */}
          {activeTab === 'pi' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <InputField label="Target Pendapatan Pasif" placeholder="Misal: 5000000" value={piData.target} onChange={v => setPiData({...piData, target: v})} />
                <div>
                  <label className="text-xs text-content-muted mb-1 block">Jangka Waktu</label>
                  <div className="flex gap-2 h-10">
                    <button onClick={() => setPiData({...piData, period: 'month'})} className={clsx("flex-1 text-sm font-bold rounded border", piData.period === 'month' ? "bg-accent/20 border-accent text-accent" : "border-surface-border text-content-muted")}>Per Bulan</button>
                    <button onClick={() => setPiData({...piData, period: 'year'})} className={clsx("flex-1 text-sm font-bold rounded border", piData.period === 'year' ? "bg-accent/20 border-accent text-accent" : "border-surface-border text-content-muted")}>Per Tahun</button>
                  </div>
                </div>
                <InputField label="Asumsi Dividen/Lembar (DPS)" placeholder="Misal: 250" value={piData.dps} onChange={v => setPiData({...piData, dps: v})} />
                <InputField label="Harga Saham Saat Ini" placeholder="Misal: 5000" value={piData.currentPrice} onChange={v => setPiData({...piData, currentPrice: v})} />
              </div>
              <button onClick={calcPI} className="btn-primary w-full mb-4">Hitung Modal Dibutuhkan</button>

              {piResult && (
                <div className="bg-surface-hover p-4 rounded-xl border border-surface-border mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="stat-card">
                    <p className="text-content-muted text-[10px]">Target Dividen per Tahun</p>
                    <p className="text-content font-bold font-mono text-lg">{formatRupiah(piResult.targetAnnual)}</p>
                  </div>
                  <div className="stat-card">
                    <p className="text-content-muted text-[10px]">Saham Dibutuhkan</p>
                    <p className="text-accent font-bold font-mono text-lg">{piResult.lotsNeeded.toLocaleString('id-ID')} Lot</p>
                  </div>
                  <div className="stat-card col-span-1 md:col-span-2 border-bull/30 bg-bull/5">
                    <p className="text-bull text-[10px] font-bold">Estimasi Modal yang Harus Disiapkan</p>
                    <p className="text-bull font-bold font-mono text-2xl">{formatRupiah(piResult.capitalNeeded)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === CONTENT 7: HARGA WAJAR === */}
          {activeTab === 'fv' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <InputField label="Earning Per Share (EPS)" placeholder="Misal: 400" value={fvData.eps} onChange={v => setFvData({...fvData, eps: v})} />
                <InputField label="Book Value (BVPS)" placeholder="Misal: 2500" value={fvData.bvps} onChange={v => setFvData({...fvData, bvps: v})} />
                
                <InputField label="Dividen (DPS)" placeholder="Misal: 150" value={fvData.dps} onChange={v => setFvData({...fvData, dps: v})} />
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="Growth (%)" placeholder="Misal: 5" value={fvData.g} onChange={v => setFvData({...fvData, g: v})} />
                  <InputField label="Discount Rate (%)" placeholder="Misal: 10" value={fvData.r} onChange={v => setFvData({...fvData, r: v})} />
                </div>
                
                <InputField label="Rata-rata PBV 5 Tahun" placeholder="Misal: 1.5" value={fvData.avgPbv} onChange={v => setFvData({...fvData, avgPbv: v})} />
                <InputField label="Rata-rata PER 5 Tahun" placeholder="Misal: 12" value={fvData.avgPer} onChange={v => setFvData({...fvData, avgPer: v})} />
              </div>
              <button onClick={calcFV} className="btn-primary w-full mb-4">Hitung Harga Wajar (Semua Metode)</button>

              {fvResult && (
                <div className="bg-surface-hover p-4 rounded-xl border border-surface-border mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="stat-card border-accent/30 bg-accent/5">
                    <p className="text-accent text-[10px] font-bold mb-1">Graham Number</p>
                    <p className="text-accent font-bold font-mono text-lg">{fvResult.graham > 0 ? formatRupiah(fvResult.graham) : 'N/A'}</p>
                  </div>
                  <div className="stat-card">
                    <p className="text-content-muted text-[10px] mb-1">Dividen Discount Model</p>
                    <p className="text-content font-bold font-mono text-lg">{fvResult.ddm > 0 ? formatRupiah(fvResult.ddm) : 'N/A'}</p>
                  </div>
                  <div className="stat-card">
                    <p className="text-content-muted text-[10px] mb-1">Valuasi Historis (PBV)</p>
                    <p className="text-content font-bold font-mono text-lg">{fvResult.pbvFair > 0 ? formatRupiah(fvResult.pbvFair) : 'N/A'}</p>
                  </div>
                  <div className="stat-card">
                    <p className="text-content-muted text-[10px] mb-1">Valuasi Historis (PER)</p>
                    <p className="text-content font-bold font-mono text-lg">{fvResult.perFair > 0 ? formatRupiah(fvResult.perFair) : 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === SAVE COMPONENT === */}
          <div className="mt-4 border-t border-surface-border pt-4 flex gap-2">
            <input 
              type="text" 
              placeholder="Beri nama untuk menyimpan hasil ini..." 
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              className="input-dark flex-1 text-sm"
            />
            <button 
              onClick={() => saveToHistory(
                activeTab, 
                activeTab==='avg'?avgData : activeTab==='pl'?plData : activeTab==='div'?divData : activeTab==='mm'?mmData : activeTab==='tp'?tpData : activeTab==='pi'?piData : fvData,
                activeTab==='avg'?avgResult : activeTab==='pl'?plResult : activeTab==='div'?divResult : activeTab==='mm'?mmResult : activeTab==='tp'?tpResult : activeTab==='pi'?piResult : fvResult
              )} 
              className="btn-ghost border border-surface-border px-4 hover:bg-accent hover:text-content flex items-center gap-2"
            >
              <Save size={16} /> Simpan
            </button>
          </div>
        </div>
      </div>

      {/* KANAN: Sidebar History / Watchlist Kalkulator */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="card p-5 h-full flex flex-col">
          <h2 className="text-content font-semibold flex items-center gap-2 mb-4">
            <Save size={16} className="text-accent" /> Histori Tersimpan
          </h2>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {savedHistory.length === 0 ? (
              <p className="text-content-muted text-xs text-center mt-10">Belum ada histori kalkulator yang tersimpan.</p>
            ) : (
              savedHistory.map((h) => (
                <div key={h.id} className="bg-surface-hover border border-surface-border rounded-lg p-3 relative group">
                  <p className="text-xs font-bold text-content mb-1 truncate pr-6">{h.name}</p>
                  <p className="text-[10px] text-content-muted mb-2">{h.date} • {TABS.find(t=>t.id===h.type)?.label}</p>
                  
                  {/* Tampilkan result sekilas berdasarkan tipe */}
                  {h.result && (
                    <div className="text-xs font-mono text-accent">
                      {h.type === 'avg' && `Avg: ${formatRupiah(h.result.avgPrice)}`}
                      {h.type === 'pl' && `Profit: ${formatRupiah(h.result.netProfit)}`}
                      {h.type === 'div' && `Yield: ${h.result.yieldPct?.toFixed(2)}%`}
                      {h.type === 'mm' && `Max Lot: ${h.result.maxLot} Lot`}
                      {h.type === 'tp' && `Target: ${formatRupiah(h.result.target)}`}
                      {h.type === 'pi' && `Modal: ${formatRupiah(h.result.capitalNeeded)}`}
                      {h.type === 'fv' && `Graham: ${formatRupiah(h.result.graham)}`}
                    </div>
                  )}

                  <button 
                    onClick={() => deleteHistory(h.id)}
                    className="absolute top-2 right-2 text-content-muted hover:text-bear opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab(h.type)
                      if(h.type==='avg'){ setAvgData(h.data); setAvgResult(h.result) }
                      if(h.type==='pl'){ setPlData(h.data); setPlResult(h.result) }
                      if(h.type==='div'){ setDivData(h.data); setDivResult(h.result) }
                      if(h.type==='mm'){ setMmData(h.data); setMmResult(h.result) }
                      if(h.type==='tp'){ setTpData(h.data); setTpResult(h.result) }
                      if(h.type==='pi'){ setPiData(h.data); setPiResult(h.result) }
                      if(h.type==='fv'){ setFvData(h.data); setFvResult(h.result) }
                    }}
                    className="mt-2 text-[10px] text-accent/80 hover:text-accent font-bold"
                  >
                    Muat Ulang Form
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
