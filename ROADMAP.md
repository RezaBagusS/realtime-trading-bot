# 🗺️ Project Roadmap: Zenith AI Trading Engine

Project ini mengikuti jalur pengembangan evolusioner: **Performance ➔ Intelligence ➔ Monetization**.

---

## ✅ FASE 1: The Pro Trader (STATUS: COMPLETED)
**Tujuan:** Membangun mesin analisa teknikal yang akurat dan sistem manajemen resiko otomatis.
- [x] **Modular Architecture (v2.0)**
- [x] **Balanced Scoring (v3.5)**
- [x] **Dual Timeframe Strategy**
- [x] **Long-Only Logic (v3.5)**
- [x] **Adaptive ATR Exits (v3.5)**
- [x] **Advanced Backtester (v1.12)**

---

## 🔵 FASE 2: The AI Quant Analyst (STATUS: IN PROGRESS)
**Tujuan:** Menggabungkan analisa Teknikal dengan Sentimen Berita & AI.

### 1. Market Risk Context
- [x] **IHSG Global Filter (v3.6):** Sistem "Safety Switch" jika kondisi bursa sedang crash. (COMPLETED)

### 2. Intelligence Layer
- [x] **News Scraper Service (v3.8):** Aggregator berita via Google News RSS (CNBC, Kontan, Investing, Bisnis.com). (COMPLETED)
- [x] **Gemini AI Sentiment Analysis (v3.9):** Ekstraksi sentimen (-1 s/d 1) menggunakan model Gemini 2.5 Flash. (COMPLETED)
- [x] **Input Validation & Robust Error Handling (v3.9.5):** Verifikasi ticker real-time dan penanganan error yang user-friendly. (COMPLETED)
- [x] **Hybrid Decision Engine (v4.0):** Gabungan skor teknikal (70%) dan skor sentimen (30%). (COMPLETED)
- [x] **Sentiment Caching:** Menghemat kuota API Gemini (TTL 1 Jam). (COMPLETED)
- [x] **Risk & Position Sizing:** Kalkulator Lot & Management Resiko. (COMPLETED)
- [x] **Signal Tracker:** Mencatat performa sinyal (Real Winrate). (COMPLETED)
- [x] **Dynamic Weighting:** Penyesuaian bobot berdasarkan tipe saham. (COMPLETED)
- [x] **Advanced Logging & Monitoring (v4.5):** Pelacakan audit user dan status radar otomatis. (COMPLETED)
- [x] **Resilience & Connection Recovery:** Penanganan otomatis untuk gangguan jaringan TradingView/Telegram. (COMPLETED)

### 3. Professional Metrics
- [ ] **Portfolio Drawdown Analysis:** Menghitung resiko penurunan modal secara historis.
- [ ] **Sharpe Ratio & Profit Factor:** Metrik profesional untuk menilai efisiensi strategi.
- [ ] **Supabase Migration:** Pindah ke database cloud untuk stabilitas. (HOLD)

---

## 🟡 FASE 3: The Business Owner (STATUS: PLANNED)
- [ ] **VIP Subscription System.**
- [ ] **Payment Gateway Integration.**
- [ ] **Web Dashboard Analytics.**

---
*Dokumentasi telah disinkronkan dengan Source Code v4.5.5 - 04 Mei 2026*
