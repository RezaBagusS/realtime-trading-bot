# 🚀 IDX Smart Trading Bot v3.8 (The News-Aware Edition)

Bot sinyal trading otomatis untuk saham IDX (Indonesia Stock Exchange) yang menggabungkan analisa teknikal pro, manajemen resiko adaptif, kesadaran kondisi pasar global (IHSG), dan agregasi berita real-time.

## ✨ Fitur Utama
- **Intelligence News Layer (v3.8):** Bot mengumpulkan berita terbaru dari sumber kredibel (CNBC, Kontan, Investing, Bisnis.com) via Google News Aggregator.
- **IHSG Global Filter (v3.6):** Bot memantau indeks IHSG sebagai *Safety Switch*. Skor saham otomatis dipotong jika kondisi bursa sedang *Bearish*.
- **Dual-Strategy Detection:** Deteksi otomatis strategi **Scalping (1H)** atau **Swing Trading (Daily)**.
- **Balanced Scoring System:** Penilaian teknikal (0-100) berbasis Tren, Momentum, Struktur, dan **Market Context**.
- **Adaptive Exits (ATR-Based):** Manajemen resiko otomatis mengikuti volatilitas pasar.
- **Advanced Backtester v1.15:** Simulasi detail dengan log transaksi riil dan integrasi filter IHSG.

---

## 🤖 Panduan Perintah Telegram
Gunakan perintah berikut langsung di bot Telegram Anda:

### 🔍 Analisa & Berita (Live)
- `/cek [TICKER]` - Menjalankan **Logic Engine v3.8** secara instan. Memberikan skor teknikal, status IHSG, area entry, dan target profit/stop-loss.
- `/news [TICKER]` - Menampilkan 5 berita terbaru emiten untuk analisa fundamental kilat.
- `/help` - Panduan lengkap.

### 📡 Radar & Watchlist (Automated)
- `/add [TICKER]` - Memasukkan saham ke radar. Bot akan memindai otomatis setiap jam.
- `/del [TICKER]` - Menghapus dari radar.
- `/list` - Cek isi radar.

---

## 📈 Validasi Strategi (Terminal Simulator)
- **Backtest Engine (v1.15):** Jalankan `node backtest.js [ticker]`.
- **Kegunaan:** Menguji performa logic bot selama 350 hari ke belakang (Sudah mendukung filter IHSG).

---

## 💡 Panduan Eksekusi (Tactical Advice)
1. **Waktu Emas Analisa:** Lakukan `/cek` manual pada jam **09:05** dan **14:50**.
2. **Cek Berita Sebelum Entry:** Gunakan `/news` untuk memastikan tidak ada sentimen negatif mendadak.
3. **Disiplin Exit:** Selalu gunakan angka **Stop Loss** yang diberikan bot.

---
*Disclaimer: Investasi saham memiliki resiko. Gunakan bot ini sebagai alat bantu analisa, bukan satu-satunya dasar pengambilan keputusan.*