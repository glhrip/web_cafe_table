import './globals.css';

export const metadata = {
  title: 'Web POS Cafe',
  description: 'Scan, Order, and Enjoy',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
