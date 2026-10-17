# CafeQR — Platform Pesan Meja untuk Cafe (White-label / Multi-tenant)

Satu aplikasi untuk **banyak cafe**. Tiap cafe punya halaman pesan sendiri,
branding sendiri (nama, logo, warna), menu sendiri, dan dashboard sendiri.
Cocok untuk dijual ulang ke beberapa pemilik cafe.

## Alur singkat

```
/                       → Landing platform: daftar semua cafe
/superadmin             → Panel reseller: buat & kelola akun cafe
/c/{slug}               → Halaman depan satu cafe (branding-nya sendiri)
/c/{slug}/table/{nomor} → Menu + keranjang pelanggan
/c/{slug}/order/{id}    → Tracking status pesanan (real-time)
/c/{slug}/admin         → Dashboard admin cafe (gerbang PIN)
/c/{slug}/admin/menu    → Kelola menu
/c/{slug}/admin/qr      → Buat & cetak QR per meja
/c/{slug}/admin/branding→ Atur nama, logo, warna cafe
```

## Menjalankan

```bash
npm install
npm run dev
# buka http://localhost:3000
```

### Mode demo vs Firebase

- **Tanpa `.env.local`** → otomatis **mode demo**: 3 cafe contoh (Kopi Senja,
  Matcha House, Kopi Biru Laut) dengan menu contoh, semua data in-memory.
  Perubahan tidak tersimpan permanen. PIN admin: `1234`. Panel `/superadmin`
  terbuka bebas. **Hanya untuk presentasi.**
- **Dengan `.env.local`** → memakai Firebase asli: Auth (admin/reseller),
  Firestore (data tersimpan permanen), dan Cloud Functions (validasi order).
  Lihat **[SECURITY.md](./SECURITY.md)** untuk model otorisasi & setup claim.

Isi `.env.local` (lihat `.env.local.example`):

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## Struktur data (Firebase)

```
tenants/{slug}                    → { name, tagline, logo, theme, owner, status }
tenants/{slug}/menu/{itemId}      → { name, price, category, description, image, popular }
tenants/{slug}/orders/{orderId}   → { tableNo, customerName, items, total, status, createdAt }
```

**Keamanan:** `firestore.rules` menegakkan Auth + custom claim (bukan PIN).
Pesanan pelanggan dibuat lewat Cloud Function `createOrder` di `functions/`
yang **menghitung ulang harga/total di server**. Setup lengkap ada di
**[SECURITY.md](./SECURITY.md)**.

```bash
# Jalankan emulator Firestore/Auth/Functions untuk uji lokal
npm run emulators

# Deploy rules & functions
npm run deploy:rules
npm run deploy:functions
```

## Kustomisasi branding

Tiap cafe mengatur brandnya sendiri dari **/c/{slug}/admin/branding**:

- **Nama & tagline** — muncul di header, judul tab, dan QR.
- **Logo** — URL gambar; kalau kosong memakai inisial nama.
- **Warna brand & aksen** — palet turunan (terang/gelap) dihitung otomatis
  oleh `src/lib/theme.js`. Ada 8 preset siap pakai.

## Arsitektur kode

```
src/
  app/
    page.js                     # Landing platform
    layout.js                   # Font & metadata global
    superadmin/page.js          # Panel reseller
    c/[slug]/
      layout.js                 # TenantProvider (branding + tema)
      page.js                   # Landing cafe
      table/[id]/page.js        # Menu pelanggan
      order/[id]/page.js        # Tracking pesanan
      admin/                    # Dashboard (layout + 4 halaman)
  components/
    TenantProvider.js           # Context tenant + penerap tema CSS
    Brand.js, MenuCard.js, ...  # Komponen reusable
    admin/                      # AdminShell, PinGate, OrderCard, StatCard
  lib/
    tenants.js                  # CRUD cafe (tenant)
    db.js                       # Menu & pesanan per-tenant
    auth.js                     # Firebase Auth + custom claim admin/reseller
    theme.js                    # Util warna & palet
    constants.js                # Status, kategori, state machine transisi
    firebase.js, mock-data.js, format.js
functions/                      # Cloud Functions (validasi order server-side)
  index.js                      # createOrder (hitung total), setAdminRole
  scripts/set-claims.js         # Bootstrap claim lewat CLI
firestore.rules                 # Aturan keamanan (Auth + claim)
```

### Catatan build (Turbopack)

Next.js 16.2.9 + Turbopack punya bug pada `next/font/google`, sehingga
`npm run build` memakai webpack (`next build --webpack`). Tersedia juga
`npm run build:turbo` bila ingin mencoba Turbopack saat sudah diperbaiki.

## Menambah cafe baru

1. Buka **/superadmin** → klik **Tambah Cafe**.
2. Isi nama, slug (alamat URL), tagline, PIN admin, dan pilih tema.
3. Cafe langsung tersedia di `/c/{slug}`. Bagikan QR dari
   `/c/{slug}/admin/qr`.
