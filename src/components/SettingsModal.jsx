import { useState, useEffect, useRef } from 'react'
import {
  X, User, Bell, Monitor, TrendingUp, Shield, RotateCcw,
  Save, Sun, Moon, Volume2, VolumeX, ChevronRight, Check,
  Palette, Activity, Database, AlertCircle,
} from 'lucide-react'
import { useStore } from '../store/useStore'

// ─── Tab List ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'profil',     label: 'Profil',       icon: User },
  { id: 'tampilan',  label: 'Tampilan',      icon: Palette },
  { id: 'notifikasi',label: 'Notifikasi',    icon: Bell },
  { id: 'trading',   label: 'Trading',       icon: TrendingUp },
  { id: 'keamanan',  label: 'Keamanan',      icon: Shield },
]

// ─── Sub-components ───────────────────────────────────────────────────────────
function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
        checked ? 'bg-blue-500' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2 mt-6 first:mt-0">
      {children}
    </h3>
  )
}

function SelectInput({ value, onChange, options, id }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function TextInput({ value, onChange, placeholder, id }) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 w-40"
    />
  )
}

// ─── Tab Panels ───────────────────────────────────────────────────────────────
function TabProfil({ settings, update }) {
  return (
    <div>
      {/* Avatar */}
      <div className="flex items-center gap-5 p-5 bg-blue-50 rounded-xl mb-6 border border-blue-100">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-2xl shadow-md">
          {settings.displayName?.charAt(0) || 'U'}
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-base">{settings.displayName}</p>
          <p className="text-xs text-slate-500">{settings.role}</p>
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
            <Check size={9} /> Akun Aktif
          </span>
        </div>
      </div>

      <SectionTitle>Informasi Akun</SectionTitle>
      <SettingRow label="Nama Tampilan" description="Nama yang ditampilkan di aplikasi">
        <TextInput
          id="setting-displayName"
          value={settings.displayName}
          onChange={(v) => update({ displayName: v })}
          placeholder="Masukkan nama..."
        />
      </SettingRow>
      <SettingRow label="Peran / Role" description="Deskripsi peran trader Anda">
        <SelectInput
          id="setting-role"
          value={settings.role}
          onChange={(v) => update({ role: v })}
          options={[
            { value: 'Pro Trader', label: 'Pro Trader' },
            { value: 'Swing Trader', label: 'Swing Trader' },
            { value: 'Day Trader', label: 'Day Trader' },
            { value: 'Investor Jangka Panjang', label: 'Investor Jangka Panjang' },
            { value: 'Analyst', label: 'Analyst' },
          ]}
        />
      </SettingRow>

      <SectionTitle>Statistik Akun</SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Watchlist', value: '12 Saham' },
          { label: 'Alert Aktif', value: '3' },
          { label: 'Sesi Login', value: '1' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <p className="text-lg font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabTampilan({ settings, update }) {
  return (
    <div>
      <SectionTitle>Tema</SectionTitle>
      <div className="grid grid-cols-2 gap-3 mb-2">
        {[
          { id: 'light', label: 'Light Mode', icon: Sun, desc: 'Terang & bersih' },
          { id: 'dark',  label: 'Dark Mode',  icon: Moon, desc: 'Gelap & elegan' },
        ].map((t) => {
          const Icon = t.icon
          const active = settings.theme === t.id
          return (
            <button
              key={t.id}
              id={`theme-${t.id}`}
              onClick={() => update({ theme: t.id })}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                active
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50/40'
              }`}
            >
              <Icon size={20} />
              <div>
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-xs opacity-60">{t.desc}</p>
              </div>
              {active && <Check size={16} className="ml-auto text-blue-500" />}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-amber-500 flex items-center gap-1 mb-2">
        <AlertCircle size={12} /> Dark mode akan tersedia di update berikutnya
      </p>

      <SectionTitle>Layout & Animasi</SectionTitle>
      <SettingRow label="Mode Kompak" description="Kurangi padding dan ukuran elemen UI">
        <Toggle id="toggle-compact" checked={settings.compactMode} onChange={(v) => update({ compactMode: v })} />
      </SettingRow>
      <SettingRow label="Ticker Strip" description="Tampilkan bar harga bergulir di atas">
        <Toggle id="toggle-ticker" checked={settings.showTickerStrip} onChange={(v) => update({ showTickerStrip: v })} />
      </SettingRow>
      <SettingRow label="Animasi" description="Aktifkan animasi dan transisi halaman">
        <Toggle id="toggle-anim" checked={settings.animationsEnabled} onChange={(v) => update({ animationsEnabled: v })} />
      </SettingRow>
    </div>
  )
}

function TabNotifikasi({ settings, update }) {
  return (
    <div>
      <SectionTitle>Jenis Notifikasi</SectionTitle>
      <SettingRow label="Alert Harga" description="Notifikasi ketika saham menyentuh target harga">
        <Toggle id="notif-price" checked={settings.notifPrice} onChange={(v) => update({ notifPrice: v })} />
      </SettingRow>
      <SettingRow label="Dividen & Aksi Korporasi" description="Cum date, RUPS, right issue, dll.">
        <Toggle id="notif-dividen" checked={settings.notifDividen} onChange={(v) => update({ notifDividen: v })} />
      </SettingRow>
      <SettingRow label="Sinyal Trading" description="Golden cross, RSI oversold/overbought, MACD">
        <Toggle id="notif-signal" checked={settings.notifSignal} onChange={(v) => update({ notifSignal: v })} />
      </SettingRow>

      <SectionTitle>Pengiriman</SectionTitle>
      <SettingRow label="Suara Notifikasi" description="Mainkan bunyi saat notifikasi masuk">
        <div className="flex items-center gap-2">
          {settings.notifSound ? <Volume2 size={16} className="text-blue-500" /> : <VolumeX size={16} className="text-slate-400" />}
          <Toggle id="notif-sound" checked={settings.notifSound} onChange={(v) => update({ notifSound: v })} />
        </div>
      </SettingRow>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-xs font-semibold text-blue-700 mb-1">💡 Catatan</p>
        <p className="text-xs text-blue-600">
          Notifikasi browser memerlukan izin dari browser. Pastikan Anda mengizinkan notifikasi
          dari situs ini agar alert harga berfungsi.
        </p>
      </div>
    </div>
  )
}

function TabTrading({ settings, update }) {
  return (
    <div>
      <SectionTitle>Preferensi Default</SectionTitle>
      <SettingRow label="Saham Default" description="Saham yang otomatis dibuka di chart">
        <TextInput
          id="setting-defaultTicker"
          value={settings.defaultTicker}
          onChange={(v) => update({ defaultTicker: v.toUpperCase() })}
          placeholder="e.g. BBCA"
        />
      </SettingRow>
      <SettingRow label="Timeframe Default" description="Periode chart yang otomatis dipilih">
        <SelectInput
          id="setting-timeframe"
          value={settings.defaultTimeframe}
          onChange={(v) => update({ defaultTimeframe: v })}
          options={[
            { value: '1m',  label: '1 Menit' },
            { value: '5m',  label: '5 Menit' },
            { value: '15m', label: '15 Menit' },
            { value: '1H',  label: '1 Jam' },
            { value: '1D',  label: '1 Hari' },
            { value: '1W',  label: '1 Minggu' },
            { value: '1M',  label: '1 Bulan' },
          ]}
        />
      </SettingRow>
      <SettingRow label="Mata Uang" description="Satuan mata uang yang ditampilkan">
        <SelectInput
          id="setting-currency"
          value={settings.currency}
          onChange={(v) => update({ currency: v })}
          options={[
            { value: 'IDR', label: 'IDR (Rupiah)' },
            { value: 'USD', label: 'USD (Dolar)' },
          ]}
        />
      </SettingRow>

      <SectionTitle>Informasi Pasar</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Bursa', value: 'IDX (Indonesia Stock Exchange)' },
          { label: 'Jam Buka', value: '09:00 WIB' },
          { label: 'Jam Tutup', value: '16:00 WIB' },
          { label: 'Zona Waktu', value: 'Asia/Jakarta (WIB UTC+7)' },
        ].map((item) => (
          <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
            <p className="text-sm font-semibold text-slate-700">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabKeamanan({ settings, update }) {
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [msg, setMsg] = useState(null)

  const handleChangePass = () => {
    if (!oldPass || !newPass || !confirmPass) {
      setMsg({ type: 'error', text: 'Semua kolom wajib diisi.' })
      return
    }
    if (newPass !== confirmPass) {
      setMsg({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' })
      return
    }
    if (newPass.length < 8) {
      setMsg({ type: 'error', text: 'Kata sandi minimal 8 karakter.' })
      return
    }
    setMsg({ type: 'success', text: 'Kata sandi berhasil diperbarui! (simulasi)' })
    setOldPass(''); setNewPass(''); setConfirmPass('')
  }

  return (
    <div>
      <SectionTitle>Ubah Kata Sandi</SectionTitle>
      <div className="space-y-3 mb-4">
        {[
          { id: 'old-pass', label: 'Kata Sandi Lama', value: oldPass, setter: setOldPass },
          { id: 'new-pass', label: 'Kata Sandi Baru', value: newPass, setter: setNewPass },
          { id: 'confirm-pass', label: 'Konfirmasi Kata Sandi Baru', value: confirmPass, setter: setConfirmPass },
        ].map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
            <input
              id={f.id}
              type="password"
              value={f.value}
              onChange={(e) => f.setter(e.target.value)}
              placeholder="••••••••"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
        ))}
        {msg && (
          <p className={`text-xs px-3 py-2 rounded-lg ${msg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
            {msg.text}
          </p>
        )}
        <button
          onClick={handleChangePass}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          Perbarui Kata Sandi
        </button>
      </div>

      <SectionTitle>Sesi & Privasi</SectionTitle>
      <div className="p-4 bg-red-50 rounded-xl border border-red-100">
        <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
          <AlertCircle size={12} /> Zona Berbahaya
        </p>
        <p className="text-xs text-red-500 mb-3">
          Aksi berikut bersifat permanen dan tidak dapat dibatalkan.
        </p>
        <button className="w-full border border-red-300 text-red-600 text-sm font-semibold py-2 rounded-xl hover:bg-red-100 transition-colors">
          Hapus Semua Data Lokal
        </button>
      </div>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function SettingsModal() {
  const { settingsOpen, closeSettings, settings, updateSettings, resetSettings } = useStore()
  const [activeTab, setActiveTab] = useState('profil')
  const [saved, setSaved] = useState(false)
  const overlayRef = useRef(null)

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeSettings() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeSettings])

  // Click outside to close
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) closeSettings()
  }

  const handleSave = () => {
    // Settings already auto-saved via updateSettings → localStorage
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    if (window.confirm('Reset semua pengaturan ke default?')) {
      resetSettings()
    }
  }

  if (!settingsOpen) return null

  const panelProps = { settings, update: updateSettings }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="relative bg-white w-full max-w-3xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up"
        style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">Pengaturan</h2>
            <p className="text-xs text-slate-400">Kelola preferensi dan akun Anda</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="settings-reset"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              id="settings-save"
              onClick={handleSave}
              className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg transition-all ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {saved ? <><Check size={13} /> Tersimpan!</> : <><Save size={13} /> Simpan</>}
            </button>
            <button
              id="settings-close"
              onClick={closeSettings}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar tabs */}
          <nav className="w-48 flex-shrink-0 border-r border-slate-100 bg-slate-50/60 p-3 space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`settings-tab-${id}`}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                }`}
              >
                <Icon size={16} />
                {label}
                {activeTab === id && <ChevronRight size={14} className="ml-auto opacity-50" />}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'profil'     && <TabProfil {...panelProps} />}
            {activeTab === 'tampilan'   && <TabTampilan {...panelProps} />}
            {activeTab === 'notifikasi' && <TabNotifikasi {...panelProps} />}
            {activeTab === 'trading'    && <TabTrading {...panelProps} />}
            {activeTab === 'keamanan'   && <TabKeamanan {...panelProps} />}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/40 flex-shrink-0">
          <p className="text-xs text-slate-400">
            Pengaturan disimpan otomatis di browser (localStorage)
          </p>
          <p className="text-xs text-slate-300">StockPulse v1.0</p>
        </div>
      </div>
    </div>
  )
}
