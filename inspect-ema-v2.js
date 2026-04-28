// inspect-ema-v2.js
require('dotenv').config();
const TradingView = require('@mathieuc/tradingview');

async function inspect() {
  try {
    const emaInd = await TradingView.getIndicator('STD;EMA');
    console.log('🔍 EMA Plots & Indicators:');
    // Tampilkan plots untuk melihat nama output (misal plot_0, plot_1, dst)
    console.log(JSON.stringify(emaInd.plots, null, 2));
    
    // Tampilkan tipe indikator
    console.log('Type:', emaInd.type);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}
inspect();
