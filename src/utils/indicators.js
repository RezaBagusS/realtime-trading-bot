/**
 * Indicators Utility v2
 * Menghitung indikator teknikal dengan Smoothing (3,3).
 */

function calculateRSI(data, period = 14) {
  if (data.length <= period) return null;
  let gains = 0, losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff; else losses -= diff;
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

  return avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
}

function calculateStochRSI(data, period = 14, smoothK = 3, smoothD = 3) {
  if (data.length < period * 2) return { k: 50, d: 50 };

  // 1. Hitung History RSI
  const rsiHistory = [];
  for (let i = period; i <= data.length; i++) {
    const rsi = calculateRSI(data.slice(0, i), period);
    if (rsi !== null) rsiHistory.push(rsi);
  }

  // 2. Hitung History Stoch (Raw)
  const stochRaw = [];
  for (let i = period; i <= rsiHistory.length; i++) {
    const slice = rsiHistory.slice(i - period, i);
    const high = Math.max(...slice);
    const low = Math.min(...slice);
    const current = rsiHistory[i - 1];
    stochRaw.push(high === low ? 0 : ((current - low) / (high - low)) * 100);
  }

  // 3. Smoothing K (SMA dari Raw)
  const kHistory = [];
  for (let i = smoothK; i <= stochRaw.length; i++) {
    const smaK = stochRaw.slice(i - smoothK, i).reduce((a, b) => a + b, 0) / smoothK;
    kHistory.push(smaK);
  }

  // 4. Smoothing D (SMA dari K)
  const k = kHistory[kHistory.length - 1] || 0;
  const d = kHistory.slice(-smoothD).reduce((a, b) => a + b, 0) / smoothD;

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
