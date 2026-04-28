# 🚀 IDX Real-time Trading Signal Bot v2.6

Bot Telegram otomatis untuk menganalisa sinyal trading saham Indonesia (IDX) secara real-time menggunakan indikator **RSI, EMA 20, EMA 50, dan Volume Analysis**. Dilengkapi dengan sistem **Double-Scan** dan **Dynamic Watchlist** berbasis database.

## ✨ Fitur Utama

- **Dynamic Watchlist (SQLite)**: Kelola daftar saham yang ingin dipantau secara otomatis langsung melalui Telegram. Data tersimpan permanen di database.
- **Smart Recommendation (Double-Scan)**: Analisa otomatis 1 Jam (Scalp) dan Daily (Swing) untuk memberikan rekomendasi strategi terbaik.
- **Auto-Screener Engine**: Melakukan pemindaian otomatis terhadap watchlist Anda setiap jam selama jam bursa (09:00 - 16:00 WIB).
- **Advanced Technical Scoring**: Skor cerdas (0-100) dengan konfirmasi tren dan volume.
- **Automated Trading Plan**: Menghitung otomatis titik Entry, Take Profit, dan Stop Loss.

---

## 📖 Cara Penggunaan

### Perintah Analisa
- `/cek [TICKER]` - Analisa mendalam 1H & Daily.

### Perintah Manajemen Watchlist (Screener)
- `/add [TICKER]` - Menambahkan saham ke radar pantauan otomatis.
- `/del [TICKER]` - Menghapus saham dari radar pantauan.
- `/list` - Melihat daftar saham yang sedang dipantau.

---

## 🚀 Instalasi & Persiapan

### 1. Clone & Install
```bash
git clone https://github.com/RezaBagusS/realtime-trading-bot.git
cd realtime-trading-bot
npm install
```

### 2. Konfigurasi
Salin `.env.example` ke `.env` dan isi token Telegram serta session TradingView Anda.

---

## 📁 Struktur Project
- `src/services/database.js` - Pengelola database SQLite.
- `src/services/screener.js` - Background task untuk auto-scan.
- `database.sqlite` - File database lokal (dibuat otomatis).

---
*Created with ❤️ for Indonesian Traders.*