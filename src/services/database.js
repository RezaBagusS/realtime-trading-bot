import sqlite3Pkg from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const sqlite3 = sqlite3Pkg.verbose ? sqlite3Pkg.verbose() : sqlite3Pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) logger.error('Gagal membuka database:', err.message);
  else logger.info('Terhubung ke database SQLite.');
});

// Inisialisasi Tabel
function init() {
  db.serialize(() => {
    // Tabel Watchlist
    db.run(`CREATE TABLE IF NOT EXISTS watchlist (
      ticker TEXT PRIMARY KEY,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabel User Settings (Modal & Risk)
    db.run(`CREATE TABLE IF NOT EXISTS user_settings (
      chat_id INTEGER PRIMARY KEY,
      balance REAL DEFAULT 0,
      risk_percent REAL DEFAULT 2.0
    )`);

    // Tabel Signal History (Audit Winrate)
    db.run(`CREATE TABLE IF NOT EXISTS signal_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT,
      price REAL,
      type TEXT, -- SWING or SCALP
      score INTEGER,
      status TEXT DEFAULT 'PENDING', -- PENDING, WIN, LOSS
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // AI Cache (Persistent Sentiment)
    db.run(`CREATE TABLE IF NOT EXISTS ai_cache (
      ticker TEXT PRIMARY KEY,
      sentiment_data TEXT,
      expiry INTEGER
    )`);

    logger.info('Tabel Watchlist, User Settings, Signal History, & AI Cache siap.');
  });
}

// Fungsi Database
const dbActions = {
  addTicker: (ticker) => {
    return new Promise((resolve, reject) => {
      // Cek limit 5 saham (Sesuai Kritik)
      db.get(`SELECT COUNT(*) as count FROM watchlist`, [], (err, row) => {
        if (err) return reject(err);
        if (row.count >= 5) {
          return reject(new Error('Limit Watchlist tercapai (Maksimal 5 saham). Hapus salah satu untuk menambah baru.'));
        }
        
        db.run(`INSERT OR IGNORE INTO watchlist (ticker) VALUES (?)`, [ticker.toUpperCase()], function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        });
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
  },

  setUserBalance: (chatId, balance) => {
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO user_settings (chat_id, balance) VALUES (?, ?) ON CONFLICT(chat_id) DO UPDATE SET balance = ?",
        [chatId, balance, balance],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  },

  getUserSettings: (chatId) => {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM user_settings WHERE chat_id = ?", [chatId], (err, row) => {
        if (err) reject(err);
        else resolve(row || { balance: 0, risk_percent: 2.0 });
      });
    });
  },

  saveSignal: (ticker, price, type, score) => {
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO signal_history (ticker, price, type, score) VALUES (?, ?, ?, ?)",
        [ticker.toUpperCase(), price, type, score],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  getWinrateStats: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'WIN' THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN status = 'LOSS' THEN 1 ELSE 0 END) as losses
        FROM signal_history
        WHERE status != 'PENDING'
      `;
      db.get(query, [], (err, row) => {
        if (err) reject(err);
        else {
          const totalResolved = row.wins + row.losses;
          const winrate = totalResolved > 0 ? (row.wins / totalResolved * 100).toFixed(1) : null;
          resolve({
            winrate,
            totalTrades: row.total,
            resolvedTrades: totalResolved
          });
        }
      });
    });
  },

  getAiCache: (ticker) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT sentiment_data, expiry FROM ai_cache WHERE ticker = ?`, [ticker.toUpperCase()], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        if (Date.now() > row.expiry) {
          db.run(`DELETE FROM ai_cache WHERE ticker = ?`, [ticker.toUpperCase()]);
          return resolve(null);
        }
        resolve(JSON.parse(row.sentiment_data));
      });
    });
  },

  setAiCache: (ticker, data, ttlMinutes = 120) => {
    const expiry = Date.now() + (ttlMinutes * 60 * 1000);
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO ai_cache (ticker, sentiment_data, expiry) VALUES (?, ?, ?)`,
        [ticker.toUpperCase(), JSON.stringify(data), expiry],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
};

export { init, dbActions };
export default { init, ...dbActions };
