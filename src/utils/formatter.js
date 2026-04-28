function calculateScore(data, strategy) {
  let score = 50;
  let reasons = [];

  // 1. RSI Score
  if (data.rsi < strategy.oversold) {
    score += 25;
    reasons.push('RSI sudah Oversold (Murah)');
  } else if (data.rsi > strategy.overbought) {
    score -= 25;
    reasons.push('RSI sudah Overbought (Jenuh Beli)');
  }

  // 2. Trend Score
  if (data.price > data.ema20) {
    score += 10;
    reasons.push('Harga di atas EMA 20 (Trend Up)');
  } else {
    score -= 5;
    reasons.push('Harga di bawah EMA 20 (Trend Down)');
  }

  if (data.ema20 > data.ema50) {
    score += 10;
    reasons.push('EMA 20 > EMA 50 (Golden Cross)');
  }

  // 3. Volume Score
  if (data.volume > data.avgVol * 1.5) {
    score += 15;
    reasons.push('Volume naik signifikan (Akumulasi)');
  }

  return {
    total: Math.min(Math.max(score, 0), 100),
    reasons: reasons.slice(0, 3) // Ambil 3 alasan utama
  };
}

function getCategory(score) {
  if (score >= 90) return { label: '💎 STRONG BUY', color: '🟩' };
  if (score >= 70) return { label: '✅ BUY', color: '🍀' };
  if (score >= 40) return { label: '⚖️ NEUTRAL', color: '🟡' };
  if (score >= 20) return { label: '⚠️ SELL', color: '🟠' };
  return { label: '🚨 STRONG SELL', color: '🟥' };
}

function format(ticker, data, strategy) {
  const { rsi, price, ema20, ema50, volume, avgVol, prevClose } = data;
  const scoreData = calculateScore(data, strategy);
  const category = getCategory(scoreData.total);
  
  // Perhitungan Trading Plan
  const entry = price;
  const sl = Math.floor(entry * (1 - strategy.risk.sl));
  const tp1 = Math.floor(entry * (1 + strategy.risk.tp1));
  const tp2 = Math.floor(entry * (1 + strategy.risk.tp2));

  const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  const priceChange = prevClose ? ((price - prevClose) / prevClose * 100).toFixed(2) : '0.00';
  
  const barCount = Math.round(scoreData.total / 10);
  const scoreBar = '💊'.repeat(barCount) + '⚪'.repeat(10 - barCount);

  let message = `${category.color} *${category.label} — $${ticker.toUpperCase()}*\n` +
                `🏢 *${strategy.name}*\n` +
                `\n` +
                `💰 *Harga:* Rp ${price?.toLocaleString('id-ID')}\n` +
                `📈 *Change:* \`${priceChange}%\` | *Vol:* \`${(volume/avgVol).toFixed(1)}x avg\`\n` +
                `\n` +
                `📊 *Technical Score:* \`${scoreData.total}/100\`\n` +
                `\`[${scoreBar}]\`\n` +
                `\n`;

  // Hanya tampilkan Trading Plan jika sinyal BUY atau STRONG BUY
  if (scoreData.total >= 70) {
    message += `🎯 *TRADING PLAN:*\n` +
               `• *Entry:* \`Rp ${entry.toLocaleString('id-ID')}\` (Current)\n` +
               `• *TP 1:* \`Rp ${tp1.toLocaleString('id-ID')}\` (+${(strategy.risk.tp1 * 100).toFixed(0)}%)\n` +
               `• *TP 2:* \`Rp ${tp2.toLocaleString('id-ID')}\` (+${(strategy.risk.tp2 * 100).toFixed(0)}%)\n` +
               `• *Stop Loss:* \`Rp ${sl.toLocaleString('id-ID')}\` (-${(strategy.risk.sl * 100).toFixed(0)}%)\n` +
               `\n`;
  }

  message += `📝 *Alasan:* \n${scoreData.reasons.map(r => `• ${r}`).join('\n')}\n` +
             `\n` +
             `🕒 _${time} WIB_\n` +
             `⚠️ _Bukan financial advice._`;

  return message;
}

module.exports = { format };
