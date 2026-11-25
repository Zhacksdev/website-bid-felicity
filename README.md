# Felicity Vol. 4 — Art Auction

Website pelelangan karya seni untuk Felicity Vol. 4, Dies Natalis Telkom Art.

## Stack

- **Next.js 14** (App Router, Server Components)
- **Supabase** — PostgreSQL + Realtime WebSocket
- **Tailwind CSS** — custom crimson & gold design system
- **Vercel** — deployment target

---

## Setup Supabase

### 1. Buat project di https://supabase.com

### 2. Jalankan schema SQL

Buka **SQL Editor** di Supabase dashboard, copy-paste isi file `supabase/schema.sql`, dan jalankan.

### 3. Aktifkan Realtime (jika SQL gagal)

Buka **Database → Replication**, klik "supabase_realtime", lalu enable tabel:
- `artworks`
- `bids`
- `auction_config`

---

## Setup Environment Variables

Copy `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Isi nilai:

| Variable | Dari mana |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role secret |
| `ADMIN_PASSWORD` | Bebas, password untuk masuk /admin |
| `ADMIN_SECRET_TOKEN` | String random panjang, misal: `openssl rand -hex 32` |

---

## Jalankan Lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000

---

## Deploy ke Vercel

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "init: felicity art auction"
git remote add origin https://github.com/username/felicity-bid.git
git push -u origin main
```

### 2. Import di Vercel

1. Buka https://vercel.com/new
2. Import repo GitHub
3. Tambahkan semua environment variables dari `.env.local`
4. Deploy!

---

## Halaman

| URL | Deskripsi |
|-----|-----------|
| `/` | Halaman publik — lihat karya & bid |
| `/admin` | Panel admin (dilindungi password) |

---

## Fitur Admin (`/admin`)

### Tab KARYA
- Tambah karya baru (judul, deskripsi, URL gambar, harga awal)
- Aktifkan/nonaktifkan karya (tutup bid untuk karya tertentu)
- Hapus karya beserta semua bid-nya

### Tab TIMER
- Set durasi (menit) lalu klik MULAI
- Tombol preset: 10m, 15m, 30m, 60m
- Perpanjang timer: +5m, +10m, +15m, +30m
- Stop timer kapan saja

---

## Fitur Publik (`/`)

- Melihat semua karya dengan bid tertinggi secara real-time
- Countdown timer sinkron di semua device
- Klik **BID NOW** → modal isi nama + jumlah bid
- Klik **RANKING** → leaderboard top 10 bidder per karya
- Minimum bid: harga tertinggi saat ini + Rp 10.000
- Validasi atomic di database — tidak ada race condition

---

## Arsitektur Realtime

```
Browser user ──WebSocket──► Supabase Realtime
                              │
                              ├── artworks (INSERT/UPDATE/DELETE)
                              ├── bids (INSERT)
                              └── auction_config (UPDATE)
```

Semua user mendapat update bid & timer secara real-time tanpa reload.
Supabase Realtime menggunakan multiplexed WebSocket — scalable untuk ratusan user serentak.

---

## Keamanan

- Admin API routes diproteksi dengan `x-admin-token` header
- Token diverifikasi server-side terhadap `ADMIN_SECRET_TOKEN` env var
- Bid divalidasi atomic di PostgreSQL function (mencegah race condition & overbid)
- Service role key hanya ada di server, tidak pernah dikirim ke client
