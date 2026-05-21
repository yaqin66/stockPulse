import { useState, useEffect, useCallback } from 'react'
import {
  Megaphone, Search, ChevronDown, ChevronLeft, ChevronRight,
  FileText, Paperclip, ExternalLink, RefreshCw, AlertCircle, Calendar,
} from 'lucide-react'
import { getAnnouncements } from '../services/idxApi'
import { screenerStocks } from '../data/mockData'
import clsx from 'clsx'

// ── Contoh data fallback (dari user) ──────────────────────────────────────────
const MOCK_ANNOUNCEMENTS = {
  ResultCount: 78,
  Replies: [
    {
      pengumuman: {
        Id2: '20260427182645-0045/ESG/2026_id-id',
        NoPengumuman: '0045/ESG/2026',
        TglPengumuman: '2026-04-27T18:26:45',
        JudulPengumuman: 'Penyampaian Bukti Iklan Informasi Laporan Keuangan Interim',
        JenisPengumuman: 'STOCK',
        PerihalPengumuman: 'Penyampaian Bukti Iklan Informasi Laporan Keuangan Interim',
        EfekEmiten_Saham: true,
        EfekEmiten_Obligasi: true,
        EfekEmiten_EBA: false,
        EfekEmiten_ETF: false,
      },
      attachments: [
        { PDFFilename: 'f4e4022d3f_c7d55b9c42.pdf', IsAttachment: false, OriginalFilename: '20260427_BBCA_Penyampaian Bukti Iklan_32074269.pdf', FullSavePath: '\\StaticData\\NewsAndAnnouncement\\ANNOUNCEMENTSTOCK\\From_EREP\\202604\\f4e4022d3f_c7d55b9c42.pdf' },
        { PDFFilename: '519aa2cabb_1c88dbef67.pdf', IsAttachment: true, OriginalFilename: '20260427_BBCA_Penyampaian Bukti Iklan_32074269_lamp1.pdf', FullSavePath: '\\StaticData\\NewsAndAnnouncement\\ANNOUNCEMENTSTOCK\\From_EREP\\202604\\519aa2cabb_1c88dbef67.pdf' },
      ],
    },
    {
      pengumuman: {
        Id2: '20260423181310-0039/ESG/2026_id-id',
        NoPengumuman: '0039/ESG/2026',
        TglPengumuman: '2026-04-23T18:13:10',
        JudulPengumuman: 'Penyampaian Press Release terkait Informasi Ringkasan Kinerja Keuangan Kuartal I Tahun 2026 (unaudited) PT Bank Central Asia Tbk ("Perseroan")',
        JenisPengumuman: 'STOCK',
        PerihalPengumuman: 'Penyampaian Press Release terkait Kinerja Keuangan Q1 2026',
        EfekEmiten_Saham: true,
        EfekEmiten_Obligasi: true,
        EfekEmiten_EBA: false,
        EfekEmiten_ETF: false,
      },
      attachments: [
        { PDFFilename: 'abc123_press_release.pdf', IsAttachment: false, OriginalFilename: '20260423_BBCA_PressRelease_Q12026.pdf', FullSavePath: '\\StaticData\\NewsAndAnnouncement\\ANNOUNCEMENTSTOCK\\From_EREP\\202604\\abc123_press_release.pdf' },
      ],
    },
    {
      pengumuman: {
        Id2: '20260415091520-0035/ESG/2026_id-id',
        NoPengumuman: '0035/ESG/2026',
        TglPengumuman: '2026-04-15T09:15:20',
        JudulPengumuman: 'Keterbukaan Informasi Rencana Pembelian Kembali Saham',
        JenisPengumuman: 'STOCK',
        PerihalPengumuman: 'Keterbukaan Informasi Rencana Pembelian Kembali Saham',
        EfekEmiten_Saham: true,
        EfekEmiten_Obligasi: false,
        EfekEmiten_EBA: false,
        EfekEmiten_ETF: false,
      },
      attachments: [
        { PDFFilename: 'buyback_info.pdf', IsAttachment: false, OriginalFilename: '20260415_BBCA_Buyback_Info.pdf', FullSavePath: '\\StaticData\\NewsAndAnnouncement\\ANNOUNCEMENTSTOCK\\From_EREP\\202604\\buyback_info.pdf' },
      ],
    },
    {
      pengumuman: {
        Id2: '20260401143000-0030/ESG/2026_id-id',
        NoPengumuman: '0030/ESG/2026',
        TglPengumuman: '2026-04-01T14:30:00',
        JudulPengumuman: 'Pemberitahuan Jadwal RUPS Tahunan 2026',
        JenisPengumuman: 'STOCK',
        PerihalPengumuman: 'Pemberitahuan Jadwal RUPS Tahunan 2026',
        EfekEmiten_Saham: true,
        EfekEmiten_Obligasi: true,
        EfekEmiten_EBA: false,
        EfekEmiten_ETF: false,
      },
      attachments: [
        { PDFFilename: 'rups_2026.pdf', IsAttachment: false, OriginalFilename: '20260401_BBCA_RUPS_2026.pdf', FullSavePath: '\\StaticData\\NewsAndAnnouncement\\ANNOUNCEMENTSTOCK\\From_EREP\\202603\\rups_2026.pdf' },
      ],
    },
  ],
}

const PAGE_SIZE = 10
const TICKER_LIST = ['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'GOTO', 'ANTM', 'ADRO', 'BREN', 'KLBF', 'PGAS', 'SMGR']

const pdfUrl = (path) => {
  const clean = path.replace(/\\/g, '/').replace('/StaticData', '')
  return `https://www.idx.co.id/StaticData${clean}`
}

const fmtDate = (str) => {
  if (!str) return '—'
  const d = new Date(str)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const efekBadges = (p) => {
  const list = []
  if (p.EfekEmiten_Saham) list.push({ label: 'Saham', cls: 'bg-bull/10 text-bull' })
  if (p.EfekEmiten_Obligasi) list.push({ label: 'Obligasi', cls: 'bg-accent/10 text-accent' })
  if (p.EfekEmiten_ETF) list.push({ label: 'ETF', cls: 'bg-warning/10 text-warning' })
  if (p.EfekEmiten_EBA) list.push({ label: 'EBA', cls: 'bg-bear/10 text-bear' })
  return list
}

export default function AnnouncementPage() {
  const [ticker, setTicker] = useState('BBCA')
  const [tickerInput, setTickerInput] = useState('BBCA')
  const [keyword, setKeyword] = useState('')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 1)
    return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10))
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [useMock, setUseMock] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setExpanded(null)
    try {
      const from = dateFrom.replace(/-/g, '')
      const to = dateTo.replace(/-/g, '')
      const result = await getAnnouncements(ticker, {
        indexFrom: page * PAGE_SIZE,
        pageSize: PAGE_SIZE,
        dateFrom: from,
        dateTo: to,
        keyword,
      })
      setData(result)
      setUseMock(false)
    } catch (e) {
      // Jika API tidak bisa diakses, pakai mock data
      console.warn('API tidak tersedia, menggunakan data contoh:', e.message)
      setData(MOCK_ANNOUNCEMENTS)
      setUseMock(true)
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [ticker, page, keyword, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const replies = data?.Replies ?? []
  const total = data?.ResultCount ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleSearch = () => {
    setTicker(tickerInput.toUpperCase())
    setPage(0)
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* ── Header & Filter ─────────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="text-content font-semibold flex items-center gap-2 text-lg">
            <Megaphone size={18} className="text-accent" /> Pengumuman Emiten
          </h2>
          {useMock && (
            <span className="flex items-center gap-1 text-xs bg-warning/10 text-warning border border-warning/20 px-2 py-0.5 rounded-full">
              <AlertCircle size={10} /> Data Contoh (Backend belum aktif)
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="ml-auto flex items-center gap-1.5 btn-ghost text-xs"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Ticker */}
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="text"
                value={tickerInput}
                onChange={e => setTickerInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Kode Emiten"
                className="input-dark w-28 uppercase font-mono font-bold"
              />
            </div>
            {/* Quick picker */}
            <div className="flex flex-wrap gap-1 max-w-xs">
              {TICKER_LIST.slice(0, 6).map(t => (
                <button
                  key={t}
                  onClick={() => { setTickerInput(t); setTicker(t); setPage(0) }}
                  className={clsx('text-xs px-2 py-1 rounded-md font-mono transition-colors',
                    ticker === t ? 'bg-accent text-white font-bold' : 'bg-surface-hover text-content-muted hover:text-content'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-content-muted" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-dark text-xs" />
            <span className="text-content-muted text-xs">s/d</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-dark text-xs" />
          </div>

          {/* Keyword */}
          <div className="relative flex-1 min-w-40">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Kata kunci pengumuman..."
              className="input-dark pl-7 w-full text-xs"
            />
          </div>

          <button onClick={handleSearch} className="btn-primary text-xs flex items-center gap-1.5">
            <Search size={12} /> Cari
          </button>
        </div>
      </div>

      {/* ── Stat bar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-content-muted text-xs">
          Total pengumuman: <span className="text-content font-mono font-bold">{total}</span>
          {' '}· Halaman <span className="text-accent font-mono">{page + 1}</span> dari {totalPages || 1}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="btn-ghost text-xs px-2 py-1 disabled:opacity-30"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loading}
            className="btn-ghost text-xs px-2 py-1 disabled:opacity-30"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Loading ──────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="card p-10 flex items-center justify-center gap-3 text-content-muted">
          <RefreshCw size={18} className="animate-spin text-accent" />
          <span className="text-sm">Mengambil data pengumuman...</span>
        </div>
      )}

      {/* ── List Pengumuman ─────────────────────────────────────────────────── */}
      {!loading && replies.length === 0 && (
        <div className="card p-10 flex flex-col items-center gap-3 text-center">
          <Megaphone size={36} className="text-content-muted" />
          <p className="text-content font-medium">Tidak Ada Pengumuman</p>
          <p className="text-content-muted text-sm">Coba ubah rentang tanggal atau kata kunci pencarian</p>
        </div>
      )}

      {!loading && replies.map((item, idx) => {
        const p = item.pengumuman
        const atts = item.attachments ?? []
        const mainDoc = atts.find(a => !a.IsAttachment)
        const lampiran = atts.filter(a => a.IsAttachment)
        const isOpen = expanded === idx

        return (
          <div
            key={p.Id2 || idx}
            className={clsx(
              'card overflow-hidden transition-all duration-200 hover:border-accent/20',
              isOpen && 'border-accent/30'
            )}
          >
            {/* ── Row Header ─────────────────────────────────────────────── */}
            <button
              className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-surface-hover transition-colors"
              onClick={() => setExpanded(isOpen ? null : idx)}
            >
              {/* Icon */}
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText size={16} className="text-accent" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-content-muted text-xs font-mono">{p.NoPengumuman}</span>
                  {efekBadges(p).map(b => (
                    <span key={b.label} className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', b.cls)}>{b.label}</span>
                  ))}
                </div>
                <p className="text-content font-medium text-sm leading-snug line-clamp-2">{p.JudulPengumuman}</p>
                <p className="text-content-muted text-xs mt-1 flex items-center gap-1.5">
                  <Calendar size={10} />
                  {fmtDate(p.TglPengumuman)}
                  {atts.length > 0 && (
                    <>
                      <span className="text-surface-border">·</span>
                      <Paperclip size={10} />
                      {atts.length} lampiran
                    </>
                  )}
                </p>
              </div>

              {/* Chevron */}
              <ChevronDown
                size={16}
                className={clsx('text-content-muted flex-shrink-0 mt-1 transition-transform duration-200', isOpen && 'rotate-180')}
              />
            </button>

            {/* ── Expanded Detail ─────────────────────────────────────────── */}
            {isOpen && (
              <div className="px-5 pb-5 border-t border-surface-border bg-surface-hover/30 animate-fade-in">
                {/* Detail text */}
                <div className="pt-4 pb-3">
                  <p className="text-content-muted text-xs font-medium mb-1">Perihal</p>
                  <p className="text-content text-sm">{p.PerihalPengumuman || p.JudulPengumuman}</p>
                </div>

                {/* Dokumen utama */}
                {mainDoc && (
                  <div className="mb-3">
                    <p className="text-content-muted text-xs font-medium mb-2">Dokumen Utama</p>
                    <a
                      href={pdfUrl(mainDoc.FullSavePath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs hover:bg-accent/20 transition-colors w-fit"
                    >
                      <FileText size={13} />
                      <span className="truncate max-w-xs">{mainDoc.OriginalFilename}</span>
                      <ExternalLink size={11} className="flex-shrink-0" />
                    </a>
                  </div>
                )}

                {/* Lampiran */}
                {lampiran.length > 0 && (
                  <div>
                    <p className="text-content-muted text-xs font-medium mb-2">Lampiran ({lampiran.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {lampiran.map((l, li) => (
                        <a
                          key={li}
                          href={pdfUrl(l.FullSavePath)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-hover border border-surface-border text-content-muted text-xs hover:text-content hover:border-white/20 transition-colors"
                        >
                          <Paperclip size={11} />
                          <span className="truncate max-w-[200px]">{l.OriginalFilename}</span>
                          <ExternalLink size={10} className="flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* ── Bottom Pagination ────────────────────────────────────────────────── */}
      {!loading && replies.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-ghost text-xs px-3 disabled:opacity-30 flex items-center gap-1"
          >
            <ChevronLeft size={13} /> Sebelumnya
          </button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = page < 3 ? i : page - 2 + i
              return pg < totalPages ? (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={clsx('w-8 h-8 rounded-lg text-xs font-mono transition-colors',
                    pg === page ? 'bg-accent text-white font-bold' : 'text-content-muted hover:text-content hover:bg-surface-hover'
                  )}
                >
                  {pg + 1}
                </button>
              ) : null
            })}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="btn-ghost text-xs px-3 disabled:opacity-30 flex items-center gap-1"
          >
            Berikutnya <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
