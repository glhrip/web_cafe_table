'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import StatCard from '@/components/admin/StatCard';
import OrderCard from '@/components/admin/OrderCard';
import { ToastProvider, useToast } from '@/components/Toast';
import { subscribeToOrders, updateOrderStatus, isFirebaseConfigured } from '@/lib/db';
import { ORDER_STATUS } from '@/lib/constants';
import { countItems, formatCurrency, isToday } from '@/lib/format';

const COLUMNS = [
  { status: ORDER_STATUS.PENDING, title: 'Pesanan Baru', tone: 'warning', icon: 'clock' },
  { status: ORDER_STATUS.PREPARING, title: 'Disiapkan', tone: 'info', icon: 'chef' },
  { status: ORDER_STATUS.READY, title: 'Siap Diambil', tone: 'success', icon: 'bag' },
];

const DONE = [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED];

function Dashboard() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    const unsub = subscribeToOrders(
      (data) => {
        setOrders(data);
        setLoading(false);
        setLoadError(false);
      },
      () => {
        setLoading(false);
        setLoadError(true);
      },
    );
    return () => unsub?.();
  }, []);

  const byStatus = useMemo(() => {
    const map = { pending: [], preparing: [], ready: [], completed: [], cancelled: [] };
    orders.forEach((o) => (map[o.status] || []).push(o));
    return map;
  }, [orders]);

  const stats = useMemo(() => {
    const today = orders.filter((o) => isToday(o.createdAt));
    const revenue = today
      .filter((o) => o.status === ORDER_STATUS.COMPLETED)
      .reduce((s, o) => s + (o.total || 0), 0);
    return {
      new: byStatus.pending.length,
      active: byStatus.preparing.length + byStatus.ready.length,
      today: today.length,
      revenue,
    };
  }, [orders, byStatus]);

  const handleUpdate = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      const label =
        status === ORDER_STATUS.CANCELLED ? 'Pesanan dibatalkan' : 'Status diperbarui';
      toast.success(label);
    } catch {
      toast.error('Gagal memperbarui status');
    }
  };

  return (
    <>
      <div className="row between gap-3 wrap" style={{ marginBottom: 20 }}>
        <div className="stack gap-1">
          <h1 className="h2">Pesanan Masuk</h1>
          <p className="muted small">Pantau dan proses pesanan secara real-time.</p>
        </div>
        {!isFirebaseConfigured ? (
          <span className="pill" style={{ color: 'var(--warning)', borderColor: 'var(--warning-bg)' }}>
            <Icon name="alert" size={14} />
            Mode Demo (tanpa Firebase)
          </span>
        ) : null}
      </div>

      {/* Statistik */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 26,
        }}
      >
        <StatCard icon="receipt" label="Pesanan Baru" value={stats.new} tone="warning" />
        <StatCard icon="chef" label="Sedang Diproses" value={stats.active} tone="info" />
        <StatCard icon="bag" label="Pesanan Hari Ini" value={stats.today} tone="brand" />
        <StatCard
          icon="trending"
          label="Pendapatan Hari Ini"
          value={formatCurrency(stats.revenue)}
          tone="success"
        />
      </div>

      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 220 }} />
          ))}
        </div>
      ) : loadError ? (
        <div
          className="card card-pad stack gap-3 text-center"
          style={{ alignItems: 'center', padding: 44, borderColor: 'var(--warning-bg)' }}
        >
          <Icon name="alert" size={36} style={{ color: 'var(--warning)' }} />
          <h2 className="h3">Gagal memuat pesanan</h2>
          <p className="muted small" style={{ maxWidth: 420 }}>
            Tidak dapat terhubung ke database. Periksa koneksi internet dan
            konfigurasi Firebase, lalu muat ulang halaman.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            <Icon name="refresh" size={16} />
            Muat Ulang
          </button>
        </div>
      ) : (
        <>
          {/* Papan kolom */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 20,
              alignItems: 'start',
            }}
          >
            {COLUMNS.map((col) => {
              const list = byStatus[col.status] || [];
              return (
                <section key={col.status} className="stack gap-3">
                  <div className="row between gap-2">
                    <span className="row gap-2" style={{ fontWeight: 750 }}>
                      <span
                        className="row"
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          background: `var(--${col.tone}-bg)`,
                          color: `var(--${col.tone})`,
                          justifyContent: 'center',
                        }}
                      >
                        <Icon name={col.icon} size={15} />
                      </span>
                      {col.title}
                    </span>
                    <span className="badge badge-neutral">{list.length}</span>
                  </div>

                  <div className="stack gap-3">
                    {list.length === 0 ? (
                      <div
                        className="card"
                        style={{
                          padding: 26,
                          textAlign: 'center',
                          borderStyle: 'dashed',
                          background: 'transparent',
                          boxShadow: 'none',
                        }}
                      >
                        <span className="small faint">Belum ada pesanan</span>
                      </div>
                    ) : (
                      list.map((o) => (
                        <OrderCard key={o.id} order={o} onUpdate={handleUpdate} />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Riwayat selesai */}
          <div className="stack gap-3" style={{ marginTop: 34 }}>
            <button
              type="button"
              className="row gap-2"
              onClick={() => setShowDone((v) => !v)}
              style={{ fontWeight: 700, alignSelf: 'flex-start' }}
            >
              <Icon
                name="chevronRight"
                size={18}
                style={{
                  transform: showDone ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
              Riwayat Selesai ({byStatus.completed.length + byStatus.cancelled.length})
            </button>

            {showDone ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 16,
                }}
              >
                {[...byStatus.completed, ...byStatus.cancelled]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 12)
                  .map((o) => (
                    <OrderCard key={o.id} order={o} onUpdate={handleUpdate} />
                  ))}
              </div>
            ) : null}
          </div>
        </>
      )}
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}
