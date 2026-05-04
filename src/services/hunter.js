import axios from 'axios';
import cron from 'node-cron';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import * as tvService from './tradingview.js';
import * as formatter from '../utils/formatter.js';
import * as newsService from './news.js';
import * as aiService from './ai.js';
import dbService from './database.js';

/**
 * Zenith Market Hunter Module
 * Berburu saham potensial di luar watchlist menggunakan kriteria Stockbit/Technical
 * Dijadwalkan setiap jam 15:30 WIB (Market Closing)
 */

async function fetchHunterCandidates() {
  try {
    const response = await axios.post('https://scanner.tradingview.com/indonesia/scan', {
      filter: [
        { left: 'price_earnings_ttm', operation: 'less', right: 40 },
        { left: 'relative_volume_10d_calc', operation: 'greater', right: 1.2 },
        { left: 'change', operation: 'greater', right: 1 },
        { left: 'close', operation: 'greater', right: 100 },
        { left: 'type', operation: 'equal', right: 'stock' }
      ],
      options: { lang: 'en' },
      markets: ['indonesia'],
      symbols: { query: { types: [] }, tickers: [] },
      columns: [
        'name',
        'close',
        'change',
        'relative_volume_10d_calc',
        'price_earnings_ttm',
        'price_52_week_high'
      ],
      sort: { sortBy: 'change', sortOrder: 'desc' },
      range: [0, 15]
    });

    if (!response.data || !response.data.data) return [];

    // Map results and filter for proximity to 52W High (> 0.7)
    return response.data.data
      .map(item => ({
        ticker: item.d[0],
        price: item.d[1],
        change: item.d[2],
        relVol: item.d[3],
        pe: item.d[4],
        high52: item.d[5],
        proximity: item.d[1] / item.d[5] // Price / 52W High
      }))
      .filter(s => s.proximity >= 0.7)
      .slice(0, 5); // Ambil Top 5 saja sesuai permintaan

  } catch (err) {
    logger.error('Hunter: Gagal mengambil data scanner:', err.message);
    return [];
  }
}

async function processHunterTicker(candidate, marketStatus, bot) {
  const ticker = candidate.ticker;
  try {
    logger.info(`Hunter: Memproses $${ticker} (Technical Proximity: ${(candidate.proximity * 100).toFixed(1)}%)`);

    // 1. Analisa Teknikal Detail
    const technicalData = await tvService.analyze(ticker, config.thresholds.swing);
    
    // 2. Analisa Berita & AI Sentiment
    const news = await newsService.getLatestNews(ticker);
    const sentiment = await aiService.analyzeSentiment(ticker, news);

    // 3. Format Hybrid Report
    const { report, hybridScore } = await formatter.formatHybridAnalysis(ticker, technicalData, sentiment, marketStatus);

    // Kirim sinyal Hunter (Minimal Hybrid Score 70 agar kualitas terjaga)
    if (hybridScore >= 70) {
      await bot.sendMessage(config.telegram.channelId, 
        `🎯 **ZENITH MARKET HUNTER: AFTER-MARKET PICK**\n` +
        `_Berdasarkan kriteria Akumulasi & Momentum 52W High_\n\n` +
        `${report}`, 
        { 
          parse_mode: 'Markdown',
          disable_web_page_preview: true 
        }
      );
      logger.success(`Hunter: Sinyal $${ticker} dikirim ke channel.`);
      return true;
    }

    logger.info(`Hunter: $${ticker} diskip karena Hybrid Score rendah (${hybridScore}).`);
    return false;
  } catch (err) {
    logger.error(`Hunter gagal memproses $${ticker}:`, err.message);
    return false;
  }
}

async function runHunter(bot) {
  logger.info('🚀 Zenith Market Hunter: Memulai sesi berburu (15:30 WIB)...');
  
  const candidates = await fetchHunterCandidates();
  
  if (candidates.length === 0) {
    logger.info('Hunter: Tidak ada kandidat saham yang memenuhi kriteria hari ini.');
    return;
  }

  logger.info(`Hunter: Menemukan ${candidates.length} kandidat potensial. Memulai verifikasi AI...`);
  
  const marketStatus = await tvService.getMarketStatus();
  let foundCount = 0;
  for (const candidate of candidates) {
    const success = await processHunterTicker(candidate, marketStatus, bot);
    if (success) foundCount++;
    
    // Jeda agar tidak terkena rate limit
    await new Promise(r => setTimeout(r, 3000));
  }

  if (foundCount === 0) {
    await bot.sendMessage(config.telegram.channelId, 
      `🎯 **ZENITH MARKET HUNTER (15:30 WIB)**\n\n` +
      `Sesi berburu hari ini telah selesai. Namun, **belum ada saham di luar radar yang memenuhi kriteria ketat** (Inflow & Momentum 52W High).\n\n` +
      `💡 _Tetap pantau bursa, peluang terbaik seringkali datang saat pasar sedang sepi._`,
      { parse_mode: 'Markdown' }
    );
    logger.info('Hunter: Tidak ada saham layak buru ditemukan.');
  } else {
    logger.success(`Hunter: Sesi selesai. ${foundCount} saham "buruan" dikirim ke channel.`);
  }
}

function init(bot) {
  // Jadwal: Setiap Senin-Jumat jam 15:30 WIB
  cron.schedule('30 15 * * 1-5', () => {
    runHunter(bot);
  }, {
    timezone: "Asia/Jakarta"
  });

  logger.info('Market Hunter Service Initialized (Schedule: 15:30 WIB)');
}

export { init, runHunter };
export default { init, runHunter };
