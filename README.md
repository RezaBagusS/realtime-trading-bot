# 🚀 IDX Smart Trading Bot v3.5 (The Pro Trader)

Bot sinyal trading otomatis untuk saham IDX (Indonesia Stock Exchange) yang menggabungkan analisa teknikal pro dengan manajemen resiko adaptif.

## ✨ Fitur Utama (Fase 1 - Terverifikasi)
- **Dual-Strategy Detection:** Bot mendeteksi strategi **Scalping (1H)** atau **Swing Trading (Daily)** secara otomatis.
- **Balanced Scoring System (v3.5):** Penilaian teknikal (0-100) berbasis Tren, Momentum, dan Struktur harga.
- **Long-Only Logic:** Fokus pada sinyal **BUY**, **WAIT & SEE**, dan **AVOID**.
- **Adaptive Exits (ATR-Based):** Manajemen resiko otomatis mengikuti volatilitas pasar.
- **Advanced Backtester v1.12:** Simulasi detail dengan log transaksi riil.

---

## 🤖 Panduan Perintah Telegram
Gunakan perintah berikut langsung di bot Telegram Anda:

### 🔍 Analisa & Sinyal
- `/cek [TICKER]` - Melakukan analisa teknikal instan (Scalp & Swing sekaligus).
- `/start` - Memulai interaksi dengan bot.
- `/help` - Menampilkan panduan penggunaan lengkap.

### 📡 Radar & Watchlist (Auto-Screener)
- `/add [TICKER]` - Menambahkan saham ke daftar radar pemantauan otomatis (Bot akan memindai tiap jam).
- `/del [TICKER]` - Menghapus saham dari daftar radar.
- `/list` - Menampilkan semua saham yang sedang dipantau di radar.

---

## 🛠️ Instalasi & Persiapan
1. **Clone Repository.**
2. **Install Dependencies:** `npm install`.
3. **Konfigurasi .env:** Masukkan `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, dan `GEMINI_API_KEY`.
4. **Jalankan Bot:** `npm start`.

## 📈 Monitoring & Analisa Terminal
- **Backtest:** Jalankan `node backtest.js [ticker]` untuk melihat performa historis saham tersebut di terminal.

---
*Disclaimer: Investasi saham memiliki resiko. Gunakan bot ini sebagai alat bantu analisa, bukan satu-satunya dasar pengambilan keputusan.*