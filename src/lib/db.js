import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

// Menu Functions
export async function getMenuItems() {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.warn("Firebase not configured. Returning mock menu.");
    return getMockMenu();
  }
  const snapshot = await getDocs(collection(db, 'menu'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Order Functions
export async function createOrder(orderData) {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.warn("Firebase not configured. Mocking create order.");
    return { id: 'mock-order-id' };
  }
  const docRef = await addDoc(collection(db, 'orders'), {
    ...orderData,
    createdAt: serverTimestamp(),
  });
  return docRef;
}

export function subscribeToOrders(callback) {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.warn("Firebase not configured. Mocking order subscription.");
    callback([]);
    return () => {}; // Return empty unsubscribe function
  }
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Handle server timestamp if it's still pending
      createdAt: doc.data().createdAt?.toDate() || new Date() 
    }));
    callback(orders);
  });
}

export async function updateOrderStatus(orderId, newStatus) {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.warn("Firebase not configured. Mocking status update.");
    return;
  }
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, { status: newStatus });
}

export function subscribeToSingleOrder(orderId, callback) {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.warn("Firebase not configured. Mocking single order subscription.");
    return () => {};
  }
  const orderRef = doc(db, 'orders', orderId);
  return onSnapshot(orderRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
}

// Mock Data
function getMockMenu() {
  return [
    { id: '1', name: 'Espresso', price: 15000, category: 'Coffee', description: 'Strong and pure coffee', image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=300&q=80' },
    { id: '2', name: 'Latte', price: 25000, category: 'Coffee', description: 'Espresso with steamed milk', image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=300&q=80' },
    { id: '3', name: 'Croissant', price: 20000, category: 'Food', description: 'Buttery flaky pastry', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80' },
  ];
}
