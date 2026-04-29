/**
 * DATA INVESTIGATOR
 * Mengecek apakah data TradingView masuk dengan benar.
 */
require('dotenv').config();
const tvService = require('./src/services/tradingview');

async function investigate(ticker) {
  try {
    const history = await tvService.getHistory(ticker, 'D', 350);
    console.log(`\n📊 DATA REPORT UNTUK $${ticker.toUpperCase()}:`);
    console.log(`• Jumlah Candle: ${history.length}`);
    
    if (history.length > 0) {
      console.log(`• Harga Terakhir: ${history[history.length-1].close}`);
      console.log(`• Harga Terlama: ${history[0].close}`);
      console.log(`• Range Tanggal: ${new Date(history[0].time * 1000).toLocaleDateString()} s/d ${new Date(history[history.length-1].time * 1000).toLocaleDateString()}`);
    } else {
      console.log(`❌ ERROR: Data kosong! Coba cek koneksi atau simbol.`);
    }
  } catch (err) {
    console.error(`❌ ERROR: ${err.message}`);
  }
}

investigate(process.argv[2] || 'BBCA');
