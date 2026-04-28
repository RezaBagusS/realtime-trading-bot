const config = require('../config');

function calculateScore(data, strategy) {
  let score = 50;
  let reasons = [];

  // 1. Stochastic RSI Score (Ganti RSI)
  if (data.stochK < 20) {
    score += 30;
    reasons.push('StochRSI Oversold (Pantulan)');
  } else if (data.stochK > 80) {
    score -= 30;
    reasons.push('StochRSI Overbought (Jenuh)');
  }

  // 2. Trend Score
  if (data.price > data.ema20) score += 10;
  if (data.ema20 > data.ema50) score += 10;

  // 3. Price Action (Support/Resistance)
  const distToSupport = (data.price - data.support) / data.support;
  const distToResist = (data.resistance - data.price) / data.price;

  if (distToSupport < 0.03) {
    score += 15;
    reasons.push('Dekat Support Kuat');
  }
  if (distToResist < 0.02) {
    score -= 20;
    reasons.push('Dekat Resistance (Rawan Koreksi)');
  }

  // 4. Volume
  if (data.volume > data.avgVol * 1.5) score += 15;

  return { total: Math.min(Math.max(score, 0), 100), reasons: reasons.slice(0, 3) };
}

function getCategory(score) {
  if (score >= 90) return { label: '💎 STRONG BUY', color: '🟩' };
  if (score >= 70) return { label: '✅ BUY', color: '🍀' };
  if (score >= 40) return { label: '⚖️ NEUTRAL', color: '🟡' };
  if (score >= 20) return { label: '⚠️ SELL', color: '🟠' };
  return { label: '🚨 STRONG SELL', color: '🟥' };
}

function formatDualAnalysis(ticker, scalpData, swingData) {
  const scalpScore = calculateScore(scalpData, config.thresholds.scalp);
  const swingScore = calculateScore(swingData, config.thresholds.swing);

  let recommendation = "BELUM ADA MOMENTUM";
  let recEmoji = "⚖️";
  let bestData = swingData;
  let bestStrategy = config.thresholds.swing;
  let bestScore = swingScore;

  if (scalpScore.total >= 70 || swingScore.total >= 70) {
    if (swingScore.total >= scalpScore.total) {
      recommendation = "COCOK UNTUK SWING (JANGKA PANJANG)";
      recEmoji = "📈";
    } else {
      recommendation = "COCOK UNTUK SCALPING (CEPAT)";
      recEmoji = "🚀";
      bestData = scalpData;
      bestStrategy = config.thresholds.scalp;
      bestScore = scalpScore;
    }
  }

  const category = getCategory(bestScore.total);
  const entry = bestData.price;
  const sl = Math.floor(entry * (1 - bestStrategy.risk.sl));
  const tp1 = Math.floor(entry * (1 + bestStrategy.risk.tp1));
  const tp2 = Math.floor(entry * (1 + bestStrategy.risk.tp2));
  
  const barCount = Math.round(bestScore.total / 10);
  const scoreBar = '💊'.repeat(barCount) + '⚪'.repeat(10 - barCount);
  const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  let msg = `${category.color} *${category.label} — $${ticker.toUpperCase()}*\n` +
            `🎯 *REKOMENDASI: ${recommendation}* ${recEmoji}\n\n` +
            `💰 *Harga:* Rp ${bestData.price.toLocaleString('id-ID')}\n` +
            `📊 *Technical Score:* \`${bestScore.total}/100\`\n` +
            `\`[${scoreBar}]\`\n\n`;

  if (bestScore.total >= 70) {
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
         `• Resist: \`Rp ${bestData.resistance.toLocaleString('id-ID')}\` \n` +
         `• Scalp: \`${scalpScore.total}\` | Swing: \`${swingScore.total}\` \n\n` +
         `🕒 _${time} WIB_`;

  return msg;
}

module.exports = { formatDualAnalysis };
