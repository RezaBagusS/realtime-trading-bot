const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const tvService = require('./tradingview');
const dbService = require('./database');
const formatter = require('../utils/formatter');
const logger = require('../utils/logger');

const bot = new TelegramBot(config.telegram.token, { polling: true });

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
    // Escape karakter Markdown agar tidak error 400
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
      // Fallback jika Markdown tetap gagal
      bot.editMessageText(`❌ Analisa $${ticker} Gagal: ${err.message}`, {
        chat_id: msg.chat.id,
        message_id: loading.message_id
      });
    });
  }
}

function init() {
  // Command: /cek [ticker]
  bot.onText(/\/(cek|scalp|swing)\s+([A-Za-z0-9]+)/i, (msg, match) => {
    handleDualCek(msg, match[2].toUpperCase());
  });

  // Command: /add [ticker]
  bot.onText(/\/add\s+([A-Za-z0-9]+)/i, async (msg, match) => {
    const ticker = match[1].toUpperCase();
    try {
      await dbService.addTicker(ticker);
      bot.sendMessage(msg.chat.id, `✅ **$${ticker}** berhasil ditambahkan ke radar screener.`, { parse_mode: 'Markdown' });
    } catch (err) {
      bot.sendMessage(msg.chat.id, `❌ Gagal menambahkan ticker.`);
    }
  });

  // Command: /del [ticker]
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

  // Command: /list
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

  // Command: /help
  bot.onText(/\/help/i, (msg) => {
    bot.sendMessage(msg.chat.id, 
      `📖 *PANDUAN PENGGUNAAN BOT ANALYST v2.6*\n\n` +
      `Bot ini membantu Anda mendeteksi peluang trading di bursa IDX dengan teknologi **Double-Scan** (1H & Daily).\n\n` +
      `⚡️ **PERINTAH ANALISA**\n` +
      `• \`/cek [TICKER]\` : Melakukan scan mendalam pada timeframe 1 Jam & Daily. Bot akan memberikan rekomendasi strategi terbaik.\n` +
      `  _Contoh: /cek BBCA_\n\n` +
      `📡 **MANAJEMEN RADAR (AUTO-SCREENER)**\n` +
      `Bot akan men-scan daftar saham ini setiap jam (09:00 - 16:00 WIB).\n` +
      `• \`/add [TICKER]\` : Menambah saham ke radar.\n` +
      `• \`/del [TICKER]\` : Menghapus saham dari radar.\n` +
      `• \`/list\` : Melihat daftar saham yang sedang dipantau.\n\n` +
      `📊 **CARA MEMBACA SINYAL**\n` +
      `• *Technical Score:* Akurasi sinyal (0-100). Di atas 70 dianggap sinyal **BUY** yang valid.\n` +
      `• *Trading Plan:* Titik Entry, TP, dan SL dihitung otomatis berdasarkan manajemen risiko.\n\n` +
      `⚠️ *Disclaimer:* Investasi saham berisiko. Bot ini hanyalah alat bantu teknikal, bukan perintah jual/beli mutlak.`, 
      { parse_mode: 'Markdown' }
    );
  });

  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 
      `🤖 *Selamat Datang di IDX Smart Signal Bot!*\n\n` +
      `Saya adalah asisten trading pribadi Anda. Saya akan memantau pasar dan membantu Anda menemukan titik entry terbaik.\n\n` +
      `Ketik \`/help\` untuk melihat panduan lengkap penggunaan bot.`, 
      { parse_mode: 'Markdown' }
    );
  });

  logger.info('Telegram Service Initialized with Help Command');
}

module.exports = { init, bot };
