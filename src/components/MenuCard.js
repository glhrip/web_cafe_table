'use client';

import Image from 'next/image';
import Icon from './Icon';
import QuantityStepper from './QuantityStepper';
import { formatCurrency } from '@/lib/format';

/** Kartu menu yang tampil di halaman pelanggan. */
export default function MenuCard({ item, qty = 0, onAdd, onRemove }) {
  const hasImage = Boolean(item.image);

  return (
    <article
      className="card"
      style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: '4 / 3',
          background: 'var(--brand-soft)',
        }}
      >
        {hasImage ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1080px) 45vw, 320px"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div
            className="row"
            style={{ height: '100%', justifyContent: 'center', color: 'var(--brand)' }}
          >
            <Icon name="coffee" size={40} strokeWidth={1.6} />
          </div>
        )}

        {item.popular ? (
          <span
            className="badge badge-warning"
            style={{ position: 'absolute', top: 10, left: 10 }}
          >
            Favorit
          </span>
        ) : null}
        {item.category ? (
          <span
            className="pill"
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              padding: '4px 10px',
              fontSize: '0.72rem',
            }}
          >
            {item.category}
          </span>
        ) : null}
      </div>

      <div
        className="stack gap-2"
        style={{ padding: 16, flex: 1, justifyContent: 'space-between' }}
      >
        <div className="stack gap-1">
          <div className="row between gap-2" style={{ alignItems: 'flex-start' }}>
            <h3 className="h3" style={{ fontSize: '1.05rem' }}>
              {item.name}
            </h3>
          </div>
          {item.description ? (
            <p
              className="small muted"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: '2.6em',
              }}
            >
              {item.description}
            </p>
          ) : null}
        </div>

        <div className="row between gap-2" style={{ marginTop: 4 }}>
          <span style={{ fontWeight: 750, color: 'var(--brand-strong)' }}>
            {formatCurrency(item.price)}
          </span>

          {qty > 0 ? (
            <QuantityStepper
              value={qty}
              onAdd={() => onAdd(item)}
              onRemove={() => onRemove(item)}
            />
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onAdd(item)}
            >
              <Icon name="plus" size={16} strokeWidth={2.6} />
              Tambah
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
