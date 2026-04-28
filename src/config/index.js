require('dotenv').config();

module.exports = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    channelId: process.env.CHANNEL_ID
  },
  tradingview: {
    session: process.env.TRADINGVIEW_SESSION,
    signature: process.env.TRADINGVIEW_SIGNATURE
  },
  thresholds: {
    scalp: {
      name: 'SCALPING (Short-Term)',
      timeframe: '60',
      rsi_length: 9,
      oversold: 30,
      overbought: 70,
      color: '🔵'
    },
    swing: {
      name: 'SWING (Long-Term)',
      timeframe: 'D',
      rsi_length: 14,
      oversold: 35,
      overbought: 65,
      color: '🟣'
    }
  }
};
