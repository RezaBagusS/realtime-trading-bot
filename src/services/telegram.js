import TelegramBot from 'node-telegram-bot-api';
import config from '../config/index.js';
import * as tvService from './tradingview.js';
import dbService from './database.js';
import * as formatter from '../utils/formatter.js';
import logger from '../utils/logger.js';
import * as newsService from './news.js';
import * as aiService from './ai.js';

let bot;
const userStates = new Map(); // Untuk melacak status user (Sesuai Permintaan User)

async function handleDualCek(msg, ticker) {
  const loading = await bot.sendMessage(msg.chat.id, `🔍 Menganalisa *$${ticker}* (1H & Daily)...`, { parse_mode: 'Markdown' });

  try {
    const [scalpData, swingData, marketStatus] = await Promise.all([
      tvService.analyze(ticker, config.thresholds.scalp),
      tvService.analyze(ticker, config.thresholds.swing),
      tvService.getMarketStatus()
    ]);

    const report = formatter.formatDualAnalysis(ticker, scalpData, swingData, marketStatus);

    await bot.editMessageText(report, {
      chat_id: msg.chat.id,
      message_id: loading.message_id,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    let errorMessage = err.message;
    let isSymbolError = false;

    if (err.message.includes('Symbol error') || err.message.includes('ser_1')) {
      errorMessage = `Emitten *$${ticker}* tidak ditemukan di Bursa Efek Indonesia (IDX).\n\n💡 _Tips: Pastikan kode saham terdiri dari 4 huruf (contoh: BBCA, GOTO)._`;
      isSymbolError = true;
    }

    const safeError = errorMessage.replace(/[_*`\[\]]/g, '\\$&');
    
    await bot.editMessageText(
      `❌ *Analisa Gagal*\n\n` +
      `${safeError}`, 
      {
        chat_id: msg.chat.id,
        message_id: loading.message_id,
        parse_mode: 'Markdown'
      }
    ).catch(() => {
      bot.editMessageText(`❌ Gagal: ${errorMessage}`, {
        chat_id: msg.chat.id,
        message_id: loading.message_id
      });
    });
  }
}

function init(options = { polling: true }) {
  if (!bot) {
    bot = new TelegramBot(config.telegram.token, options);
    
    // Konfigurasi Command Menu (Sesuai Permintaan User)
    bot.setMyCommands([
      { command: 'analysis', description: 'Analisa Hybrid (Teknikal + AI Sentiment)' },
      { command: 'technical', description: 'Analisa Teknikal Murni (Scalp & Swing)' },
      { command: 'news', description: 'Berita Terbaru & Sentimen AI' },
      { command: 'list', description: 'Lihat Radar Watchlist' },
      { command: 'add', description: 'Tambah Saham ke Radar' },
      { command: 'del', description: 'Hapus Saham dari Radar' },
      { command: 'nextscan', description: 'Cek Kapan Radar Berjalan Lagi' },
      { command: 'setbalance', description: 'Atur Modal untuk Risk Management' },
      { command: 'help', description: 'Panduan Penggunaan Bot' }
    ]).then(() => logger.info('Telegram Command Menu updated.'));
  }

  // Hanya pasang listener jika polling aktif
  if (options.polling) {
    // Middleware-like logging & Unified Message Handling
    bot.on('message', async (msg) => {
      if (!msg.text) return;
      
      const chatId = msg.chat.id;
      const user = msg.from.username || msg.from.first_name || 'Unknown';
      const input = msg.text.trim().toUpperCase();

      logger.info(`[TELEGRAM] ${user} (${chatId}): ${msg.text}`);

      // 1. Cek apakah user sedang dalam status menunggu input ticker
      const state = userStates.get(chatId);
      if (state && !msg.text.startsWith('/')) {
        logger.info(`[STATE] User ${user} mengirim ticker ${input} untuk aksi ${state.action}`);
        
        // Bersihkan status agar tidak loop
        userStates.delete(chatId);

        // Jalankan aksi sesuai status
        if (state.action === 'analysis') {
          return bot.processUpdate({ message: { ...msg, text: `/analysis ${input}` } });
        } else if (state.action === 'technical') {
          return bot.processUpdate({ message: { ...msg, text: `/technical ${input}` } });
        } else if (state.action === 'news') {
          return bot.processUpdate({ message: { ...msg, text: `/news ${input}` } });
        } else if (state.action === 'add') {
          return bot.processUpdate({ message: { ...msg, text: `/add ${input}` } });
        } else if (state.action === 'del') {
          return bot.processUpdate({ message: { ...msg, text: `/del ${input}` } });
        }
      }

      // 2. Catch-all: Jika bukan perintah dan bukan dalam mode state
      if (!msg.text.startsWith('/') && !msg.text.startsWith('@')) {
        const fallbackMsg = `⚠️ **Perintah tidak dikenali.**\n\n` +
                            `Saya tidak mengerti pesan: "_${msg.text}_"\n\n` +
                            `💡 **Tips:** Gunakan menu tombol di pojok kiri bawah atau ketik \`/help\` untuk melihat daftar perintah yang tersedia.`;
        bot.sendMessage(chatId, fallbackMsg, { parse_mode: 'Markdown' });
      }
    });

    bot.onText(/\/technical(?:\s+([A-Za-z0-9]+))?$/i, (msg, match) => {
      const ticker = match[1];
      if (!ticker) {
        return bot.sendMessage(msg.chat.id, `📊 **Analisa Teknikal**\n\nSilakan balas pesan ini dengan **Kode Saham** yang ingin dicek (Contoh: \`PTRO\`).`, { 
          parse_mode: 'Markdown',
          reply_markup: { force_reply: true, selective: true }
        });
      }
      handleDualCek(msg, ticker.toUpperCase());
    });

    bot.onText(/\/analysis(?:\s+([A-Za-z0-9]+))?$/i, async (msg, match) => {
      const ticker = match[1]?.toUpperCase();
      
      if (!ticker) {
        return bot.sendMessage(msg.chat.id, `🧬 **Analisa Hybrid (AI)**\n\nSilakan balas pesan ini dengan **Kode Saham** yang ingin dianalisa (Contoh: \`BBCA\`).`, { 
          parse_mode: 'Markdown',
          reply_markup: { force_reply: true, selective: true }
        });
      }

      const loading = await bot.sendMessage(msg.chat.id, `🧬 **Zenith AI Hybrid Engine** sedang memproses *$${ticker}*...\n\n_Menganalisa data teknikal & sentimen AI..._`, { parse_mode: 'Markdown' });
      
      try {
        const [technicalResults, marketStatus, userSettings] = await Promise.all([
          tvService.analyze(ticker, config.thresholds.swing),
          tvService.getMarketStatus(),
          dbService.getUserSettings(msg.chat.id)
        ]);

        const tScore = formatter.calculateScore(technicalResults, marketStatus).total;
        
        let sentiment = { score: 0, summary: "Analisa AI dilewati karena tren teknikal sangat lemah.", sentiment_label: "NEUTRAL" };
        
        // Hanya panggil AI jika Technical Score > 30 (Menghemat Kuota Pro)
        if (tScore > 30) {
          const news = await newsService.getLatestNews(ticker);
          sentiment = await aiService.analyzeSentiment(ticker, news);
        } else {
          logger.info(`Skipping AI for ${ticker} due to low technical score (${tScore})`);
        }
        
        const { report, hybridScore } = await formatter.formatHybridAnalysis(ticker, technicalResults, sentiment, marketStatus, userSettings);

        // 1. Simpan Sinyal ke History jika Skor >= 70
        if (hybridScore >= 70) {
          await dbService.saveSignal(ticker, technicalData.price, 'SWING', hybridScore);
        }
        
        await bot.editMessageText(report, {
          chat_id: msg.chat.id,
          message_id: loading.message_id,
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });
      } catch (err) {
        let errorMsg = `❌ *Gagal Memproses Analysis*\n\nDetail: \`${err.message.replace(/[_*`\[\]]/g, '\\$&')}\``;
        if (err.message.includes('Symbol error') || err.message.includes('ser_1')) {
          errorMsg = `❌ Emitten *$${ticker}* tidak ditemukan di IDX.`;
        }
        
        bot.editMessageText(errorMsg, {
          chat_id: msg.chat.id,
          message_id: loading.message_id,
          parse_mode: 'Markdown'
        });
      }
    });

    bot.onText(/\/news(?:\s+([A-Za-z0-9]+))?$/i, async (msg, match) => {
      const ticker = match[1]?.toUpperCase();
      
      if (!ticker) {
        return bot.sendMessage(msg.chat.id, `📰 **Cek Berita & Sentimen**\n\nSilakan balas pesan ini dengan **Kode Saham** yang ingin dicari beritanya.`, { 
          parse_mode: 'Markdown',
          reply_markup: { force_reply: true, selective: true }
        });
      }

      const loading = await bot.sendMessage(msg.chat.id, `📰 Mencari berita & Menganalisa Sentimen *$${ticker}*...`, { parse_mode: 'Markdown' });
      
      try {
        const news = await newsService.getLatestNews(ticker);
        
        // Panggil Gemini AI untuk analisa sentimen
        const sentiment = await aiService.analyzeSentiment(ticker, news);
        
        const report = formatter.formatNews(ticker, news, sentiment);
        
        await bot.editMessageText(report, {
          chat_id: msg.chat.id,
          message_id: loading.message_id,
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });
      } catch (err) {
        const safeError = err.message.replace(/[_*`\[\]]/g, '\\$&');
        bot.editMessageText(
          `❌ *Gagal Memproses Berita*\n\n` +
          `Ticker: $${ticker}\n` +
          `Detail: \`${safeError}\`\n\n` +
          `💡 _Tips: Pastikan kode saham benar dan koneksi internet stabil._`, 
          {
            chat_id: msg.chat.id,
            message_id: loading.message_id,
            parse_mode: 'Markdown'
          }
        );
      }
    });

    bot.onText(/\/add(?:\s+([A-Za-z0-9]+))?$/i, async (msg, match) => {
      const ticker = match[1]?.toUpperCase();
      
      if (!ticker) {
        return bot.sendMessage(msg.chat.id, `💡 **Cara Penggunaan:**\nKetik \`/add [TICKER]\`\nContoh: \`/add BBCA\``, { parse_mode: 'Markdown' });
      }

      const status = await bot.sendMessage(msg.chat.id, `🔍 Memverifikasi *$${ticker}* di bursa...`, { parse_mode: 'Markdown' });

      try {
        // Coba analisa singkat untuk verifikasi keberadaan ticker
        await tvService.analyze(ticker, 1); 
        
        await dbService.addTicker(ticker);
        await bot.editMessageText(`✅ **$${ticker}** terverifikasi dan berhasil ditambahkan ke radar screener.`, {
          chat_id: msg.chat.id,
          message_id: status.message_id,
          parse_mode: 'Markdown'
        });
      } catch (err) {
        let errorReason;
        if (err.message.includes('Symbol error') || err.message.includes('ser_1')) {
          errorReason = "Emiten tidak ditemukan di IDX.";
        } else {
          errorReason = `Gangguan teknis: \`${err.message}\``;
        }

        await bot.editMessageText(`❌ **$${ticker}** gagal ditambahkan.\n\nAlasan: ${errorReason}`, {
          chat_id: msg.chat.id,
          message_id: status.message_id,
          parse_mode: 'Markdown'
        });
      }
    });

    bot.onText(/\/del(?:\s+([A-Za-z0-9]+))?$/i, async (msg, match) => {
      const ticker = match[1]?.toUpperCase();
      
      if (!ticker) {
        return bot.sendMessage(msg.chat.id, `💡 **Cara Penggunaan:**\nKetik \`/del [TICKER]\`\nContoh: \`/del BBCA\``, { parse_mode: 'Markdown' });
      }
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

    bot.onText(/\/nextscan/i, (msg) => {
      const now = new Date();
      const currentMinutes = now.getMinutes();
      const minutesLeft = 60 - currentMinutes;
      
      const nextMsg = `⏳ **Informasi Radar**\n\n` +
                      `Screener otomatis berjalan setiap awal jam.\n` +
                      `• **Scan Terakhir:** ${now.getHours()}:00 WIB\n` +
                      `• **Scan Berikutnya:** dalam **${minutesLeft} menit** (sekitar jam ${now.getHours() + 1}:00 WIB).\n\n` +
                      `💡 _Bot hanya men-scan saham yang ada di dalam \`/list\` Anda._`;
      
      bot.sendMessage(msg.chat.id, nextMsg, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/setbalance(?:\s+([0-9]+))?$/i, async (msg, match) => {
      const balance = parseFloat(match[1]);
      try {
        await dbService.setUserBalance(msg.chat.id, balance);
        bot.sendMessage(msg.chat.id, `💰 **Modal Berhasil Diatur:** Rp ${balance.toLocaleString('id-ID')}\n\n_Bot sekarang akan menghitung rekomendasi lot otomatis untuk Anda._`, { parse_mode: 'Markdown' });
      } catch (err) {
        bot.sendMessage(msg.chat.id, `❌ Gagal mengatur modal.`);
      }
    });

    bot.onText(/\/help/i, (msg) => {
      const helpMsg = `🤖 *Zenith AI Trading Engine v4.5*\n` +
                      `_The Hybrid Engine Edition_\n\n` +
                      `Gunakan tombol di bawah ini untuk memudahkan Anda memanggil perintah tanpa mengetik manual:\n\n` +
                      `💎 *INTELLIGENCE ANALYST*\n` +
                      `• \`/analysis\` - Analisa Hybrid (Teknikal + AI)\n` +
                      `• \`/technical\` - Analisa Teknikal Murni\n` +
                      `• \`/news\` - Berita & Sentimen AI\n\n` +
                      `📡 *RADAR & WATCHLIST*\n` +
                      `• \`/add\` - Tambah Saham ke Radar\n` +
                      `• \`/del\` - Hapus Saham dari Radar\n` +
                      `• \`/list\` - Lihat Isi Radar\n\n` +
                      `💡 *TIPS*\n` +
                      `Klik tombol di bawah untuk langsung mencoba perintah favorit Anda!`;

      bot.sendMessage(msg.chat.id, helpMsg, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🧬 Analisa Hybrid', callback_data: 'ask_analysis' },
              { text: '📊 Teknikal', callback_data: 'ask_technical' }
            ],
            [
              { text: '📰 Berita AI', callback_data: 'ask_news' },
              { text: '📡 Sisa Waktu Scan', callback_data: 'nextscan' }
            ],
            [
              { text: '➕ Tambah Radar', callback_data: 'ask_add' },
              { text: '➖ Hapus Radar', callback_data: 'ask_del' }
            ]
          ]
        }
      });
    });

    // Handle callback queries (Tombol Langsung)
    bot.on('callback_query', (query) => {
      const chatId = query.message.chat.id;
      bot.answerCallbackQuery(query.id);

      if (query.data === 'nextscan') {
        const now = new Date();
        const minutesLeft = 60 - now.getMinutes();
        return bot.sendMessage(chatId, `⏳ **Scan Berikutnya:** dalam **${minutesLeft} menit**.`);
      }

      const actions = {
        'ask_analysis': { action: 'analysis', text: '🧬 **Analisa Hybrid (AI)**\n\nSilakan balas pesan ini dengan **Kode Saham** (Contoh: `BBCA`).' },
        'ask_technical': { action: 'technical', text: '📊 **Analisa Teknikal**\n\nSilakan balas pesan ini dengan **Kode Saham** (Contoh: `PTRO`).' },
        'ask_news': { action: 'news', text: '📰 **Berita & Sentimen**\n\nSilakan balas pesan ini dengan **Kode Saham**.' },
        'ask_add': { action: 'add', text: '➕ **Tambah Radar**\n\nSilakan balas pesan ini dengan **Kode Saham** yang ingin dipantau.' },
        'ask_del': { action: 'del', text: '➖ **Hapus Radar**\n\nSilakan balas pesan ini dengan **Kode Saham** yang ingin dihapus.' }
      };

      if (actions[query.data]) {
        // Set State sebelum kirim pesan
        userStates.set(chatId, { action: actions[query.data].action });
        
        bot.sendMessage(chatId, actions[query.data].text, { 
          parse_mode: 'Markdown', 
          reply_markup: { force_reply: true, selective: true } 
        });
      }
    });

    bot.onText(/\/start/, (msg) => {
      const startMsg = `🤖 *Halo Trader! Saya adalah Zenith AI Trading Engine.*\n\n` +
                       `Saya akan membantu Anda mencari momentum terbaik di bursa saham Indonesia menggunakan algoritma *Adaptive ATR* & *Balanced Technical Scoring*.\n\n` +
                       `Ketik \`/help\` untuk melihat daftar perintah.`;
      bot.sendMessage(msg.chat.id, startMsg, { parse_mode: 'Markdown' });
    });


    // Handle Polling Errors (Network Timeout, etc)
    bot.on('polling_error', (err) => {
      if (err.message.includes('ETIMEDOUT') || err.message.includes('EFATAL')) {
        logger.warn('Telegram Polling Timeout. Mencoba menyambung kembali...');
      } else {
        logger.error('Telegram Polling Error:', err.message);
      }
    });
  }

  logger.info(`Telegram Service Initialized (Polling: ${options.polling})`);
  return bot;
}

const getBot = () => bot;

export { init, getBot };
export default { init, getBot };
