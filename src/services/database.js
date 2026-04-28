const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) logger.error('Gagal membuka database:', err.message);
  else logger.info('Terhubung ke database SQLite.');
});

// Inisialisasi Tabel
function init() {
  db.run(`CREATE TABLE IF NOT EXISTS watchlist (
    ticker TEXT PRIMARY KEY,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) logger.error('Gagal membuat tabel:', err.message);
    else logger.info('Tabel Watchlist siap.');
  });
}

// Fungsi Database
const dbActions = {
  addTicker: (ticker) => {
    return new Promise((resolve, reject) => {
      db.run(`INSERT OR IGNORE INTO watchlist (ticker) VALUES (?)`, [ticker.toUpperCase()], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  },

  deleteTicker: (ticker) => {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM watchlist WHERE ticker = ?`, [ticker.toUpperCase()], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  },

  getWatchlist: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT ticker FROM watchlist`, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(r => r.ticker));
      });
    });
  }
};

module.exports = { init, ...dbActions };
