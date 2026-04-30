const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const logger = require('../utils/logger');

const parser = new Parser();
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT, ...options.headers },
        timeout: 10000,
        ...options
      });
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

/**
 * Get news from Google News RSS (Aggregator for CNBC, Kontan, Bisnis, etc.)
 */
async function scrapeGoogleNews(ticker, timeframe = '7d') {
  try {
    const query = encodeURIComponent(`${ticker} (saham OR "keterbukaan informasi" OR pengumuman) IDX when:${timeframe}`);
    const url = `https://news.google.com/rss/search?q=${query}&hl=id&gl=ID&ceid=ID:id`;
    
    const feed = await parser.parseURL(url);
    
    // Jika tidak ada berita dalam timeframe ini, coba timeframe yang lebih luas (hanya sekali)
    if (feed.items.length === 0 && timeframe === '7d') {
      logger.info(`Tidak ada berita 7 hari terakhir untuk $${ticker}, mencoba 30 hari...`);
      return scrapeGoogleNews(ticker, '30d');
    }

    return feed.items.slice(0, 10).map(item => {
      const isDisclosure = item.title.toLowerCase().includes('keterbukaan informasi') || 
                           item.title.toLowerCase().includes('pengumuman') ||
                           item.source?.text === 'IDX';
      
      return {
        source: item.source?.text || 'News',
        title: isDisclosure ? `[📢 PENGUMUMAN] ${item.title}` : item.title,
        link: item.link,
        date: item.pubDate,
        content: item.contentSnippet || '',
        isDisclosure
      };
    });
  } catch (err) {
    logger.error(`Error fetching Google News for ${ticker}:`, err.message);
    return [];
  }
}

/**
 * Get aggregated news for a ticker
 */
async function getLatestNews(ticker) {
  logger.info(`📰 Mengambil berita terkini untuk $${ticker.toUpperCase()}...`);
  
  // Gunakan Google News sebagai agregator utama karena sangat stabil
  const news = await scrapeGoogleNews(ticker);
  
  // Urutkan: Pengumuman IDX dulu, baru berdasarkan tanggal terbaru
  news.sort((a, b) => {
    if (a.isDisclosure && !b.isDisclosure) return -1;
    if (!a.isDisclosure && b.isDisclosure) return 1;
    return new Date(b.date) - new Date(a.date);
  });

  if (news.length === 0) {
    logger.warn(`Tidak ada berita ditemukan untuk $${ticker.toUpperCase()}`);
  }

  return news;
}

module.exports = { getLatestNews };
