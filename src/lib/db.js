import { db, isFirebaseConfigured } from './firebase';
import { MOCK_MENU } from './mock-data';
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

const demo = {
  data: {}, // tenantId -> { menu, orders }
  menuSubs: new Map(), // tenantId -> Set(cb)
  orderListSubs: new Map(),
  orderOneSubs: new Map(),
  seq: 0,
};

function tid(tenantId) {
  return tenantId || 'default';
}

function bucket(tenantId) {
  const id = tid(tenantId);
  if (!demo.data[id]) {
    demo.data[id] = {
      menu: MOCK_MENU.map((m) => ({ ...m })),
      orders: [],
    };
  }
  return demo.data[id];
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
    return;
  }
  await updateDoc(doc(db, 'tenants', tid(tenantId), 'menu', id), data);
}

export async function deleteMenuItem(tenantId, id) {
  if (!isFirebaseConfigured) {
    const b = bucket(tenantId);
    b.menu = b.menu.filter((m) => m.id !== id);
    emitMenu(tenantId);
    return;
  }
  await deleteDoc(doc(db, 'tenants', tid(tenantId), 'menu', id));
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function createOrder(tenantId, orderData) {
  if (!isFirebaseConfigured) {
    const id = `demo-order-${++demo.seq}`;
    const order = { id, ...orderData, createdAt: new Date() };
    bucket(tenantId).orders.unshift(order);
    emitOrders(tenantId);
    // Delay kecil supaya halaman tracking sempat ter-mount lebih dulu.
    setTimeout(() => emitOrder(tenantId, id), 300);
    return { id };
  }
  const docRef = await addDoc(
    collection(db, 'tenants', tid(tenantId), 'orders'),
    { ...orderData, createdAt: serverTimestamp() },
  );
  return docRef;
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

export async function updateOrderStatus(tenantId, orderId, newStatus) {
  if (!isFirebaseConfigured) {
    const order = bucket(tenantId).orders.find((o) => o.id === orderId);
    if (order) {
      order.status = newStatus;
      emitOrders(tenantId);
      emitOrder(tenantId, orderId);
    }
    return;
  }
  await updateDoc(doc(db, 'tenants', tid(tenantId), 'orders', orderId), {
    status: newStatus,
  });
}

export { isFirebaseConfigured };
