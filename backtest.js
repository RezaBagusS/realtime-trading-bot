/**
 * BASIC BACKTESTER v1.12
 * Swing Standard Multipliers (2.5x / 5x ATR).
 */
require('dotenv').config();
const tvService = require('./src/services/tradingview');
const indicators = require('./src/utils/indicators');

function getSimulatedScore(snapshot) {
  let score = 50;
  if (snapshot.ema20 > snapshot.ema50) score += 20;
  else score -= 30;
  if (snapshot.macdHist > 0) score += 15;
  if (snapshot.price >= snapshot.resistance) score += 15;
  else if (Math.abs(snapshot.price - snapshot.ema20) / snapshot.ema20 < 0.02) score += 10;
  return score;
}

async function runBacktest(ticker) {
  try {
    const history = await tvService.getHistory(ticker, 'D', 350);
    console.log(`\n🚀 BACKTEST SWING (v1.12): $${ticker.toUpperCase()}`);
    console.log(`------------------------------------------------------------`);

    let trades = [];
    let activeTrade = null;
    let balance = 10000000;

    for (let i = 60; i < history.length; i++) {
      const currentData = history.slice(0, i + 1);
      const prevData = history.slice(0, i);
      
      const stoch = indicators.calculateStochRSI(currentData);
      const srPrev = indicators.findSupportResistance(prevData);
      const macd = indicators.calculateMACD(currentData);
      const atr = indicators.calculateATR(currentData, 14);
      const ema20 = indicators.calculateEMA(currentData, 20);
      const ema50 = indicators.calculateEMA(currentData, 50);
      const price = history[i].close;
      const date = new Date(history[i].time * 1000).toLocaleDateString('id-ID');

      const snapshot = { price, ema20, ema50, macdHist: macd.hist, resistance: srPrev.resistance, atr };
      const score = getSimulatedScore(snapshot);

      if (activeTrade) {
        let reason = '';
        if (price >= activeTrade.tp) reason = 'HIT TP ✅';
        else if (price <= activeTrade.sl) reason = 'HIT SL ❌';
        else if (i === history.length - 1) reason = 'FORCE CLOSE (End of Data) 🔚';

        if (reason) {
          const profitPct = (price - activeTrade.entryPrice) / activeTrade.entryPrice;
          balance += balance * profitPct;
          
          console.log(`🔴 EXIT  | Tgl: ${date} | Harga: ${price.toLocaleString()} | Hasil: ${reason} | Profit: ${(profitPct * 100).toFixed(2)}%`);
          console.log(`------------------------------------------------------------`);
          
          trades.push({ profit: profitPct * 100, status: profitPct > 0 ? 'WIN' : 'LOSS' });
          activeTrade = null;
        }
      } 
      else if (score >= 70) {
        // SWING MULTIPLIERS: 2.5x ATR untuk SL, 5x ATR untuk TP
        const sl = Math.floor(price - (2.5 * atr));
        const tp = Math.floor(price + (5 * atr));
        
        activeTrade = { entryPrice: price, sl, tp, entryDate: date };
        
        console.log(`🔵 ENTRY | Tgl: ${date} | Harga: ${price.toLocaleString()} | Score: ${score}`);
        console.log(`   PLAN  | SL: ${sl.toLocaleString()} | TP: ${tp.toLocaleString()} | ATR: ${atr.toFixed(0)}`);
      }
    }

    const wins = trades.filter(t => t.status === 'WIN').length;
    const totalProfit = ((balance - 10000000) / 10000000 * 100).toFixed(1);

    console.log(`\n========================================`);
    console.log(`📈 RINGKASAN HASIL $${ticker.toUpperCase()}`);
    console.log(`========================================`);
    console.log(`🔹 Saldo Akhir   : Rp ${Math.round(balance).toLocaleString('id-ID')}`);
    console.log(`🔹 Total Profit  : ${totalProfit}%`);
    console.log(`🔹 Win Rate     : ${trades.length > 0 ? (wins / trades.length * 100).toFixed(1) : 0}%`);
    console.log(`🔹 Total Trades  : ${trades.length}`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error(err);
  }
}

runBacktest(process.argv[2] || 'BULL');
