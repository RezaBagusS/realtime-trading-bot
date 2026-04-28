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
      reject(new Error(`Timeout ${strategy.name}`));
    }, 25000);

    let chart;
    let results = { rsi: null, price: null, volume: null, prevClose: null, avgVol: null };

    try {
      const tvClient = getClient();
      chart = new tvClient.Session.Chart();
      
      chart.setMarket(symbol, { timeframe: strategy.timeframe, range: 150 });

      const rsiInd = await TradingView.getIndicator('STD;RSI');
      rsiInd.setOption('in_0', strategy.rsi_length);
      const RSI_Study = new chart.Study(rsiInd);

      const checkReady = () => {
        if (results.rsi !== null && results.price !== null) {
          const chronData = [...chart.periods].reverse();
          const final = {
            ...results,
            ema20: calculateEMA(chronData, 20),
            ema50: calculateEMA(chronData, 50),
            timeframe: strategy.timeframe,
            strategyName: strategy.name
          };
          clearTimeout(timeout);
          chart.delete();
          resolve(final);
        }
      };

      RSI_Study.onUpdate(() => {
        const val = RSI_Study.periods[0]?.RSI ?? RSI_Study.periods[0]?.plot_0;
        if (val !== undefined) { results.rsi = val; checkReady(); }
      });

      chart.onUpdate(() => {
        if (chart.periods.length > 1) {
          const candles = chart.periods;
          results.price = candles[0].close;
          results.volume = candles[0].volume;
          results.prevClose = candles[1].close;
          results.avgVol = candles.slice(0, 20).reduce((s, c) => s + (c.volume || 0), 0) / 20;
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
