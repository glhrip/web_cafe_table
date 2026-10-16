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
 * db.js — satu pintu akses data.
 *
 * Kalau Firebase belum dikonfigurasi (mode demo), semua fungsi memakai
 * "demo store" in-memory di bawah ini. Demo store ini MENDUNGKUNG subscription
 * (onSnapshot) dengan benar, jadi alur buat-pesanan → tracking status tetap
 * jalan penuh saat presentasi tanpa Firebase.
 */

// ---------------------------------------------------------------------------
// Demo store (in-memory)
// ---------------------------------------------------------------------------

const demo = {
  menu: MOCK_MENU.map((m) => ({ ...m })),
  orders: [],
  menuSubs: new Set(),
  orderSubs: new Set(),
  seq: 0,
};

function emitMenu() {
  const snapshot = demo.menu.map((m) => ({ ...m }));
  demo.menuSubs.forEach((cb) => cb(snapshot));
}

function emitOrders() {
  const snapshot = demo.orders.map((o) => ({ ...o }));
  demo.orderSubs.forEach((cb) => cb(snapshot));
}

function emitOrder(orderId) {
  const order = demo.orders.find((o) => o.id === orderId);
  demo.orderSubs.forEach((cb) => cb(order ? { ...order } : null));
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export function subscribeToMenu(callback, onError) {
  if (!isFirebaseConfigured) {
    demo.menuSubs.add(callback);
    callback(demo.menu.map((m) => ({ ...m })));
    return () => demo.menuSubs.delete(callback);
  }
  return onSnapshot(
    collection(db, 'menu'),
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (error) => {
      console.error('subscribeToMenu error:', error);
      onError?.(error);
    },
  );
}

export async function getMenuItems() {
  if (!isFirebaseConfigured) {
    return demo.menu.map((m) => ({ ...m }));
  }
  const snapshot = await getDocs(collection(db, 'menu'));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addMenuItem(data) {
  if (!isFirebaseConfigured) {
    const item = { id: `demo-menu-${++demo.seq}`, ...data };
    demo.menu.push(item);
    emitMenu();
    return item;
  }
  const ref = await addDoc(collection(db, 'menu'), data);
  return { id: ref.id, ...data };
}

export async function updateMenuItem(id, data) {
  if (!isFirebaseConfigured) {
    demo.menu = demo.menu.map((m) => (m.id === id ? { ...m, ...data } : m));
    emitMenu();
    return;
  }
  await updateDoc(doc(db, 'menu', id), data);
}

export async function deleteMenuItem(id) {
  if (!isFirebaseConfigured) {
    demo.menu = demo.menu.filter((m) => m.id !== id);
    emitMenu();
    return;
  }
  await deleteDoc(doc(db, 'menu', id));
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function createOrder(orderData) {
  if (!isFirebaseConfigured) {
    const id = `demo-order-${++demo.seq}`;
    const order = { id, ...orderData, createdAt: new Date() };
    demo.orders.unshift(order);
    emitOrders();
    // Delay kecil supaya halaman tracking sempat ter-mount lebih dulu.
    setTimeout(() => emitOrder(id), 300);
    return { id };
  }
  const docRef = await addDoc(collection(db, 'orders'), {
    ...orderData,
    createdAt: serverTimestamp(),
  });
  return docRef;
}

export function subscribeToOrders(callback, onError) {
  if (!isFirebaseConfigured) {
    demo.orderSubs.add(callback);
    callback(demo.orders.map((o) => ({ ...o })));
    return () => demo.orderSubs.delete(callback);
  }
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
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

export function subscribeToSingleOrder(orderId, callback, onError) {
  if (!isFirebaseConfigured) {
    demo.orderSubs.add(callback);
    emitOrder(orderId);
    return () => demo.orderSubs.delete(callback);
  }
  return onSnapshot(
    doc(db, 'orders', orderId),
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

export async function updateOrderStatus(orderId, newStatus) {
  if (!isFirebaseConfigured) {
    const order = demo.orders.find((o) => o.id === orderId);
    if (order) {
      order.status = newStatus;
      emitOrders();
      emitOrder(orderId);
    }
    return;
  }
  await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
}

export { isFirebaseConfigured };
