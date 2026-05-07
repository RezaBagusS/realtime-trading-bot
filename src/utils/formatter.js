import * as indicators from './indicators.js';
import dbService from '../services/database.js';

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
    score += 10;
    reasons.push('Momentum MACD Positif');
  }
  if (macd.crossover) {
    score += 15;
    reasons.push('🔥 MACD Bullish Cross');
  }

  // 4. MOMENTUM STOCHRSI
  const stoch = indicators.calculateStochRSI(data.rawHistory);
  if (stoch.k < 20) {
    score += 5;
    reasons.push('StochRSI Oversold');
  }
  if (stoch.crossover) {
    score += 10;
    reasons.push('⚡ StochRSI Goldencross');
  }

  // 5. STRUCTURE
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

    const entryFloor = Math.floor(bestData.ema20 || bestData.support);
    const entryCeiling = entryBase;

    if (isSwing) {
      sl = Math.floor(entryFloor - (1.5 * atr));
      tp1 = Math.floor(entryCeiling + (5 * atr));
      tp2 = Math.floor(entryCeiling + (10 * atr));
      advice = bestData.price >= bestData.resistance ? "Buy on Breakout" : "Buy on Weakness";
      area = `Rp ${entryFloor.toLocaleString('id-ID')} - Rp ${entryCeiling.toLocaleString('id-ID')}`;
    } else {
      sl = Math.floor(entryBase - (2 * atr));
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

async function formatHybridAnalysis(ticker, technicalData, sentimentData, marketStatus = null, userSettings = null) {
  const type = indicators.getTickerType(ticker);
  
  // Penentuan Bobot Dinamis
  let tWeight = 0.7; // Default Technical
  let sWeight = 0.3; // Default Sentiment
  
  if (type === 'BLUECHIP') {
    tWeight = 0.8; sWeight = 0.2;
  } else if (type === 'SPECULATIVE') {
    tWeight = 0.3; sWeight = 0.7;
  }

  const tScore = calculateScore(technicalData, marketStatus).total;
  const sScore = Math.round((sentimentData.score + 1) * 50); // Normalize -1..1 to 0..100
  
  const hybridScore = Math.round((tScore * tWeight) + (sScore * sWeight));
  
  let category = getCategory(hybridScore);
  let statusLabel = hybridScore >= 85 ? "High Confidence Signal" : (hybridScore >= 70 ? "Moderate Confidence" : "Low Confidence");
  
  // Visual Bars
  const tBar = '🟩'.repeat(Math.round(tScore / 10)) + '⬜'.repeat(10 - Math.round(tScore / 10));
  const sBar = '🟦'.repeat(Math.round(sScore / 10)) + '⬜'.repeat(10 - Math.round(sScore / 10));
  
  const entryBase = technicalData.price;
  const atr = technicalData.atr;
  
  // Perbaikan Logika: SL harus di bawah entry floor (support/ema20)
  const entryFloor = Math.floor(technicalData.ema20 || technicalData.support);
  const entryCeiling = entryBase;

  const sl = Math.floor(entryFloor - (1.5 * atr));
  const tp1 = Math.floor(entryCeiling + (5 * atr));
  const tp2 = Math.floor(entryCeiling + (10 * atr));

  const isBuy = hybridScore >= 70;
  
  let riskInfo = "";
  if (isBuy && userSettings && userSettings.balance > 0) {
    const riskAmount = userSettings.balance * (userSettings.risk_percent / 100);
    const riskPerShare = entryBase - sl;
    const maxShares = Math.floor(riskAmount / riskPerShare);
    const maxLots = Math.floor(maxShares / 100);
    const estValue = maxLots * 100 * entryBase;

    riskInfo = `🛡️ **RISK MANAGEMENT:**\n` +
               `• Modal Tersedia: \`Rp ${userSettings.balance.toLocaleString('id-ID')}\` \n` +
               `• Max Risk (${userSettings.risk_percent}%): \`Rp ${Math.floor(riskAmount).toLocaleString('id-ID')}\` \n` +
               `• Rekomendasi: \`${maxLots} Lot\`\n` +
               `• Est. Value: \`Rp ${estValue.toLocaleString('id-ID')}\` \n\n`;
  }

  let tradingSetup = `📍 **TRADING SETUP:**\n`;
  if (isBuy) {
    tradingSetup += `├─ Buy Zone: \`Rp ${entryFloor.toLocaleString('id-ID')} - ${entryCeiling.toLocaleString('id-ID')}\` \n` +
                    `├─ TP 1: \`Rp ${tp1.toLocaleString('id-ID')}\` (+${((tp1-entryCeiling)/entryCeiling*100).toFixed(1)}%) 🚀\n` +
                    `├─ TP 2: \`Rp ${tp2.toLocaleString('id-ID')}\` (+${((tp2-entryCeiling)/entryCeiling*100).toFixed(1)}%) 🚀\n` +
                    `└─ SL: \`Rp ${sl.toLocaleString('id-ID')}\` (-${((entryCeiling-sl)/entryCeiling*100).toFixed(1)}%) 🛡️\n\n`;
  } else {
    tradingSetup += `_Belum ada trading plan. Tunggu hingga momentum teknikal & sentimen AI sinkron (Hybrid Score > 70)._\n\n`;
  }

  const isAiError = sentimentData.summary.includes("(API Error)");
  const isQuotaLimit = sentimentData.sentiment_label === "LIMITED";
  
  let insightMsg = sentimentData.summary;
  
  if (isAiError) {
    insightMsg = `⚠️ _${sentimentData.summary}_\n` +
                 `💡 *Tips:* Hasil analisa belum maksimal. Silakan ulangi perintah \`/analysis\` dalam 1-2 menit lagi.`;
  } else if (isQuotaLimit) {
    insightMsg = `⚠️ _Quota AI Free Tier Habis_\n` +
                 `💡 *Tips:* Bot tetap memberikan analisa teknikal yang akurat (70% bobot). Coba lagi besok atau gunakan API Key berbayar.`;
  }

  // REAL Winrate from Signal Tracker (v4.5 Optimization)
  const stats = await dbService.getWinrateStats();
  const winrateDisplay = stats.winrate ? `${stats.winrate}% (${stats.resolvedTrades} trades)` : 'New System (Data Pending)';

  const confidence = sentimentData.confidence ? `(Conf: ${(sentimentData.confidence * 100).toFixed(0)}%)` : '';
  const sLabel = sentimentData.sentiment_label || (sentimentData.score > 0.3 ? 'BULLISH' : (sentimentData.score < -0.3 ? 'BEARISH' : 'NEUTRAL'));

  const report = `🚀 **STRATEGI: SWING TRADING**\n` +
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
         `• Status: ${sLabel} ${confidence}\n` +
         `• Insight: ${insightMsg}\n\n` +
         `${riskInfo}` +
         `${tradingSetup}` +
         `━━━━━━━━━━━━━━━\n` +
         `📈 *Win-rate Real: ${winrateDisplay}*\n` +
         `*Zenith AI Engine v4.5: Integrity & Intelligence.*`;
  return { report, hybridScore };
}

async function formatTechnicalAnalysis(ticker, data, marketStatus = null, userSettings = null) {
  const tScore = calculateScore(data, marketStatus).total;
  let category = getCategory(tScore);
  
  const tBar = '🟩'.repeat(Math.round(tScore / 10)) + '⬜'.repeat(10 - Math.round(tScore / 10));
  const entryBase = data.price;
  const atr = data.atr;
  
  const entryFloor = Math.floor(data.ema20 || data.support);
  const entryCeiling = entryBase;

  const sl = Math.floor(entryFloor - (1.5 * atr));
  const tp1 = Math.floor(entryCeiling + (5 * atr));
  const tp2 = Math.floor(entryCeiling + (10 * atr));

  const stats = await dbService.getWinrateStats();
  const winrateDisplay = stats.winrate ? `${stats.winrate}%` : 'Data Pending';

  const report = `📊 **ANALISA TEKNIKAL: $${ticker.toUpperCase()}**\n` +
         `${category.color} **STATUS: ${category.label}**\n\n` +
         `━━━━━━━━━━━━━━━\n` +
         `🏆 **TECHNICAL SCORE: ${tScore}/100**\n` +
         `💰 **Harga Saat Ini: Rp ${entryBase.toLocaleString('id-ID')}**\n` +
         `\`${tBar}\` \n\n` +
         `📈 **DATA PASAR:**\n` +
         `• Trend: ${data.ema20 > data.ema50 ? 'Bullish 🚀' : 'Bearish 📉'}\n` +
         `• Momentum: ${data.price > data.ema20 ? 'Strong' : 'Stable'}\n` +
         `• Volatilitas (ATR): Rp ${atr.toFixed(0)}\n\n` +
         `📍 **TRADING SETUP:**\n` +
         `├─ Buy Zone: \`Rp ${entryFloor.toLocaleString('id-ID')} - ${entryCeiling.toLocaleString('id-ID')}\` \n` +
         `├─ TP 1: \`Rp ${tp1.toLocaleString('id-ID')}\` (+${((tp1-entryCeiling)/entryCeiling*100).toFixed(1)}%) 🚀\n` +
         `├─ TP 2: \`Rp ${tp2.toLocaleString('id-ID')}\` (+${((tp2-entryCeiling)/entryCeiling*100).toFixed(1)}%) 🚀\n` +
         `└─ SL: \`Rp ${sl.toLocaleString('id-ID')}\` (-${((entryCeiling-sl)/entryCeiling*100).toFixed(1)}%) 🛡️\n\n` +
         `━━━━━━━━━━━━━━━\n` +
         `📈 *Win-rate System: ${winrateDisplay}*\n` +
         `*Zenith Pure Technical Engine v9.0*`;

  return { report, technicalScore: tScore };
}

function formatAdvice(ticker, technical, avgPrice, lots) {
  const { price, support, resistance, atr, ema20, ema50 } = technical;
  
  // Hitung Level (Konservatif)
  const sl = support > 0 ? Math.min(support * 0.985, price - (atr * 2)) : price - (atr * 2.5);
  const tp1 = price + (atr * 1.5);
  const tp2 = resistance > price ? resistance : price + (atr * 3);

  // Kalkulasi Risiko (Lot)
  const riskPerShare = avgPrice - sl;
  const riskTotal = riskPerShare * lots * 100;
  const riskPercent = (riskPerShare / avgPrice) * 100;
  
  // Status Posisi Saat Ini
  const floating = ((price - avgPrice) / avgPrice * 100).toFixed(2);
  const statusEmoji = floating >= 0 ? "🟢 PROFIT" : "🔴 LOSS";

  // Persentase TP & SL terhadap Harga Saat Ini
  const tp1Pct = ((tp1 - price) / price * 100).toFixed(1);
  const tp2Pct = ((tp2 - price) / price * 100).toFixed(1);
  const slPct = ((price - sl) / price * 100).toFixed(1);

  // Peringatan Risiko
  let riskWarning = "";
  if (riskPercent > 10) {
    riskWarning = `⚠️ **RISIKO SANGAT TINGGI (>10%)**\n_Stop Loss Anda terlalu jauh dari harga modal._\n\n`;
  }

  return `🏦 **ZENITH ADVICE: $${ticker.toUpperCase()}**\n` +
         `━━━━━━━━━━━━━━━━━━━━\n` +
         `💰 **Status Portofolio:**\n` +
         `• Avg Price: Rp ${avgPrice.toLocaleString('id-ID')}\n` +
         `• **Price Now: Rp ${price.toLocaleString('id-ID')}**\n` +
         `• Total Lot: ${lots} Lot\n` +
         `• Status: ${statusEmoji} (${floating}%)\n\n` +
         `🎯 **Target & Proteksi:**\n` +
         `• **TP 1:** Rp ${Math.round(tp1).toLocaleString('id-ID')} (+${tp1Pct}%)\n` +
         `• **TP 2:** Rp ${Math.round(tp2).toLocaleString('id-ID')} (+${tp2Pct}%)\n` +
         `• **Stop Loss:** Rp ${Math.round(sl).toLocaleString('id-ID')} (-${slPct}%)\n\n` +
         `🛡️ **Manajemen Risiko:**\n` +
         `${riskWarning}` +
         `• Potensi Risiko: Rp ${Math.round(riskTotal).toLocaleString('id-ID')}\n` +
         `• Besaran Risiko: ${riskPercent.toFixed(2)}%\n\n` +
         `🧐 **Komentar Teknikal:**\n` +
         `• Support terdekat di ${Math.round(support)}.\n` +
         `• Volatilitas (ATR): Rp ${Math.round(atr)}.\n\n` +
         `🛠️ **Advice Exit Strategi:**\n` +
         `• **Resiko Terdekat:** Gunakan SL di Rp ${Math.round(support * 0.99)} (Base Support).\n` +
         `• **Resiko Ideal:** Gunakan SL di Rp ${Math.round(price - (atr * 2))} (Base Volatilitas).\n\n` +
         `💡 _Saran: Jika besaran risiko > 10%, pertimbangkan untuk 'Sell on Strength' saat harga mendekati TP1._`;
}

const calculateMACD = (history) => indicators.calculateMACD(history);
const calculateStochRSI = (history) => indicators.calculateStochRSI(history);

export { calculateScore, getCategory, formatDualAnalysis, formatNews, formatHybridAnalysis, formatTechnicalAnalysis, formatAdvice, calculateMACD, calculateStochRSI };
export default { calculateScore, getCategory, formatDualAnalysis, formatNews, formatHybridAnalysis, formatTechnicalAnalysis, formatAdvice, calculateMACD, calculateStochRSI };
