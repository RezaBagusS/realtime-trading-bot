import TradingView from '@mathieuc/tradingview';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import * as indicators from '../utils/indicators.js';

let client = null;
let lastErrorTime = 0;
const RECONNECT_COOLDOWN = 15000; // 15 detik jeda antar koneksi ulang

function getClient() {
  if (!client) {
    const now = Date.now();
    if (now - lastErrorTime < RECONNECT_COOLDOWN) {
      throw new Error(`Sistem sedang memulihkan koneksi ke TradingView. Mohon tunggu ${Math.ceil((RECONNECT_COOLDOWN - (now - lastErrorTime))/1000)} detik.`);
    }

    client = new TradingView.Client({
      token: config.tradingview.session,
      signature: config.tradingview.signature
    });
    client.onError((err) => {
      logger.error('TradingView Client Error:', err);
      lastErrorTime = Date.now();
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

async function getMarketStatus() {
  try {
    const history = await getHistory('COMPOSITE', 'D', 50);
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    
    const ema20 = calculateEMA(history, 20);
    const isBullish = last.close > ema20;
    const dailyChange = ((last.close - prev.close) / prev.close * 100).toFixed(2);

    return {
      price: last.close,
      change: dailyChange,
      trend: isBullish ? 'BULLISH' : 'BEARISH',
      ema20: ema20
    };
  } catch (err) {
    logger.error('Gagal mengambil status IHSG:', err.message);
    return { trend: 'NEUTRAL', change: 0, price: 0 };
  }
}

async function analyze(ticker, strategy) {
  return new Promise(async (resolve, reject) => {
    const symbol = ticker.toUpperCase() === 'COMPOSITE' ? 'IDX:COMPOSITE' : `IDX:${ticker.toUpperCase()}`;
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

      chart.setMarket(symbol, { timeframe: strategy.timeframe, range: 150 });

      chart.onUpdate(() => {
        if (chart.periods.length > 50) {
          const candles = chart.periods;
          const chronData = [...candles].reverse();
          
          const current = candles[0];
          const stoch = indicators.calculateStochRSI(chronData, 14);
          const sr = indicators.findSupportResistance(chronData);
          const atr = indicators.calculateATR(chronData, 14);
          
          const results = {
            price: current.close,
            volume: current.volume,
            prevClose: candles[1]?.close,
            avgVol: candles.slice(0, 20).reduce((s, c) => s + (c.volume || 0), 0) / 20,
            ema20: calculateEMA(chronData, 20),
            ema50: calculateEMA(chronData, 50),
            stochK: stoch.k,
            stochD: stoch.d,
            stochPrevK: stoch.prevK,
            stochPrevD: stoch.prevD,
            support: sr.support,
            resistance: sr.resistance,
            atr: atr, // Nilai Volatilitas
            rawHistory: chronData,
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

async function getHistory(ticker, timeframe = 'D', range = 350) {
  return new Promise(async (resolve, reject) => {
    // Gunakan IDX:COMPOSITE untuk IHSG, atau IDX: untuk saham
    let symbol = ticker.toUpperCase() === 'COMPOSITE' ? 'IDX:COMPOSITE' : `IDX:${ticker.toUpperCase()}`;
    const tvClient = getClient();
    let chart;
    let pollInterval;
    
    const timeout = setTimeout(() => {
      if (pollInterval) clearInterval(pollInterval);
      if (chart) chart.delete();
      reject(new Error(`Timeout: Data $${ticker} tidak merespon. Pastikan ticker benar.`));
    }, 35000); // 35 detik

    try {
      chart = new tvClient.Session.Chart();
      
      chart.onError((err) => {
        if (pollInterval) clearInterval(pollInterval);
        clearTimeout(timeout);
        chart.delete();
        reject(new Error(`TradingView Error: ${err}`));
      });

      chart.setMarket(symbol, { timeframe, range });
      
      // Smart Polling: Cek buffer data setiap 2 detik 
      // (Lebih stabil untuk Indeks daripada onUpdate)
      pollInterval = setInterval(() => {
        if (chart.periods.length >= 10) {
          const data = [...chart.periods].reverse(); 
          clearInterval(pollInterval);
          clearTimeout(timeout);
          chart.delete();
          resolve(data);
        }
      }, 2000);

      chart.onUpdate(() => {
        if (chart.periods.length >= 20) {
          const data = [...chart.periods].reverse(); 
          if (pollInterval) clearInterval(pollInterval);
          clearTimeout(timeout);
          chart.delete();
          resolve(data);
        }
      });
    } catch (err) {
      if (pollInterval) clearInterval(pollInterval);
      clearTimeout(timeout);
      if (chart) chart.delete();
      reject(err);
    }
  });
}

export { analyze, getHistory, getMarketStatus };
export default { analyze, getHistory, getMarketStatus };
