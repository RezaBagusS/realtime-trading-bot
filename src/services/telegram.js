const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const tvService = require('./tradingview');
const dbService = require('./database');
const formatter = require('../utils/formatter');
const logger = require('../utils/logger');

let bot;

async function handleDualCek(msg, ticker) {
  const loading = await bot.sendMessage(msg.chat.id, `🔍 Menganalisa *$${ticker}* (1H & Daily)...`, { parse_mode: 'Markdown' });

  try {
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
  } catch (err) {
    const safeError = err.message.replace(/[_*`\[\]]/g, '\\$&');
    await bot.editMessageText(
      `❌ *Analisa Gagal*\n` +
      `Ticker: $${ticker}\n` +
      `Pesan: \`${safeError}\``, 
      {
        chat_id: msg.chat.id,
        message_id: loading.message_id,
        parse_mode: 'Markdown'
      }
    ).catch(() => {
      bot.editMessageText(`❌ Analisa $${ticker} Gagal: ${err.message}`, {
        chat_id: msg.chat.id,
        message_id: loading.message_id
      });
    });
  }
}

function init(options = { polling: true }) {
  if (!bot) {
    bot = new TelegramBot(config.telegram.token, options);
  }

  // Hanya pasang listener jika polling aktif
  if (options.polling) {
    bot.onText(/\/(cek|scalp|swing)\s+([A-Za-z0-9]+)/i, (msg, match) => {
      handleDualCek(msg, match[2].toUpperCase());
    });

    bot.onText(/\/add\s+([A-Za-z0-9]+)/i, async (msg, match) => {
      const ticker = match[1].toUpperCase();
      try {
        await dbService.addTicker(ticker);
        bot.sendMessage(msg.chat.id, `✅ **$${ticker}** berhasil ditambahkan ke radar screener.`, { parse_mode: 'Markdown' });
      } catch (err) {
        bot.sendMessage(msg.chat.id, `❌ Gagal menambahkan ticker.`);
      }
    });

    bot.onText(/\/del\s+([A-Za-z0-9]+)/i, async (msg, match) => {
      const ticker = match[1].toUpperCase();
      try {
        const changes = await dbService.deleteTicker(ticker);
        if (changes > 0) {
          bot.sendMessage(msg.chat.id, `🗑️ **$${ticker}** dihapus dari radar screener.`, { parse_mode: 'Markdown' });
        } else {
          bot.sendMessage(msg.chat.id, `⚠️ Ticker tidak ditemukan di watchlist.`);
        }
      } catch (err) {
        bot.sendMessage(msg.chat.id, `❌ Gagal menghapus ticker.`);
      }
    });

    bot.onText(/\/list/i, async (msg) => {
      try {
        const list = await dbService.getWatchlist();
        if (list.length > 0) {
          bot.sendMessage(msg.chat.id, `📋 **Radar Watchlist Saat Ini:**\n\n${list.map(t => `• $${t}`).join('\n')}`, { parse_mode: 'Markdown' });
        } else {
          bot.sendMessage(msg.chat.id, `📭 Watchlist kosong. Gunakan \`/add [TICKER]\` untuk menambah.`);
        }
      } catch (err) {
        bot.sendMessage(msg.chat.id, `❌ Gagal mengambil watchlist.`);
      }
    });

    bot.onText(/\/help/i, (msg) => {
      bot.sendMessage(msg.chat.id, `📖 *PANDUAN BOT*\n\n\`/cek [ticker]\` - Analisa\n\`/add [ticker]\` - Pantau\n\`/list\` - Cek Radar`, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/start/, (msg) => {
      bot.sendMessage(msg.chat.id, `🤖 *IDX Smart Signal Bot*\nKetik \`/help\` untuk panduan.`, { parse_mode: 'Markdown' });
    });
  }

  logger.info(`Telegram Service Initialized (Polling: ${options.polling})`);
  return bot;
}

module.exports = { init, getBot: () => bot };
