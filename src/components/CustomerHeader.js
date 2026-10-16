'use client';

import Link from 'next/link';
import Brand from './Brand';
import Icon from './Icon';

/** Header halaman pelanggan: brand + label meja + tombol pesanan aktif. */
export default function CustomerHeader({ tableId, orderCount = 0, orderId }) {
  return (
    <header className="app-header">
      <div className="shell row between gap-3" style={{ width: '100%' }}>
        <Brand href="/" subtitle={tableId ? `Meja ${tableId}` : undefined} />

        {orderId ? (
          <Link href={`/order/${orderId}`} className="btn btn-ghost btn-sm">
            <Icon name="receipt" size={16} />
            <span className="hide-sm">Pesanan Saya</span>
            {orderCount > 0 ? (
              <span
                className="badge badge-warning"
                style={{ padding: '2px 8px' }}
              >
                {orderCount}
              </span>
            ) : null}
          </Link>
        ) : (
          <Link href="/" className="btn btn-quiet btn-sm">
            <Icon name="arrowLeft" size={16} />
            <span className="hide-sm">Beranda</span>
          </Link>
        )}
      </div>
    </header>
  );
}
