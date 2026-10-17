/**
 * auth.js — lapisan autentikasi admin cafe & reseller.
 *
 * Prinsip: PIN BUKAN pengamanan. Yang mengamankan data adalah Firebase Auth +
 * custom claim, lalu ditegakkan oleh Firestore Security Rules (firestore.rules).
 *
 * Model otorisasi (custom claims):
 *   reseller: true            → boleh membuat/mengubah/menghapus tenant
 *   admin_<slug>: true        → boleh mengubah menu tenant <slug>
 *   claim "slug"              → slug tenant yang diadmini (untuk kenyamanan UI)
 *
 * Mode demo (tanpa Firebase) tetap memakai PIN in-memory supaya presentasi
 * jalan tanpa konfigurasi — TAPI hanya untuk UX, bukan klaim keamanan.
 */

import { auth, isFirebaseConfigured } from './firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

/** Saklar fitur Firebase Auth (aktif otomatis bila Firebase dikonfigurasi). */
export const isAuthConfigured = isFirebaseConfigured;

/** Kunci sessionStorage untuk sesi admin demo (bukan Firebase). */
export function demoAuthKey(slug) {
  return `cafe-admin-auth:${slug || 'default'}`;
}

/** Email admin default untuk sebuah cafe (dipakai form login). */
export function adminEmailFor(slug) {
  return `admin@${slug}.cafeqr.local`;
}

/** Kunci custom claim yang menandai admin sebuah cafe. */
export function adminClaimKey(slug) {
  return `admin_${slug}`;
}

/** Cek apakah user punya akses admin untuk tenant tertentu. */
export function canAdminTenant(claims, slug) {
  if (!claims) return false;
  if (claims.reseller === true) return true;
  if (!slug) return false;
  return claims[adminClaimKey(slug)] === true || claims.slug === slug;
}

/** Cek apakah user adalah reseller (pengelola platform). */
export function isReseller(claims) {
  return Boolean(claims && claims.reseller === true);
}

// ---------------------------------------------------------------------------
// Demo (tanpa Firebase)
// ---------------------------------------------------------------------------

/**
 * Login admin tenant dalam mode demo. Membandingkan PIN terhadap data tenant
 * demo. Hanya untuk UX presentasi — tidak ada klaim keamanan.
 */
export function demoAdminLogin(slug, pin, expectedPin) {
  if (String(pin) === String(expectedPin || '1234')) {
    try {
      sessionStorage.setItem(demoAuthKey(slug), '1');
    } catch {
      /* ignore */
    }
    return true;
  }
  return false;
}

export function demoAdminLogout(slug) {
  try {
    sessionStorage.removeItem(demoAuthKey(slug));
  } catch {
    /* ignore */
  }
}

export function demoAdminSession(slug) {
  try {
    return sessionStorage.getItem(demoAuthKey(slug)) === '1';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Firebase Auth (dipakai bila dikonfigurasi)
// ---------------------------------------------------------------------------

/**
 * Login admin cafe dengan email + password. Setelah sukses memastikan user
 * benar-benar punya claim admin untuk slug tersebut (claim reseller lolos).
 */
export async function loginAdmin(slug, email, password) {
  if (!isAuthConfigured) throw new Error('Firebase Auth tidak dikonfigurasi');
  const cred = await signInWithEmailAndPassword(
    auth,
    String(email || '').trim(),
    password,
  );
  const token = await cred.user.getIdTokenResult();
  if (!canAdminTenant(token.claims, slug)) {
    await signOut(auth);
    throw new Error('Akun ini tidak berhak mengelola cafe tersebut.');
  }
  return cred.user;
}

/** Login reseller (pengelola platform). Memerlukan claim reseller. */
export async function loginReseller(email, password) {
  if (!isAuthConfigured) throw new Error('Firebase Auth tidak dikonfigurasi');
  const cred = await signInWithEmailAndPassword(
    auth,
    String(email || '').trim(),
    password,
  );
  const token = await cred.user.getIdTokenResult();
  if (!isReseller(token.claims)) {
    await signOut(auth);
    throw new Error('Akun ini bukan reseller.');
  }
  return cred.user;
}

export async function logout() {
  if (!isAuthConfigured) return;
  await signOut(auth);
}

/**
 * Pantau status auth + claims. Callback menerima
 * { user, claims, adminSlugs, reseller } atau null bila belum login.
 */
export function subscribeToAuth(callback) {
  if (!isAuthConfigured) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }
    try {
      const token = await user.getIdTokenResult();
      const claims = token.claims || {};
      const adminSlugs = Object.keys(claims)
        .filter((k) => k.startsWith('admin_') && claims[k] === true)
        .map((k) => k.slice('admin_'.length));
      callback({
        user: { uid: user.uid, email: user.email },
        claims,
        adminSlugs,
        reseller: isReseller(claims),
      });
    } catch (error) {
      console.error('subscribeToAuth claims error:', error);
      callback({ user: { uid: user.uid, email: user.email }, claims: {}, adminSlugs: [], reseller: false });
    }
  });
}
