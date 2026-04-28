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
      color: '🔵',
      risk: { sl: 0.02, tp1: 0.03, tp2: 0.06 } // SL 2%, TP 3% & 6%
    },
    swing: {
      name: 'SWING (Long-Term)',
      timeframe: 'D',
      rsi_length: 14,
      oversold: 35,
      overbought: 65,
      color: '🟣',
      risk: { sl: 0.05, tp1: 0.10, tp2: 0.20 } // SL 5%, TP 10% & 20%
    }
  },
  watchList: [
    'BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 
    'GOTO', 'UNVR', 'ADRO', 'AMRT', 'ICBP'
  ]
};
