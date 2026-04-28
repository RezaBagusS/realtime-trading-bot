/**
 * BASIC BACKTESTER v1.0
 * Menguji strategi Technical Score pada data historis.
 */
require('dotenv').config();
const tvService = require('./src/services/tradingview');
const indicators = require('./src/utils/indicators');
const logger = require('./src/utils/logger');

function calculateEMA(data, period) {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((s, c) => s + c.close, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close * k) + (ema * (1 - k));
  }
  return ema;
}

function getSimulatedScore(snapshot) {
  let score = 50;
  if (snapshot.stochK < 20) score += 30;
  else if (snapshot.stochK > 80) score -= 30;
  if (snapshot.price > snapshot.ema20) score += 10;
  if (snapshot.ema20 > snapshot.ema50) score += 10;
  const distToSupport = (snapshot.price - snapshot.support) / snapshot.support;
  if (distToSupport < 0.03) score += 15;
  const distToResist = (snapshot.resistance - snapshot.price) / snapshot.price;
  if (distToResist < 0.02) score -= 20;
  return Math.min(Math.max(score, 0), 100);
}

async function runBacktest(ticker) {
  try {
    const history = await tvService.getHistory(ticker, 'D', 300);
    logger.info(`📊 Memulai Backtest $${ticker} (300 candles)...`);

    let trades = [];
    let activeTrade = null;
    let initialBalance = 10000000; // 10 Juta
    let balance = initialBalance;

    // Mulai dari candle ke-50 agar indikator punya data
    for (let i = 50; i < history.length; i++) {
      const currentData = history.slice(0, i + 1);
      const lastCandle = history[i];

      // Hitung indikator pada titik waktu 'i'
      const stoch = indicators.calculateStochRSI(currentData, 14);
      const sr = indicators.findSupportResistance(currentData);
      
      const snapshot = {
        price: lastCandle.close,
        ema20: calculateEMA(currentData, 20),
        ema50: calculateEMA(currentData, 50),
        stochK: stoch.k,
        support: sr.support,
        resistance: sr.resistance
      };

      const score = getSimulatedScore(snapshot);

      // Logika Jual (Jika ada trade aktif)
      if (activeTrade) {
        const profitPct = (snapshot.price - activeTrade.entryPrice) / activeTrade.entryPrice;
        
        // Cek Take Profit (10%) atau Stop Loss (5%)
        if (profitPct >= 0.10 || profitPct <= -0.05) {
          const result = balance * profitPct;
          balance += result;
          trades.push({
            entry: activeTrade.entryPrice,
            exit: snapshot.price,
            profit: profitPct * 100,
            status: profitPct > 0 ? 'WIN' : 'LOSS'
          });
          activeTrade = null;
        }
      } 
      
      // Logika Beli (Jika tidak ada trade aktif dan score >= 75)
      else if (score >= 75) {
        activeTrade = {
          entryPrice: snapshot.price,
          entryTime: i
        };
      }
    }

    // Tampilkan Hasil
    const wins = trades.filter(t => t.status === 'WIN').length;
    const losses = trades.filter(t => t.status === 'LOSS').length;
    const winRate = (wins / trades.length * 100).toFixed(1);
    const totalProfit = ((balance - initialBalance) / initialBalance * 100).toFixed(1);

    console.log(`\n========================================`);
    console.log(`📈 HASIL BACKTEST $${ticker.toUpperCase()}`);
    console.log(`========================================`);
    console.log(`🔹 Total Trades  : ${trades.length}`);
    console.log(`🔹 Win Rate     : ${winRate}% (✅ ${wins} | ❌ ${losses})`);
    console.log(`🔹 Total Profit  : ${totalProfit}%`);
    console.log(`🔹 Akhir Saldo   : Rp ${balance.toLocaleString('id-ID')}`);
    console.log(`========================================\n`);

  } catch (err) {
    logger.error(`Error Backtest: ${err.message}`);
  }
}

// Jalankan untuk ticker yang diminta
const ticker = process.argv[2] || 'BBCA';
runBacktest(ticker);
