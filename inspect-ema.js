// inspect-ema.js
require('dotenv').config();
const TradingView = require('@mathieuc/tradingview');

async function inspect() {
  try {
    const emaInd = await TradingView.getIndicator('STD;EMA');
    console.log('🔍 EMA Indicator Inputs:');
    console.log(JSON.stringify(emaInd.inputs, null, 2));
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}
inspect();
