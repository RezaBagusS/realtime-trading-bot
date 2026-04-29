# 🚀 IDX Smart Trading Bot v3.5

Bot sinyal trading otomatis untuk saham IDX (Indonesia Stock Exchange) yang menggabungkan analisa teknikal pro dengan manajemen resiko adaptif.

## ✨ Fitur Utama (Fase 1 Selesai)
- **Hybrid Analysis:** Menganalisa timeframe 1H (Scalping) dan Daily (Swing) secara bersamaan.
- **Dynamic Scoring v3.5:** Penilaian teknikal berdasarkan Tren (EMA), Momentum (MACD), dan Struktur (Breakout/Pullback).
- **Long-Only Strategy:** Dirancang khusus untuk pasar spot (hanya memberikan sinyal BUY).
- **Adaptive Exits (ATR):** Penentuan Target Profit (TP) dan Stop Loss (SL) otomatis berdasarkan volatilitas tiap saham.
- **Backtester v1.12:** Simulasi historis detail dengan log transaksi per tanggal untuk memvalidasi strategi.
- **Dynamic Watchlist:** Kelola saham favorit Anda via database SQLite.

## 🛠️ Tech Stack
- **Node.js:** Runtime utama.
- **TradingView API:** Sumber data realtime.
- **SQLite:** Database watchlist.
- **Telegram Bot API:** Antarmuka notifikasi.

## 📊 Cara Penggunaan
1. Masukkan API Key Telegram & Gemini di file `.env`.
2. Jalankan bot: `npm start`.
3. Gunakan command `/analisa [ticker]` di Telegram untuk cek saham secara instan.
4. Gunakan `node backtest.js [ticker]` untuk simulasi historis.

---
*Developed with ❤️ for Indonesian Traders.*