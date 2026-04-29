/**
 * DEBUG SCORE EXPLORER
 * Membedah alasan bot memberikan skor pada setiap candle.
 */
require('dotenv').config();
const tvService = require('./src/services/tradingview');
const indicators = require('./src/utils/indicators');

async function debugScore(ticker) {
  try {
    const history = await tvService.getHistory(ticker, 'D', 150);
    console.log(`\n🔍 DEBUGGING LOGIC UNTUK $${ticker.toUpperCase()}:`);
    
    // Kita ambil 5 candle terakhir saja untuk sampling
    for (let i = history.length - 5; i < history.length; i++) {
      const currentData = history.slice(0, i + 1);
      const last = history[i];
      
      const stoch = indicators.calculateStochRSI(currentData);
      const sr = indicators.findSupportResistance(currentData);
      const macd = indicators.calculateMACD(currentData);
      
      const ema20 = indicators.calculateEMA(currentData, 20);
      const ema50 = indicators.calculateEMA(currentData, 50);
      
      let score = 50;
      let log = [`Base: 50`];

      if (stoch.k < 20) { score += 20; log.push(`Stoch Oversold: +20`); }
      if (ema20 > ema50) { score += 15; log.push(`Trend Up: +15`); } else { score -= 25; log.push(`Trend Down: -25`); }
      if (macd.hist > 0) { score += 15; log.push(`MACD Bullish: +15`); }
      
      const distToResist = (sr.resistance - last.close) / last.close;
      if (distToResist < 0.02) { score -= 30; log.push(`Near Resistance: -30 ❌`); }

      console.log(`----------------------------------------`);
      console.log(`Candle Ke-${i} | Harga: ${last.close}`);
      console.log(`Skor Akhir: ${score}`);
      console.log(`Alasan: ${log.join(' | ')}`);
    }
  } catch (err) {
    console.error(err);
  }
}

const ticker = process.argv[2] || 'BBCA';
debugScore(ticker);
