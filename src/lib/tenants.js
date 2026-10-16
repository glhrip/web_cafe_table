/**
 * tenants.js — lapisan data "cafe" (tenant) untuk skema white-label.
 *
 * Satu aplikasi melayani banyak cafe. Tiap cafe = satu dokumen di koleksi
 * `tenants/{slug}` berisi nama, tagline, logo, tema warna, dan PIN admin.
 *
 * Tanpa Firebase, data disimpan di demo store in-memory (mode demo) yang
 * mendukung subscription, jadi perubahan branding langsung terlihat.
 */

import { db, isFirebaseConfigured } from './firebase';
import { DEFAULT_THEME } from './theme';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

/** Ubah nama bebas menjadi slug aman untuk URL. */
export function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/** Beberapa cafe contoh untuk mode demo (tiap-tiap branding berbeda). */
const SEED_TENANTS = [
  {
    slug: 'kopi-senja',
    name: 'Kopi Senja',
    tagline: 'Kopi enak, suasana hangat',
    logo: '',
    theme: { brand: '#c2703d', accent: '#e29a5c' },
    pin: '1234',
    owner: 'Demo',
    status: 'active',
  },
  {
    slug: 'matcha-house',
    name: 'Matcha House',
    tagline: 'Segar, hijau, menenangkan',
    logo: '',
    theme: { brand: '#2f8f5b', accent: '#7cc79a' },
    pin: '1234',
    owner: 'Demo',
    status: 'active',
  },
  {
    slug: 'kopi-biru-laut',
    name: 'Kopi Biru Laut',
    tagline: 'Ngopi santai tepi pantai',
    logo: '',
    theme: { brand: '#2563eb', accent: '#60a5fa' },
    pin: '1234',
    owner: 'Demo',
    status: 'active',
  },
];

const demo = {
  tenants: Object.fromEntries(SEED_TENANTS.map((t) => [t.slug, { ...t }])),
  subs: new Set(),
  seq: 0,
};

function emitTenants() {
  const snapshot = Object.values(demo.tenants).map((t) => ({ ...t }));
  demo.subs.forEach((cb) => cb(snapshot));
}

/** Pantau semua cafe (dipakai halaman platform & super admin). */
export function subscribeToTenants(callback, onError) {
  if (!isFirebaseConfigured) {
    demo.subs.add(callback);
    callback(Object.values(demo.tenants).map((t) => ({ ...t })));
    return () => demo.subs.delete(callback);
  }
  const q = query(collection(db, 'tenants'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ slug: d.id, ...d.data() }))),
    (error) => {
      console.error('subscribeToTenants error:', error);
      onError?.(error);
    },
  );
}

/** Pantau satu cafe berdasarkan slug. */
export function subscribeToTenant(slug, callback, onError) {
  if (!isFirebaseConfigured) {
    const fn = (list) => {
      const found = list.find((t) => t.slug === slug);
      callback(found ? { ...found } : null);
    };
    demo.subs.add(fn);
    fn(Object.values(demo.tenants).map((t) => ({ ...t })));
    return () => demo.subs.delete(fn);
  }
  return onSnapshot(
    doc(db, 'tenants', slug),
    (snap) => callback(snap.exists() ? { slug: snap.id, ...snap.data() } : null),
    (error) => {
      console.error('subscribeToTenant error:', error);
      onError?.(error);
    },
  );
}

export async function getTenant(slug) {
  if (!isFirebaseConfigured) {
    return demo.tenants[slug] ? { ...demo.tenants[slug] } : null;
  }
  const snap = await getDoc(doc(db, 'tenants', slug));
  return snap.exists() ? { slug: snap.id, ...snap.data() } : null;
}

export async function listTenants() {
  if (!isFirebaseConfigured) {
    return Object.values(demo.tenants).map((t) => ({ ...t }));
  }
  const snap = await getDocs(collection(db, 'tenants'));
  return snap.docs.map((d) => ({ slug: d.id, ...d.data() }));
}

/** Buat cafe baru. Melempar error bila slug sudah dipakai. */
export async function createTenant(data) {
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  if (!slug) throw new Error('Slug tidak valid');

  const payload = {
    name: data.name?.trim() || 'Cafe Baru',
    tagline: data.tagline?.trim() || '',
    logo: data.logo?.trim() || '',
    theme: { ...DEFAULT_THEME, ...(data.theme || {}) },
    pin: String(data.pin || '1234').trim() || '1234',
    owner: data.owner?.trim() || '',
    status: 'active',
  };

  if (!isFirebaseConfigured) {
    if (demo.tenants[slug]) throw new Error('Slug sudah dipakai');
    demo.tenants[slug] = { slug, ...payload };
    emitTenants();
    return { slug, ...payload };
  }

  const ref = doc(db, 'tenants', slug);
  const existing = await getDoc(ref);
  if (existing.exists()) throw new Error('Slug sudah dipakai');
  await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
  return { slug, ...payload };
}

export async function updateTenant(slug, data) {
  if (!isFirebaseConfigured) {
    demo.tenants[slug] = { ...(demo.tenants[slug] || { slug }), ...data, slug };
    emitTenants();
    return;
  }
  await updateDoc(doc(db, 'tenants', slug), data);
}

export async function deleteTenant(slug) {
  if (!isFirebaseConfigured) {
    delete demo.tenants[slug];
    emitTenants();
    return;
  }
  await deleteDoc(doc(db, 'tenants', slug));
}

export { isFirebaseConfigured };
