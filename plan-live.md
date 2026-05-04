# 🚀 Zenith AI Live Production Plan
**Target Version: v5.0 (SaaS Ready)**

Dokumen ini merinci langkah-langkah, infrastruktur, dan estimasi biaya untuk mengoperasikan Zenith AI sebagai layanan publik (subscription-based).

---

## 💰 1. Rincian Estimasi Biaya (Monthly OpEx)

### Skala Starter (1 - 50 User)
*Cocok untuk Validasi Pasar & Grup Komunitas Terbatas.*

| Komponen | Layanan | Biaya (Estimasi) |
| :--- | :--- | :--- |
| **Hosting** | VPS (IDCloudHost / DigitalOcean) - 1GB RAM | Rp 75.000 |
| **AI API** | Gemini Flash (Free Tier + Key Rotation) | Rp 0 |
| **Database** | SQLite (Local Storage) | Rp 0 |
| **Domain** | Subdomain / No Domain | Rp 0 |
| **TOTAL** | | **~Rp 75.000 / bln** |

### Skala Growth (50 - 200 User)
*Cocok untuk Bot Berbayar yang Stabil.*

| Komponen | Layanan | Biaya (Estimasi) |
| :--- | :--- | :--- |
| **Hosting** | VPS (2GB RAM / 2 Core) | Rp 150.000 |
| **AI API** | Gemini Flash (Paid Tier - Pay As You Go) | Rp 100.000 |
| **Database** | Supabase (Free Tier) | Rp 0 |
| **Monitoring** | Logtail / Sentry (Free Tier) | Rp 0 |
| **TOTAL** | | **~Rp 250.000 / bln** |

---

## 🏗️ 2. Langkah Strategis (Migration Roadmap)

### Phase 1: Cloud Migration
1.  **Migrasi Database**: Pindah dari SQLite ke **Supabase (PostgreSQL)**.
2.  **API Upgrade**: Daftarkan kartu kredit ke Google Cloud Console untuk mendapatkan kuota **Gemini Paid Tier** (mencegah limit 429).
3.  **Deployment**: Setup VPS menggunakan **Ubuntu 22.04** dan **PM2** (Cluster Mode).

### Phase 2: User & Monetization
1.  **User Tiers**: Implementasi fitur `/subscribe` atau `/premium`.
2.  **Payment Link**: Integrasi link pembayaran otomatis (Midtrans/QRIS).
3.  **Usage Quota**: Membatasi jumlah cek saham per hari untuk user gratisan.

---

### 📊 3. Proyeksi Keuntungan
*Asumsi harga jual subscription: **Rp 50.000 / bln / user***

*   **10 User**: Profit Bersih **Rp 425.000**
*   **50 User**: Profit Bersih **Rp 2.425.000**
*   **100 User**: Profit Bersih **Rp 4.750.000**

---

## 🛡️ 4. Risk Management (Production)
*   **Auto-Restart**: Menggunakan PM2 untuk menjaga bot tetap online.
*   **Secret Management**: Menggunakan file `.env` yang terpisah dan tidak di-push ke GitHub publik.
*   **Backup**: Melakukan backup database secara mingguan.

---
*Dokumen ini diperbarui secara berkala sesuai perkembangan teknologi Zenith AI.*
