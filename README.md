# 🚀 IDX Smart Trading Bot v3.6 (The Market-Aware Pro)

Bot sinyal trading otomatis untuk saham IDX (Indonesia Stock Exchange) yang menggabungkan analisa teknikal pro, manajemen resiko adaptif, dan kesadaran kondisi pasar global (IHSG).

## ✨ Fitur Utama
- **IHSG Global Filter (v3.6):** Bot memantau indeks IHSG sebagai *Safety Switch*. Skor saham otomatis dipotong jika kondisi bursa sedang *Bearish*.
- **Dual-Strategy Detection:** Deteksi otomatis strategi **Scalping (1H)** atau **Swing Trading (Daily)**.
- **Balanced Scoring System:** Penilaian teknikal (0-100) berbasis Tren, Momentum, Struktur, dan **Market Context**.
- **Long-Only Logic:** Fokus pada sinyal **BUY**, **WAIT & SEE**, dan **AVOID**.
- **Adaptive Exits (ATR-Based):** Manajemen resiko otomatis mengikuti volatilitas pasar.
- **Advanced Backtester v1.12:** Simulasi detail dengan log transaksi riil.

---

## 🤖 Panduan Perintah Telegram
Gunakan perintah berikut langsung di bot Telegram Anda:

### 🔍 Analisa & Sinyal (Live)
- `/cek [TICKER]` - Menjalankan **Logic Engine v3.6** secara instan. Memberikan skor teknikal, status IHSG, area entry, dan target profit/stop-loss.
- `/start` - Memulai interaksi.
- `/help` - Panduan lengkap.

### 📡 Radar & Watchlist (Automated)
- `/add [TICKER]` - Memasukkan saham ke radar. Bot akan menjalankan fungsi `/cek` secara otomatis setiap jam.
- `/del [TICKER]` - Menghapus dari radar.
- `/list` - Cek isi radar.

---

## 📈 Validasi Strategi (Terminal Simulator)
- **Backtest Engine (v1.12):** Jalankan `node backtest.js [ticker]`.
- **Kegunaan:** Menguji performa logic bot selama 350 hari ke belakang.

---

## 💡 Panduan Eksekusi (Tactical Advice)
1. **Waktu Emas Analisa:** Lakukan `/cek` manual pada jam **09:05** dan **14:50**.
2. **Sinyal Radar Berulang:** Konfirmasi tren kuat jika muncul setiap jam.
3. **Disiplin Exit:** Selalu gunakan angka **Stop Loss** yang diberikan bot.

---
*Disclaimer: Investasi saham memiliki resiko. Gunakan bot ini sebagai alat bantu analisa, bukan satu-satunya dasar pengambilan keputusan.*