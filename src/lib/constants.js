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
