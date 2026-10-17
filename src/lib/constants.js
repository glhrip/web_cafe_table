// Sumber tunggal untuk status pesanan, kategori, dan konstanta platform.
// Branding (nama/tagline/warna) kini per-cafe → lihat lib/tenants.js.

export const PLATFORM_NAME = 'CafeQR';

export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

/**
 * Metadata tiap status: label, nada warna (dipakai komponen Badge),
 * dan posisi pada progress tracker pelanggan.
 */
export const STATUS_META = {
  [ORDER_STATUS.PENDING]: {
    label: 'Menunggu Konfirmasi',
    short: 'Menunggu',
    tone: 'warning',
    step: 0,
  },
  [ORDER_STATUS.PREPARING]: {
    label: 'Sedang Disiapkan',
    short: 'Disiapkan',
    tone: 'info',
    step: 1,
  },
  [ORDER_STATUS.READY]: {
    label: 'Siap Diambil',
    short: 'Siap',
    tone: 'success',
    step: 2,
  },
  [ORDER_STATUS.COMPLETED]: {
    label: 'Selesai',
    short: 'Selesai',
    tone: 'neutral',
    step: 3,
  },
  [ORDER_STATUS.CANCELLED]: {
    label: 'Dibatalkan',
    short: 'Batal',
    tone: 'danger',
    step: -1,
  },
};

/** Urutan langkah yang ditampilkan di halaman tracking pelanggan. */
export const TRACK_STEPS = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.COMPLETED,
];

/**
 * State machine transisi status pesanan yang SAH.
 *
 * Aturan:
 * - Alur normal maju satu langkah: pending → preparing → ready → completed.
 * - Dibatalkan hanya boleh dari pending/preparing (belum diserahkan).
 * - Status akhir (completed/cancelled) tidak bisa diubah lagi.
 *
 * Dipakai oleh UI (menyembunyikan tombol tak sah) DAN divalidasi ulang di
 * server (Cloud Function) sehingga tidak bisa dilewati dari client.
 */
export const STATUS_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY]: [ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

/** Status yang dianggap final (tidak boleh berubah lagi). */
export const TERMINAL_STATUSES = [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED];

/** Apakah transisi from → to diizinkan oleh state machine. */
export function canTransition(from, to) {
  if (!from || !to || from === to) return false;
  return (STATUS_TRANSITIONS[from] || []).includes(to);
}

/** Daftar status berikutnya yang sah dari status saat ini. */
export function nextStatuses(from) {
  return STATUS_TRANSITIONS[from] || [];
}

export const PAYMENT_METHODS = [
  { id: 'kasir', label: 'Bayar di Kasir', hint: 'Bayar tunai/kartu di kasir' },
  { id: 'qris', label: 'QRIS', hint: 'Scan & bayar dari aplikasi bank/e-wallet' },
];

export const PAYMENT_LABEL = {
  kasir: 'Kasir',
  qris: 'QRIS',
};

/** Kategori default untuk form admin (menu tetap bisa punya kategori bebas). */
export const DEFAULT_CATEGORIES = [
  'Coffee',
  'Non-Coffee',
  'Tea',
  'Main Course',
  'Snack',
  'Dessert',
];

export const ADMIN_PIN_FALLBACK = '1234';

/** Kunci sessionStorage untuk sesi login admin (dipisah per cafe). */
export function adminAuthKey(slug) {
  return `cafe-admin-auth:${slug || 'default'}`;
}
