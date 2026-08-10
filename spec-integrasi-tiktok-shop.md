# Spec Teknis: Integrasi TikTok Shop ke Papan Promo (Larisin)

Dokumen ini untuk dibawa ke Claude Code (tempat project Next.js + Supabase Larisin dibangun). Fokus fase 1: integrasi TikTok Shop dulu. Pola yang dipakai di sini didesain reusable, supaya Shopee & Tokopedia tinggal ikut pola yang sama di fase berikutnya.

Status partner: 4 kualifikasi TikTok Shop Partner Center sudah **Disetujui** — Connectors, Multi-Channel Management, Promotions, Analytics & Reporting. App Key & App Secret sudah bisa diambil dari Partner Center.

---

## 1. Tujuan Integrasi

Ganti alur yang sekarang manual (tambah produk manual, event di-seed manual, submit cuma nyimpen ke tabel `submissions` tanpa benar-benar mendaftar ke TikTok) jadi terhubung ke API asli:

1. Seller connect toko TikTok Shop-nya lewat OAuth.
2. Produk ditarik otomatis dari toko (opsional, "tambah manual" tetap ada sebagai fallback).
3. Daftar event/campaign di halaman "Event & Promo" diisi dari data real TikTok (Promotion API), bukan cuma data manual.
4. Tombol submit benar-benar memanggil API TikTok untuk mendaftarkan produk ke campaign, hasilnya masuk ke "Riwayat Submit".

---

## 2. Alur OAuth (Authorization)

TikTok Shop pakai OAuth 2.0 authorization code flow:

1. **Redirect ke authorization URL** — dari halaman "Pengaturan Akun", tombol "Hubungkan TikTok Shop" mengarahkan seller ke URL otorisasi TikTok (berisi `app_key`, `state`, `redirect_uri`) untuk login & approve scope.
2. **Callback dengan authorization code** — TikTok redirect balik ke `redirect_uri` kita dengan query param `code` dan `state`.
3. **Tukar code jadi token** — server-side (API route Next.js) exchange `code` + `app_key` + `app_secret` ke endpoint token TikTok, dapat balik: `access_token`, `refresh_token`, `expires_in`, `open_id`, `shop_cipher`/`shop_id`, `scope`.
4. **Simpan koneksi** — simpan token (terenkripsi) ke tabel baru `marketplace_connections`.
5. **Refresh token** — `access_token` TikTok umurnya pendek (biasanya hitungan jam), `refresh_token` lebih panjang. Perlu job terjadwal (Vercel Cron atau Supabase Edge Function) yang refresh token sebelum expired, supaya seller nggak perlu connect ulang terus-terusan.

Catatan implementasi: field & endpoint URL persis (path, versi API seperti `202309`/`202407`) sebaiknya dicek ulang langsung di **API Testing Tool** pada Partner Center saat mulai coding — TikTok sering versioning dokumentasinya dan ini yang paling akurat dibanding dokumentasi pihak ketiga.

**Env vars baru yang dibutuhkan (server-side only, jangan expose ke client):**
```
TIKTOK_APP_KEY=
TIKTOK_APP_SECRET=
TIKTOK_REDIRECT_URI=https://www.larisin.site/api/auth/tiktok/callback
```

---

## 3. Perubahan Skema Database (Supabase)

### Tabel baru: `marketplace_connections`
Menyimpan koneksi OAuth per seller per platform — dibuat generic dari awal supaya Shopee/Tokopedia tinggal nambah row baru dengan `platform` beda.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK -> profiles.id | |
| `platform` | text | `'tiktok'` \| `'shopee'` \| `'tokopedia'` |
| `shop_id` | text | ID toko di platform terkait |
| `shop_cipher` | text, nullable | khusus TikTok, dipakai di header request produk |
| `access_token` | text (encrypted) | |
| `refresh_token` | text (encrypted) | |
| `token_expires_at` | timestamptz | |
| `scope` | text | scope yang di-approve |
| `status` | text | `'connected'` \| `'expired'` \| `'revoked'` |
| `connected_at` | timestamptz | |
| `updated_at` | timestamptz | |

Enkripsi token: jangan simpan plain text. Pakai Supabase Vault, atau enkripsi di application layer sebelum insert (AES-256 dengan key dari env var terpisah).

### Perubahan tabel `products`
Tambah kolom:
- `source` (text) — `'manual'` \| `'tiktok_sync'` \| `'shopee_sync'` \| `'tokopedia_sync'`
- `platform_product_id` (text, nullable) — ID produk asli di TikTok Shop
- `marketplace_connection_id` (uuid, FK -> marketplace_connections.id, nullable)
- `last_synced_at` (timestamptz, nullable)

### Perubahan tabel `events`
(Sudah ada rencana tambah `butuh_diskon`, `butuh_foto` dari sesi sebelumnya — ditambah lagi:)
- `source` (text) — `'manual_curated'` \| `'tiktok_api'` — event yang ditarik otomatis dari Promotion API vs yang di-input manual admin
- `external_campaign_id` (text, nullable) — ID campaign asli di TikTok, dipakai saat submit ke API
- `platform_connection_required` (boolean) — kalau true, seller harus connect dulu sebelum bisa lihat/submit ke event ini

### Perubahan tabel `submissions`
- `external_submission_id` (text, nullable) — ID hasil submit dari TikTok API
- `platform_status` (text) — status asli dari TikTok (`pending`, `approved`, `rejected`), beda dari status internal kita
- `synced_at` (timestamptz, nullable)
- `sync_error` (text, nullable) — simpan pesan error kalau API call gagal, buat debugging

---

## 4. API Routes Baru (Next.js)

Semua di bawah `/app/api/tiktok/...` (App Router) atau `/pages/api/tiktok/...` sesuai struktur project yang sudah ada.

| Route | Method | Fungsi |
|---|---|---|
| `/api/auth/tiktok/connect` | GET | Generate authorization URL, redirect seller ke TikTok |
| `/api/auth/tiktok/callback` | GET | Terima `code`, exchange ke token, simpan ke `marketplace_connections` |
| `/api/tiktok/products/sync` | POST | Tarik daftar produk dari toko seller (Product API), upsert ke tabel `products` dengan `source='tiktok_sync'` |
| `/api/tiktok/promotions/list` | GET | Tarik daftar campaign/promotion yang eligible buat toko seller (Promotion API), upsert ke tabel `events` |
| `/api/tiktok/promotions/submit` | POST | Submit produk terpilih ke campaign terpilih, simpan hasil ke `submissions` |
| `/api/tiktok/token/refresh` | POST (internal/cron) | Refresh access_token pakai refresh_token sebelum expired |

Cron: `/api/tiktok/token/refresh` dipanggil terjadwal (Vercel Cron Job, misal tiap 6 jam) buat cek semua koneksi yang mau expired dan refresh otomatis.

---

## 5. Perubahan di UI (4 halaman existing)

**Pengaturan Akun** — tambah section "Koneksi Marketplace": tombol "Hubungkan TikTok Shop" (kalau belum connect) atau status "Terhubung sejak [tanggal]" + tombol "Putuskan Koneksi" (kalau sudah).

**Produk Saya** — tambah tombol "Tarik Produk dari TikTok Shop" (manual trigger sync). Badge kecil di tiap produk nunjukin asalnya (manual vs tiktok_sync). Fitur "tambah produk manual" tetap ada persis seperti sekarang.

**Event & Promo** — event dari TikTok Shop yang ditarik via API ditandai beda (misal badge "Live dari TikTok") dibanding event manual-curated lainnya (Shopee/Tokopedia yang masih manual buat sekarang). Multi-select checkbox & submit satu tombol (fitur yang lagi dikerjain) tetap dipakai, cuma sekarang tombol submit untuk event TikTok manggil `/api/tiktok/promotions/submit` beneran, bukan cuma nyimpen ke database lokal.

**Riwayat Submit** — tambah kolom/status yang refleksikan `platform_status` asli dari TikTok, bukan cuma status internal.

---

## 6. Urutan Implementasi yang Disarankan

1. **OAuth connect flow** (tabel `marketplace_connections` + 2 API route + UI di Pengaturan Akun). Ini fondasi, harus jalan duluan dan bisa dites end-to-end (connect → lihat status "Terhubung").
2. **Token refresh job** — jangan skip, karena tanpa ini integrasi bakal putus sendiri setelah beberapa jam/hari.
3. **Product sync** — tarik produk dari TikTok, tampil di "Produk Saya" dengan badge sumbernya.
4. **Promotion list sync** — tarik campaign real, tampil di "Event & Promo".
5. **Submit ke campaign (real API call)** — sambungkan tombol submit yang sudah ada ke endpoint asli, update "Riwayat Submit" dengan status real.
6. **(Opsional) Webhook** — kalau TikTok kasih webhook buat update status approval campaign, tambah endpoint listener biar Riwayat Submit auto-update tanpa perlu polling manual.

Setelah 6 langkah ini jalan & tervalidasi buat TikTok, pola yang sama (tabel `marketplace_connections` generic, kolom `source` di products/events/submissions) tinggal direplikasi untuk Shopee & Tokopedia — cuma beda di detail OAuth URL dan payload API masing-masing platform.

---

## 7. Hal yang Perlu Dicek Ulang Sebelum/Saat Coding

- Path endpoint API persis & versi terbaru (`v2/...`, tanggal versi seperti `202407`) — cek di API Testing Tool Partner Center, karena TikTok sering update versi dokumentasi.
- Rate limit per endpoint (umumnya ada batas QPS dan limit harian) — perlu retry/backoff logic di API route.
- Format `shop_cipher` — beberapa endpoint TikTok Shop butuh header ini selain `access_token`, pastikan disimpan saat callback OAuth.
- Kebijakan penyimpanan token: pastikan sesuai syarat keamanan TikTok Partner (biasanya ada requirement token harus dienkripsi at-rest).
