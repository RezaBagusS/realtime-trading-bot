# 🚀 IDX Real-time Trading Signal Bot v2.7

Bot Telegram otomatis untuk menganalisa sinyal trading saham Indonesia (IDX).

## ✨ Fitur Utama
- **Smart Recommendation (Double-Scan)**: Analisa 1H & Daily sekaligus.
- **Advanced Price Action**: Stochastic RSI (3,3) + Support & Resistance otomatis.
- **Auto-Screener Engine**: Monitor watchlist Anda setiap jam (Market Hours).
- **Basic Backtester**: Uji strategi Anda pada data historis 1 tahun terakhir.

---

## 📖 Cara Penggunaan

### Perintah Telegram
- `/cek [TICKER]` - Analisa mendalam (Double-Scan).
- `/add [TICKER]` - Tambah ke radar screener.
- `/list` - Cek daftar pantauan.

### Menjalankan Backtest (Terminal)
Untuk melihat performa strategi di masa lalu:
```bash
node backtest.js [TICKER]
# Contoh: node backtest.js ADRO
```

---

## 🚀 Instalasi
1. Clone repo & `npm install`.
2. Isi `.env`.
3. Jalankan `npm run dev`.

---
*Fase 1 Selesai. Siap melangkah ke Fase 2 (AI Analyst).*