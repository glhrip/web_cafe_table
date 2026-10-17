# Keamanan CafeQR

Dokumen ini menjelaskan model otorisasi dan cara mengaktifkannya. **PIN admin
tidak lagi menjadi pengamanan** — ia hanya gerbang UX di mode demo. Keamanan
data ditegakkan oleh Firebase Auth + custom claims + Firestore Rules + Cloud
Functions.

## Model otorisasi (custom claims)

| Claim                | Arti                                            |
| -------------------- | ----------------------------------------------- |
| `reseller: true`     | Boleh membuat/mengubah/menghapus tenant.        |
| `admin_<slug>: true` | Boleh mengelola menu & status pesanan `<slug>`. |
| `slug: "<slug>"`     | Slug yang diadmini (kenyamanan UI saja).        |

`firestore.rules` mengecek claim ini langsung dari token (`request.auth.token`).

## Yang dilindungi

- **Tenant** — hanya `reseller` yang bisa create/delete. Update branding hanya
  oleh admin tenant atau reseller, dan hanya field yang diizinkan.
- **Menu** — tulis hanya oleh admin tenant (`admin_<slug>`).
- **Orders**
  - `create` dari client **dimatikan**. Pesanan hanya dibuat lewat Cloud
    Function `createOrder` (Admin SDK) yang **menghitung harga & total dari
    koleksi menu di server**, sehingga tidak bisa dipalsukan.
  - `update` hanya mengubah field `status`, hanya oleh admin tenant, dan hanya
    bila transisinya sah (state machine `pending → preparing → ready →
completed`, batal hanya dari `pending`/`preparing`).

## Setup produksi

1. **Aktifkan Firebase Auth** (Email/Password) di Firebase Console.
2. **Buat akun**:
   - Admin tiap cafe: mis. `admin@kopisenja.com`.
   - Reseller: mis. `owner@platform.com`.
3. **Set claim** (butuh kredensial admin / service account):

   ```bash
   # reseller
   node functions/scripts/set-claims.js reseller owner@platform.com

   # admin sebuah cafe
   node functions/scripts/set-claims.js admin admin@kopisenja.com kopi-senja
   ```

   Claim baru berlaku setelah user logout/login ulang.

4. **Deploy rules & functions**:

   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only functions
   ```

## Menyetel claim dari aplikasi

Cloud Function `setAdminRole` memungkinkan reseller menetapkan claim admin dari
panel `/superadmin` tanpa terminal:

```
setAdminRole({ uid: "<uid-user>", slug: "kopi-senja", enabled: true })
```

Hanya bisa dipanggil oleh user dengan claim `reseller`.

## Mode demo

Tanpa `.env.local` (tanpa API key), aplikasi jalan tanpa Auth/Firestore asli:
data in-memory, PIN `1234`, panel `/superadmin` terbuka. Ini **hanya untuk
presentasi** dan tidak boleh dipakai di produksi.

## Catatan

- Kunci API Firebase di client memang publik; keamanan berasal dari rules +
  claim, bukan dari menyembunyikan config.
- Cloud Function `createOrder` menyimpan `createdByUid` (null bila anonim) untuk
  audit.
- Batas wajar: maksimal 100 jenis item, qty per item ≤ 99, total < 1e9.
