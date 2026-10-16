'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CustomerHeader from '@/components/CustomerHeader';
import OrderProgress from '@/components/OrderProgress';
import OrderSummary from '@/components/OrderSummary';
import StatusBadge from '@/components/StatusBadge';
import Confetti from '@/components/Confetti';
import Icon from '@/components/Icon';
import { ToastProvider } from '@/components/Toast';
import { useTenant } from '@/components/TenantProvider';
import { subscribeToSingleOrder } from '@/lib/db';
import { ORDER_STATUS, PAYMENT_LABEL, STATUS_META } from '@/lib/constants';
import { formatDateTime, shortId } from '@/lib/format';

const TONE_ICON = {
  warning: 'clock',
  info: 'chef',
  success: 'bag',
  neutral: 'check',
  danger: 'alert',
};

function OrderScreen({ orderId }) {
  const tenant = useTenant();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const prevStatus = useRef(null);

  useEffect(() => {
    const unsub = subscribeToSingleOrder(
      tenant.slug,
      orderId,
      (data) => {
        if (data) {
          setOrder(data);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      },
      () => setNotFound(true),
    );
    return () => unsub?.();
  }, [tenant.slug, orderId]);

  // Picu confetti sekali saat berubah menjadi "siap diambil".
  useEffect(() => {
    if (
      order?.status === ORDER_STATUS.READY &&
      prevStatus.current !== ORDER_STATUS.READY
    ) {
      setCelebrate(true);
    }
    if (order) prevStatus.current = order.status;
  }, [order]);

  if (notFound) {
    return (
      <>
        <CustomerHeader />
        <main className="shell shell-narrow page">
          <div
            className="card card-pad stack gap-3 text-center"
            style={{ alignItems: 'center', padding: 48 }}
          >
            <Icon name="alert" size={38} style={{ color: 'var(--warning)' }} />
            <h1 className="h2">Pesanan tidak ditemukan</h1>
            <p className="muted small">
              Pastikan tautan benar, atau buat pesanan baru dari meja Anda.
            </p>
            <Link href={`/c/${tenant.slug}`} className="btn btn-primary">
              Kembali ke Beranda
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <CustomerHeader />
        <main className="shell shell-narrow page stack gap-4">
          <div className="skeleton" style={{ height: 96 }} />
          <div className="skeleton" style={{ height: 260 }} />
        </main>
      </>
    );
  }

  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const isCancelled = order.status === ORDER_STATUS.CANCELLED;
  const isDone = order.status === ORDER_STATUS.COMPLETED;

  return (
    <>
      <Confetti fire={celebrate} />
      <CustomerHeader tableId={order.tableNo} />

      <main className="shell shell-narrow page stack gap-4">
        <section
          className="card card-pad fade-up"
          style={{
            background: `linear-gradient(135deg, var(--${meta.tone}-bg), var(--surface) 65%)`,
          }}
        >
          <div className="row between gap-3 wrap" style={{ marginBottom: 20 }}>
            <div className="stack gap-1">
              <span className="eyebrow">Status Pesanan</span>
              <h1 className="h2">{meta.label}</h1>
              <span className="small faint mono">
                #{shortId(order.id)} · Meja {order.tableNo}
              </span>
            </div>
            <StatusBadge status={order.status} full />
          </div>

          {!isCancelled ? <OrderProgress status={order.status} /> : null}

          <div
            className="row gap-3"
            style={{
              marginTop: 22,
              padding: 16,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
            }}
          >
            <span
              className="row"
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: `var(--${meta.tone}-bg)`,
                color: `var(--${meta.tone})`,
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name={TONE_ICON[meta.tone]} size={22} strokeWidth={2.3} />
            </span>
            <div className="stack gap-1">
              <span style={{ fontWeight: 700 }}>
                {order.status === ORDER_STATUS.PENDING &&
                  'Menunggu konfirmasi kasir'}
                {order.status === ORDER_STATUS.PREPARING &&
                  'Pesananmu sedang disiapkan'}
                {order.status === ORDER_STATUS.READY &&
                  `Siap diambil, ${order.customerName}!`}
                {order.status === ORDER_STATUS.COMPLETED &&
                  'Terima kasih sudah memesan'}
                {isCancelled && 'Pesanan dibatalkan'}
              </span>
              <span className="small muted">
                {order.status === ORDER_STATUS.PENDING &&
                  'Selesaikan pembayaran, lalu kasir akan memproses pesananmu.'}
                {order.status === ORDER_STATUS.PREPARING &&
                  'Barista kami sedang meracik pesananmu. Mohon tunggu sebentar.'}
                {order.status === ORDER_STATUS.READY &&
                  'Silakan ambil pesananmu di kasir sekarang.'}
                {order.status === ORDER_STATUS.COMPLETED &&
                  'Kami tunggu kunjungan berikutnya! ☕'}
                {isCancelled &&
                  'Hubungi kasir bila ini tidak sesuai. Terima kasih.'}
              </span>
            </div>
          </div>
        </section>

        <section className="card card-pad">
          <div className="row between gap-2" style={{ marginBottom: 16 }}>
            <h2 className="h3">Rincian Pesanan</h2>
            <span className="pill">
              <Icon name="wallet" size={14} />
              {PAYMENT_LABEL[order.paymentMethod] || 'Kasir'}
            </span>
          </div>

          <div className="row between gap-3 wrap" style={{ marginBottom: 14 }}>
            <div className="stack gap-1">
              <span className="tiny faint">Nama</span>
              <span style={{ fontWeight: 650 }}>{order.customerName}</span>
            </div>
            <div className="stack gap-1">
              <span className="tiny faint">No. HP</span>
              <span style={{ fontWeight: 650 }}>{order.customerPhone}</span>
            </div>
            <div className="stack gap-1">
              <span className="tiny faint">Waktu</span>
              <span style={{ fontWeight: 650 }}>
                {formatDateTime(order.createdAt)}
              </span>
            </div>
          </div>

          <hr className="divider" style={{ marginBottom: 4 }} />

          <OrderSummary order={order} />
        </section>

        {isDone || isCancelled ? (
          <Link
            href={`/c/${tenant.slug}/table/${order.tableNo}`}
            className="btn btn-primary btn-block btn-lg"
          >
            <Icon name="refresh" size={18} />
            Pesan Lagi
          </Link>
        ) : (
          <p className="small faint text-center">
            Halaman ini diperbarui otomatis. Tidak perlu refresh.
          </p>
        )}
      </main>
    </>
  );
}

export default function OrderTrackingPage({ params }) {
  const { id } = use(params);
  return (
    <ToastProvider>
      <OrderScreen orderId={id} />
    </ToastProvider>
  );
}
