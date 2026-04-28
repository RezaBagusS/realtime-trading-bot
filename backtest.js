/**
 * BASIC BACKTESTER v1.1
 * Optimalisasi Win-Rate dengan MACD & Trend Filter.
 */
require('dotenv').config();
const tvService = require('./src/services/tradingview');
const indicators = require('./src/utils/indicators');
const logger = require('./src/utils/logger');

function getSimulatedScore(snapshot) {
  let score = 50;
  
  // 1. Stochastic RSI + Crossover (Lebih Akurat)
  if (snapshot.stochK < 20) {
    score += 20;
    // Bonus jika terjadi Golden Cross di area Oversold
    if (snapshot.stochPrevK < snapshot.stochPrevD && snapshot.stochK > snapshot.stochD) {
      score += 25; 
    }
  } else if (snapshot.stochK > 80) {
    score -= 30;
  }

  // 2. Trend Filter (Mencegah Catching Falling Knife)
  if (snapshot.ema20 > snapshot.ema50) {
    score += 15; // Trend is Up
  } else {
    score -= 20; // Strong Down Trend - JANGAN BELI
  }

  // 3. MACD Momentum
  if (snapshot.macdHist > 0) {
    score += 15; // Momentum positif
  }

  // 4. Price Action
  const distToSupport = (snapshot.price - snapshot.support) / snapshot.support;
  if (distToSupport < 0.03) score += 10;
  
  const distToResist = (snapshot.resistance - snapshot.price) / snapshot.price;
  if (distToResist < 0.02) score -= 25;

  return Math.min(Math.max(score, 0), 100);
}

async function runBacktest(ticker) {
  try {
    const history = await tvService.getHistory(ticker, 'D', 350);
    logger.info(`📊 Memulai Backtest Optimasi $${ticker}...`);

    let trades = [];
    let activeTrade = null;
    let balance = 10000000;
    const initialBalance = balance;

    // Mulai dari candle ke-60 agar MACD & EMA stabil
    for (let i = 60; i < history.length; i++) {
      const currentData = history.slice(0, i + 1);
      const lastCandle = history[i];

      const stoch = indicators.calculateStochRSI(currentData, 14);
      const sr = indicators.findSupportResistance(currentData);
      const macd = indicators.calculateMACD(currentData);
      
      const snapshot = {
        price: lastCandle.close,
        ema20: indicators.calculateEMA(currentData, 20),
        ema50: indicators.calculateEMA(currentData, 50),
        stochK: stoch.k,
        stochD: stoch.d,
        stochPrevK: stoch.prevK,
        stochPrevD: stoch.prevD,
        macdHist: macd.hist,
        support: sr.support,
        resistance: sr.resistance
      };

      const score = getSimulatedScore(snapshot);

      if (activeTrade) {
        const profitPct = (snapshot.price - activeTrade.entryPrice) / activeTrade.entryPrice;
        if (profitPct >= 0.10 || profitPct <= -0.05) {
          balance += balance * profitPct;
          trades.push({ profit: profitPct * 100, status: profitPct > 0 ? 'WIN' : 'LOSS' });
          activeTrade = null;
        }
      } 
      // Kita naikkan ambang batas beli ke 80 agar lebih selektif
      else if (score >= 80) {
        activeTrade = { entryPrice: snapshot.price };
      }
    }

    const wins = trades.filter(t => t.status === 'WIN').length;
    const losses = trades.filter(t => t.status === 'LOSS').length;
    const winRate = trades.length > 0 ? (wins / trades.length * 100).toFixed(1) : 0;
    const totalProfit = ((balance - initialBalance) / initialBalance * 100).toFixed(1);

    console.log(`========================================`);
    console.log(`📈 HASIL OPTIMASI $${ticker.toUpperCase()}`);
    console.log(`========================================`);
    console.log(`🔹 Saldo Akhir   : Rp ${balance.toLocaleString('id-ID')}`);
    console.log(`🔹 Total Profit  : ${totalProfit}%`);
    console.log(`🔹 Win Rate     : ${winRate}% (✅ ${wins} | ❌ ${losses})`);
    console.log(`🔹 Total Trades  : ${trades.length}`);
    console.log(`========================================\n`);

  } catch (err) {
    logger.error(`Error: ${err.message}`);
  }
}

const ticker = process.argv[2] || 'BBCA';
runBacktest(ticker);
