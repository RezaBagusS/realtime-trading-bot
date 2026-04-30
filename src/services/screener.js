const cron = require('node-cron');
const config = require('../config');
const tvService = require('./tradingview');
const dbService = require('./database');
const formatter = require('../utils/formatter');
const logger = require('../utils/logger');

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
      // Analisa Paralel
      const [scalpData, swingData] = await Promise.all([
        tvService.analyze(ticker, config.thresholds.scalp).catch(() => null),
        tvService.analyze(ticker, config.thresholds.swing).catch(() => null)
      ]);
      
      if (!scalpData || !swingData) continue;

      const report = formatter.formatDualAnalysis(ticker, scalpData, swingData, marketStatus);
      
      // Kirim alert hanya jika ada sinyal BUY/STRONG BUY
      if (report.includes('💎') || report.includes('✅')) {
        await bot.sendMessage(config.telegram.channelId, `📢 **AUTO-ALERT RADAR**\n\n${report}`, { parse_mode: 'Markdown' });
        logger.success(`Sinyal ditemukan untuk ${ticker}, alert dikirim.`);
      }

      await new Promise(r => setTimeout(r, 2000));
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
