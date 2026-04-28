/**
 * TEST SCREENER SCRIPT v2
 * Lebih stabil dan lambat agar tidak diblokir TradingView.
 */
require('dotenv').config();
const TradingView = require('@mathieuc/tradingview');
const config = require('./src/config');
const tvService = require('./src/services/tradingview');
const formatter = require('./src/utils/formatter');
const TelegramBot = require('node-telegram-bot-api');
const logger = require('./src/utils/logger');

const bot = new TelegramBot(config.telegram.token);

async function forceRun() {
  logger.info('🚀 Memulai FORCE SCAN (Sesi Stabil)...');
  logger.info(`Target Channel: ${config.telegram.channelId}`);
  
  // Kita coba 3 saham saja dulu untuk testing agar cepat & pasti
  const testList = ['BBCA', 'ASII', 'TLKM'];

  for (const ticker of testList) {
    try {
      logger.info(`🔍 Menganalisa $${ticker}...`);
      
      const scalpData = await tvService.analyze(ticker, config.thresholds.scalp);
      await new Promise(r => setTimeout(r, 2000)); // Jeda antar request
      const swingData = await tvService.analyze(ticker, config.thresholds.swing);

      const report = formatter.formatDualAnalysis(ticker, scalpData, swingData);
      
      await bot.sendMessage(config.telegram.channelId, `🧪 **TEST SCAN RESULT**\n\n${report}`, { parse_mode: 'Markdown' });
      
      logger.success(`Berhasil mengirim laporan $${ticker} ke Telegram!`);
      
      // Jeda lebih lama antar saham
      await new Promise(r => setTimeout(r, 3000));
      
    } catch (err) {
      logger.error(`Gagal $${ticker}:`, err.message);
    }
  }
  
  logger.success('✅ Pengetesan selesai.');
  process.exit(0);
}

forceRun();
