# MBKM Pembimbing

Sistem pembagian dosen pembimbing MBKM (Merdeka Belajar – Kampus Merdeka) TA 2026/2027 untuk Universitas Duta Bangsa, lengkap dengan fitur upload bukti magang (Penyerahan, Supervisi, Penarikan) via link Google Drive.

## Fitur

- **Login** — NextAuth (Credentials), 2 peran: `ADMIN` dan `DOSEN`
- **Dashboard** — ringkasan jumlah mahasiswa & bukti per jenis
- **Data Pembagian** — 38 mahasiswa + dosen pembimbing (dari file Excel resmi), pencarian, rekap per dosen (admin)
- **Upload Bukti** — 3 jenis: Penyerahan Magang / Supervisi / Penarikan; bukti berupa **link Google Drive** (file atau folder); dosen hanya bisa mengelola bukti mahasiswa bimbingannya, admin bebas
- **Filter & pencarian bukti**, hapus bukti milik sendiri

## Akun Seed

- Admin: `admin@udb.ac.id`
- Dosen: `<nama>@udb.ac.id` (contoh: `eko@udb.ac.id`, `afu@udb.ac.id`, …) — password per dosen dibuat saat seeding

## Teknologi

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Prisma + MySQL (VPS-B `mbkm_pembimbing_db`)
- NextAuth v4 (JWT session)

## Setup Lokal

```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

## Deploy Vercel

Env yang dibutuhkan:
- `DATABASE_URL` — MySQL remote
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` — domain produksi
