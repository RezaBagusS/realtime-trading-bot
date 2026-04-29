/**
 * Indicators Utility v8
 * Memperbaiki akses properti high/low untuk perhitungan ATR.
 */

function calculateEMA(data, period) {
  if (data.length < period) return 0;
  const k = 2 / (period + 1);
  let ema = data[0].close || data[0].price;
  for (let i = 1; i < data.length; i++) {
    const price = data[i].close || data[i].price;
    ema = (price * k) + (ema * (1 - k));
  }
  return ema;
}

function calculateATR(data, period = 14) {
  if (data.length <= period) return 0;
  let trSum = 0;
  const start = data.length - period;
  for (let i = start; i < data.length; i++) {
    const high = data[i].high || data[i].close; // Fallback ke close jika high hilang
    const low = data[i].low || data[i].close;
    const prevClose = data[i - 1].close || data[i - 1].price;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trSum += tr;
  }
  return trSum / period;
}

function calculateMACD(data) {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macdLine = ema12 - ema26;
  return { hist: macdLine > 0 ? 1 : -1 };
}

function calculateRSI(data, period = 14) {
  if (data.length <= period) return 50;
  let gains = 0, losses = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const price = data[i].close || data[i].price;
    const prevPrice = data[i - 1].close || data[i - 1].price;
    const diff = price - prevPrice;
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const rs = gains / (losses || 1);
  return 100 - (100 / (1 + rs));
}

function calculateStochRSI(data, period = 14) {
  if (data.length < period * 2) return { k: 50, d: 50, divergence: false };
  const rsis = [];
  for (let i = data.length - period; i <= data.length; i++) {
    rsis.push(calculateRSI(data.slice(0, i), period));
  }
  const lowRSI = Math.min(...rsis);
  const highRSI = Math.max(...rsis);
  const currentRSI = rsis[rsis.length - 1];
  const k = highRSI === lowRSI ? 0 : ((currentRSI - lowRSI) / (highRSI - lowRSI)) * 100;
  return { k, d: k, divergence: false };
}

function findSupportResistance(data) {
  const last20 = data.slice(-20).map(d => d.close || d.price);
  return {
    resistance: Math.max(...last20),
    support: Math.min(...last20)
  };
}

module.exports = { calculateEMA, calculateATR, calculateMACD, calculateRSI, calculateStochRSI, findSupportResistance };
