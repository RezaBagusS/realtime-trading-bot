# 🗺️ Project Roadmap: IDX Smart Trading Bot

Project ini mengikuti jalur pengembangan evolusioner: **Performance ➔ Intelligence ➔ Monetization**.

---

## ✅ FASE 1: The Pro Trader (COMPLETED)
**Tujuan:** Membangun akurasi sinyal dan sistem manajemen resiko otomatis.
- [x] **Modular Architecture:** Pemisahan logic service, utils, dan formatter.
- [x] **Balanced Scoring (v3.5):** Integrasi EMA, MACD, dan Breakout detection.
- [x] **Dual Timeframe Engine:** Deteksi otomatis strategi Scalp (1H) vs Swing (Daily).
- [x] **Long-Only Logic:** Fokus pada akumulasi (Buy) & Wait, menghapus kebisingan sinyal jual.
- [x] **Adaptive ATR Exits:** TP/SL dinamis mengikuti volatilitas pasar.
- [x] **Backtester v1.12:** Simulasi detail dengan log transaksi riil.

---

## 🔵 FASE 2: The AI Quant Analyst (Current Phase)
**Tujuan:** Menggabungkan analisa Teknikal dengan Sentimen Berita & AI.

### 1. News Sentiment Engine
- [ ] **Multi-Source Scraper:** CNBC Indonesia, Kontan, dan Bisnis.com.
- [ ] **Gemini AI Analysis:** Ekstraksi sentimen (-1 s/d 1) dari berita saham.
- [ ] **Hybrid Sentiment Score:** Penggabungan analisa teknikal & sentimen berita.

### 2. Risk Management Pro
- [ ] **IHSG Index Filter:** Deteksi kondisi pasar global sebagai "Kill-Switch".
- [ ] **Drawdown Calculator:** Menghitung resiko penurunan saldo di backtest.

### 3. Interactive AI
- [ ] **Command `/tanya`:** Konsultasi portofolio & analisa berita via Gemini.

---

## 🟡 FASE 3: The Business Owner (Expansion)
- [ ] **VIP Subscription System.**
- [ ] **Payment Gateway Integration.**
- [ ] **Web Dashboard Analytics.**

---
*Last Modified: 29 April 2026 - Phase 1 Finalized*
