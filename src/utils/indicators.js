/**
 * Indicators Utility v3
 * Menambahkan MACD & StochRSI Golden Cross logic.
 */

function calculateEMA(data, period) {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((s, c) => s + c.close, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close * k) + (ema * (1 - k));
  }
  return ema;
}

function calculateMACD(data) {
  if (data.length < 26 + 9) return { macd: 0, signal: 0, hist: 0 };
  
  // Hitung EMA 12 dan EMA 26
  const ema12History = [];
  const ema26History = [];
  
  for (let i = 26; i <= data.length; i++) {
    const slice = data.slice(0, i);
    ema12History.push(calculateEMA(slice, 12));
    ema26History.push(calculateEMA(slice, 26));
  }

  const macdLine = ema12History.map((e12, idx) => e12 - ema26History[idx]);
  
  // Signal Line (EMA 9 dari MACD Line)
  const k = 2 / (9 + 1);
  let signalLine = macdLine.slice(0, 9).reduce((a, b) => a + b, 0) / 9;
  for (let i = 9; i < macdLine.length; i++) {
    signalLine = (macdLine[i] * k) + (signalLine * (1 - k));
  }

  const currentMACD = macdLine[macdLine.length - 1];
  return {
    macd: currentMACD,
    signal: signalLine,
    hist: currentMACD - signalLine
  };
}

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
  const rsiHistory = [];
  for (let i = period; i <= data.length; i++) {
    const rsi = calculateRSI(data.slice(0, i), period);
    if (rsi !== null) rsiHistory.push(rsi);
  }
  const stochRaw = [];
  for (let i = period; i <= rsiHistory.length; i++) {
    const slice = rsiHistory.slice(i - period, i);
    const high = Math.max(...slice);
    const low = Math.min(...slice);
    const current = rsiHistory[i - 1];
    stochRaw.push(high === low ? 0 : ((current - low) / (high - low)) * 100);
  }
  const kHistory = [];
  for (let i = smoothK; i <= stochRaw.length; i++) {
    kHistory.push(stochRaw.slice(i - smoothK, i).reduce((a, b) => a + b, 0) / smoothK);
  }
  const k = kHistory[kHistory.length - 1] || 0;
  const prevK = kHistory[kHistory.length - 2] || 0;
  const d = kHistory.slice(-smoothD).reduce((a, b) => a + b, 0) / smoothD;
  const prevD = kHistory.slice(-smoothD - 1, -1).reduce((a, b) => a + b, 0) / smoothD;

  return { k, d, prevK, prevD };
}

function findSupportResistance(data) {
  const prices = data.map(d => d.close);
  return { resistance: Math.max(...prices), support: Math.min(...prices) };
}

module.exports = { calculateEMA, calculateMACD, calculateRSI, calculateStochRSI, findSupportResistance };
