import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-display',
});

const body = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata = {
  title: {
    default: 'CafeQR · Pesan dari Meja',
    template: '%s · CafeQR',
  },
  description:
    'Platform pesan-antar meja untuk cafe. Satu aplikasi, banyak cafe, tiap cafe punya branding sendiri.',
  applicationName: 'CafeQR',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f7f3ee',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
