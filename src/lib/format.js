// Helper format & util kecil yang dipakai di banyak tempat.

export function formatCurrency(value) {
  const n = Number(value) || 0;
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export function formatNumber(value) {
  return (Number(value) || 0).toLocaleString('id-ID');
}

/** Terima Date, Firestore Timestamp, number, atau string. */
export function toDate(value) {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function formatTime(value) {
  return toDate(value).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(value) {
  return toDate(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value) {
  return toDate(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function shortId(id) {
  return String(id || '')
    .slice(0, 8)
    .toUpperCase();
}

/** Gabungkan className secara kondisional. */
export function cx(...args) {
  return args.filter(Boolean).join(' ');
}

export function isToday(value) {
  const d = toDate(value);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

/** Total item (qty) dari array order.items. */
export function countItems(items) {
  return (items || []).reduce((sum, it) => sum + (Number(it?.qty) || 0), 0);
}
