import axios from 'axios';
import cron from 'node-cron';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import * as tvService from './tradingview.js';
import * as formatter from '../utils/formatter.js';
import * as newsService from './news.js';
import aiService from './ai.js';
import telegramService from './telegram.js';
import dbService from './database.js';

let botInstance;

/**
 * Zenith Market Hunter Module
 * Berburu saham potensial di luar watchlist menggunakan kriteria Stockbit/Technical
 * Dijadwalkan setiap jam 15:30 WIB (Market Closing)
 */

async function fetchHunterCandidates(tier = 'L2') {
  try {
    const filters = {
      'L1': [ // Bluechip & Konglo (Big Cap)
        { left: 'market_cap_basic', operation: 'greater', right: 10000000000 }, // MC > 10T (TradingView MC is in units)
        { left: 'relative_volume_10d_calc', operation: 'greater', right: 0.9 },
        { left: 'change', operation: 'greater', right: 0.5 },
        { left: 'type', operation: 'equal', right: 'stock' }
      ],
      'L2': [ // Momentum (Mid-Cap)
        { left: 'price_earnings_ttm', operation: 'less', right: 40 },
        { left: 'relative_volume_10d_calc', operation: 'greater', right: 1.2 },
        { left: 'change', operation: 'greater', right: 1.5 },
        { left: 'close', operation: 'greater', right: 200 },
        { left: 'type', operation: 'equal', right: 'stock' }
      ]
    };

    const sortBy = tier === 'L1' ? 'market_cap_basic' : 'change';

    const response = await axios.post('https://scanner.tradingview.com/indonesia/scan', {
      filter: filters[tier],
      options: { lang: 'en' },
      markets: ['indonesia'],
      symbols: { query: { types: [] }, tickers: [] },
      columns: ['name', 'close', 'change', 'relative_volume_10d_calc', 'market_cap_basic'],
      sort: { sortBy: sortBy, sortOrder: 'desc' },
      range: [0, 50]
    });

    if (!response.data || !response.data.data) return [];

    return response.data.data.map(item => ({
      ticker: item.d[0],
      price: item.d[1],
      change: item.d[2],
      relVol: item.d[3],
      marketCap: item.d[4],
      tier: tier
    }));

  } catch (err) {
    logger.error(`Hunter: Gagal mengambil data scanner ${tier}:`, err.message);
    return [];
  }
}

async function processHunterTicker(candidate, marketStatus) {
  const bot = telegramService.getBot();
  const ticker = candidate.ticker;
  const tier = candidate.tier;
  try {
    // 1. Analisa Teknikal Detail
    const technicalData = await tvService.analyze(ticker, config.thresholds.swing);
    const history = technicalData.rawHistory;

    // --- MULTI-STRATEGY DETECTION ---
    let strategyType = "";
    
    // A. BREAKOUT Check (High 20-Day)
    const past20Days = history.slice(1, 21);
    let high20 = 0;
    if (past20Days.length >= 20) {
      high20 = Math.max(...past20Days.map(d => d.high || d.close || d.price || 0));
      if (technicalData.price >= (high20 * 0.995)) {
        strategyType = "CONSOLIDATION BREAKOUT";
      }
    }
    
    // B. PULLBACK Check (Buy on Dip)
    let distToEma20 = 0;
    if (!strategyType && technicalData.ema20 > technicalData.ema50) {
      distToEma20 = (technicalData.price - technicalData.ema20) / technicalData.ema20;
      // L1 lebih longgar (7%), L2 (5%)
      const tolerance = tier === 'L1' ? 0.07 : 0.05;
      if (distToEma20 >= -0.005 && distToEma20 <= tolerance) {
        strategyType = "UPTREND PULLBACK";
      }
    }

    // C. REVERSAL Check (MACD Bullish Cross)
    if (!strategyType) {
      const macd = formatter.calculateMACD(history);
      if (macd.crossover) {
        strategyType = "MOMENTUM REVERSAL";
      }
    }

    // LOG EVALUASI DETAIL
    if (!strategyType) {
      logger.info(`🔍 EVAL [${tier}]: $${ticker} | Price: ${technicalData.price} | High20: ${high20.toFixed(0)} | Hasil: SKIP`);
      return { success: true, strategyType: "" };
    }

    const tScore = formatter.calculateScore(technicalData, marketStatus).total;
    logger.info(`🔍 EVAL [${tier}]: $${ticker} | Pola: [${strategyType}] | Skor: ${tScore}/100 | Hasil: PROSES`);

    // 2. Format Report (Murni Teknikal)
    const { report, technicalScore } = await formatter.formatTechnicalAnalysis(ticker, technicalData, marketStatus);

    return {
      success: true,
      ticker,
      tier,
      strategyType,
      hybridScore: technicalScore,
      report
    };

  } catch (err) {
    const isBusy = err.message.includes('sibuk') || err.message.includes('TradingView Error');
    if (!isBusy) logger.error(`Hunter gagal memproses $${ticker}:`, err.message);
    return { success: false, isBusy };
  }
}

async function runHunter(manualChatId = null) {
  const bot = manualChatId ? telegramService.getBot() : (botInstance || telegramService.getBot());
  logger.info('🚀 Zenith Market Hunter v10: Memulai sesi berburu (L1 & L2)...');
  
  if (!bot) {
    logger.error('Hunter: Gagal mendapatkan instansi Bot Telegram.');
    return;
  }
  
  try {
    const marketStatus = await tvService.getMarketStatus();
    
    // 1. Fetch Candidates (L1 & L2)
    const [l1Candidates, l2Candidates] = await Promise.all([
      fetchHunterCandidates('L1'),
      fetchHunterCandidates('L2')
    ]);

    const allResults = [];

    // 2. Process Tiers
    const total = l1Candidates.length + l2Candidates.length;
    let count = 0;
    
    if (manualChatId) {
      await bot.sendMessage(manualChatId, `🔍 **Processing ${total} candidates...**`);
    }

    // Process L1
    for (const cand of l1Candidates) {
      count++;
      const res = await processHunterWithRetry(cand, marketStatus);
      if (manualChatId) {
        const status = res ? `✅ **PROSES** (${res.hybridScore})` : "❌ SKIP";
        await bot.sendMessage(manualChatId, `[${count}/${total}] $${cand.ticker} (L1): ${status}`);
      }
      if (res) allResults.push({ ...res, tier: 'L1' });
    }

    // Process L2
    for (const cand of l2Candidates) {
      count++;
      const res = await processHunterWithRetry(cand, marketStatus);
      if (manualChatId) {
        const status = res ? `✅ **PROSES** (${res.hybridScore})` : "❌ SKIP";
        await bot.sendMessage(manualChatId, `[${count}/${total}] $${cand.ticker} (L2): ${status}`);
      }
      if (res) allResults.push({ ...res, tier: 'L2' });
    }

    // --- SELEKSI & PENGIRIMAN ---
    const sortedSignals = allResults
      .filter(r => r.hybridScore >= 60)
      .sort((a, b) => b.hybridScore - a.hybridScore);

    const finalSignals = sortedSignals.slice(0, 5);

    if (finalSignals.length === 0) {
      const noSignalMsg = `🎯 **ZENITH MARKET HUNTER (L1 & L2)**\n\n` +
                          `Sesi berburu selesai. Belum ada saham yang memenuhi standar teknikal minimal hari ini.\n\n` +
                          `💡 _Tetap pantau bursa, bank-bank besar biasanya bergerak saat IHSG mulai stabil._`;
      
      await bot.sendMessage(config.telegram.channelId, noSignalMsg, { parse_mode: 'Markdown' });
      
      if (manualChatId) {
        const { sendNavigationMenu } = await import('./telegram.js');
        await bot.sendMessage(manualChatId, noSignalMsg, { parse_mode: 'Markdown' });
        sendNavigationMenu(manualChatId);
      }
    } else {
      for (const signal of finalSignals) {
        const tierLabel = signal.tier === 'L1' ? "🏦 [L1 BLUECHIP/KONGLO]" : "🚀 [L2 MOMENTUM]";
        const riskLabel = signal.hybridScore >= 75 ? "💎 PREMIUM" : "⚠️ MODERATE";
        
        await bot.sendMessage(config.telegram.channelId, 
          `🎯 **ZENITH HUNTER: ${tierLabel}**\n` +
          `🔥 *Pattern:* ${signal.strategyType}\n` +
          `🏆 *Score:* ${signal.hybridScore}/100 (${riskLabel})\n\n` +
          `${signal.report}`, 
          { 
            parse_mode: 'Markdown',
            disable_web_page_preview: true 
          }
        );
      }
      
      const successMsg = `✅ **Hunter: Sesi selesai.** ${finalSignals.length} saham buruan (L1/L2) dikirim ke channel.`;
      logger.success(successMsg);

      if (manualChatId) {
        const { sendNavigationMenu } = await import('./telegram.js');
        await bot.sendMessage(manualChatId, successMsg, { parse_mode: 'Markdown' });
        sendNavigationMenu(manualChatId);
      }
    }
  } catch (err) {
    logger.error('Hunter Process Error:', err);
    if (manualChatId) {
      bot.sendMessage(manualChatId, `❌ **Hunter Error:** ${err.message}`);
    }
  }
}

async function processHunterWithRetry(candidate, marketStatus) {
  let result = { success: false, isBusy: false };
  let retries = 2;
  
  while (retries > 0 && !result.success) {
    result = await processHunterTicker(candidate, marketStatus);
    if (!result.success && result.isBusy) {
      await new Promise(r => setTimeout(r, 4000));
      retries--;
    } else {
      break;
    }
  }

  if (result.success && result.strategyType) {
    return result;
  }
  await new Promise(r => setTimeout(r, 1500));
  return null;
}

function init(bot) {
  botInstance = bot;
  
  // Jadwal: Setiap Senin-Jumat jam 15:30 WIB
  cron.schedule('30 15 * * 1-5', () => {
    const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    logger.info(`[CRON] Heartbeat: Menjalankan Hunter Otomatis (${now} WIB)`);
    runHunter();
  }, {
    timezone: "Asia/Jakarta"
  });

  logger.info('Market Hunter Service Initialized (Schedule: 15:30 WIB)');
}

export { init, runHunter };
export default { init, runHunter };
