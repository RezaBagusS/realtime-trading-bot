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

async function analyze(ticker, strategy) {
  return new Promise(async (resolve, reject) => {
    const symbol = `IDX:${ticker.toUpperCase()}`;
    const timeout = setTimeout(() => reject(new Error('Timeout data TradingView')), 20000);

    try {
      const tvClient = getClient();
      const chart = new tvClient.Session.Chart();
      
      chart.onError((err) => {
        clearTimeout(timeout);
        chart.delete();
        reject(new Error(`Ticker ${ticker} tidak ditemukan`));
      });

      chart.setMarket(symbol, { timeframe: strategy.timeframe, range: 50 }); // Ambil 50 candle untuk rata-rata volume

      // 1. Setup Indikator
      const rsiInd = await TradingView.getIndicator('STD;RSI');
      rsiInd.setOption('in_0', strategy.rsi_length);

      const ema20Ind = await TradingView.getIndicator('STD;EMA');
      ema20Ind.setOption('length', 20);

      const ema50Ind = await TradingView.getIndicator('STD;EMA');
      ema50Ind.setOption('length', 50);

      // 2. Init Studies
      const RSI_Study = new chart.Study(rsiInd);
      const EMA20_Study = new chart.Study(ema20Ind);
      const EMA50_Study = new chart.Study(ema50Ind);

      let results = { rsi: null, ema20: null, ema50: null, volume: null, price: null, prevClose: null, avgVol: null };

      // Helper untuk cek apakah semua data sudah terkumpul
      const checkReady = () => {
        if (results.rsi !== null && results.ema20 !== null && results.ema50 !== null && results.price !== null) {
          clearTimeout(timeout);
          chart.delete();
          resolve(results);
        }
      };

      RSI_Study.onUpdate(() => {
        results.rsi = RSI_Study.periods[0]?.RSI ?? RSI_Study.periods[0]?.plot_0;
        checkReady();
      });

      EMA20_Study.onUpdate(() => {
        results.ema20 = EMA20_Study.periods[0]?.EMA ?? EMA20_Study.periods[0]?.plot_0;
        checkReady();
      });

      EMA50_Study.onUpdate(() => {
        results.ema50 = EMA50_Study.periods[0]?.EMA ?? EMA50_Study.periods[0]?.plot_0;
        checkReady();
      });

      chart.onUpdate(() => {
        const candles = chart.periods;
        if (candles.length > 0) {
          const current = candles[0];
          results.price = current.close;
          results.volume = current.volume;
          results.prevClose = candles[1]?.close;
          
          // Hitung rata-rata volume 20 candle terakhir
          const volSum = candles.slice(0, 20).reduce((sum, c) => sum + (c.volume || 0), 0);
          results.avgVol = volSum / 20;
        }
        checkReady();
      });

    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });
}

module.exports = { analyze };
