/**
 * SCRIPT TEST MARKET CONTEXT v3.6
 */
require('dotenv').config();
const tvService = require('./src/services/tradingview');
const logger = require('./src/utils/logger');

async function testMarket() {
  console.log('🔍 Mengambil data IHSG (COMPOSITE)...');
  try {
    const status = await tvService.getMarketStatus();
    console.log('\n========================================');
    console.log('📊 HASIL CEK MARKET CONTEXT');
    console.log('========================================');
    console.log(`🔹 Indeks IHSG : ${status.price.toLocaleString()}`);
    console.log(`🔹 Perubahan   : ${status.change}%`);
    console.log(`🔹 Tren Global  : ${status.trend === 'BULLISH' ? '📈 BULLISH' : '📉 BEARISH'}`);
    console.log(`🔹 Support EMA20: ${status.ema20.toLocaleString()}`);
    console.log('========================================\n');
    
    if (status.trend === 'BEARISH') {
      console.log('🛡️ STATUS: SAFETY SWITCH AKTIF (Skor akan dipotong 20 poin)');
    } else {
      console.log('🚀 STATUS: MARKET SUPPORTIVE (Skor akan ditambah 5 poin)');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal:', err.message);
    process.exit(1);
  }
}

testMarket();
