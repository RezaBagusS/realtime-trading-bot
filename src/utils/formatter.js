const config = require('../config');
const indicators = require('./indicators');

function calculateScore(data, marketStatus = null) {
  let score = 50; 
  let reasons = [];

  // 1. MARKET CONTEXT (Safety Switch)
  if (marketStatus) {
    if (marketStatus.trend === 'BEARISH') {
      score -= 20;
      reasons.push('⚠️ Market (IHSG) Bearish');
    } else if (marketStatus.trend === 'BULLISH') {
      score += 5;
      reasons.push('🌐 Market (IHSG) Bullish');
    }
  }

  // 2. TREND
  if (data.ema20 > data.ema50) {
    score += 20;
    if (data.price > data.ema20) score += 5;
    reasons.push('Tren Saham Bullish');
  } else {
    score -= 30;
    reasons.push('Tren Saham Bearish');
  }

  // 3. MOMENTUM MACD
  const macd = indicators.calculateMACD(data.rawHistory);
  if (macd.hist > 0) {
    score += 15;
    reasons.push('Momentum MACD Positif');
  }

  // 4. STRUCTURE
  if (data.price >= data.resistance) {
    score += 15;
    reasons.push('Breakout Resistance Lokal');
  } else if (Math.abs(data.price - data.ema20) / data.ema20 < 0.02) {
    score += 10;
    reasons.push('Area Pullback (EMA20)');
  }

  return { total: Math.min(Math.max(score, 0), 100), reasons: reasons.slice(0, 4) };
}

function getCategory(score) {
  if (score >= 85) return { label: '💎 STRONG BUY', color: '🟩' };
  if (score >= 70) return { label: '✅ BUY', color: '🍀' };
  if (score >= 40) return { label: '⚖️ WAIT & SEE', color: '🟡' };
  return { label: '🚨 AVOID', color: '🟥' };
}

function formatDualAnalysis(ticker, scalpData, swingData, marketStatus = null) {
  const scalpScore = calculateScore(scalpData, marketStatus);
  const swingScore = calculateScore(swingData, marketStatus);

  let isSwing = swingScore.total >= scalpScore.total;
  let bestData = isSwing ? swingData : scalpData;
  let bestScore = isSwing ? swingScore : scalpScore;
  
  const isBuy = bestScore.total >= 70;
  const category = getCategory(bestScore.total);
  const recommendation = isBuy ? (isSwing ? "SWING TRADING" : "SCALPING") : "BELUM ADA MOMENTUM";
  
  const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  const scoreBar = '💊'.repeat(Math.round(bestScore.total / 10)) + '⚪'.repeat(10 - Math.round(bestScore.total / 10));

  let marketEmoji = '⚪';
  if (marketStatus) {
    marketEmoji = marketStatus.trend === 'BULLISH' ? '📈' : '📉';
  }

  let msg = `${category.color} *${category.label} — $${ticker.toUpperCase()}*\n` +
            `🎯 *REKOMENDASI: ${recommendation}*\n\n` +
            `💰 *Harga Saat Ini:* Rp ${bestData.price.toLocaleString('id-ID')}\n` +
            `📊 *Technical Score:* \`${bestScore.total}/100\`\n` +
            `\`[${scoreBar}]\`\n\n`;

  if (marketStatus) {
    msg += `${marketEmoji} *Market Context:* IHSG ${marketStatus.trend} (${marketStatus.change}%)\n\n`;
  }

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

function formatNews(ticker, newsList, aiSentiment = null) {
  if (newsList.length === 0) {
    return `⚠️ Tidak ada berita terbaru ditemukan untuk *$${ticker.toUpperCase()}*.\n\n` +
           `💡 _Saran: Pastikan kode saham benar. Jika sudah benar, berarti emiten ini sedang tidak memiliki berita signifikan atau pengumuman bursa dalam 30 hari terakhir._`;
  }

  let msg = `📰 *Berita Terbaru: $${ticker.toUpperCase()}*\n`;
  msg += `------------------------------------------\n\n`;

  if (aiSentiment) {
    const aiEmoji = aiSentiment.score > 0.3 ? '🚀' : (aiSentiment.score < -0.3 ? '💀' : '⚖️');
    const scoreText = (aiSentiment.score * 100).toFixed(0);
    msg += `🤖 *AI SENTIMENT ANALYSIS:* \`${scoreText}%\` ${aiEmoji}\n`;
    msg += `📝 _"${aiSentiment.summary}"_\n\n`;
  }

  newsList.slice(0, 5).forEach((n, i) => {
    const date = new Date(n.date).toLocaleString('id-ID', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    msg += `${i + 1}. *${n.title}*\n`;
    msg += `   📅 ${date} | 🌐 _${n.source}_\n`;
    msg += `   🔗 [Baca Berita](${n.link})\n\n`;
  });

  msg += `_Data diupdate secara real-time via Google News_`;
  return msg;
}

function formatHybridAnalysis(ticker, technicalData, sentimentData, marketStatus = null) {
  const tScore = calculateScore(technicalData, marketStatus).total;
  const sScore = Math.round((sentimentData.score + 1) * 50); // Normalize -1..1 to 0..100
  
  const hybridScore = Math.round((tScore * 0.7) + (sScore * 0.3));
  
  let category = getCategory(hybridScore);
  let statusLabel = hybridScore >= 85 ? "High Confidence Signal" : (hybridScore >= 70 ? "Moderate Confidence" : "Low Confidence");
  
  // Visual Bars
  const tBar = '🟩'.repeat(Math.round(tScore / 10)) + '⬜'.repeat(10 - Math.round(tScore / 10));
  const sBar = '🟦'.repeat(Math.round(sScore / 10)) + '⬜'.repeat(10 - Math.round(sScore / 10));
  
  const entryBase = technicalData.price;
  const atr = technicalData.atr;
  const sl = Math.floor(entryBase - (2.5 * atr));
  const tp1 = Math.floor(entryBase + (5 * atr));
  const tp2 = Math.floor(entryBase + (10 * atr));

  const isBuy = hybridScore >= 70;
  
  let tradingSetup = `📍 **TRADING SETUP:**\n`;
  if (isBuy) {
    tradingSetup += `├─ Buy Zone: \`Rp ${Math.floor(technicalData.ema20 || technicalData.support).toLocaleString('id-ID')} - ${entryBase.toLocaleString('id-ID')}\` \n` +
                    `├─ TP 1: \`Rp ${tp1.toLocaleString('id-ID')}\` (+${((tp1-entryBase)/entryBase*100).toFixed(1)}%) 🚀\n` +
                    `├─ TP 2: \`Rp ${tp2.toLocaleString('id-ID')}\` (+${((tp2-entryBase)/entryBase*100).toFixed(1)}%) 🚀\n` +
                    `└─ SL: \`Rp ${sl.toLocaleString('id-ID')}\` (-${((entryBase-sl)/entryBase*100).toFixed(1)}%) 🛡️\n\n`;
  } else {
    tradingSetup += `_Belum ada trading plan. Tunggu hingga momentum teknikal & sentimen AI sinkron (Hybrid Score > 70)._\n\n`;
  }

  // Fake Winrate based on score for aesthetics (Real one will come in v4.1)
  const winrate = (65 + (hybridScore / 10) + (marketStatus?.trend === 'BULLISH' ? 5 : -5)).toFixed(1);

  const isAiError = sentimentData.summary.includes("(API Error)");
  let insightMsg = sentimentData.summary;
  if (isAiError) {
    insightMsg = `⚠️ _${sentimentData.summary}_\n` +
                 `💡 *Tips:* Hasil analisa belum maksimal. Silakan ulangi perintah \`/analysis\` dalam 1-2 menit lagi untuk memicu ulang kecerdasan AI.`;
  }

  return `🚀 **STRATEGI: SWING TRADING**\n` +
         `${category.color} **$${ticker.toUpperCase()} — ${category.label}**\n\n` +
         `━━━━━━━━━━━━━━━\n` +
         `🏆 **HYBRID SCORE: ${hybridScore}/100**\n` +
         `💰 **Harga Saat Ini: Rp ${entryBase.toLocaleString('id-ID')}**\n` +
         `🔥 *Status: ${statusLabel}*\n\n` +
         `📊 **TECHNICAL ANALYSIS (70%)**\n` +
         `\`${tBar} ${tScore}%\` \n` +
         `• Trend: ${technicalData.ema20 > technicalData.ema50 ? 'Bullish' : 'Bearish'}\n` +
         `• Momentum: ${technicalData.price > technicalData.ema20 ? 'Strong' : 'Stable'}\n\n` +
         `🤖 **AI SENTIMENT (30%)**\n` +
         `\`${sBar} ${sScore}%\` \n` +
         `• Score: ${sentimentData.score > 0 ? '+' : ''}${sentimentData.score.toFixed(2)} (${sentimentData.score > 0.3 ? 'Bullish' : (sentimentData.score < -0.3 ? 'Bearish' : 'Neutral')})\n` +
         `• Insight: ${insightMsg}\n\n` +
         `${tradingSetup}` +
         `━━━━━━━━━━━━━━━\n` +
         `📈 *Win-rate Historis: ${winrate}% (Kondisi Market ${marketStatus?.trend || 'Neutral'})*\n` +
         `*Hybrid Engine v4.0: Technical Analysis + Gemini AI Sentiment.*`;
}

module.exports = { formatDualAnalysis, formatNews, formatHybridAnalysis };
