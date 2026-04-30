const cron = require('node-cron');
const config = require('../config');
const tvService = require('./tradingview');
const dbService = require('./database');
const formatter = require('../utils/formatter');
const logger = require('../utils/logger');
const newsService = require('./news');
const aiService = require('./ai');

function isMarketOpen() {
  const now = new Date();
  const wibTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const day = wibTime.getDay();
  const hour = wibTime.getHours();
  if (day >= 1 && day <= 5) {
    if (hour >= 9 && hour < 16) return true;
  }
  return false;
}

async function runScreener(bot) {
  if (!isMarketOpen()) {
    logger.info('Pasar IDX sedang tutup. Auto-Screener dilewati.');
    return;
  }

  // Ambil list saham terbaru dari database
  const watchList = await dbService.getWatchlist();
  
  if (watchList.length === 0) {
    logger.info('Watchlist kosong, tidak ada yang di-scan.');
    return;
  }

  logger.info(`Memulai Auto-Screener: ${watchList.length} saham dipantau...`);
  const marketStatus = await tvService.getMarketStatus();

  for (const ticker of watchList) {
    try {
      // 1. Ambil Data Teknikal Terlebih Dahulu (Filter Utama)
      const technicalData = await tvService.analyze(ticker, config.thresholds.swing);
      const tScore = formatter.calculateScore(technicalData, marketStatus).total;

      // OPTIMASI: Hanya panggil AI jika Technical Score >= 60
      // Ini menghemat kuota API Gemini & mempercepat proses
      if (tScore < 60) {
        logger.info(`Screener: $${ticker} diskip (Technical Score ${tScore} < 60).`);
        continue; 
      }

      logger.info(`Screener: $${ticker} potensial (Score ${tScore}), memanggil AI Sentiment...`);
      
      // 2. Ambil Berita & Analisa AI hanya untuk yang lolos filter
      const news = await newsService.getLatestNews(ticker);
      const sentiment = await aiService.analyzeSentiment(ticker, news);

      // 3. Generate Hybrid Report
      const report = formatter.formatHybridAnalysis(ticker, technicalData, sentiment, marketStatus);
      
      // Kirim alert jika skor Hybrid >= 70
      if (report.includes('✅') || report.includes('💎')) {
        await bot.sendMessage(config.telegram.channelId, `📢 **AUTO-SIGNAL: HYBRID RADAR**\n\n${report}`, { 
          parse_mode: 'Markdown',
          disable_web_page_preview: true 
        });
        logger.success(`Hybrid Signal ditemukan untuk ${ticker}, alert dikirim.`);
      }

      // Jeda 3 detik saja (sudah cukup karena filter teknikal sudah mengurangi jumlah panggilan)
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      logger.error(`Screener gagal untuk ${ticker}:`, err.message);
    }
  }
}

function init(bot) {
  cron.schedule('0 * * * *', () => {
    runScreener(bot);
  });
  logger.info('Auto-Screener Service Initialized (Dynamic Database Mode)');
}

module.exports = { init };
