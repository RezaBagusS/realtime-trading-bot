const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const tvService = require('./tradingview');
const formatter = require('../utils/formatter');
const logger = require('../utils/logger');

const bot = new TelegramBot(config.telegram.token, { polling: true });

async function handleDualCek(msg, ticker) {
  const loading = await bot.sendMessage(msg.chat.id, `🔍 Melakukan **Double-Scan** untuk *$${ticker}* (1H & Daily)...`, { parse_mode: 'Markdown' });

  try {
    // Jalankan analisa paralel untuk menghemat waktu
    const [scalpData, swingData] = await Promise.all([
      tvService.analyze(ticker, config.thresholds.scalp),
      tvService.analyze(ticker, config.thresholds.swing)
    ]);

    const report = formatter.formatDualAnalysis(ticker, scalpData, swingData);

    await bot.editMessageText(report, {
      chat_id: msg.chat.id,
      message_id: loading.message_id,
      parse_mode: 'Markdown'
    });
    logger.success(`Double-Scan untuk ${ticker} selesai.`);
  } catch (err) {
    await bot.editMessageText(`❌ *Error:* ${err.message}`, {
      chat_id: msg.chat.id,
      message_id: loading.message_id,
      parse_mode: 'Markdown'
    });
    logger.error(`Double-Scan untuk ${ticker} gagal:`, err.message);
  }
}

function init() {
  // Semua perintah diarahkan ke satu fungsi cerdas: handleDualCek
  bot.onText(/\/(cek|scalp|swing)\s+([A-Za-z0-9]+)/i, (msg, match) => {
    handleDualCek(msg, match[2].toUpperCase());
  });

  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 
      `🤖 *IDX Smart Signal Bot v2.4*\n\n` +
      `Cukup gunakan satu perintah untuk analisa mendalam:\n` +
      `🔍 \`/cek [ticker]\` - Analisa 1H & Daily sekaligus\n\n` +
      `Bot akan otomatis memberikan rekomendasi apakah saham tersebut cocok untuk *Scalping* atau *Swing Trading*.`, 
      { parse_mode: 'Markdown' }
    );
  });

  logger.info('Telegram Service Initialized with Smart Recommendation');
}

module.exports = { init };
