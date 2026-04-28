const config = require('../config');

function calculateScore(data, strategy) {
  let score = 50;
  let reasons = [];

  if (data.rsi < strategy.oversold) { score += 25; reasons.push('RSI Murah (Oversold)'); }
  else if (data.rsi > strategy.overbought) { score -= 25; reasons.push('RSI Jenuh Beli'); }

  if (data.price > data.ema20) { score += 10; reasons.push('Harga di atas EMA 20'); }
  if (data.ema20 > data.ema50) { score += 10; reasons.push('Golden Cross EMA'); }
  if (data.volume > data.avgVol * 1.5) { score += 15; reasons.push('Volume Akumulasi'); }

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

  // Tentukan Rekomendasi
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
         `🔍 *Detil Skor:* \n` +
         `• Scalp (1H): \`${scalpScore.total}\` | Swing (D): \`${swingScore.total}\` \n\n` +
         `🕒 _${time} WIB_`;

  return msg;
}

module.exports = { formatDualAnalysis };
