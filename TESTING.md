# Cara Test CafeQR

Ada dua mode. Karena Cloud Functions butuh **Blaze plan**, mode Firebase belum
bisa membuat pesanan sampai Blaze diaktifkan. Untuk mencoba alur penuh sekarang,
pakai **Mode Demo**.

---

## Mode Demo (rekomendasi untuk sekarang — tanpa Blaze)

Matikan Firebase sementara, jalankan dev, lalu balikkan lagi.

**Windows (CMD):**

```bat
ren .env.local .env.local.bak
npm run dev
```

**Windows (PowerShell):**

```powershell
Rename-Item .env.local .env.local.bak
npm run dev
```

Buka `http://localhost:3000` dan uji:

| Halaman                    | Aksi                        | Harapan                                                   |
| -------------------------- | --------------------------- | --------------------------------------------------------- |
| `/`                        | —                           | Daftar 3 cafe demo                                        |
| `/c/kopi-senja/table/1`    | Pilih menu, isi nama, Pesan | Pindah ke halaman tracking                                |
| `/c/kopi-senja/order/<id>` | —                           | Status "Menunggu Konfirmasi"                              |
| `/c/kopi-senja/admin`      | PIN `1234`                  | Masuk dashboard                                           |
| Dashboard                  | Klik tombol maju di kartu   | hanya transisi sah: Menunggu → Disiapkan → Siap → Selesai |
| Dashboard                  | Lihat tombol saat "Siap"    | tidak ada tombol batal (sudah final)                      |
| `/c/kopi-senja/admin/qr`   | —                           | Grid QR meja                                              |
| `/superadmin`              | —                           | Terbuka (mode demo)                                       |

Balikkan ke Firebase:

```bat
ren .env.local.bak .env.local
```

---

## Mode Firebase (setelah Blaze + Auth siap)

### 1. Upgrade Blaze (sekali saja)

`firebase deploy --only functions` akan gagal dengan:

> Your project web-pos-cafe must be on the Blaze (pay-as-you-go) plan…

Klik tautan upgrade di pesan itu, atau Firebase Console → **Usage and billing**
→ **Modify plan** → **Blaze**. Ada free tier; biaya test normalnya ~Rp0.

### 2. Aktifkan Auth + buat akun

Firebase Console → **Authentication** → **Get started** →
**Sign-in method** → aktifkan **Email/Password**.

Lalu tab **Users** → **Add user**, buat 1 akun, mis.
`admin@cafeqr.test` dengan password bebas (min 6 karakter).

### 3. Set custom claim

```bat
npm run set-claims -- reseller admin@cafeqr.test
npm run set-claims -- admin admin@cafeqr.test kopi-senja
```

> Butuh Application Default Credentials. Jalankan sekali:
> `gcloud auth application-default login`
> (atau set `GOOGLE_APPLICATION_CREDENTIALS` ke service account key.)

### 4. Deploy functions

```bat
npm run deploy:functions
```

### 5. Jalankan dev & test

```bat
npm run dev
```

Uji keamanannya:

| Skenario                                       | Hasil yang benar                       |
| ---------------------------------------------- | -------------------------------------- |
| `/c/kopi-senja/admin` → login email+password   | Masuk (punya claim `admin_kopi-senja`) |
| `/c/kopi-senja/admin` → login akun tanpa claim | Ditolak: "Akun ini tidak berhak…"      |
| Buat order dari halaman meja                   | Sukses; `total` dihitung server        |
| Coba tulis order dari konsol browser           | **Gagal** (create dimatikan rules)     |
| Set status `pending → completed` dari konsol   | **Ditolak** (transisi tak sah)         |
| `/superadmin` → login bukan reseller           | Ditolak                                |

---

## Alternatif: Emulator (tanpa Blaze, tanpa sentuh produksi)

Set di `.env.local`:

```
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
```

Lalu:

```bat
npm run emulators
```

Di terminal lain:

```bat
npm run dev
```

Emulator UI: `http://localhost:4000` (buat user & atur claim di sana).

---

## Catatan build

`npm run build` memakai `--webpack` karena Next.js 16.2.9 + Turbopack punya bug
pada `next/font/google`. Gunakan `npm run build:turbo` saat upstream diperbaiki.
