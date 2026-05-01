/**
 * Indicators Utility v8
 * Memperbaiki akses properti high/low untuk perhitungan ATR.
 */

function calculateEMA(data, period) {
  const prices = Array.isArray(data[0]) ? data : data.map(d => typeof d === 'number' ? d : (d.close || d.price));
  if (prices.length < period) return 0;
  
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] * k) + (ema * (1 - k));
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
  if (data.length < 35) return { macd: 0, signal: 0, hist: 0, crossover: false };
  
  const ema12Arr = [];
  const ema26Arr = [];
  const macdArr = [];
  
  // Calculate MACD Line series
  for (let i = 26; i <= data.length; i++) {
    const subset = data.slice(0, i);
    const e12 = calculateEMA(subset, 12);
    const e26 = calculateEMA(subset, 26);
    macdArr.push(e12 - e26);
  }
  
  const macdLine = macdArr[macdArr.length - 1];
  const signalLine = calculateEMA(macdArr, 9);
  const hist = macdLine - signalLine;
  
  // Check Crossover (MACD crosses Signal)
  const prevMacdLine = macdArr[macdArr.length - 2];
  const prevSignalLine = calculateEMA(macdArr.slice(0, -1), 9);
  const crossover = (prevMacdLine <= prevSignalLine && macdLine > signalLine);
  
  return { macd: macdLine, signal: signalLine, hist, crossover };
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

function calculateStochRSI(data, period = 14, smoothK = 3, smoothD = 3) {
  if (data.length < period + smoothK + smoothD) return { k: 50, d: 50, crossover: false };
  
  const kValues = [];
  // Calculate %K series
  for (let j = 0; j < (smoothK + smoothD); j++) {
    const offset = data.length - j;
    const rsis = [];
    for (let i = offset - period; i <= offset; i++) {
      rsis.push(calculateRSI(data.slice(0, i), period));
    }
    const lowRSI = Math.min(...rsis);
    const highRSI = Math.max(...rsis);
    const currentRSI = rsis[rsis.length - 1];
    const rawK = highRSI === lowRSI ? 0 : ((currentRSI - lowRSI) / (highRSI - lowRSI)) * 100;
    kValues.push(rawK);
  }
  
  kValues.reverse(); // Bring back to chronological order
  const k = calculateEMA(kValues.slice(-smoothK), smoothK);
  const d = calculateEMA(kValues, smoothD);
  
  const crossover = kValues[kValues.length - 2] < d && k > d; // Bullish cross
  
  return { k, d, crossover };
}

function findSupportResistance(data) {
  const prices = data.map(d => d.close || d.price);
  const last50 = prices.slice(-50);
  const last250 = prices.slice(-250); // Sekitar 1 tahun bursa
  
  const localHigh = Math.max(...last50);
  const localLow = Math.min(...last50);
  const annualHigh = Math.max(...last250);
  
  // Jika harga saat ini mendekati ATH (All Time High / 1 Year High)
  const currentPrice = prices[prices.length - 1];
  const isATH = currentPrice >= annualHigh * 0.98;
  
  return {
    resistance: isATH ? annualHigh * 1.1 : localHigh, // Beri buffer jika ATH
    support: localLow,
    isATH: isATH
  };
}

/**
 * Mengklasifikasikan tipe saham untuk bobot analisa
 */
function getTickerType(ticker) {
  const lq45 = ['BBCA', 'BBRI', 'BMRI', 'BBNI', 'ASII', 'TLKM', 'GOTO', 'UNVR', 'ICBP', 'PGAS', 'ADRO', 'ITMG', 'PTBA', 'ANTM', 'INCO', 'BRPT', 'CPIN', 'KLBF'];
  
  const t = ticker.toUpperCase();
  if (lq45.includes(t)) return 'BLUECHIP';
  if (t.includes('-W') || t.length > 4) return 'SPECULATIVE';
  return 'REGULAR';
}

export { 
  calculateEMA, 
  calculateATR, 
  calculateMACD, 
  calculateRSI, 
  calculateStochRSI, 
  findSupportResistance,
  getTickerType 
};
