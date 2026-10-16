/**
 * theme.js — util warna & tema branding.
 *
 * Pemilik cafe cukup memilih 1-2 warna; palet lengkap (strong/soft/tint)
 * diturunkan otomatis supaya tampilan tetap konsisten di semua komponen.
 */

export const DEFAULT_BRAND = '#c2703d';
export const DEFAULT_ACCENT = '#e29a5c';

export const DEFAULT_THEME = {
  brand: DEFAULT_BRAND,
  accent: DEFAULT_ACCENT,
};

/** Preset warna siap pakai untuk halaman Branding. */
export const BRAND_PRESETS = [
  { name: 'Kopi', brand: '#c2703d', accent: '#e29a5c' },
  { name: 'Matcha', brand: '#2f8f5b', accent: '#7cc79a' },
  { name: 'Laut', brand: '#2563eb', accent: '#60a5fa' },
  { name: 'Ungu', brand: '#7c3aed', accent: '#a78bfa' },
  { name: 'Merah', brand: '#dc2626', accent: '#f87171' },
  { name: 'Pink', brand: '#db2777', accent: '#f472b6' },
  { name: 'Kuning', brand: '#d97706', accent: '#fbbf24' },
  { name: 'Malam', brand: '#0f172a', accent: '#475569' },
];

function clamp(n) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Terima '#abc', 'abc', '#aabbcc' → '#aabbcc' (lowercase) atau null. */
export function normalizeHex(input) {
  if (!input) return null;
  let h = String(input).trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return '#' + h.toLowerCase();
}

export function hexToRgb(hex) {
  const h = normalizeHex(hex);
  if (!h) return null;
  return {
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  };
}

export function rgbToHex({ r, g, b }) {
  return (
    '#' +
    [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')
  );
}

/** Campur dua warna. weight=0 → a, weight=1 → b. */
export function mix(a, b, weight = 0.5) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  if (!A || !B) return normalizeHex(a) || DEFAULT_BRAND;
  return rgbToHex({
    r: A.r + (B.r - A.r) * weight,
    g: A.g + (B.g - A.g) * weight,
    b: A.b + (B.b - A.b) * weight,
  });
}

export function darken(hex, amount) {
  return mix(hex, '#000000', amount);
}

export function lighten(hex, amount) {
  return mix(hex, '#ffffff', amount);
}

/** Bangun palet lengkap dari tema { brand, accent }. */
export function buildPalette(theme) {
  const brand = normalizeHex(theme?.brand) || DEFAULT_BRAND;
  const accent = normalizeHex(theme?.accent) || lighten(brand, 0.2);
  return {
    brand,
    'brand-strong': darken(brand, 0.2),
    'brand-soft': mix(brand, '#ffffff', 0.84),
    'brand-tint': mix(brand, '#ffffff', 0.94),
    accent,
  };
}

/** Hasilkan CSS yang menimpa variabel tema di :root. */
export function themeCss(theme) {
  const p = buildPalette(theme);
  const { r, g, b } = hexToRgb(p.brand) || { r: 194, g: 112, b: 61 };
  const vars = Object.entries(p)
    .map(([k, v]) => `--${k}:${v};`)
    .join('');
  return `:root{${vars}--shadow-brand:0 10px 24px rgba(${r},${g},${b},0.28);}`;
}

/** Style object berisi CSS var — untuk pratinjau live tanpa mengubah global. */
export function paletteStyle(theme) {
  const p = buildPalette(theme);
  const { r, g, b } = hexToRgb(p.brand) || { r: 194, g: 112, b: 61 };
  return {
    '--brand': p.brand,
    '--brand-strong': p['brand-strong'],
    '--brand-soft': p['brand-soft'],
    '--brand-tint': p['brand-tint'],
    '--accent': p.accent,
    '--shadow-brand': `0 10px 24px rgba(${r},${g},${b},0.28)`,
  };
}
