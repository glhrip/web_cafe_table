'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { ToastProvider, useToast } from '@/components/Toast';
import {
  subscribeToTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  slugify,
} from '@/lib/tenants';
import { BRAND_PRESETS, buildPalette } from '@/lib/theme';
import { PLATFORM_NAME } from '@/lib/constants';

const EMPTY = {
  name: '',
  slug: '',
  tagline: '',
  logo: '',
  pin: '1234',
  owner: '',
  theme: { brand: BRAND_PRESETS[0].brand, accent: BRAND_PRESETS[0].accent },
};

function Console() {
  const toast = useToast();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const unsub = subscribeToTenants(
      (list) => {
        setTenants(list);
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

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    const slug = slugify(form.slug || form.name);
    if (!form.name.trim()) {
      toast.error('Nama cafe wajib diisi');
      return;
    }
    if (!slug) {
      toast.error('Slug tidak valid — gunakan huruf/angka');
      return;
    }
    if (tenants.some((t) => t.slug === slug)) {
      toast.error(`Slug "${slug}" sudah dipakai`);
      return;
    }
    setSaving(true);
    try {
      await createTenant({ ...form, slug });
      toast.success(`Cafe "${form.name}" dibuat`);
      setForm(EMPTY);
      setShowForm(false);
    } catch (err) {
      toast.error(err?.message || 'Gagal membuat cafe');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (t) => {
    const next = t.status === 'disabled' ? 'active' : 'disabled';
    try {
      await updateTenant(t.slug, { status: next });
      toast.success(next === 'active' ? 'Cafe diaktifkan' : 'Cafe dinonaktifkan');
    } catch {
      toast.error('Gagal memperbarui status');
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Hapus cafe "${t.name}"? Menu & pesanannya tidak dihapus otomatis.`))
      return;
    try {
      await deleteTenant(t.slug);
      toast.success('Cafe dihapus');
    } catch {
      toast.error('Gagal menghapus cafe');
    }
  };

  const slugPreview = slugify(form.slug || form.name);

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="shell row between gap-3" style={{ width: '100%' }}>
          <span className="row gap-2" style={{ fontWeight: 750 }}>
            <span className="brand-mark" style={{ background: 'linear-gradient(135deg,#0f172a,#475569)' }}>
              <Icon name="grid" size={18} />
            </span>
            <span className="stack">
              <span className="brand-name">{PLATFORM_NAME}</span>
              <span className="tiny faint" style={{ lineHeight: 1 }}>
                Panel Reseller
              </span>
            </span>
          </span>
          <Link href="/" className="btn btn-ghost btn-sm">
            <Icon name="arrowLeft" size={16} />
            <span className="hide-sm">Ke Beranda</span>
          </Link>
        </div>
      </header>

      <main className="shell page">
        <div className="row between gap-3 wrap" style={{ marginBottom: 22 }}>
          <div className="stack gap-1">
            <h1 className="h2">Kelola Cafe</h1>
            <p className="muted small">
              {tenants.length} cafe terdaftar. Setiap cafe punya halaman &
              branding sendiri.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm((v) => !v)}
          >
            <Icon name={showForm ? 'close' : 'plus'} size={17} />
            {showForm ? 'Tutup' : 'Tambah Cafe'}
          </button>
        </div>

        {/* Form tambah */}
        {showForm ? (
          <form
            onSubmit={submit}
            className="card card-pad stack gap-3 fade-up"
            style={{ marginBottom: 26 }}
          >
            <h2 className="h3">Cafe Baru</h2>
            <div
              className="responsive-grid"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
            >
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="t-name">Nama Cafe</label>
                <input
                  id="t-name"
                  className="input"
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="Misal: Kopi Senja"
                  required
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="t-slug">Slug (alamat URL)</label>
                <input
                  id="t-slug"
                  className="input"
                  value={form.slug}
                  onChange={(e) => set({ slug: e.target.value })}
                  placeholder="kopi-senja"
                />
                <span className="tiny faint">/c/{slugPreview || 'nama-cafe'}</span>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="t-tag">Tagline</label>
                <input
                  id="t-tag"
                  className="input"
                  value={form.tagline}
                  onChange={(e) => set({ tagline: e.target.value })}
                  placeholder="Kopi enak, suasana hangat"
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="t-owner">Nama Pemilik (opsional)</label>
                <input
                  id="t-owner"
                  className="input"
                  value={form.owner}
                  onChange={(e) => set({ owner: e.target.value })}
                  placeholder="Misal: Budi"
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="t-pin">PIN Admin</label>
                <input
                  id="t-pin"
                  className="input"
                  value={form.pin}
                  onChange={(e) => set({ pin: e.target.value })}
                  placeholder="1234"
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="t-logo">URL Logo (opsional)</label>
                <input
                  id="t-logo"
                  className="input"
                  value={form.logo}
                  onChange={(e) => set({ logo: e.target.value })}
                  placeholder="https://…"
                />
              </div>
            </div>

            <div className="stack gap-2">
              <span className="label">Tema Warna Awal</span>
              <div className="row gap-2 wrap">
                {BRAND_PRESETS.map((p) => {
                  const active = form.theme.brand === p.brand;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => set({ theme: { brand: p.brand, accent: p.accent } })}
                      className="row gap-2"
                      style={{
                        padding: '6px 12px 6px 6px',
                        borderRadius: 'var(--r-full)',
                        border: active ? `2px solid ${p.brand}` : '1.5px solid var(--line)',
                        background: 'var(--surface)',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${p.brand}, ${p.accent})`,
                        }}
                      />
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="row gap-2">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner" /> Membuat…
                  </>
                ) : (
                  <>
                    <Icon name="check" size={16} strokeWidth={2.6} />
                    Buat Cafe
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  setForm(EMPTY);
                  setShowForm(false);
                }}
              >
                Batal
              </button>
            </div>
          </form>
        ) : null}

        {/* Daftar cafe */}
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 18,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 150 }} />
            ))}
          </div>
        ) : loadError ? (
          <div
            className="card card-pad stack gap-3 text-center"
            style={{ alignItems: 'center', padding: 44, borderColor: 'var(--warning-bg)' }}
          >
            <Icon name="alert" size={36} style={{ color: 'var(--warning)' }} />
            <h2 className="h3">Gagal memuat daftar cafe</h2>
            <p className="muted small">Periksa koneksi lalu muat ulang halaman.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              <Icon name="refresh" size={16} />
              Muat Ulang
            </button>
          </div>
        ) : tenants.length === 0 ? (
          <div
            className="card card-pad text-center"
            style={{ padding: 44, borderStyle: 'dashed', background: 'transparent', boxShadow: 'none' }}
          >
            <p className="muted">Belum ada cafe. Klik "Tambah Cafe" untuk memulai.</p>
          </div>
        ) : (
          <div
            className="stagger"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 18,
            }}
          >
            {tenants.map((t) => {
              const p = buildPalette(t.theme);
              const disabled = t.status === 'disabled';
              return (
                <div
                  key={t.slug}
                  className="card"
                  style={{ overflow: 'hidden', opacity: disabled ? 0.6 : 1 }}
                >
                  <div
                    style={{
                      height: 10,
                      background: `linear-gradient(90deg, ${p.brand}, ${p.accent})`,
                    }}
                  />
                  <div className="stack gap-3" style={{ padding: 18 }}>
                    <div className="row between gap-2" style={{ alignItems: 'flex-start' }}>
                      <span className="row gap-2" style={{ minWidth: 0 }}>
                        <span
                          className="row"
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 11,
                            background: p['brand-soft'],
                            color: p['brand-strong'],
                            justifyContent: 'center',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {t.name?.charAt(0).toUpperCase() || 'C'}
                        </span>
                        <span className="stack" style={{ minWidth: 0 }}>
                          <span style={{ fontWeight: 750 }}>{t.name}</span>
                          <span className="tiny faint mono">/c/{t.slug}</span>
                        </span>
                      </span>
                      <span
                        className={`badge ${disabled ? 'badge-danger' : 'badge-success'}`}
                      >
                        {disabled ? 'Nonaktif' : 'Aktif'}
                      </span>
                    </div>

                    <div className="row gap-3 wrap tiny faint">
                      <span className="row gap-1">
                        <Icon name="lock" size={12} /> PIN {t.pin || '1234'}
                      </span>
                      {t.owner ? (
                        <span className="row gap-1">
                          <Icon name="user" size={12} /> {t.owner}
                        </span>
                      ) : null}
                    </div>

                    <div className="row gap-2 wrap">
                      <Link href={`/c/${t.slug}`} className="btn btn-ghost btn-sm">
                        <Icon name="coffee" size={14} /> Buka
                      </Link>
                      <Link href={`/c/${t.slug}/admin`} className="btn btn-ghost btn-sm">
                        <Icon name="receipt" size={14} /> Admin
                      </Link>
                      <button
                        type="button"
                        className="btn btn-quiet btn-sm"
                        onClick={() => toggleStatus(t)}
                      >
                        <Icon name={disabled ? 'check' : 'close'} size={14} />
                        {disabled ? 'Aktifkan' : 'Nonaktifkan'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-quiet btn-icon"
                        onClick={() => remove(t)}
                        aria-label={`Hapus ${t.name}`}
                        style={{ color: 'var(--danger)' }}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

export default function SuperAdminPage() {
  return (
    <ToastProvider>
      <Console />
    </ToastProvider>
  );
}
