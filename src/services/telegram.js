const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const tvService = require('./tradingview');
const formatter = require('../utils/formatter');
const logger = require('../utils/logger');

const bot = new TelegramBot(config.telegram.token, { polling: true });

async function handleCommand(msg, ticker, mode) {
  const strategy = config.thresholds[mode.toLowerCase()];
  if (!strategy) return;

  const loading = await bot.sendMessage(msg.chat.id, `🔍 Menganalisa *$${ticker}* untuk mode *${strategy.name}*...`, { parse_mode: 'Markdown' });

  try {
    const data = await tvService.analyze(ticker, strategy);
    const report = formatter.format(ticker, data, strategy);

    await bot.editMessageText(report, {
      chat_id: msg.chat.id,
      message_id: loading.message_id,
      parse_mode: 'Markdown'
    });
    logger.success(`Analisa ${mode} untuk ${ticker} selesai.`);
  } catch (err) {
    await bot.editMessageText(`❌ *Error:* ${err.message}`, {
      chat_id: msg.chat.id,
      message_id: loading.message_id,
      parse_mode: 'Markdown'
    });
    logger.error(`Analisa ${mode} untuk ${ticker} gagal:`, err.message);
  }
}

function init() {
  bot.onText(/\/(scalp|swing)\s+([A-Za-z0-9]+)/i, (msg, match) => {
    handleCommand(msg, match[2].toUpperCase(), match[1]);
  });

  bot.onText(/\/cek\s+([A-Za-z0-9]+)/i, (msg, match) => {
    handleCommand(msg, match[1].toUpperCase(), 'swing');
  });

  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 
      `🤖 *IDX Signal Bot v2.1 (Modular)*\n\n` +
      `Gunakan perintah berikut:\n` +
      `🚀 \`/scalp [ticker]\` - Jangka pendek\n` +
      `📈 \`/swing [ticker]\` - Jangka panjang\n\n` +
      `Contoh: \`/scalp BBCA\``, 
      { parse_mode: 'Markdown' }
    );
  });

  logger.info('Telegram Service Initialized');
}

module.exports = { init };
