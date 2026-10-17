/**
 * Cloud Functions CafeQR.
 *
 * Fungsi utama:
 *   createOrder    — membuat pesanan dengan HARGA & TOTAL dihitung di server
 *                    dari koleksi menu, sehingga tidak bisa dipalsukan client.
 *   setAdminRole   — reseller menetapkan custom claim admin_<slug> untuk
 *                    sebuah akun (dipanggil dari panel /superadmin).
 *
 * Prinsip keamanan: client tidak dipercaya untuk harga. Semua perhitungan
 * uang dilakukan di sini memakai data menu yang tersimpan di Firestore.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

admin.initializeApp();

setGlobalOptions({ region: 'asia-southeast2', maxInstances: 10 });

/**
 * Beberapa nilai yang wajib selaras dengan src/lib/constants.js.
 * (Diduplikasi karena Node Functions tidak bisa mengimpor modul ESM Next.js.)
 */
const ORDER_STATUS_PENDING = 'pending';
const MAX_ITEMS = 100;
const MAX_QTY_PER_ITEM = 99;
const MAX_TOTAL = 1000000000; // batas wajar total pesanan

function assertString(value, field, maxLength = 200) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpsError('invalid-argument', `Field "${field}" wajib diisi.`);
  }
  if (value.length > maxLength) {
    throw new HttpsError('invalid-argument', `Field "${field}" terlalu panjang.`);
  }
  return value.trim();
}

/**
 * createOrder — panggilan callable dari halaman meja.
 *
 * Payload: { tenantId, tableNo, customerName, customerPhone?, paymentMethod?,
 *            items: [{ id, qty }] }
 * Output : { id, total }
 */
exports.createOrder = onCall(async (request) => {
  const data = request.data || {};
  const tenantId = assertString(data.tenantId, 'tenantId', 120);
  const tableNo = assertString(String(data.tableNo ?? ''), 'tableNo', 40);
  const customerName = assertString(data.customerName, 'customerName', 120);
  const customerPhone =
    typeof data.customerPhone === 'string' ? data.customerPhone.slice(0, 40) : '';
  const paymentMethod =
    data.paymentMethod === 'qris' ? 'qris' : 'kasir';

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new HttpsError('invalid-argument', 'Pesanan harus berisi minimal 1 item.');
  }
  if (data.items.length > MAX_ITEMS) {
    throw new HttpsError('invalid-argument', 'Jumlah jenis item melebihi batas.');
  }

  const db = admin.firestore();
  const tenantRef = db.collection('tenants').doc(tenantId);

  const tenantSnap = await tenantRef.get();
  if (!tenantSnap.exists) {
    throw new HttpsError('not-found', 'Cafe tidak ditemukan.');
  }
  if (tenantSnap.data().status === 'disabled') {
    throw new HttpsError('failed-precondition', 'Cafe sedang nonaktif.');
  }

  // Ambil harga asli dari server — bukan dari payload client.
  const items = [];
  let total = 0;
  for (const raw of data.items) {
    const id = assertString(raw?.id, 'items[].id', 200);
    const qty = Number(raw?.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) {
      throw new HttpsError('invalid-argument', 'Jumlah item (qty) tidak valid.');
    }
    const menuSnap = await tenantRef.collection('menu').doc(id).get();
    if (!menuSnap.exists) {
      throw new HttpsError('not-found', `Menu "${id}" tidak ditemukan.`);
    }
    const menu = menuSnap.data();
    const price = Number(menu.price) || 0;
    if (price < 0) {
      throw new HttpsError('failed-precondition', `Harga menu "${id}" tidak valid.`);
    }
    total += price * qty;
    items.push({ id, name: menu.name || '', price, qty });
  }

  if (total > MAX_TOTAL) {
    throw new HttpsError('invalid-argument', 'Total pesanan melebihi batas wajar.');
  }

  const created = await tenantRef.collection('orders').add({
    tableNo,
    customerName,
    customerPhone,
    paymentMethod,
    items,
    total,
    status: ORDER_STATUS_PENDING,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdByUid: request.auth?.uid || null,
  });

  return { id: created.id, total };
});

/**
 * setAdminRole — hanya reseller yang boleh memanggil.
 * Payload: { uid, slug, enabled? }
 * Menetapkan/menghapus claim `admin_<slug>` pada akun target.
 */
exports.setAdminRole = onCall(async (request) => {
  const caller = request.auth;
  if (!caller || caller.token.reseller !== true) {
    throw new HttpsError('permission-denied', 'Hanya reseller yang boleh mengatur admin.');
  }

  const uid = assertString(request.data?.uid, 'uid', 128);
  const slug = assertString(request.data?.slug, 'slug', 120);
  const enabled = request.data?.enabled !== false;

  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new HttpsError('invalid-argument', 'Slug tidak valid.');
  }

  await admin.auth().setCustomUserClaims(uid, { [`admin_${slug}`]: enabled });
  return { uid, slug, enabled };
});
