'use client';

import Icon from './Icon';

/** Tombol +/- untuk mengatur jumlah item. */
export default function QuantityStepper({ value, onAdd, onRemove, size = 'md' }) {
  const dim = size === 'sm' ? 30 : 36;
  const btnStyle = {
    width: dim,
    height: dim,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  };

  return (
    <div
      className="row between"
      style={{
        background: 'var(--brand-tint)',
        border: '1.5px solid var(--brand-soft)',
        borderRadius: 'var(--r-full)',
        padding: 3,
      }}
    >
      <button
        type="button"
        aria-label="Kurangi"
        onClick={onRemove}
        style={{ ...btnStyle, background: 'var(--surface)', color: 'var(--ink)' }}
      >
        <Icon name="minus" size={size === 'sm' ? 15 : 17} strokeWidth={2.6} />
      </button>
      <span
        className="mono"
        style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Tambah"
        onClick={onAdd}
        style={{ ...btnStyle, background: 'var(--brand)', color: '#fff' }}
      >
        <Icon name="plus" size={size === 'sm' ? 15 : 17} strokeWidth={2.6} />
      </button>
    </div>
  );
}
