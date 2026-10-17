import { db, isFirebaseConfigured, functions } from './firebase';
import { MOCK_MENU } from './mock-data';
import { canTransition } from './constants';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

/**
 * db.js — satu pintu akses data menu & pesanan, DIPISAH PER CAFE (tenant).
 *
 * Struktur Firebase:
 *   tenants/{tenantId}/menu/{itemId}
 *   tenants/{tenantId}/orders/{orderId}
 *
 * Tanpa Firebase (mode demo), semua fungsi memakai demo store in-memory
 * yang mendukung subscription, jadi alur buat-pesanan → tracking tetap
 * jalan penuh saat presentasi.
 */

/**
 * Demo store — dipakai saat tanpa Firebase.
 *
 * Dua masalah yang harus diatasi agar alur table → admin tetap jalan:
 *
 * 1. Di Next.js, tiap route/komponen bisa memuat modul ini sebagai instance
 *    berbeda. Karena itu store disimpan di `globalThis`, bukan variabel modul,
 *    supaya semua route dalam satu proses berbagi data yang sama.
 *
 * 2. Bila halaman table dan admin dibuka di TAB berbeda, memori masing-masing
 *    tab terpisah. Untuk itu data demo juga dipersist ke `localStorage`, dan
 *    perubahan disinkronkan lintas-tab lewat event `storage`.
 *
 * Catatan: mode demo memang hanya untuk presentasi — tanpa jaminan durability
 * seperti database sungguhan.
 */

const DEMO_STORE_KEY = 'cafeqr:demo-store';

function hasLocalStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

function readPersisted() {
  if (!hasLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(DEMO_STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persist(data, seq) {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(
      DEMO_STORE_KEY,
      JSON.stringify({ data, seq }),
    );
  } catch {
    /* kuota penuh / private mode — abaikan */
  }
}

function createDemoStore() {
  const persisted = readPersisted();
  return {
    data: persisted?.data || {}, // tenantId -> { menu, orders }
    menuSubs: new Map(), // tenantId -> Set(cb)
    orderListSubs: new Map(),
    orderOneSubs: new Map(),
    seq: persisted?.seq || 0,
    hydrated: !!persisted,
  };
}

const demo = (globalThis.__cafeqrDemoStore ||= createDemoStore());

/** Simpan snapshot demo ke localStorage (tanpa data subscription). */
function save() {
  persist(demo.data, demo.seq);
}

// Sinkron lintas-tab: saat tab lain mengubah store, muat ulang & beri tahu.
if (hasLocalStorage() && !demo.listening) {
  demo.listening = true;
  window.addEventListener('storage', (e) => {
    if (e.key !== DEMO_STORE_KEY || !e.newValue) return;
    try {
      const parsed = JSON.parse(e.newValue);
      demo.data = parsed.data || {};
      demo.seq = parsed.seq || demo.seq;
      Object.keys(demo.data).forEach((tenantId) => {
        emitMenu(tenantId);
        emitOrders(tenantId);
        demo.data[tenantId].orders.forEach((o) => emitOrder(tenantId, o.id));
      });
    } catch {
      /* abaikan payload rusak */
    }
  });
}

function tid(tenantId) {
  return tenantId || 'default';
}

/**
 * Normalisasi pesanan demo supaya data lama (mis. dari localStorage versi
 * sebelum patch) tetap konsisten: selalu punya status, items lengkap, total.
 */
function normalizeOrder(order, menu) {
  const status = order.status || 'pending';
  const items = (order.items || []).map((it) => {
    if (it.name && typeof it.price === 'number') return it;
    const found = menu.find((m) => m.id === it.id);
    return {
      id: it.id,
      name: it.name || found?.name || 'Item',
      price: typeof it.price === 'number' ? it.price : Number(found?.price) || 0,
      qty: Number(it.qty) || 0,
    };
  });
  const total =
    typeof order.total === 'number' && order.total > 0
      ? order.total
      : items.reduce((s, it) => s + it.price * it.qty, 0);
  return { ...order, status, items, total };
}

function bucket(tenantId) {
  const id = tid(tenantId);
  if (!demo.data[id]) {
    demo.data[id] = {
      menu: MOCK_MENU.map((m) => ({ ...m })),
      orders: [],
    };
  }
  const b = demo.data[id];
  if (b.orders.length) {
    b.orders = b.orders.map((o) => normalizeOrder(o, b.menu));
  }
  return b;
}

function subs(map, tenantId) {
  const id = tid(tenantId);
  if (!map.has(id)) map.set(id, new Set());
  return map.get(id);
}

function emitMenu(tenantId) {
  const snapshot = bucket(tenantId).menu.map((m) => ({ ...m }));
  subs(demo.menuSubs, tenantId).forEach((cb) => cb(snapshot));
}

function emitOrders(tenantId) {
  const snapshot = bucket(tenantId).orders.map((o) => ({ ...o }));
  subs(demo.orderListSubs, tenantId).forEach((cb) => cb(snapshot));
}

function emitOrder(tenantId, orderId) {
  const order = bucket(tenantId).orders.find((o) => o.id === orderId);
  subs(demo.orderOneSubs, tenantId).forEach((cb) =>
    cb(order ? { ...order } : null),
  );
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export function subscribeToMenu(tenantId, callback, onError) {
  if (!isFirebaseConfigured) {
    subs(demo.menuSubs, tenantId).add(callback);
    callback(bucket(tenantId).menu.map((m) => ({ ...m })));
    return () => subs(demo.menuSubs, tenantId).delete(callback);
  }
  return onSnapshot(
    collection(db, 'tenants', tid(tenantId), 'menu'),
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (error) => {
      console.error('subscribeToMenu error:', error);
      onError?.(error);
    },
  );
}

export async function getMenuItems(tenantId) {
  if (!isFirebaseConfigured) {
    return bucket(tenantId).menu.map((m) => ({ ...m }));
  }
  const snapshot = await getDocs(
    collection(db, 'tenants', tid(tenantId), 'menu'),
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addMenuItem(tenantId, data) {
  if (!isFirebaseConfigured) {
    const item = { id: `demo-menu-${++demo.seq}`, ...data };
    bucket(tenantId).menu.push(item);
    emitMenu(tenantId);
    save();
    return item;
  }
  const ref = await addDoc(
    collection(db, 'tenants', tid(tenantId), 'menu'),
    data,
  );
  return { id: ref.id, ...data };
}

export async function updateMenuItem(tenantId, id, data) {
  if (!isFirebaseConfigured) {
    const b = bucket(tenantId);
    b.menu = b.menu.map((m) => (m.id === id ? { ...m, ...data } : m));
    emitMenu(tenantId);
    save();
    return;
  }
  await updateDoc(doc(db, 'tenants', tid(tenantId), 'menu', id), data);
}

export async function deleteMenuItem(tenantId, id) {
  if (!isFirebaseConfigured) {
    const b = bucket(tenantId);
    b.menu = b.menu.filter((m) => m.id !== id);
    emitMenu(tenantId);
    save();
    return;
  }
  await deleteDoc(doc(db, 'tenants', tid(tenantId), 'menu', id));
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/**
 * Buat pesanan baru.
 *
 * PENTING: harga & total TIDAK dipercaya dari client. Saat Firebase aktif,
 * pembuatan pesanan dirutekan lewat Cloud Function `createOrder` yang
 * menghitung ulang total dari koleksi menu di server. `orderData` di sini
 * hanya berisi niat pelanggan (meja, nama, daftar item + qty, metode bayar).
 *
 * Mode demo tetap menghitung di client karena tidak ada backend — itu wajar
 * untuk presentasi, tapi bukan model keamanan produksi.
 */
export async function createOrder(tenantId, orderData) {
  if (!isFirebaseConfigured) {
    // Mode demo meniru Cloud Function: harga & nama TIDAK dipercaya dari
    // client. Halaman table hanya mengirim { id, qty }; di sini kita lengkapi
    // dari menu di store demo, lalu hitung total.
    const menu = bucket(tenantId).menu;
    const items = (orderData.items || [])
      .map((it) => {
        const found = menu.find((m) => m.id === it.id);
        if (!found) return null;
        const qty = Number(it.qty) || 0;
        return {
          id: it.id,
          name: found.name,
          price: Number(found.price) || 0,
          qty,
        };
      })
      .filter(Boolean);

    const total = items.reduce((s, it) => s + it.price * it.qty, 0);

    const id = `demo-order-${++demo.seq}`;
    const order = {
      ...orderData,
      items,
      total,
      status: 'pending',
      createdAt: new Date(),
      id,
    };
    bucket(tenantId).orders.unshift(order);
    emitOrders(tenantId);
    save();
    // Delay kecil supaya halaman tracking sempat ter-mount lebih dulu.
    setTimeout(() => emitOrder(tenantId, id), 300);
    return { id, total };
  }

  const call = httpsCallable(functions, 'createOrder');
  const { data } = await call({
    tenantId: tid(tenantId),
    tableNo: orderData.tableNo,
    customerName: orderData.customerName,
    customerPhone: orderData.customerPhone || '',
    paymentMethod: orderData.paymentMethod || 'kasir',
    // Kirim hanya id + qty; server yang mengambil harga asli dari menu.
    items: (orderData.items || []).map((it) => ({ id: it.id, qty: it.qty })),
  });
  return { id: data.id, total: data.total };
}

export function subscribeToOrders(tenantId, callback, onError) {
  if (!isFirebaseConfigured) {
    subs(demo.orderListSubs, tenantId).add(callback);
    callback(bucket(tenantId).orders.map((o) => ({ ...o })));
    return () => subs(demo.orderListSubs, tenantId).delete(callback);
  }
  const q = query(
    collection(db, 'tenants', tid(tenantId), 'orders'),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      callback(
        snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() || new Date(),
        })),
      );
    },
    (error) => {
      console.error('subscribeToOrders error:', error);
      onError?.(error);
    },
  );
}

export function subscribeToSingleOrder(tenantId, orderId, callback, onError) {
  if (!isFirebaseConfigured) {
    subs(demo.orderOneSubs, tenantId).add(callback);
    emitOrder(tenantId, orderId);
    return () => subs(demo.orderOneSubs, tenantId).delete(callback);
  }
  return onSnapshot(
    doc(db, 'tenants', tid(tenantId), 'orders', orderId),
    (snap) => {
      if (snap.exists()) {
        callback({
          id: snap.id,
          ...snap.data(),
          createdAt: snap.data().createdAt?.toDate?.() || new Date(),
        });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('subscribeToSingleOrder error:', error);
      onError?.(error);
    },
  );
}

/**
 * Ubah status pesanan dengan menegakkan state machine (constants.js).
 *
 * Guard di sini bersifat UX/awal; penegakan final ada di Firestore rules
 * (admin) dan Cloud Function (create). Transisi tak sah melempar error
 * supaya UI bisa memberi umpan balik.
 */
export async function updateOrderStatus(tenantId, orderId, newStatus, currentStatus) {
  const current =
    currentStatus ||
    bucket(tenantId).orders.find((o) => o.id === orderId)?.status;

  if (!canTransition(current, newStatus)) {
    throw new Error(
      `Transisi status tidak sah: ${current || '?'} → ${newStatus}`,
    );
  }

  if (!isFirebaseConfigured) {
    const order = bucket(tenantId).orders.find((o) => o.id === orderId);
    if (order) {
      order.status = newStatus;
      emitOrders(tenantId);
      emitOrder(tenantId, orderId);
      save();
    }
    return;
  }
  await updateDoc(doc(db, 'tenants', tid(tenantId), 'orders', orderId), {
    status: newStatus,
  });
}

export { isFirebaseConfigured };
