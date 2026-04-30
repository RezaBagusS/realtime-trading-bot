/**
 * ADVANCED BACKTESTER v1.15
 * Sync with Logic v3.6 (IHSG Global Filter)
 */
require('dotenv').config();
const tvService = require('./src/services/tradingview');
const indicators = require('./src/utils/indicators');

function getSimulatedScore(snapshot, marketTrend) {
  let score = 50;
  
  // 1. MARKET CONTEXT (Safety Switch v3.6)
  if (marketTrend === 'BEARISH') score -= 20;
  else if (marketTrend === 'BULLISH') score += 5;

  // 2. TREND
  if (snapshot.ema20 > snapshot.ema50) score += 20;
  else score -= 30;

  // 3. MOMENTUM
  if (snapshot.macdHist > 0) score += 15;

  // 4. STRUCTURE
  if (snapshot.price >= snapshot.resistance) score += 15;
  else if (Math.abs(snapshot.price - snapshot.ema20) / snapshot.ema20 < 0.02) score += 10;
  
  return score;
}

async function runBacktest(ticker) {
  try {
    console.log(`\n🔍 Mengambil data history untuk $${ticker.toUpperCase()} & IHSG...`);
    
    // Ambil data history saham dan IHSG secara paralel
    const [history, ihsgHistory] = await Promise.all([
      tvService.getHistory(ticker, 'D', 350),
      tvService.getHistory('COMPOSITE', 'D', 350)
    ]);

    console.log(`🚀 BACKTEST MARKET-AWARE (v1.15): $${ticker.toUpperCase()}`);
    console.log(`------------------------------------------------------------`);

    let trades = [];
    let activeTrade = null;
    let balance = 10000000;
    const FEE = 0.002; // Fee Transaksi 0.2%

    // Loop mulai dari candle ke-60 agar indikator stabil
    for (let i = 60; i < history.length; i++) {
      const currentData = history.slice(0, i + 1);
      const prevData = history.slice(0, i);
      const currentTime = history[i].time;

      // Cari data IHSG yang cocok dengan tanggal saat ini
      const ihsgSnapshot = ihsgHistory.filter(h => h.time <= currentTime).slice(-20);
      const ihsgLast = ihsgSnapshot[ihsgSnapshot.length - 1];
      const ihsgEma20 = indicators.calculateEMA(ihsgSnapshot, 20);
      const marketTrend = (ihsgLast && ihsgLast.close > ihsgEma20) ? 'BULLISH' : 'BEARISH';

      // Hitung indikator saham
      const srPrev = indicators.findSupportResistance(prevData);
      const macd = indicators.calculateMACD(currentData);
      const atr = indicators.calculateATR(currentData, 14);
      const ema20 = indicators.calculateEMA(currentData, 20);
      const ema50 = indicators.calculateEMA(currentData, 50);
      const price = history[i].close;
      const date = new Date(currentTime * 1000).toLocaleDateString('id-ID');

      const score = getSimulatedScore({ price, ema20, ema50, macdHist: macd.hist, resistance: srPrev.resistance }, marketTrend);

      if (activeTrade) {
        let reason = '';
        if (price >= activeTrade.tp) reason = 'HIT TP ✅';
        else if (price <= activeTrade.sl) reason = 'HIT SL ❌';
        else if (i === history.length - 1) reason = 'FORCE CLOSE (End) 🔚';

        if (reason) {
          const rawProfit = (price - activeTrade.entryPrice) / activeTrade.entryPrice;
          const netProfit = rawProfit - (FEE * 2); // Potong fee beli & jual
          balance += balance * netProfit;
          
          console.log(`🔴 EXIT  | Tgl: ${date} | Harga: ${price.toLocaleString()} | Hasil: ${reason} | Net Profit: ${(netProfit * 100).toFixed(2)}%`);
          console.log(`------------------------------------------------------------`);
          
          trades.push({ profit: netProfit * 100, status: netProfit > 0 ? 'WIN' : 'LOSS' });
          activeTrade = null;
        }
      } 
      else if (score >= 70) {
        const sl = Math.floor(price - (2.5 * atr));
        const tp = Math.floor(price + (5 * atr));
        
        activeTrade = { entryPrice: price, sl, tp, entryDate: date };
        
        console.log(`🔵 ENTRY | Tgl: ${date} | Harga: ${price.toLocaleString()} | Score: ${score} | Market: ${marketTrend === 'BULLISH' ? '📈' : '📉'}`);
        console.log(`   PLAN  | SL: ${sl.toLocaleString()} | TP: ${tp.toLocaleString()} | ATR: ${atr.toFixed(0)}`);
      }
    }

    const wins = trades.filter(t => t.status === 'WIN').length;
    const totalProfit = ((balance - 10000000) / 10000000 * 100).toFixed(1);

    console.log(`\n========================================`);
    console.log(`📈 RINGKASAN HASIL $${ticker.toUpperCase()} (Logic v3.6)`);
    console.log(`========================================`);
    console.log(`🔹 Saldo Akhir   : Rp ${Math.round(balance).toLocaleString('id-ID')}`);
    console.log(`🔹 Total Profit  : ${totalProfit}% (Net after Fee)`);
    console.log(`🔹 Win Rate     : ${trades.length > 0 ? (wins / trades.length * 100).toFixed(1) : 0}%`);
    console.log(`🔹 Total Trades  : ${trades.length}`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Backtest Error:', err.message);
  }
}

runBacktest(process.argv[2] || 'MDKA');
