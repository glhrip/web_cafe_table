'use client';

import Icon from './Icon';
import { formatCurrency } from '@/lib/format';

/** Bar melayang di bawah: ringkasan keranjang + tombol buka checkout. */
export default function CartBar({ count, total, onOpen }) {
  if (!count) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        padding: '14px 16px calc(14px + env(safe-area-inset-bottom))',
        background: 'linear-gradient(transparent, var(--bg) 32%)',
      }}
    >
      <div className="shell" style={{ padding: 0 }}>
        <button
          type="button"
          className="btn btn-primary btn-block btn-lg fade-up"
          onClick={onOpen}
          style={{ justifyContent: 'space-between' }}
        >
          <span className="row gap-2">
            <span
              className="row"
              style={{
                position: 'relative',
                width: 26,
                height: 26,
                justifyContent: 'center',
              }}
            >
              <Icon name="cart" size={22} />
            </span>
            <span>
              {count} item
            </span>
          </span>
          <span className="row gap-2">
            <span>{formatCurrency(total)}</span>
            <Icon name="arrowRight" size={18} />
          </span>
        </button>
      </div>
    </div>
  );
}
