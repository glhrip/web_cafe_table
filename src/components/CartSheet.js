'use client';

import { useState } from 'react';
import Icon from './Icon';
import QuantityStepper from './QuantityStepper';
import { formatCurrency } from '@/lib/format';
import { PAYMENT_METHODS } from '@/lib/constants';

/** Bottom-sheet checkout: daftar item, data pelanggan, metode bayar. */
export default function CartSheet({
  items,
  total,
  onClose,
  onAdd,
  onRemove,
  onSubmit,
  submitting,
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [payment, setPayment] = useState(PAYMENT_METHODS[0].id);

  const count = items.reduce((s, it) => s + it.qty, 0);
  const note =
    payment === 'kasir'
      ? 'Silakan bayar di kasir setelah konfirmasi. Pesanan disiapkan setelah pembayaran diterima.'
      : 'Selesaikan pembayaran via QRIS, lalu tunjukkan bukti bayar ke kasir.';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name: name.trim(), phone: phone.trim(), payment });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Detail pesanan"
      >
        <div className="row between gap-2" style={{ marginBottom: 18 }}>
          <div>
            <span className="eyebrow">Keranjang</span>
            <h2 className="h2" style={{ marginTop: 2 }}>
              Detail Pesanan
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-quiet btn-icon"
            onClick={onClose}
            aria-label="Tutup"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="stack" style={{ marginBottom: 18 }}>
          {items.map((it) => (
            <div
              key={it.id}
              className="row between gap-3"
              style={{ padding: '12px 0', borderBottom: '1px solid var(--line-2)' }}
            >
              <div className="stack gap-1" style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 650 }}>{it.name}</span>
                <span className="small muted mono">
                  {formatCurrency(it.price)} × {it.qty}
                </span>
              </div>
              <div className="row gap-3">
                <span className="mono" style={{ fontWeight: 700, minWidth: 78, textAlign: 'right' }}>
                  {formatCurrency(it.price * it.qty)}
                </span>
                <QuantityStepper
                  size="sm"
                  value={it.qty}
                  onAdd={() => onAdd(it)}
                  onRemove={() => onRemove(it)}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          className="row between"
          style={{
            padding: '14px 0',
            marginBottom: 20,
            borderTop: '1.5px dashed var(--line)',
          }}
        >
          <span className="h3">Total ({count} item)</span>
          <span className="h3" style={{ color: 'var(--brand-strong)' }}>
            {formatCurrency(total)}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="cust-name">
              Nama Anda
            </label>
            <input
              id="cust-name"
              className="input"
              placeholder="Misal: Budi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="cust-phone">
              No. HP / WhatsApp
            </label>
            <input
              id="cust-phone"
              className="input"
              type="tel"
              inputMode="tel"
              placeholder="0812xxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <span className="label">Metode Pembayaran</span>
            <div className="row gap-2 wrap">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.id}
                  className={`radio-card ${payment === m.id ? 'is-active' : ''}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.id}
                    checked={payment === m.id}
                    onChange={() => setPayment(m.id)}
                    className="sr-only"
                  />
                  <span className="radio-dot" />
                  <span className="stack gap-1">
                    <span style={{ fontWeight: 650 }}>{m.label}</span>
                    <span className="tiny muted">{m.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <p
            className="small muted"
            style={{
              background: 'var(--brand-tint)',
              padding: '12px 14px',
              borderRadius: 'var(--r-md)',
              marginBottom: 18,
            }}
          >
            {note}
          </p>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner" /> Memproses…
              </>
            ) : (
              <>
                <Icon name="check" size={18} strokeWidth={2.6} /> Konfirmasi Pesanan
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
