const config = require('../config');
const indicators = require('./indicators');

function calculateScore(data, strategy) {
  let score = 50;
  let reasons = [];

  // 1. Stochastic RSI + Crossover (30%)
  if (data.stochK < 20) {
    score += 15;
    if (data.stochPrevK < data.stochPrevD && data.stochK > data.stochD) {
      score += 20; 
      reasons.push('Golden Cross StochRSI');
    } else {
      reasons.push('StochRSI Oversold');
    }
  } else if (data.stochK > 80) {
    score -= 30;
    reasons.push('StochRSI Overbought');
  }

  // 2. Trend Filter (30%)
  if (data.ema20 > data.ema50) {
    score += 15;
    if (data.price > data.ema20) score += 10;
  } else {
    score -= 25; // Strong Downtrend
    reasons.push('Tren Menurun (EMA20 < EMA50)');
  }

  // 3. MACD Momentum (20%)
  const macd = indicators.calculateMACD(data.rawHistory);
  if (macd.hist > 0) {
    score += 15;
    reasons.push('Momentum MACD Positif');
  }

  // 4. Price Action Support (20%)
  const distToSupport = (data.price - data.support) / data.support;
  if (distToSupport < 0.03) {
    score += 10;
    reasons.push('Dekat Support Kuat');
  }

  return { total: Math.min(Math.max(score, 0), 100), reasons: reasons.slice(0, 3) };
}

function getCategory(score) {
  if (score >= 90) return { label: '💎 STRONG BUY', color: '🟩' };
  if (score >= 75) return { label: '✅ BUY', color: '🍀' };
  if (score >= 40) return { label: '⚖️ NEUTRAL', color: '🟡' };
  if (score >= 20) return { label: '⚠️ SELL', color: '🟠' };
  return { label: '🚨 STRONG SELL', color: '🟥' };
}

function formatDualAnalysis(ticker, scalpData, swingData) {
  // Tambahkan rawHistory ke data agar bisa hitung MACD di calculateScore
  const scalpScore = calculateScore(scalpData, config.thresholds.scalp);
  const swingScore = calculateScore(swingData, config.thresholds.swing);

  let recommendation = "BELUM ADA MOMENTUM";
  let recEmoji = "⚖️";
  let bestData = swingData;
  let bestStrategy = config.thresholds.swing;
  let bestScore = swingScore;

  if (scalpScore.total >= 75 || swingScore.total >= 75) {
    if (swingScore.total >= scalpScore.total) {
      recommendation = "COCOK UNTUK SWING";
      recEmoji = "📈";
    } else {
      recommendation = "COCOK UNTUK SCALPING";
      recEmoji = "🚀";
      bestData = scalpData;
      bestStrategy = config.thresholds.scalp;
      bestScore = scalpScore;
    }
  }

  const category = getCategory(bestScore.total);
  const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  const scoreBar = '💊'.repeat(Math.round(bestScore.total / 10)) + '⚪'.repeat(10 - Math.round(bestScore.total / 10));

  let msg = `${category.color} *${category.label} — $${ticker.toUpperCase()}*\n` +
            `🎯 *REKOMENDASI: ${recommendation}* ${recEmoji}\n\n` +
            `💰 *Harga:* Rp ${bestData.price.toLocaleString('id-ID')}\n` +
            `📊 *Technical Score:* \`${bestScore.total}/100\`\n` +
            `\`[${scoreBar}]\`\n\n`;

  if (bestScore.total >= 75) {
    const entry = bestData.price;
    const sl = Math.floor(entry * (1 - bestStrategy.risk.sl));
    const tp1 = Math.floor(entry * (1 + bestStrategy.risk.tp1));
    const tp2 = Math.floor(entry * (1 + bestStrategy.risk.tp2));
    
    msg += `🚀 *TRADING PLAN:* (${bestStrategy.timeframe === 'D' ? 'Swing' : 'Scalp'})\n` +
           `• *Entry:* \`Rp ${entry.toLocaleString('id-ID')}\`\n` +
           `• *TP 1:* \`Rp ${tp1.toLocaleString('id-ID')}\` (+${(bestStrategy.risk.tp1*100).toFixed(0)}%)\n` +
           `• *TP 2:* \`Rp ${tp2.toLocaleString('id-ID')}\` (+${(bestStrategy.risk.tp2*100).toFixed(0)}%)\n` +
           `• *Stop Loss:* \`Rp ${sl.toLocaleString('id-ID')}\` (-${(bestStrategy.risk.sl*100).toFixed(0)}%)\n\n`;
  }

  msg += `📝 *Alasan:* \n${bestScore.reasons.map(r => `• ${r}`).join('\n')}\n\n` +
         `🔍 *Detil Analisa:* \n` +
         `• StochRSI: \`${bestData.stochK.toFixed(1)}\` \n` +
         `• Support: \`Rp ${bestData.support.toLocaleString('id-ID')}\` \n` +
         `• Momentum: \`MACD Filtered\` \n\n` +
         `🕒 _${time} WIB_`;

  return msg;
}

module.exports = { formatDualAnalysis };
