function calculateScore(data, strategy) {
  let score = 50; // Start at neutral
  let details = [];

  // 1. RSI Score (Weight: 40)
  if (data.rsi < strategy.oversold) {
    score += 25;
    details.push('RSI Oversold (+25)');
  } else if (data.rsi > strategy.overbought) {
    score -= 25;
    details.push('RSI Overbought (-25)');
  } else if (data.rsi < 50) {
    score += 5;
  }

  // 2. Trend/EMA Score (Weight: 40)
  const isAboveEMA20 = data.price > data.ema20;
  const isAboveEMA50 = data.price > data.ema50;
  const isGoldenCross = data.ema20 > data.ema50;

  if (isAboveEMA20) {
    score += 10;
    details.push('Above EMA20 (+10)');
  } else {
    score -= 10;
  }

  if (isAboveEMA50) {
    score += 10;
    details.push('Above EMA50 (+10)');
  }

  if (isGoldenCross) {
    score += 10;
    details.push('Golden Cross EMA (+10)');
  }

  // 3. Volume Score (Weight: 20)
  const volRatio = data.volume / data.avgVol;
  if (volRatio > 1.5) {
    score += 15;
    details.push('High Volume Spike (+15)');
  } else if (volRatio > 1.1) {
    score += 5;
  }

  // Final Clamp
  return {
    total: Math.min(Math.max(score, 0), 100),
    details
  };
}

function getCategory(score) {
  if (score >= 90) return { label: '💎 STRONG BUY', color: '🟩', note: 'Konfirmasi Sempurna!' };
  if (score >= 70) return { label: '✅ BUY', color: '🍀', note: 'Momentum Bagus.' };
  if (score >= 40) return { label: '⚖️ NEUTRAL', color: '🟡', note: 'Wait & See.' };
  if (score >= 20) return { label: '⚠️ SELL', color: '🟠', note: 'Waspada Koreksi.' };
  return { label: '🚨 STRONG SELL', color: '🟥', note: 'Distribusi Masif!' };
}

function format(ticker, data, strategy) {
  const { rsi, price, ema20, ema50, volume, avgVol, prevClose } = data;
  const scoreData = calculateScore(data, strategy);
  const category = getCategory(scoreData.total);
  
  const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  const priceChange = prevClose ? ((price - prevClose) / prevClose * 100).toFixed(2) : '0.00';
  const volRatio = (volume / avgVol).toFixed(1);

  // Score Bar
  const barCount = Math.round(scoreData.total / 10);
  const scoreBar = '💊'.repeat(barCount) + '⚪'.repeat(10 - barCount);

  return (
    `${category.color} *${category.label} — $${ticker.toUpperCase()}*\n` +
    `🏢 *${strategy.name}*\n` +
    `\n` +
    `💰 *Harga:* Rp ${price?.toLocaleString('id-ID')}\n` +
    `📈 *Change:* \`${priceChange}%\` | *Vol:* \`${volRatio}x avg\`\n` +
    `\n` +
    `📊 *Technical Score:* \`${scoreData.total}/100\`\n` +
    `\`[${scoreBar}]\`\n` +
    `\n` +
    `🔍 *Key Indicators:*\n` +
    `• RSI (${strategy.rsi_length}): \`${rsi.toFixed(2)}\`\n` +
    `• EMA 20: \`${ema20.toFixed(0)}\` (${price > ema20 ? 'UP' : 'DOWN'})\n` +
    `• EMA 50: \`${ema50.toFixed(0)}\` (${price > ema50 ? 'UP' : 'DOWN'})\n` +
    `\n` +
    `💡 *Note:* ${category.note}\n` +
    `🕒 _${time} WIB_\n` +
    `\n` +
    `⚠️ _Bukan financial advice. DYOR._`
  );
}

module.exports = { format };
