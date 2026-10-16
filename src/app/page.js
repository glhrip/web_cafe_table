'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { subscribeToTenants } from '@/lib/tenants';
import { buildPalette } from '@/lib/theme';
import { PLATFORM_NAME } from '@/lib/constants';

const FEATURES = [
  {
    icon: 'qr',
    title: 'Pesan dari Meja',
    text: 'Pelanggan scan QR di meja, langsung pilih menu tanpa antre dan tanpa install aplikasi.',
  },
  {
    icon: 'sparkles',
    title: 'Branding Sendiri',
    text: 'Tiap cafe atur nama, logo, dan warna sendiri — tampilan otomatis menyesuaikan.',
  },
  {
    icon: 'chef',
    title: 'Dashboard Real-time',
    text: 'Pesanan masuk langsung ke papan kanban dapur. Proses cukup satu klik.',
  },
  {
    icon: 'wallet',
    title: 'Multi Cafe',
    text: 'Satu aplikasi untuk banyak cafe. Kelola semuanya dari satu tempat.',
  },
];

export default function PlatformLanding() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToTenants(
      (list) => {
        setTenants(list.filter((t) => t.status !== 'disabled'));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub?.();
  }, []);

  return (
    <div className="stack">
      {/* Hero */}
      <section className="shell page-center" style={{ minHeight: 'auto', paddingTop: 72, paddingBottom: 40 }}>
        <div className="stack gap-4 fade-up" style={{ alignItems: 'center', maxWidth: 720, textAlign: 'center' }}>
          <span className="pill" style={{ padding: '7px 16px' }}>
            <Icon name="sparkles" size={15} style={{ color: 'var(--brand)' }} />
            Platform POS Cafe · White-label
          </span>
          <h1 className="display" style={{ fontSize: 'clamp(2.2rem, 6vw, 3.4rem)' }}>
            Satu aplikasi untuk
            <br />
            semua cafe Anda
          </h1>
          <p className="muted" style={{ maxWidth: 540, fontSize: '1.08rem' }}>
            {PLATFORM_NAME} memberi setiap cafe halaman pesan sendiri — lengkap
            dengan branding, menu, dan dashboard. Tinggal bagikan QR, pesanan
            langsung masuk.
          </p>
          <div className="row gap-3 wrap" style={{ justifyContent: 'center', marginTop: 4 }}>
            <Link href="/superadmin" className="btn btn-primary btn-lg">
              <Icon name="grid" size={18} />
              Kelola Cafe (Reseller)
            </Link>
            <a href="#cafes" className="btn btn-ghost btn-lg">
              <Icon name="coffee" size={18} />
              Lihat Contoh Cafe
            </a>
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section className="shell page" style={{ paddingTop: 24 }}>
        <div
          className="stagger"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 20,
          }}
        >
          {FEATURES.map((f) => (
            <div key={f.title} className="card card-pad stack gap-2">
              <span
                className="row"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: 'var(--brand-soft)',
                  color: 'var(--brand-strong)',
                  justifyContent: 'center',
                }}
              >
                <Icon name={f.icon} size={22} />
              </span>
              <h3 className="h3">{f.title}</h3>
              <p className="small muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Daftar cafe */}
      <section id="cafes" className="shell page" style={{ paddingTop: 8 }}>
        <div className="stack gap-1" style={{ marginBottom: 22 }}>
          <span className="eyebrow">Coba Sekarang</span>
          <h2 className="h2">Pilih salah satu cafe</h2>
          <p className="muted small">
            Tiap cafe punya warna &amp; identitasnya sendiri.
          </p>
        </div>

        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 18,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 150 }} />
            ))}
          </div>
        ) : tenants.length === 0 ? (
          <div
            className="card card-pad text-center"
            style={{ padding: 44, borderStyle: 'dashed', background: 'transparent', boxShadow: 'none' }}
          >
            <p className="muted">
              Belum ada cafe. Buka{' '}
              <Link href="/superadmin" style={{ color: 'var(--brand-strong)', fontWeight: 700 }}>
                panel reseller
              </Link>{' '}
              untuk membuat cafe pertama.
            </p>
          </div>
        ) : (
          <div
            className="stagger"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 18,
            }}
          >
            {tenants.map((t) => {
              const p = buildPalette(t.theme);
              return (
                <Link
                  key={t.slug}
                  href={`/c/${t.slug}`}
                  className="card"
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      height: 88,
                      background: `linear-gradient(135deg, ${p.brand}, ${p.accent})`,
                    }}
                  />
                  <div className="stack gap-2" style={{ padding: 18 }}>
                    <span className="row gap-2" style={{ alignItems: 'center' }}>
                      <span
                        className="row"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          background: p['brand-soft'],
                          color: p['brand-strong'],
                          justifyContent: 'center',
                          fontWeight: 700,
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {t.name?.charAt(0).toUpperCase() || 'C'}
                      </span>
                      <span className="h3" style={{ fontSize: '1.05rem' }}>
                        {t.name}
                      </span>
                    </span>
                    <span className="small muted">{t.tagline || 'Pesan langsung dari meja'}</span>
                    <span
                      className="row gap-1 small"
                      style={{ color: p['brand-strong'], fontWeight: 700, marginTop: 4 }}
                    >
                      Buka menu
                      <Icon name="arrowRight" size={15} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <footer className="shell" style={{ paddingTop: 20, paddingBottom: 40 }}>
        <hr className="divider" style={{ marginBottom: 20 }} />
        <p className="tiny faint text-center">
          {PLATFORM_NAME} · Demo white-label POS cafe. Setiap cafe dikelola
          terpisah.
        </p>
      </footer>
    </div>
  );
}
