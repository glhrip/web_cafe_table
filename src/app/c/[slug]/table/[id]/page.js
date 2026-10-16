'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerHeader from '@/components/CustomerHeader';
import MenuCard from '@/components/MenuCard';
import MenuSkeleton from '@/components/MenuSkeleton';
import CartBar from '@/components/CartBar';
import CartSheet from '@/components/CartSheet';
import Icon from '@/components/Icon';
import { ToastProvider, useToast } from '@/components/Toast';
import { useTenant } from '@/components/TenantProvider';
import { getMenuItems, createOrder } from '@/lib/db';

const ALL = '__all__';

function MenuScreen({ tableId }) {
  const router = useRouter();
  const toast = useToast();
  const tenant = useTenant();

  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cart, setCart] = useState({});
  const [activeCat, setActiveCat] = useState(ALL);
  const [query, setQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const cartKey = `cart:${tenant.slug}:${tableId}`;
  const orderKey = `order:${tenant.slug}:${tableId}`;

  // Muat menu tenant.
  useEffect(() => {
    let alive = true;
    getMenuItems(tenant.slug)
      .then((items) => {
        if (alive) setMenu(items);
      })
      .catch(() => {
        if (alive) setLoadError(true);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.slug]);

  // Pulihkan keranjang tersimpan.
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) setCart(JSON.parse(savedCart));
      const savedOrder = localStorage.getItem(orderKey);
      if (savedOrder) setLastOrder(savedOrder);
    } catch {
      /* ignore */
    }
  }, [cartKey, orderKey]);

  useEffect(() => {
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart, cartKey]);

  const categories = useMemo(() => {
    const set = new Set(menu.map((m) => m.category).filter(Boolean));
    return [ALL, ...Array.from(set)];
  }, [menu]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu.filter((m) => {
      const catOk = activeCat === ALL || m.category === activeCat;
      const qOk =
        !q ||
        m.name?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [menu, activeCat, query]);

  const add = (item) =>
    setCart((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));

  const remove = (item) =>
    setCart((prev) => {
      const next = { ...prev };
      if (next[item.id] > 1) next[item.id] -= 1;
      else delete next[item.id];
      return next;
    });

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const item = menu.find((m) => m.id === id);
          return item ? { ...item, qty } : null;
        })
        .filter(Boolean),
    [cart, menu],
  );

  const total = cartLines.reduce((s, it) => s + it.price * it.qty, 0);
  const count = cartLines.reduce((s, it) => s + it.qty, 0);

  const submit = async ({ name, phone, payment }) => {
    setSubmitting(true);
    try {
      const orderData = {
        tableNo: tableId,
        customerName: name,
        customerPhone: phone,
        paymentMethod: payment,
        items: cartLines.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          qty: it.qty,
        })),
        total,
        status: 'pending',
      };
      const ref = await createOrder(tenant.slug, orderData);
      try {
        localStorage.setItem(orderKey, ref.id);
        localStorage.removeItem(cartKey);
      } catch {
        /* ignore */
      }
      router.push(`/c/${tenant.slug}/order/${ref.id}`);
    } catch {
      toast.error('Gagal membuat pesanan. Coba lagi.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <CustomerHeader tableId={tableId} orderId={lastOrder} orderCount={count} />

      <main className="shell page">
        {/* Hero */}
        <section
          className="card card-pad fade-up"
          style={{
            marginBottom: 24,
            background:
              'linear-gradient(135deg, var(--brand-tint), var(--surface) 60%)',
            borderColor: 'var(--brand-soft)',
          }}
        >
          <div className="row between gap-3 wrap">
            <div className="stack gap-1">
              <span className="eyebrow">Meja {tableId}</span>
              <h1 className="h2">Selamat datang! 👋</h1>
              <p className="muted small">
                {tenant?.tagline || 'Pilih menu favoritmu di bawah ini.'}
              </p>
            </div>
            <div
              className="row gap-2"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-md)',
                padding: '10px 14px',
              }}
            >
              <Icon name="coffee" size={22} style={{ color: 'var(--brand)' }} />
              <div className="stack">
                <span className="tiny faint">Meja</span>
                <span className="h3" style={{ lineHeight: 1 }}>
                  {tableId}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Kontrol pencarian + kategori */}
        <div className="stack gap-3" style={{ marginBottom: 22 }}>
          <div style={{ position: 'relative' }}>
            <Icon
              name="search"
              size={19}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ink-3)',
              }}
            />
            <input
              className="input"
              placeholder="Cari menu…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: 44 }}
            />
          </div>

          {!loading && categories.length > 1 ? (
            <div className="row gap-2" style={{ overflowX: 'auto', paddingBottom: 4 }}>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`pill ${activeCat === c ? 'is-active' : ''}`}
                  onClick={() => setActiveCat(c)}
                  style={
                    activeCat === c
                      ? {
                          background: 'var(--brand)',
                          borderColor: 'var(--brand)',
                          color: '#fff',
                        }
                      : undefined
                  }
                >
                  {c === ALL ? 'Semua' : c}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Grid menu */}
        {loading ? (
          <MenuSkeleton count={6} />
        ) : loadError ? (
          <div
            className="card card-pad stack gap-2 text-center"
            style={{ alignItems: 'center', padding: 48, borderColor: 'var(--warning-bg)' }}
          >
            <Icon name="alert" size={36} style={{ color: 'var(--warning)' }} />
            <h3 className="h3">Gagal memuat menu</h3>
            <p className="muted small">
              Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              <Icon name="refresh" size={16} />
              Coba Lagi
            </button>
          </div>
        ) : menu.length === 0 ? (
          <div
            className="card card-pad stack gap-2 text-center"
            style={{ alignItems: 'center', padding: 48 }}
          >
            <Icon name="coffee" size={36} style={{ color: 'var(--ink-3)' }} />
            <h3 className="h3">Menu belum tersedia</h3>
            <p className="muted small">
              Mohon maaf, menu sedang diperbarui. Silakan tanya kasir kami.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div
            className="card card-pad stack gap-2 text-center"
            style={{ alignItems: 'center', padding: 48 }}
          >
            <Icon name="search" size={34} style={{ color: 'var(--ink-3)' }} />
            <h3 className="h3">Menu tidak ditemukan</h3>
            <p className="muted small">
              Coba kata kunci lain atau pilih kategori berbeda.
            </p>
          </div>
        ) : (
          <div
            className="stagger"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: 20,
            }}
          >
            {visible.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                qty={cart[item.id] || 0}
                onAdd={add}
                onRemove={remove}
              />
            ))}
          </div>
        )}
      </main>

      <CartBar count={count} total={total} onOpen={() => setShowCart(true)} />

      {showCart ? (
        <CartSheet
          items={cartLines}
          total={total}
          submitting={submitting}
          onClose={() => setShowCart(false)}
          onAdd={add}
          onRemove={remove}
          onSubmit={submit}
        />
      ) : null}
    </>
  );
}

export default function TableMenuPage({ params }) {
  const { id } = use(params);
  return (
    <ToastProvider>
      <MenuScreen tableId={id} />
    </ToastProvider>
  );
}
