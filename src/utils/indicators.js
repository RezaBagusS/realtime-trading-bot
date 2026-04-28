/**
 * Indicators Utility
 * Menghitung indikator teknikal secara lokal untuk efisiensi.
 */

function calculateRSI(data, period = 14) {
  if (data.length <= period) return null;
  
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateStochRSI(data, period = 14) {
  if (data.length < period * 2) return { k: 0, d: 0 };

  const rsiHistory = [];
  for (let i = period; i <= data.length; i++) {
    const rsi = calculateRSI(data.slice(0, i), period);
    if (rsi !== null) rsiHistory.push(rsi);
  }

  const stochHistory = [];
  const lookback = period;
  
  for (let i = lookback; i <= rsiHistory.length; i++) {
    const slice = rsiHistory.slice(i - lookback, i);
    const high = Math.max(...slice);
    const low = Math.min(...slice);
    const current = rsiHistory[i - 1];
    
    const stoch = high === low ? 0 : ((current - low) / (high - low)) * 100;
    stochHistory.push(stoch);
  }

  // K = SMA 3 dari Stoch
  const k = stochHistory.slice(-3).reduce((a, b) => a + b, 0) / 3;
  // D = SMA 3 dari K
  const d = k; // Sederhana untuk saat ini

  return { k, d };
}

function findSupportResistance(data) {
  const prices = data.map(d => d.close);
  return {
    resistance: Math.max(...prices),
    support: Math.min(...prices)
  };
}

module.exports = { calculateRSI, calculateStochRSI, findSupportResistance };
