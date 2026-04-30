const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const tvService = require('./tradingview');
const dbService = require('./database');
const formatter = require('../utils/formatter');
const logger = require('../utils/logger');
const newsService = require('./news');
const aiService = require('./ai');

let bot;

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
  }

  // Hanya pasang listener jika polling aktif
  if (options.polling) {
    bot.onText(/\/technical\s+([A-Za-z0-9]+)/i, (msg, match) => {
      handleDualCek(msg, match[1].toUpperCase());
    });

    bot.onText(/\/analysis\s+([A-Za-z0-9]+)/i, async (msg, match) => {
      const ticker = match[1].toUpperCase();
      
      // Basic validation for IDX tickers (usually 4 chars, max 6 for warrants)
      if (ticker.length < 4 || ticker.length > 6) {
        return bot.sendMessage(msg.chat.id, `⚠️ Ticker *$${ticker}* tidak valid. Kode saham IDX biasanya 4 huruf.`, { parse_mode: 'Markdown' });
      }

      const loading = await bot.sendMessage(msg.chat.id, `🧬 **Hybrid Engine v4.0** sedang memproses *$${ticker}*...\n\n_Menganalisa data teknikal & sentimen AI..._`, { parse_mode: 'Markdown' });
      
      try {
        const [technicalData, news, marketStatus] = await Promise.all([
          tvService.analyze(ticker, config.thresholds.swing),
          newsService.getLatestNews(ticker),
          tvService.getMarketStatus()
        ]);

        // Panggil Gemini AI untuk analisa sentimen
        const sentiment = await aiService.analyzeSentiment(ticker, news);
        
        const report = formatter.formatHybridAnalysis(ticker, technicalData, sentiment, marketStatus);
        
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

    bot.onText(/\/news\s+([A-Za-z0-9]+)/i, async (msg, match) => {
      const ticker = match[1].toUpperCase();
      
      // Basic validation for IDX tickers (usually 4 chars, max 6 for warrants)
      if (ticker.length < 4 || ticker.length > 6) {
        return bot.sendMessage(msg.chat.id, `⚠️ Ticker *$${ticker}* tidak valid.\n\nKode saham IDX biasanya terdiri dari 4 huruf (contoh: BBCA, ASII).`, { parse_mode: 'Markdown' });
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

    bot.onText(/\/add\s+([A-Za-z0-9]+)/i, async (msg, match) => {
      const ticker = match[1].toUpperCase();
      
      // Basic validation
      if (ticker.length < 4 || ticker.length > 6) {
        return bot.sendMessage(msg.chat.id, `⚠️ Ticker *$${ticker}* tidak valid. Kode saham IDX biasanya 4 huruf.`, { parse_mode: 'Markdown' });
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
        let errorReason = "Emiten tidak ditemukan di IDX.";
        if (!err.message.includes('Symbol error') && !err.message.includes('ser_1')) {
          errorReason = "Terjadi gangguan saat verifikasi. Coba lagi nanti.";
        }

        await bot.editMessageText(`❌ **$${ticker}** gagal ditambahkan.\n\nAlasan: ${errorReason}`, {
          chat_id: msg.chat.id,
          message_id: status.message_id,
          parse_mode: 'Markdown'
        });
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
      const helpMsg = `🤖 *IDX Signal Bot v4.0*\n` +
                      `_The Hybrid Engine Edition_\n\n` +
                      `Selamat datang! Gunakan perintah berikut untuk mengoperasikan bot:\n\n` +
                      `💎 *INTELLIGENCE ANALYST*\n` +
                      `• \`/analysis [ticker]\` - **Analisa Hybrid (Teknikal + AI).** Rekomendasi paling akurat.\n` +
                      `• \`/technical [ticker]\` - Analisa teknikal murni (Scalp & Swing).\n` +
                      `• \`/news [ticker]\` - Baca 5 berita terbaru emiten & Sentimen AI.\n\n` +
                      `📡 *RADAR & WATCHLIST*\n` +
                      `• \`/add [ticker]\` - Tambahkan saham ke radar pemantauan otomatis.\n` +
                      `• \`/del [ticker]\` - Hapus saham dari radar.\n` +
                      `• \`/list\` - Tampilkan semua saham di radar.\n\n` +
                      `💡 *TIPS*\n` +
                      `Gunakan \`/analysis\` untuk mendapatkan keyakinan penuh sebelum melakukan entry saham.\n\n` +
                      `_Developed with ❤️ for Indonesian Traders_`;
      bot.sendMessage(msg.chat.id, helpMsg, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/start/, (msg) => {
      const startMsg = `🤖 *Halo Trader! Saya adalah IDX Smart Signal Bot.*\n\n` +
                       `Saya akan membantu Anda mencari momentum terbaik di bursa saham Indonesia menggunakan algoritma *Adaptive ATR* & *Balanced Technical Scoring*.\n\n` +
                       `Ketik \`/help\` untuk melihat daftar perintah.`;
      bot.sendMessage(msg.chat.id, startMsg, { parse_mode: 'Markdown' });
    });
  }

  logger.info(`Telegram Service Initialized (Polling: ${options.polling})`);
  return bot;
}

module.exports = { init, getBot: () => bot };
