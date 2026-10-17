import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Kalau API key belum diisi, aplikasi otomatis jalan di "mode demo"
 * memakai data mock in-memory (lihat lib/db.js) dan PIN in-memory
 * (lihat lib/auth.js). Mode demo BUKAN mode aman — hanya untuk presentasi.
 */
export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
);

/** Aktifkan emulator lokal via NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true. */
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

let app = null;
let db = null;
let auth = null;
let functions = null;
let emulatorsConnected = false;

function connectEmulators() {
  if (emulatorsConnected || !useEmulator) return;
  emulatorsConnected = true;
  const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || '127.0.0.1';
  try {
    connectFirestoreEmulator(db, host, 8080);
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    if (functions) connectFunctionsEmulator(functions, host, 5001);
  } catch (error) {
    console.error('Gagal menyambung ke emulator Firebase:', error);
  }
}

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  functions = getFunctions(app);
  connectEmulators();
}

export { app, db, auth, functions };
