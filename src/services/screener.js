const cron = require('node-cron');
const config = require('../config');
const tvService = require('./tradingview');
const formatter = require('../utils/formatter');
const logger = require('../utils/logger');

// Fungsi untuk cek apakah pasar IDX sedang buka (WIB)
function isMarketOpen() {
  const now = new Date();
  const wibTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  
  const day = wibTime.getDay(); // 0: Minggu, 6: Sabtu
  const hour = wibTime.getHours();
  const minute = wibTime.getMinutes();

  // Senin (1) sampai Jumat (5)
  if (day >= 1 && day <= 5) {
    // Jam 09:00 sampai 16:00 WIB (Sesi 1 & 2)
    if (hour >= 9 && hour < 16) {
      return true;
    }
  }
  return false;
}

async function runScreener(bot) {
  if (!isMarketOpen()) {
    logger.info('Pasar IDX sedang tutup. Auto-Screener dilewati.');
    return;
  }

  logger.info(`Memulai Auto-Screener LQ45: ${config.watchList.length} saham dipantau...`);

  for (const ticker of config.watchList) {
    try {
      // Untuk screener, kita fokus ke analisa SWING (Daily)
      // Jalankan analisa satu per satu agar tidak membebani session
      const data = await tvService.analyze(ticker, config.thresholds.swing);
      
      // Ambil score secara internal (logic dipindah sedikit dari formatter)
      // Kita hanya kirim alert jika score >= 80 (Sinyal sangat kuat)
      const scalpData = await tvService.analyze(ticker, config.thresholds.scalp).catch(() => null);
      
      if (!scalpData) continue;

      const report = formatter.formatDualAnalysis(ticker, scalpData, data);
      
      // Kirim ke Channel jika skor salah satunya tinggi
      if (report.includes('💎') || report.includes('✅')) {
        await bot.sendMessage(config.telegram.channelId, `📢 **AUTO-ALERT LQ45**\n\n${report}`, { parse_mode: 'Markdown' });
        logger.success(`Sinyal ditemukan untuk ${ticker}, alert dikirim ke channel.`);
      }

      // Jeda 2 detik antar saham agar tidak kena limit TradingView
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (err) {
      logger.error(`Screener gagal untuk ${ticker}:`, err.message);
    }
  }
}

function init(bot) {
  // Jadwalkan setiap jam pada menit ke-0
  // Contoh: 09:00, 10:00, dst.
  cron.schedule('0 * * * *', () => {
    logger.info('Mengeksekusi jadwal Auto-Screener...');
    runScreener(bot);
  });

  logger.info('Auto-Screener Service Initialized (Scheduled Hourly)');
}

module.exports = { init };
