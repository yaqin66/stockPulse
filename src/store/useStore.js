import { create } from 'zustand'
import { watchlistStocks } from '../data/mockData'

export const useStore = create((set) => ({
  // Navigation
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Chart
  selectedTicker: 'BBCA',
  selectedTimeframe: '1D',
  setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),
  setSelectedTimeframe: (tf) => set({ selectedTimeframe: tf }),

  // Screener
  screenerFilters: {
    rsiMax: 70,
    peMax: 30,
    roeMin: 10,
    divYieldMin: 0,
    signal: 'all',
    sector: 'all',
    cap: 'all',
  },
  setScreenerFilters: (filters) => set((s) => ({
    screenerFilters: { ...s.screenerFilters, ...filters }
  })),
  savedPresets: [],
  savePreset: (name, filters) => set((s) => ({
    savedPresets: [...s.savedPresets, { name, filters, id: Date.now() }]
  })),

  // Watchlist
  watchlist: watchlistStocks,
  addToWatchlist: (ticker) => set((s) => ({
    watchlist: s.watchlist.includes(ticker) ? s.watchlist : [...s.watchlist, ticker]
  })),
  removeFromWatchlist: (ticker) => set((s) => ({
    watchlist: s.watchlist.filter((t) => t !== ticker)
  })),

  // Fundamental
  selectedFundamentalTicker: 'BBCA',
  setSelectedFundamentalTicker: (ticker) => set({ selectedFundamentalTicker: ticker }),

  // Notifications
  notifications: [
    { id: 1, type: 'alert', msg: 'BBRI menyentuh area oversold (RSI 35)', time: '09:15' },
    { id: 2, type: 'event', msg: 'BBCA Cum Date Dividen — 15 Mei 2026', time: '08:00' },
    { id: 3, type: 'signal', msg: 'ASII: Golden Cross MA20 > MA50', time: '07:30' },
  ],
}))
