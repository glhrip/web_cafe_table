/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Admin bisa menempelkan URL gambar dari host mana pun, jadi kita izinkan
    // semua HTTPS (dan http lokal). Kalau mau lebih ketat, ganti ke daftar
    // hostname spesifik.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

export default nextConfig;
