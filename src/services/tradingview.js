const TradingView = require('@mathieuc/tradingview');
const config = require('../config');
const logger = require('../utils/logger');
const indicators = require('../utils/indicators');

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

// EMA Calculator Lokal
function calculateEMA(data, period) {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((s, c) => s + c.close, 0) / period;
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
      reject(new Error(`Timeout: Koneksi sedang sibuk. Coba 5 detik lagi.`));
    }, 25000);

    let chart;

    try {
      const tvClient = getClient();
      chart = new tvClient.Session.Chart();
      
      chart.onError((err) => {
        clearTimeout(timeout);
        chart.delete();
        reject(new Error(`TradingView Error: ${err}`));
      });

      // Ambil 150 candle untuk analisa S/R dan StochRSI yang akurat
      chart.setMarket(symbol, { timeframe: strategy.timeframe, range: 150 });

      // ZERO STUDY MODE: Semua dihitung lokal dari data candle
      chart.onUpdate(() => {
        if (chart.periods.length > 50) {
          const candles = chart.periods;
          const chronData = [...candles].reverse();
          
          const current = candles[0];
          const stoch = indicators.calculateStochRSI(chronData, 14);
          const sr = indicators.findSupportResistance(chronData);
          
          const results = {
            price: current.close,
            volume: current.volume,
            prevClose: candles[1]?.close,
            avgVol: candles.slice(0, 20).reduce((s, c) => s + (c.volume || 0), 0) / 20,
            ema20: calculateEMA(chronData, 20),
            ema50: calculateEMA(chronData, 50),
            stochK: stoch.k,
            stochD: stoch.d,
            support: sr.support,
            resistance: sr.resistance,
            timeframe: strategy.timeframe
          };

          clearTimeout(timeout);
          chart.delete();
          resolve(results);
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
