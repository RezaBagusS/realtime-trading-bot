# 🚀 IDX Smart Trading Bot v3.9.5 (The Robust AI Edition)

Bot sinyal trading otomatis untuk saham IDX (Indonesia Stock Exchange) yang menggabungkan analisa teknikal pro, kecerdasan buatan (Gemini AI), manajemen resiko adaptif, kesadaran kondisi pasar global (IHSG), dan agregasi berita real-time.

## ✨ Fitur Utama
- **🤖 AI Sentiment Analysis (v3.9.5):** Integrasi **Gemini 2.5 Flash** untuk menganalisis sentimen berita secara otomatis (-1 s/d 1) dan memberikan ringkasan eksekutif.
- **🛡️ Robust Input Validation:** Verifikasi emiten secara real-time ke bursa sebelum ditambahkan ke watchlist untuk mencegah data sampah.
- **Intelligence News Layer (v3.8):** Bot mengumpulkan berita terbaru dari sumber kredibel (CNBC, Kontan, Investing, Bisnis.com) via Google News Aggregator.
- **IHSG Global Filter (v3.6):** Bot memantau indeks IHSG sebagai *Safety Switch*. Skor saham otomatis dipotong jika kondisi bursa sedang *Bearish*.
- **Dual-Strategy Detection:** Deteksi otomatis strategi **Scalping (1H)** atau **Swing Trading (Daily)**.
- **Balanced Scoring System:** Penilaian teknikal (0-100) berbasis Tren, Momentum, Struktur, dan **Market Context**.
- **Adaptive Exits (ATR-Based):** Manajemen resiko otomatis mengikuti volatilitas pasar.

---

## 🤖 Panduan Perintah Telegram
Gunakan perintah berikut langsung di bot Telegram Anda:

### 🔍 Analisa & AI Sentiment (Live)
- `/cek [TICKER]` - Menjalankan **Logic Engine v3.9.5** secara instan. Memberikan skor teknikal, status IHSG, area entry, dan target profit/stop-loss.
- `/news [TICKER]` - Menampilkan berita terbaru + **Analisa Sentimen AI** menggunakan model Gemini terbaru.
- `/help` - Panduan lengkap.

### 📡 Radar & Watchlist (Automated)
- `/add [TICKER]` - Memasukkan saham ke radar (Melalui proses verifikasi bursa otomatis).
- `/del [TICKER]` - Menghapus dari radar.
- `/list` - Cek isi radar.

---

## 📈 Validasi Strategi (Terminal Simulator)
- **Backtest Engine (v1.15):** Jalankan `node backtest.js [ticker]`.
- **Kegunaan:** Menguji performa logic bot selama 350 hari ke belakang (Sudah mendukung filter IHSG).

---

## 💡 Panduan Eksekusi (Tactical Advice)
1. **Waktu Emas Analisa:** Lakukan `/cek` manual pada jam **09:05** dan **14:50**.
2. **Cek Sentimen AI:** Gunakan `/news` untuk melihat skor sentimen (-100% s/d 100%) sebelum mengambil keputusan entry.
3. **Disiplin Exit:** Selalu gunakan angka **Stop Loss** yang diberikan bot.

---
*Disclaimer: Investasi saham memiliki resiko. Gunakan bot ini sebagai alat bantu analisa, bukan satu-satunya dasar pengambilan keputusan.*