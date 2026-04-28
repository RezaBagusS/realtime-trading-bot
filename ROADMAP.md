# 🗺️ Project Roadmap: IDX Smart Trading Bot

Project ini mengikuti jalur pengembangan evolusioner: **Performance ➔ Intelligence ➔ Monetization**.

---

## 🟢 FASE 1: The Pro Trader (Current Focus - Short Term)
**Tujuan:** Membangun akurasi sinyal dan sistem monitoring otomatis.
- [x] **Modular Refactoring:** Struktur kode skalabel.
- [x] **Dual Focus Mode:** Scalping (1H) & Swing (Daily).
- [ ] **Technical Upgrade:**
    - Tambahkan konfirmasi **EMA 20/50/200** (Golden Cross / Death Cross).
    - Tambahkan konfirmasi **MACD** & **Volume Spike**.
- [ ] **Auto-Screener Engine:**
    - Sistem yang otomatis scan Top 20 Saham IDX (LQ45) setiap jam.
    - Alert otomatis ke Telegram jika ada saham yang memasuki zona *Oversold*.
- [ ] **Basic Backtester:** Script sederhana untuk cek win-rate strategi RSI di 6 bulan terakhir.

---

## 🔵 FASE 2: The AI Quant Analyst (Long Term)
**Tujuan:** Menggunakan AI untuk sentiment pasar dan interaksi cerdas.
- [ ] **News Scraper:** Integrasi berita dari portal finansial (CNBC Indonesia/Kontan).
- [ ] **Gemini AI Integration:**
    - Fitur `/tanya [ticker]` untuk mendapatkan ringkasan fundamental & teknikal berbasis AI.
    - Sentiment Analysis: Menilai apakah berita emiten cenderung *Bullish* atau *Bearish*.
- [ ] **Portfolio Tracker:** Sistem pencatatan jual-beli personal di dalam bot.

---

## 🟡 FASE 3: The Business Owner (Expansion)
**Tujuan:** Mengubah bot menjadi platform SaaS (Software as a Service).
- [ ] **User Management:** Database (SQLite) untuk mengelola data user & status berlangganan.
- [ ] **Subscription System:** 
    - Tiering: Free (Limit 3 cek/hari) vs VIP (Unlimited + Auto-Screener).
    - Payment Integration (Midtrans/Xendit).
- [ ] **Admin Command:** Broadcast berita/sinyal khusus ke seluruh member VIP.

---

## 📈 Log Perubahan (Changelog)
- **v2.1 (Current):** Refactoring Modular, Dual-Focus (Scalp/Swing), README Docs.
- **v1.0:** Initial basic RSI bot.

---
*Roadmap ini akan diperbarui secara berkala seiring berjalannya pengembangan.*
