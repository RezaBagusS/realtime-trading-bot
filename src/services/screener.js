import cron from 'node-cron';
import config from '../config/index.js';
import * as tvService from './tradingview.js';
import dbService from './database.js';
import * as formatter from '../utils/formatter.js';
import logger from '../utils/logger.js';
import * as newsService from './news.js';
import * as aiService from './ai.js';

function isMarketOpen() {
  const now = new Date();
  const wibTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  
  const day = wibTime.getDay(); // 0: Sunday, 6: Saturday
  const hour = wibTime.getHours();
  const dateStr = wibTime.toISOString().split('T')[0];

  // List Hari Libur Bursa IDX 2026 (Placeholder/Static)
  const holidays = [
    '2026-01-01', // Tahun Baru
    '2026-02-17', // Isra Miraj
    '2026-02-18', // Tahun Baru Imlek
    '2026-03-20', // Nyepi
    '2026-03-20', // Wafat Yesus Kristus
    '2026-03-31', // Idul Fitri
    '2026-04-01', // Idul Fitri
    '2026-05-01', // Hari Buruh
    '2026-05-14', // Kenaikan Yesus Kristus
    '2026-05-27', // Hari Raya Waisak
    '2026-06-16', // Idul Adha
    '2026-07-06', // Tahun Baru Islam
    '2026-08-17', // Hari Kemerdekaan RI
    '2026-09-14', // Maulid Nabi Muhammad
    '2026-12-25', // Hari Natal
  ];

  if (day === 0 || day === 6 || holidays.includes(dateStr)) return false;
  if (hour >= 9 && hour < 16) return true;
  
  return false;
}

async function processTicker(ticker, marketStatus, bot) {
  try {
    // 1. Ambil Data Teknikal Terlebih Dahulu (Filter Utama)
    const technicalData = await tvService.analyze(ticker, config.thresholds.swing);
    const tScore = formatter.calculateScore(technicalData, marketStatus).total;

    // OPTIMASI: Hanya panggil AI jika Technical Score >= 60
    if (tScore < 60) {
      logger.info(`Screener: $${ticker} diskip (Technical Score ${tScore} < 60).`);
      return; 
    }

    logger.info(`Screener: $${ticker} potensial (Score ${tScore}), memanggil AI Sentiment...`);
    
    // 2. Ambil Berita & Analisa AI hanya untuk yang lolos filter
    const news = await newsService.getLatestNews(ticker);
    const sentiment = await aiService.analyzeSentiment(ticker, news);

    // 3. Generate Hybrid Report
    const { report, hybridScore } = await formatter.formatHybridAnalysis(ticker, technicalData, sentiment, marketStatus);
    
    // Kirim alert jika skor Hybrid >= 70
    if (hybridScore >= 70) {
      await dbService.saveSignal(ticker, technicalData.price, 'SWING', hybridScore);
      await bot.sendMessage(config.telegram.channelId, `📢 **AUTO-SIGNAL: HYBRID RADAR**\n\n${report}`, { 
        parse_mode: 'Markdown',
        disable_web_page_preview: true 
      });
      logger.success(`Hybrid Signal ditemukan untuk ${ticker}, alert dikirim.`);
      return true; // Sinyal ditemukan
    }
    return false; // Tidak ada sinyal
  } catch (err) {
    logger.error(`Screener gagal untuk ${ticker}:`, err.message);
  }
}

async function runScreener(bot) {
  if (!isMarketOpen()) {
    logger.info('Pasar IDX sedang tutup atau hari libur. Auto-Screener dilewati.');
    return;
  }

  // Ambil list saham terbaru dari database
  let watchList = await dbService.getWatchlist();
  
  if (watchList.length === 0) {
    logger.info('Watchlist kosong, tidak ada yang di-scan.');
    return;
  }

  // LIMIT: Maksimal 5 saham untuk di watchlist (Sesuai Kritik)
  if (watchList.length > 5) {
    logger.warn(`Watchlist terlalu gemuk (${watchList.length}), membatasi ke 5 saham pertama.`);
    watchList = watchList.slice(0, 5);
  }

  logger.info(`Memulai Auto-Screener: ${watchList.length} saham dipantau (Parallel Mode)...`);
  const marketStatus = await tvService.getMarketStatus();

  // CONCURRENCY: Proses paralel dalam batch kecil agar tidak membebani TradingView Socket
  const chunks = [];
  const chunkSize = 2; // Proses 2 saham sekaligus
  for (let i = 0; i < watchList.length; i += chunkSize) {
    chunks.push(watchList.slice(i, i + chunkSize));
  }

  let totalSignals = 0;
  for (const chunk of chunks) {
    const results = await Promise.all(chunk.map(ticker => processTicker(ticker, marketStatus, bot)));
    totalSignals += results.filter(r => r === true).length;

    // Jeda antar batch agar lebih stabil
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Jika tidak ada saham yang layak (Hybrid Score < 70)
  if (totalSignals === 0) {
    const timeStr = new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' });
    await bot.sendMessage(config.telegram.channelId, 
      `📝 **LAPORAN RADAR (${timeStr} WIB)**\n\n` +
      `Hasil pemindaian terhadap ${watchList.length} saham di radar menunjukkan **belum ada saham yang mencapai ambang batas layak beli (Hybrid Score >= 70).**\n\n` +
      `💡 _Saran: Tetap disiplin & tunggu momentum sinkron antara teknikal & sentimen._`,
      { parse_mode: 'Markdown' }
    );
    logger.info('Screener: Tidak ada saham layak beli ditemukan.');
  }
}

function init(bot) {
  cron.schedule('0 * * * *', () => {
    runScreener(bot);
  });
  logger.info('Auto-Screener Service Initialized (Dynamic Database Mode)');
}

export { init };
export default { init };
