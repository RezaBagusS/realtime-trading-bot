const TradingView = require('@mathieuc/tradingview');
const config = require('../config');
const logger = require('../utils/logger');

let client = null;
let rsiIndicatorCache = null;

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
    const timeout = setTimeout(() => reject(new Error('Timeout data TradingView')), 15000);

    try {
      const tvClient = getClient();
      const chart = new tvClient.Session.Chart();
      
      chart.onError((err) => {
        clearTimeout(timeout);
        chart.delete();
        reject(new Error(`Ticker ${ticker} tidak ditemukan`));
      });

      chart.setMarket(symbol, { timeframe: strategy.timeframe, range: 20 });

      const rsiIndicator = await TradingView.getIndicator('STD;RSI');
      rsiIndicator.setOption('in_0', strategy.rsi_length);
      
      const RSI_Study = new chart.Study(rsiIndicator);

      RSI_Study.onUpdate(() => {
        const period = RSI_Study.periods[0];
        if (!period) return;

        const rsi = period['RSI'] ?? period['plot_0'];
        const price = chart.periods[0]?.close;

        if (rsi !== undefined) {
          clearTimeout(timeout);
          chart.delete();
          resolve({ rsi, price });
        }
      });
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });
}

module.exports = { analyze };
