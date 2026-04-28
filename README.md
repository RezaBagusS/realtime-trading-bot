# 🚀 IDX Real-time Trading Signal Bot v2.4

Bot Telegram otomatis untuk menganalisa sinyal trading saham Indonesia (IDX) secara real-time menggunakan indikator **RSI, EMA 20, EMA 50, dan Volume Analysis**. Bot ini menggunakan sistem **Double-Scan** untuk memberikan rekomendasi strategi terbaik (Scalp vs Swing).

## ✨ Fitur Utama

- **Smart Recommendation (Double-Scan)**: Bot menganalisa Timeframe 1 Jam (Scalp) dan Daily (Swing) secara bersamaan dan merekomendasikan strategi yang paling potensial.
- **Advanced Technical Scoring**: Skor (0-100) berdasarkan kombinasi RSI, Trend EMA, dan Volume Spike.
- **Automated Trading Plan**: Menghitung otomatis titik Entry, Take Profit 1 & 2, serta Stop Loss.
- **Dynamic Reasoning**: Memberikan alasan logis di balik setiap sinyal yang muncul.
- **Zero Study Conflict**: Perhitungan EMA dilakukan secara lokal, menghemat limit akun TradingView Free.

---

## 📖 Cara Penggunaan

### Perintah Telegram
- `/start` - Menampilkan panduan penggunaan.
- `/cek [TICKER]` - Analisa mendalam (Double-Scan) 1H & Daily.
- *(Perintah /scalp dan /swing tetap aktif dan diarahkan ke sistem Double-Scan yang cerdas).*

---

## 🚀 Instalasi & Persiapan

### 1. Clone & Install
```bash
git clone https://github.com/RezaBagusS/realtime-trading-bot.git
cd realtime-trading-bot
npm install
```

### 2. Konfigurasi
Salin `.env.example` ke `.env` dan isi token Anda.

---

## 👨‍💻 Kontribusi
Silakan lakukan Fork dan kirimkan Pull Request untuk pengembangan lebih lanjut.

---
*Created with ❤️ for Indonesian Traders.*