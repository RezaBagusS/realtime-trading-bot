const TradingView = require('@mathieuc/tradingview');
const config = require('../config');
const logger = require('../utils/logger');

let client = null;

function getClient() {
  if (!client) {
    client = new TradingView.Client({
      token: config.tradingview.session,
      signature: config.tradingview.signature
    });
    client.onError((err) => {
      logger.error('TradingView Client Error:', err);
      client = null;
    });
  }
  return client;
}

// EMA Calculator Lokal (Tanpa Study TradingView)
function calculateEMA(data, period) {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  // Mulai dengan SMA sederhana untuk candle pertama sebagai basis
  let ema = data.slice(0, period).reduce((s, c) => s + c.close, 0) / period;
  // Lanjutkan dengan rumus EMA untuk sisa candle
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close * k) + (ema * (1 - k));
  }
  return ema;
}

async function analyze(ticker, strategy) {
  return new Promise(async (resolve, reject) => {
    const symbol = `IDX:${ticker.toUpperCase()}`;
    const timeout = setTimeout(() => {
      if (chart) chart.delete();
      reject(new Error(`Timeout: Koneksi sedang sibuk atau market data tidak tersedia. Coba 5 detik lagi.`));
    }, 25000);

    let chart;
    let results = { rsi: null, price: null, volume: null, prevClose: null, avgVol: null };

    try {
      const tvClient = getClient();
      chart = new tvClient.Session.Chart();
      
      chart.onError((err) => {
        clearTimeout(timeout);
        chart.delete();
        reject(new Error(`TradingView Error: ${err}`));
      });

      chart.setMarket(symbol, { timeframe: strategy.timeframe, range: 150 });

      // HANYA 1 STUDY (RSI) - Hemat limit akun free
      const rsiInd = await TradingView.getIndicator('STD;RSI');
      rsiInd.setOption('in_0', strategy.rsi_length);
      const RSI_Study = new chart.Study(rsiInd);

      const checkReady = () => {
        if (results.rsi !== null && results.price !== null) {
          // Balik urutan candle (dari terlama ke terbaru) untuk hitung EMA
          const chronData = [...chart.periods].reverse();
          
          const finalResults = {
            ...results,
            ema20: calculateEMA(chronData, 20),
            ema50: calculateEMA(chronData, 50)
          };

          clearTimeout(timeout);
          chart.delete();
          resolve(finalResults);
        }
      };

      RSI_Study.onUpdate(() => {
        const val = RSI_Study.periods[0]?.RSI ?? RSI_Study.periods[0]?.plot_0;
        if (val !== undefined && val !== null) {
          results.rsi = val;
          checkReady();
        }
      });

      chart.onUpdate(() => {
        if (chart.periods.length > 1) {
          const candles = chart.periods;
          results.price = candles[0].close;
          results.volume = candles[0].volume;
          results.prevClose = candles[1].close;
          
          const volSum = candles.slice(0, 20).reduce((sum, c) => sum + (c.volume || 0), 0);
          results.avgVol = volSum / 20;
          checkReady();
        }
      });

    } catch (err) {
      clearTimeout(timeout);
      if (chart) chart.delete();
      reject(err);
    }
  });
}

module.exports = { analyze };
