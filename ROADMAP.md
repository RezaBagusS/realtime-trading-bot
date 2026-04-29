# 🗺️ Project Roadmap: IDX Smart Trading Bot

Project ini mengikuti jalur pengembangan evolusioner: **Performance ➔ Intelligence ➔ Monetization**.

---

## ✅ FASE 1: The Pro Trader (STATUS: COMPLETED)
**Tujuan:** Membangun mesin analisa teknikal yang akurat dan sistem manajemen resiko otomatis.

- [x] **Modular Architecture (v2.0):** Pemisahan yang bersih antara Services (TV, DB, Telegram) dan Utils (Indicators, Formatter).
- [x] **Balanced Scoring (v3.5):** Algoritma penilaian teknikal 0-100 menggunakan perpaduan EMA, MACD, dan Price Action.
- [x] **Dual Timeframe Strategy:** Sistem cerdas yang bisa membedakan rekomendasi **Scalping (1H)** dan **Swing (Daily)**.
- [x] **Long-Only Logic (v3.5):** Optimasi untuk pasar spot dengan filter sinyal "Wait & See" dan "Avoid".
- [x] **Adaptive ATR Exits (v3.5):** Manajemen resiko otomatis dengan pengali ATR yang berbeda untuk setiap strategi.
- [x] **Advanced Backtester (v1.12):** Simulasi dengan log detail, kalkulasi saldo, dan force-close floating trades.

---

## 🔵 FASE 2: The AI Quant Analyst (STATUS: NEXT STEP)
**Tujuan:** Mengintegrasikan AI untuk membaca sentimen pasar dan berita fundamental.

### 1. Intelligence Layer
- [ ] **News Scraper Service:** Integrasi scraper untuk CNBC Indonesia, Kontan, dan Bisnis.com.
- [ ] **Gemini AI Sentiment Analysis:** Mengklasifikasikan berita menjadi skor sentimen positif/negatif.
- [ ] **Hybrid Decision Engine:** Gabungan skor teknikal (70%) dan skor sentimen (30%).

### 2. Market Risk Context
- [ ] **IHSG Global Filter:** Sistem "Safety Switch" jika kondisi bursa sedang crash.
- [ ] **Sectoral Pulse:** Deteksi pergerakan modal antar sektor saham.

### 3. Professional Metrics
- [ ] **Portfolio Drawdown Analysis:** Menghitung resiko penurunan modal secara historis.
- [ ] **Sharpe Ratio & Profit Factor:** Metrik profesional untuk menilai efisiensi strategi.

---

## 🟡 FASE 3: The Business Owner (STATUS: PLANNED)
- [ ] **VIP Subscription System.**
- [ ] **Payment Gateway Integration.**
- [ ] **Web Dashboard Analytics.**

---
*Dokumentasi ini telah disinkronkan dengan Source Code v3.5 - 29 April 2026*
