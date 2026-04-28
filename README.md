# 🚀 IDX Real-time Trading Signal Bot v2.1

Bot Telegram otomatis untuk menganalisa sinyal trading saham Indonesia (IDX) secara real-time menggunakan indikator **RSI (Relative Strength Index)** langsung dari TradingView. Bot ini dirancang dengan arsitektur modular yang skalabel dan mendukung dua strategi utama: **Scalping** & **Swing Trading**.

## ✨ Fitur Utama

- **Dual-Focus Strategy**:
  - 🚀 **Scalping Mode**: Analisa cepat menggunakan Timeframe 1 Jam dan RSI periode 9.
  - 📈 **Swing Mode**: Analisa jangka panjang menggunakan Timeframe Daily dan RSI periode 14.
- **On-Demand Analysis**: Cek saham apapun di IDX hanya dengan mengetik perintah di Telegram.
- **Real-time Data**: Mengambil data langsung dari WebSocket TradingView menggunakan library `@mathieuc/tradingview`.
- **Modular Architecture**: Kode yang rapi dan terorganisir (Config, Services, Utils, Handlers) sehingga mudah dikembangkan.
- **Visual Reporting**: Laporan sinyal yang informatif dengan RSI bar visual dan saran analisa otomatis.

---

## 🛠️ Teknologi yang Digunakan

- **Runtime**: Node.js
- **API**: [TradingView-API](https://github.com/mathieuc/tradingview) & [Node Telegram Bot API](https://github.com/yagop/node-telegram-bot-api)
- **Development**: Nodemon (Auto-restart)
- **Environment**: Dotenv (Secret management)

---

## 🚀 Instalasi & Persiapan

### 1. Clone Repository
```bash
git clone https://github.com/RezaBagusS/realtime-trading-bot.git
cd realtime-trading-bot
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi variabel berikut di dalam `.env`:
- `TELEGRAM_BOT_TOKEN`: Dapatkan dari [@BotFather](https://t.me/BotFather).
- `CHANNEL_ID`: Chat ID Telegram Anda.
- `TRADINGVIEW_SESSION` & `TRADINGVIEW_SIGNATURE`: Dapatkan dari browser cookies (sessionid & sessionid_sign).

---

## 📖 Cara Penggunaan

### Menjalankan Bot
- **Mode Development** (Auto-restart): `npm run dev`
- **Mode Production**: `npm start`

### Perintah Telegram
- `/start` - Menampilkan panduan penggunaan.
- `/scalp [TICKER]` - Contoh: `/scalp BBCA` (Mode Jangka Pendek).
- `/swing [TICKER]` - Contoh: `/swing BBRI` (Mode Jangka Panjang).
- `/cek [TICKER]` - Alias untuk mode Swing.

---

## 📁 Struktur Project
```text
├── src/
│   ├── config/          # Pengaturan .env & Strategi
│   ├── services/        # Logika TradingView & Telegram
│   ├── utils/           # Logger & Formatter Pesan
│   └── handlers/        # (Optional) Command Router
├── bot.js               # Titik Masuk Utama
├── .env                 # File Rahasia (Jangan di-push!)
└── .gitignore           # Daftar file yang diabaikan Git
```

---

## ⚠️ Disclaimer
Bot ini dibuat untuk tujuan edukasi dan alat bantu analisa teknikal. Pengambilan keputusan investasi sepenuhnya menjadi tanggung jawab pengguna. **Trading saham memiliki risiko tinggi. Selalu lakukan riset sendiri (DYOR).**

---

## 👨‍💻 Kontribusi
Kontribusi selalu terbuka! Silakan lakukan **Fork** dan kirimkan **Pull Request** jika Anda memiliki ide pengembangan lebih lanjut.

---
*Created with ❤️ for Indonesian Traders.*