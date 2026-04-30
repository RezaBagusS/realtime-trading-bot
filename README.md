# 🚀 IDX Smart Trading Bot v4.0 (The Hybrid Engine Edition)

Bot sinyal trading otomatis untuk saham IDX (Indonesia Stock Exchange) yang menggabungkan analisa teknikal pro, kecerdasan buatan (Gemini AI), manajemen resiko adaptif, kesadaran kondisi pasar global (IHSG), dan agregasi berita real-time.

## ✨ Fitur Utama
- **💎 Hybrid Decision Engine (v4.0):** Menggabungkan **Technical Analysis (70%)** dan **AI Sentiment (30%)** untuk memberikan sinyal trading paling akurat dengan tingkat kepercayaan tinggi.
- **🤖 AI Sentiment Analysis (v3.9.5):** Integrasi **Gemini 2.5 Flash** untuk menganalisis sentimen berita secara otomatis (-1 s/d 1) dan memberikan ringkasan eksekutif.
- **🛡️ Robust Input Validation:** Verifikasi emiten secara real-time ke bursa sebelum ditambahkan ke watchlist untuk mencegah data sampah.
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