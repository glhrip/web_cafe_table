'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatTime, shortId } from '@/lib/format';
import { ORDER_STATUS, PAYMENT_LABEL } from '@/lib/constants';

/** Kartu pesanan di dashboard admin dengan tombol aksi sesuai status. */
export default function OrderCard({ order, onUpdate }) {
  const [busy, setBusy] = useState(false);
  const items = order.items || [];

  const act = async (status) => {
    setBusy(true);
    try {
      await onUpdate(order.id, status);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card card-pad stack gap-3">
      <div className="row between gap-2" style={{ alignItems: 'flex-start' }}>
        <div className="stack gap-1">
          <div className="row gap-2">
            <span className="h3">Meja {order.tableNo}</span>
            <span className="pill" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>
              <Icon name="wallet" size={12} />
              {PAYMENT_LABEL[order.paymentMethod] || 'Kasir'}
            </span>
          </div>
          <span className="small muted">
            {order.customerName} · {order.customerPhone}
          </span>
          <span className="tiny faint mono">
            #{shortId(order.id)} · {formatTime(order.createdAt)}
          </span>
        </div>
        <StatusBadge status={order.status} full />
      </div>

      <div
        className="stack"
        style={{
          padding: '12px 0',
          borderTop: '1px solid var(--line-2)',
          borderBottom: '1px solid var(--line-2)',
        }}
      >
        {items.map((it, i) => (
          <div
            key={`${it.id || it.name}-${i}`}
            className="row between gap-2 small"
            style={{ padding: '3px 0' }}
          >
            <span>
              <span className="mono" style={{ fontWeight: 700, color: 'var(--brand-strong)' }}>
                {it.qty}×
              </span>{' '}
              {it.name}
            </span>
            <span className="mono muted">
              {formatCurrency((it.price || 0) * (it.qty || 0))}
            </span>
          </div>
        ))}
        <div
          className="row between"
          style={{ marginTop: 8, paddingTop: 8, borderTop: '1.5px dashed var(--line)' }}
        >
          <span style={{ fontWeight: 700 }}>Total</span>
          <span style={{ fontWeight: 750, color: 'var(--brand-strong)' }}>
            {formatCurrency(order.total)}
          </span>
        </div>
      </div>

      <div className="row gap-2 wrap">
        {order.status === ORDER_STATUS.PENDING ? (
          <>
            <button
              type="button"
              className="btn btn-primary grow"
              disabled={busy}
              onClick={() => act(ORDER_STATUS.PREPARING)}
            >
              <Icon name="check" size={16} strokeWidth={2.6} />
              Terima &amp; Proses
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              onClick={() => act(ORDER_STATUS.CANCELLED)}
            >
              Batal
            </button>
          </>
        ) : null}

        {order.status === ORDER_STATUS.PREPARING ? (
          <button
            type="button"
            className="btn btn-primary grow"
            disabled={busy}
            style={{ background: 'var(--success)' }}
            onClick={() => act(ORDER_STATUS.READY)}
          >
            <Icon name="bag" size={16} />
            Tandai Siap Diambil
          </button>
        ) : null}

        {order.status === ORDER_STATUS.READY ? (
          <button
            type="button"
            className="btn btn-primary grow"
            disabled={busy}
            style={{ background: 'var(--neutral)' }}
            onClick={() => act(ORDER_STATUS.COMPLETED)}
          >
            <Icon name="check" size={16} strokeWidth={2.6} />
            Selesaikan
          </button>
        ) : null}

        {order.status === ORDER_STATUS.COMPLETED ||
        order.status === ORDER_STATUS.CANCELLED ? (
          <span className="small faint">
            {order.status === ORDER_STATUS.COMPLETED
              ? 'Pesanan selesai.'
              : 'Pesanan dibatalkan.'}
          </span>
        ) : null}
      </div>
    </article>
  );
}
