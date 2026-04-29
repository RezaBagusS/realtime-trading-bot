const config = require('../config');
const indicators = require('./indicators');

function calculateScore(data) {
  let score = 50; 
  let reasons = [];

  // 1. TREND
  if (data.ema20 > data.ema50) {
    score += 20;
    if (data.price > data.ema20) score += 5;
    reasons.push('Tren Bullish (EMA20 > EMA50)');
  } else {
    score -= 30;
    reasons.push('Tren Bearish');
  }

  // 2. MOMENTUM MACD
  const macd = indicators.calculateMACD(data.rawHistory);
  if (macd.hist > 0) {
    score += 15;
    reasons.push('Momentum MACD Positif');
  }

  // 3. STRUCTURE
  if (data.price >= data.resistance) {
    score += 15;
    reasons.push('Breakout Resistance Lokal');
  } else if (Math.abs(data.price - data.ema20) / data.ema20 < 0.02) {
    score += 10;
    reasons.push('Area Pullback (Dekat EMA20)');
  }

  return { total: Math.min(Math.max(score, 0), 100), reasons: reasons.slice(0, 3) };
}

function getCategory(score) {
  if (score >= 85) return { label: '💎 STRONG BUY', color: '🟩' };
  if (score >= 70) return { label: '✅ BUY', color: '🍀' };
  if (score >= 40) return { label: '⚖️ WAIT & SEE', color: '🟡' };
  return { label: '🚨 AVOID', color: '🟥' }; // Mengganti SELL menjadi AVOID
}

function formatDualAnalysis(ticker, scalpData, swingData) {
  const scalpScore = calculateScore(scalpData);
  const swingScore = calculateScore(swingData);

  let isSwing = swingScore.total >= scalpScore.total;
  let bestData = isSwing ? swingData : scalpData;
  let bestScore = isSwing ? swingScore : scalpScore;
  
  const isBuy = bestScore.total >= 70;
  const category = getCategory(bestScore.total);
  const recommendation = isBuy ? (isSwing ? "SWING TRADING" : "SCALPING") : "BELUM ADA MOMENTUM";
  
  const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  const scoreBar = '💊'.repeat(Math.round(bestScore.total / 10)) + '⚪'.repeat(10 - Math.round(bestScore.total / 10));

  let msg = `${category.color} *${category.label} — $${ticker.toUpperCase()}*\n` +
            `🎯 *REKOMENDASI: ${recommendation}*\n\n` +
            `💰 *Harga Saat Ini:* Rp ${bestData.price.toLocaleString('id-ID')}\n` +
            `📊 *Technical Score:* \`${bestScore.total}/100\`\n` +
            `\`[${scoreBar}]\`\n\n`;

  if (isBuy) {
    const entryBase = bestData.price;
    const atr = bestData.atr;
    let sl, tp1, tp2, advice, area;

    if (isSwing) {
      sl = Math.floor(entryBase - (2.5 * atr));
      tp1 = Math.floor(entryBase + (5 * atr));
      tp2 = Math.floor(entryBase + (10 * atr));
      advice = bestData.price >= bestData.resistance ? "Buy on Breakout" : "Buy on Weakness";
      area = `Rp ${Math.floor(bestData.ema20 || bestData.support).toLocaleString('id-ID')} - Rp ${entryBase.toLocaleString('id-ID')}`;
    } else {
      sl = Math.floor(entryBase - (1.5 * atr));
      tp1 = Math.floor(entryBase + (2 * atr));
      tp2 = Math.floor(entryBase + (4 * atr));
      advice = "Fast Entry (Momentum)";
      area = `Rp ${entryBase.toLocaleString('id-ID')}`;
    }
    
    msg += `🚀 *ADAPTIVE PLAN:*\n` +
           `💡 *Advice:* ${advice}\n` +
           `📍 *Area Entry:* \`${area}\`\n` +
           `🎯 *TP 1:* \`Rp ${tp1.toLocaleString('id-ID')}\` (+${((tp1-entryBase)/entryBase*100).toFixed(1)}%)\n` +
           `🎯 *TP 2:* \`Rp ${tp2.toLocaleString('id-ID')}\` (+${((tp2-entryBase)/entryBase*100).toFixed(1)}%)\n` +
           `🛡️ *Stop Loss:* \`Rp ${sl.toLocaleString('id-ID')}\` (-${((entryBase-sl)/entryBase*100).toFixed(1)}%)\n\n`;
  }

  msg += `📝 *Alasan:* \n${bestScore.reasons.map(r => `• ${r}`).join('\n')}\n\n` +
         `🔍 *Detil:* \n` +
         `• Resist Lokal: \`Rp ${bestData.resistance.toLocaleString('id-ID')}\` \n` +
         `• ATR: \`Rp ${bestData.atr.toFixed(0)}\` \n\n` +
         `🕒 _${time} WIB_`;

  return msg;
}

module.exports = { formatDualAnalysis };
