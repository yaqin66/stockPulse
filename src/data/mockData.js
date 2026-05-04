// Mock data for StockPulse frontend

export const marketIndices = [
  { name: 'IHSG', value: 7_284.31, change: +47.82, changePct: +0.66, volume: '18.4T' },
  { name: 'LQ45', value: 1_024.15, change: -3.41, changePct: -0.33, volume: '9.1T' },
  { name: 'IDX30', value: 542.67, change: +2.18, changePct: +0.40, volume: '5.2T' },
  { name: 'BISNIS27', value: 611.23, change: +5.74, changePct: +0.95, volume: '3.8T' },
];

export const sectorPerformance = [
  { name: 'Financials', pct: +1.42, cap: '2.1T' },
  { name: 'Industrials', pct: +0.87, cap: '890B' },
  { name: 'Consumer', pct: +0.54, cap: '1.4T' },
  { name: 'Technology', pct: -0.23, cap: '430B' },
  { name: 'Energy', pct: -1.05, cap: '760B' },
  { name: 'Basic Materials', pct: -1.78, cap: '520B' },
  { name: 'Healthcare', pct: +0.31, cap: '290B' },
  { name: 'Properties', pct: -0.64, cap: '380B' },
];

export const topGainers = [
  { ticker: 'BREN', name: 'Barito Renewables', price: 8_250, change: +12.5, vol: '245M' },
  { ticker: 'GOTO', name: 'GoTo Gojek Tokopedia', price: 84, change: +8.3, vol: '18.2B' },
  { ticker: 'BRPT', name: 'Barito Pacific', price: 1_275, change: +6.9, vol: '892M' },
  { ticker: 'INDF', name: 'Indofood Sukses Makmur', price: 7_450, change: +5.2, vol: '112M' },
  { ticker: 'TLKM', name: 'Telekomunikasi Indonesia', price: 3_860, change: +4.1, vol: '328M' },
];

export const topLosers = [
  { ticker: 'BUMI', name: 'Bumi Resources', price: 92, change: -8.4, vol: '4.1B' },
  { ticker: 'ANTM', name: 'Aneka Tambang', price: 1_640, change: -5.7, vol: '567M' },
  { ticker: 'PTBA', name: 'Bukit Asam', price: 3_120, change: -4.3, vol: '201M' },
  { ticker: 'INCO', name: 'Vale Indonesia', price: 4_570, change: -3.8, vol: '89M' },
  { ticker: 'ADRO', name: 'Adaro Energy', price: 2_890, change: -2.9, vol: '445M' },
];

// Generate IHSG chart data (90 days)
export const generateIHSGData = () => {
  const data = [];
  let base = 6_800;
  const now = new Date('2026-05-03');
  for (let i = 89; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.45) * 80;
    base = Math.max(6000, Math.min(8000, base + change));
    data.push({
      date: date.toISOString().slice(0, 10),
      value: parseFloat(base.toFixed(2)),
      volume: Math.floor(Math.random() * 5000 + 8000),
    });
  }
  return data;
};

// Generate candlestick data for a stock
export const generateCandleData = (ticker = 'BBCA', days = 60) => {
  const prices = {
    BBCA: 9_100, TLKM: 3_860, BBRI: 4_750, ASII: 5_200, BMRI: 6_800,
  };
  let base = prices[ticker] || 5_000;
  const data = [];
  const now = new Date('2026-05-03');
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const open = base;
    const change = (Math.random() - 0.48) * base * 0.025;
    const close = parseFloat((base + change).toFixed(0));
    const high = parseFloat((Math.max(open, close) + Math.random() * base * 0.01).toFixed(0));
    const low = parseFloat((Math.min(open, close) - Math.random() * base * 0.01).toFixed(0));
    const volume = Math.floor(Math.random() * 80_000_000 + 20_000_000);
    data.push({ date: date.toISOString().slice(0, 10), open, high, low, close, volume });
    base = close;
  }
  return data;
};

// Screener results
export const screenerStocks = [
  { ticker: 'BBCA', name: 'Bank Central Asia', sector: 'Financials', price: 9_100, pe: 23.4, roe: 21.5, rsi: 42, divYield: 1.8, signal: 'Accumulate', cap: 'Large' },
  { ticker: 'BBRI', name: 'Bank Rakyat Indonesia', sector: 'Financials', price: 4_750, pe: 13.2, roe: 18.3, rsi: 35, divYield: 4.2, signal: 'Strong Buy', cap: 'Large' },
  { ticker: 'ASII', name: 'Astra International', sector: 'Industrials', price: 5_200, pe: 11.8, roe: 16.7, rsi: 28, divYield: 5.1, signal: 'Buy', cap: 'Large' },
  { ticker: 'ICBP', name: 'Indofood CBP', sector: 'Consumer', price: 10_450, pe: 14.5, roe: 19.2, rsi: 55, divYield: 2.9, signal: 'Hold', cap: 'Large' },
  { ticker: 'KLBF', name: 'Kalbe Farma', sector: 'Healthcare', price: 1_615, pe: 28.3, roe: 14.8, rsi: 62, divYield: 1.5, signal: 'Hold', cap: 'Mid' },
  { ticker: 'SMGR', name: 'Semen Indonesia', sector: 'Basic Materials', price: 4_130, pe: 9.7, roe: 12.1, rsi: 31, divYield: 5.8, signal: 'Buy', cap: 'Mid' },
  { ticker: 'PGAS', name: 'Perusahaan Gas Negara', sector: 'Energy', price: 1_575, pe: 8.2, roe: 22.4, rsi: 24, divYield: 6.3, signal: 'Strong Buy', cap: 'Mid' },
  { ticker: 'UNVR', name: 'Unilever Indonesia', sector: 'Consumer', price: 2_960, pe: 32.1, roe: 82.5, rsi: 48, divYield: 3.1, signal: 'Hold', cap: 'Large' },
  { ticker: 'SIDO', name: 'Industri Jamu Sido', sector: 'Healthcare', price: 815, pe: 18.6, roe: 35.2, rsi: 38, divYield: 7.2, signal: 'Buy', cap: 'Mid' },
  { ticker: 'MAPI', name: 'Mitra Adiperkasa', sector: 'Consumer', price: 1_350, pe: 16.4, roe: 11.3, rsi: 71, divYield: 0.8, signal: 'Take Profit', cap: 'Mid' },
];

export const heatmapData = [
  { ticker: 'BBCA', sector: 'Financials', cap: 280, pct: +1.2 },
  { ticker: 'BBRI', sector: 'Financials', cap: 230, pct: +0.8 },
  { ticker: 'BMRI', sector: 'Financials', cap: 210, pct: +2.1 },
  { ticker: 'BNGA', sector: 'Financials', cap: 90, pct: -0.4 },
  { ticker: 'ASII', sector: 'Industrials', cap: 185, pct: -0.7 },
  { ticker: 'UNTR', sector: 'Industrials', cap: 80, pct: +0.3 },
  { ticker: 'TLKM', sector: 'Telecom', cap: 175, pct: +4.1 },
  { ticker: 'EXCL', sector: 'Telecom', cap: 45, pct: +1.5 },
  { ticker: 'ICBP', sector: 'Consumer', cap: 120, pct: -0.2 },
  { ticker: 'UNVR', sector: 'Consumer', cap: 110, pct: +0.9 },
  { ticker: 'INDF', sector: 'Consumer', cap: 95, pct: +5.2 },
  { ticker: 'KLBF', sector: 'Healthcare', cap: 70, pct: -1.3 },
  { ticker: 'SIDO', sector: 'Healthcare', cap: 40, pct: +0.5 },
  { ticker: 'PGAS', sector: 'Energy', cap: 90, pct: -2.1 },
  { ticker: 'ADRO', sector: 'Energy', cap: 130, pct: -2.9 },
  { ticker: 'PTBA', sector: 'Energy', cap: 75, pct: -4.3 },
  { ticker: 'BREN', sector: 'Energy', cap: 160, pct: +12.5 },
  { ticker: 'SMGR', sector: 'Materials', cap: 65, pct: -0.8 },
  { ticker: 'INTP', sector: 'Materials', cap: 55, pct: -1.1 },
  { ticker: 'ANTM', sector: 'Materials', cap: 70, pct: -5.7 },
];

export const runningTrades = [
  { ticker: 'BBCA', price: 9_100, type: 'buy', lot: 120, time: '09:31:04' },
  { ticker: 'GOTO', price: 84, type: 'sell', lot: 5000, time: '09:31:05' },
  { ticker: 'TLKM', price: 3_860, type: 'buy', lot: 50, time: '09:31:06' },
  { ticker: 'ADRO', price: 2_890, type: 'sell', lot: 200, time: '09:31:07' },
  { ticker: 'BBRI', price: 4_750, type: 'buy', lot: 300, time: '09:31:08' },
  { ticker: 'BREN', price: 8_250, type: 'buy', lot: 30, time: '09:31:09' },
  { ticker: 'ANTM', price: 1_640, type: 'sell', lot: 400, time: '09:31:10' },
  { ticker: 'ASII', price: 5_200, type: 'buy', lot: 150, time: '09:31:11' },
];

export const fundamentalData = {
  BBCA: {
    ticker: 'BBCA',
    name: 'Bank Central Asia Tbk',
    sector: 'Financials',
    industry: 'Banking',
    price: 9_100,
    change: +1.2,
    marketCap: '1.12T',
    pe: 23.4,
    pbv: 4.8,
    eps: 389.5,
    roe: 21.5,
    der: 7.2,
    currentRatio: 1.12,
    divYield: 1.8,
    revenue: [78_400, 82_100, 89_600, 95_800, 102_400],
    netIncome: [24_200, 26_800, 28_900, 31_400, 33_900],
    years: [2021, 2022, 2023, 2024, 2025],
    events: [
      { type: 'Dividen', date: '2026-05-15', desc: 'Cum Date Dividen Interim Rp 120/saham' },
      { type: 'RUPS', date: '2026-04-28', desc: 'RUPS Tahunan 2026' },
    ],
  },
};

export const watchlistStocks = ['BBCA', 'TLKM', 'ASII', 'BBRI', 'GOTO'];
