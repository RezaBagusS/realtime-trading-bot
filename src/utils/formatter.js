function format(ticker, rsi, price, strategy) {
  const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  
  let signal = 'NEUTRAL ⚖️';
  let emoji = '🟡';
  let advice = 'Belum ada momentum kuat.';

  if (rsi < strategy.oversold) {
    signal = 'BUY (OVERSOLD) 🟢';
    emoji = '✅';
    advice = strategy.timeframe === 'D' 
      ? 'Area akumulasi sehat untuk cicil beli (Swing).' 
      : 'Potensi rebound cepat, siap-siap take profit tipis (Scalp).';
  } else if (rsi > strategy.overbought) {
    signal = 'SELL (OVERBOUGHT) 🔴';
    emoji = '⚠️';
    advice = strategy.timeframe === 'D'
      ? 'Sudah terlalu tinggi, amankan profit sebagian.'
      : 'Jenuh beli, rawan koreksi mendadak.';
  }

  const barCount = Math.min(Math.max(Math.round(rsi / 10), 0), 10);
  const bar = '🔹'.repeat(barCount) + '⬜'.repeat(10 - barCount);

  return (
    `${strategy.color} *${strategy.name} ANALISIS*\n` +
    `📌 *Ticker:* $${ticker.toUpperCase()}\n` +
    `💰 *Harga:* Rp ${price?.toLocaleString('id-ID') || '-'}\n` +
    `\n` +
    `📊 *RSI (${strategy.rsi_length}):* \`${rsi.toFixed(2)}\`\n` +
    `\`[${bar}]\`\n` +
    `⏱ *Timeframe:* ${strategy.timeframe === 'D' ? 'Daily' : '1 Jam'}\n` +
    `\n` +
    `${emoji} *Signal:* ${signal}\n` +
    `📝 *Analisa:* ${advice}\n` +
    `\n` +
    `🕒 _Data per: ${time} WIB_\n` +
    `⚠️ _Bukan financial advice._`
  );
}

module.exports = { format };
