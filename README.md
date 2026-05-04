# 🚀 Zenith AI Trading Engine v4.5
**Professional-Grade Hybrid Decision Engine for IDX Stocks**

Zenith AI Trading Engine adalah bot sinyal trading canggih yang menggabungkan kekuatan **Analisis Teknikal (70%)** dan **AI Sentiment (30%)** untuk memberikan sinyal yang akurat, jujur, dan berintegritas tinggi bagi trader bursa saham Indonesia.

## ✨ Fitur Utama (v4.5 Pro Edition)
*   🧠 **Hybrid AI Decision Engine**: Menggunakan Gemini 1.5/2.5 Flash untuk menganalisa berita bursa secara kritis (Anti-Clickbait).
*   📊 **Professional Indicators**: Kalkulasi MACD, StochRSI, dan Support/Resistance yang presisi (Standard Industri).
*   🛡️ **Risk Management**: Kalkulasi otomatis besaran Lot dan Risk/Reward Ratio per transaksi.
*   📈 **Real Win-rate Tracker**: Menampilkan statistik performa nyata dari database, bukan angka simulasi.
*   ⚡ **Modern Architecture**: Berjalan sepenuhnya di **Node.js ESM (ECMAScript Modules)**.
*   💾 **Persistent AI Cache**: Menghemat kuota API dengan menyimpan hasil analisa sentimen di database SQLite.
*   📅 **Market Awareness**: Mendeteksi kalender libur bursa IDX secara otomatis.
*   🔄 **API Key Rotation**: Mendukung penggunaan multiple API Keys untuk bypass limit free tier.
*   📱 **Professional Telegram UX**: Menu perintah interaktif, validasi input otomatis, sistem bantuan cerdas, dan fitur hitung mundur `/nextscan`.
*   🌐 **Resilient Connectivity**: Sistem auto-recovery, reconnection cooldown, dan **Advanced Activity Logging** untuk pemantauan audit user.
*   📡 **Automated Radar Status**: Bot otomatis mengirimkan laporan ke channel jika tidak ada saham yang layak beli dalam satu sesi scanning.
- **IHSG Global Filter (v3.6):** Bot memantau indeks IHSG sebagai *Safety Switch*. Skor saham otomatis dipotong jika kondisi bursa sedang *Bearish*.
- **Dual-Strategy Detection:** Deteksi otomatis strategi **Scalping (1H)** atau **Swing Trading (Daily)**.

---

## 🤖 Panduan Perintah Telegram
Gunakan perintah berikut langsung di bot Telegram Anda:

### 💎 Intelligence Analyst (New)
- `/analysis [TICKER]` - **Fitur Unggulan v4.0.** Menjalankan analisa Hybrid (Teknikal + AI Sentiment). Memberikan skor gabungan, area entry, dan target profit dengan visualisasi bar premium.
- `/technical [TICKER]` - Analisa teknikal murni (Scalp & Swing) tanpa sentiment AI. Pengganti perintah `/cek`.
- `/news [TICKER]` - Menampilkan berita terbaru + **Analisa Sentimen AI**.

### 📡 Radar & Watchlist (Automated)
- `/add [TICKER]` - Memasukkan saham ke radar (Melalui proses verifikasi bursa otomatis).
- `/del [TICKER]` - Menghapus dari radar.
- `/list` - Cek isi radar.
- `/nextscan` - Cek hitung mundur pemindaian radar berikutnya.

---

## 📈 Validasi Strategi (Terminal Simulator)
- **Backtest Engine (v1.15):** Jalankan `node backtest.js [ticker]`.
- **Kegunaan:** Menguji performa logic bot selama 350 hari ke belakang (Sudah mendukung filter IHSG).

---

## 💡 Panduan Eksekusi (Tactical Advice)
1. **Gunakan `/analysis` untuk Keyakinan:** Sebelum entry, pastikan skor Hybrid di atas 70%.
2. **Waktu Emas:** Lakukan analisa pada jam **09:05** (Open) dan **14:50** (Pre-closing).
3. **Disiplin Exit:** Selalu gunakan angka **Stop Loss** yang diberikan bot.

---
*Disclaimer: Investasi saham memiliki resiko. Gunakan bot ini sebagai alat bantu analisa, bukan satu-satunya dasar pengambilan keputusan.*
## 🚀 Cara Menjalankan & Mengelola Bot

Pastikan Anda sudah mengonfigurasi file .env dengan benar sebelum memulai.

### 1. Instalasi
```bash
npm install
```

### 2. Menjalankan di Production (Background Mode)
Gunakan perintah ini agar bot tetap menyala meskipun terminal ditutup:
```bash
npm start
```

### 3. Pemantauan & Log
Untuk melihat aktivitas bot secara real-time:
```bash
npm run logs
```
Untuk melihat status kesehatan bot:
```bash
npm run status
```

### 4. Pemeliharaan
*   **Restart Bot** (Gunakan setelah mengubah .env): `npm run restart`
*   **Matikan Bot**: `npm stop`

## 🛠️ Tech Stack
*   **Engine**: Node.js v20+ (ESM)
*   **Process Manager**: PM2 (Cluster/Fork Mode)
*   **Database**: SQLite (Local) / Ready for Supabase (Cloud)
*   **AI**: Google Gemini 1.5/2.5 Flash
*   **Indicators**: Custom Built (MACD, RSI, ATR, Support/Resistance)

