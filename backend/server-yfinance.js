const express = require('express');
const cors = require('cors');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

const app = express();
const PORT = 3002;

// Mengizinkan semua origin agar bisa diakses dari IP Publik/Domain Linux VPS
app.use(cors());
app.use(express.json());

// Endpoint khusus untuk mengambil Data Fundamental (Summary Profile, Financial Data, dll)
app.get('/api/fundamental/:ticker', async (req, res) => {
  let ticker = req.params.ticker.toUpperCase();
  const rawTicker = ticker.replace('.JK', '');
  
  // Tambahkan akhiran .JK jika belum ada untuk saham Indonesia
  if (!ticker.includes('.')) {
    ticker += '.JK';
  }

  try {
    console.log(`\n[YFinance] 📊 Meminta data fundamental untuk saham: ${ticker}...`);
    
    // Gunakan modul quoteSummary dari yahoo-finance2 untuk menarik data fundamental
    const queryOptions = { modules: ['summaryProfile', 'financialData', 'defaultKeyStatistics'] };
    const result = await yahooFinance.quoteSummary(ticker, queryOptions);
    
    if (!result) {
      console.warn(`[YFinance] ⚠️ Data fundamental tidak ditemukan untuk ${ticker}`);
      return res.status(404).json({ success: false, error: 'Data fundamental tidak ditemukan' });
    }

    const profile = result.summaryProfile || {};
    const financial = result.financialData || {};
    const stats = result.defaultKeyStatistics || {};

    const fundamentalData = {
      ticker: rawTicker,
      sector: profile.sector || '-',
      industry: profile.industry || '-',
      website: profile.website || '-',
      description: profile.longBusinessSummary || '-',
      employees: profile.fullTimeEmployees || '-',
      
      // Financials
      currentPrice: financial.currentPrice || null,
      targetHighPrice: financial.targetHighPrice || null,
      targetLowPrice: financial.targetLowPrice || null,
      recommendationKey: financial.recommendationKey || '-',
      numberOfAnalystOpinions: financial.numberOfAnalystOpinions || 0,
      totalCash: financial.totalCash || null,
      totalDebt: financial.totalDebt || null,
      totalRevenue: financial.totalRevenue || null,
      grossProfits: financial.grossProfits || null,
      operatingMargins: financial.operatingMargins || null,
      ebitda: financial.ebitda || null,
      returnOnAssets: financial.returnOnAssets || null,
      returnOnEquity: financial.returnOnEquity || null,

      // Statistics
      enterpriseValue: stats.enterpriseValue || null,
      forwardPE: stats.forwardPE || profile.trailingPE || null,
      pegRatio: stats.pegRatio || null,
      priceToBook: stats.priceToBook || null,
      beta: stats.beta || null,
      bookValue: stats.bookValue || null,
      dividendYield: stats.dividendYield || null,
    };

    // ── TECHNICAL ANALYSIS (Riwayat 3 Bulan Terakhir) ──
    let technicalData = null;
    try {
      const period1 = new Date();
      period1.setMonth(period1.getMonth() - 3);
      const period2 = new Date(); // ← wajib ada di yahoo-finance2 v3
      const history = await yahooFinance.historical(ticker, { period1, period2, interval: '1d' });
      
      if (history && history.length >= 20) {
        // Kalkulasi Harga Tertinggi / Terendah 3 Bulan
        const highs = history.map(h => h.high);
        const lows = history.map(h => h.low);
        const high3M = Math.max(...highs);
        const low3M = Math.min(...lows);

        // Kalkulasi OBV (On-Balance Volume)
        let obv = 0;
        let obvHistory = [];
        for (let i = 1; i < history.length; i++) {
          const current = history[i];
          const prev = history[i - 1];
          if (current.close > prev.close) obv += current.volume;
          else if (current.close < prev.close) obv -= current.volume;
          obvHistory.push(obv);
        }
        
        // Akumulasi trend: Bandingkan OBV sekarang dgn OBV 10 hari lalu
        const currentObv = obvHistory[obvHistory.length - 1];
        const pastObv = obvHistory[Math.max(0, obvHistory.length - 10)];
        const isAccumulation = currentObv > pastObv;

        // Kalkulasi MA20
        const closes = history.map(h => h.close);
        const last20 = closes.slice(-20);
        const ma20 = last20.reduce((a, b) => a + b, 0) / 20;

        // Kalkulasi RSI (14 Hari)
        let gains = 0, losses = 0;
        const last15 = closes.slice(-15);
        for (let i = 1; i < last15.length; i++) {
          const change = last15[i] - last15[i - 1];
          if (change > 0) gains += change;
          else losses -= change;
        }
        const rs = (gains / 14) / (losses / 14 || 1); // hindari bagi nol
        const rsi = 100 - (100 / (1 + rs));

        technicalData = {
          high3M,
          low3M,
          ma20,
          rsi,
          isAccumulation,
          currentObv
        };
      }
    } catch (e) {
      console.warn(`[YFinance] ⚠️ Gagal menarik history untuk ${ticker}:`, e.message);
    }

    // ── Simple Scoring Algorithm (Fundamental + Technical) ──
    let score = 0;
    let reasons = [];

    // Evaluasi Fundamental
    const pe = fundamentalData.forwardPE;
    if (pe) {
      if (pe > 0 && pe < 15) { score += 2; reasons.push("Valuasi murah (P/E < 15x)"); }
      else if (pe >= 15 && pe < 25) { score += 1; reasons.push("Valuasi wajar (P/E 15x - 25x)"); }
      else if (pe >= 25) { score -= 1; reasons.push("Valuasi mahal (P/E > 25x)"); }
    }

    const pbv = fundamentalData.priceToBook;
    if (pbv) {
      if (pbv > 0 && pbv < 1.5) { score += 2; reasons.push("Undervalued (PBV < 1.5x)"); }
      else if (pbv > 3) { score -= 1; reasons.push("Overvalued (PBV > 3.0x)"); }
    }

    const roe = fundamentalData.returnOnEquity;
    if (roe) {
      if (roe > 0.15) { score += 2; reasons.push("Profitabilitas unggul (ROE > 15%)"); }
      else if (roe < 0.08) { score -= 1; reasons.push("Profitabilitas lemah (ROE < 8%)"); }
    }

    // Evaluasi Technical
    if (technicalData) {
      const { rsi, ma20, isAccumulation, low3M } = technicalData;
      const currPrice = fundamentalData.currentPrice;

      if (rsi < 30) { score += 2; reasons.push("Harga jenuh jual / Oversold (RSI < 30)"); }
      else if (rsi > 70) { score -= 2; reasons.push("Harga jenuh beli / Overbought (RSI > 70)"); }

      if (currPrice && currPrice > ma20) { score += 1; reasons.push("Trend naik (Harga di atas MA20)"); }
      else { score -= 1; reasons.push("Trend turun (Harga di bawah MA20)"); }

      if (isAccumulation) { score += 2; reasons.push("Indikasi Akumulasi Volume (OBV Naik)"); }
      else { score -= 1; reasons.push("Indikasi Distribusi Volume (OBV Turun)"); }
      
      if (currPrice && ((currPrice - low3M) / low3M) < 0.05) {
        score += 1; reasons.push("Harga berada dekat area support 3 bulan");
      }
    }

    let finalSignal = "Hold";
    if (score >= 6) finalSignal = "Strong Buy";
    else if (score >= 3) finalSignal = "Buy";
    else if (score >= 0) finalSignal = "Hold";
    else if (score >= -2) finalSignal = "Sell";
    else finalSignal = "Strong Sell";

    fundamentalData.analysis = {
      score,
      signal: finalSignal,
      reasons
    };
    
    // Sisipkan technicalData ke respons
    fundamentalData.technical = technicalData;

    console.log(`[YFinance] ✅ Sukses ambil fundamental & teknikal ${ticker} | Signal: ${finalSignal}`);
    return res.json({ success: true, data: fundamentalData, source: 'Yahoo Finance' });
  } catch (error) {
    console.error(`[YFinance] ❌ Error fundamental ${ticker}:`, error.message);
    
    // Format error jika terkena rate limit
    if (error.message.includes('Too Many Requests') || error.message.includes('invalid json')) {
      return res.status(429).json({ success: false, error: 'Yahoo Finance API Limit Terpenuhi. Tunggu beberapa saat.' });
    }
    
    return res.status(500).json({ success: false, error: `Gagal scrape YFinance: ${error.message}` });
  }
});

// Endpoint untuk AI News & Sentiment Analysis
app.get('/api/news/:ticker', async (req, res) => {
  let ticker = req.params.ticker.toUpperCase();
  const rawTicker = ticker.replace('.JK', '');
  if (!ticker.includes('.')) ticker += '.JK';

  try {
    console.log(`\n[YFinance] 📰 Mencari berita untuk: ${ticker}...`);
    
    // Cari berita spesifik emiten dari Yahoo Finance
    const result = await yahooFinance.search(ticker, { newsCount: 8 });
    
    if (!result || !result.news || result.news.length === 0) {
      return res.json({ success: true, data: [], message: 'Tidak ada berita terbaru.' });
    }

    // Kamus Sentimen Bahasa Inggris & Indonesia (Basic NLP Dictionary)
    const bullishWords = ['naik', 'laba', 'profit', 'melonjak', 'rekor', 'investasi', 'akuisisi', 'dividen', 'borong', 'buy', 'target', 'surge', 'jump', 'gain', 'growth', 'positive', 'upgrade', 'beat', 'rally'];
    const bearishWords = ['turun', 'rugi', 'anjlok', 'ambles', 'susut', 'jual', 'sell', 'krisis', 'gagal', 'bunga', 'inflasi', 'merah', 'drop', 'fall', 'loss', 'miss', 'downgrade', 'plunge', 'weak'];

    const analyzedNews = result.news.map(article => {
      const title = article.title.toLowerCase();
      let score = 0;
      
      // Hitung sentimen berdasarkan judul
      bullishWords.forEach(word => { if (title.includes(word)) score += 1; });
      bearishWords.forEach(word => { if (title.includes(word)) score -= 1; });

      let sentiment = 'Netral';
      let color = 'text-muted';
      let bg = 'bg-surface-hover';
      
      if (score > 0) {
        sentiment = 'Bullish';
        color = 'text-bull';
        bg = 'bg-bull/10 border-bull/30';
      } else if (score < 0) {
        sentiment = 'Bearish';
        color = 'text-bear';
        bg = 'bg-bear/10 border-bear/30';
      }

      return {
        id: article.uuid,
        title: article.title,
        publisher: article.publisher,
        link: article.link,
        time: new Date(article.providerPublishTime * 1000).toLocaleString('id-ID'),
        sentiment,
        score,
        ui: { color, bg }
      };
    });

    console.log(`[YFinance] ✅ Ditemukan ${analyzedNews.length} berita untuk ${ticker}.`);
    return res.json({ success: true, data: analyzedNews });

  } catch (error) {
    console.error(`[YFinance] ❌ Error news ${ticker}:`, error.message);
    return res.status(500).json({ success: false, error: 'Gagal menarik berita.' });
  }
});

// Health check
app.get('/health', (_, res) => res.json({
  status: 'ok',
  service: 'YFinance Fundamental API',
  time: new Date().toISOString(),
}));

app.listen(PORT, () => {
  console.log(`\n🚀 StockPulse Fundamental API (YFinance)  →  http://localhost:${PORT}`);
  console.log('   Module   : yahoo-finance2');
  console.log('   Endpoint : /api/fundamental/:ticker\n');
});
