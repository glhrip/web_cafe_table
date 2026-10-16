'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import Brand from '@/components/Brand';
import { ToastProvider, useToast } from '@/components/Toast';
import { useTenant } from '@/components/TenantProvider';
import { updateTenant } from '@/lib/tenants';
import {
  BRAND_PRESETS,
  DEFAULT_BRAND,
  DEFAULT_ACCENT,
  normalizeHex,
  paletteStyle,
} from '@/lib/theme';

function BrandingStudio() {
  const toast = useToast();
  const tenant = useTenant();

  const [name, setName] = useState(tenant.name || '');
  const [tagline, setTagline] = useState(tenant.tagline || '');
  const [logo, setLogo] = useState(tenant.logo || '');
  const [brand, setBrand] = useState(tenant.theme?.brand || DEFAULT_BRAND);
  const [accent, setAccent] = useState(tenant.theme?.accent || DEFAULT_ACCENT);
  const [saving, setSaving] = useState(false);

  const theme = { brand, accent };
  const preview = paletteStyle(theme);

  const applyPreset = (p) => {
    setBrand(p.brand);
    setAccent(p.accent);
  };

  const save = async (e) => {
    e.preventDefault();
    const safeBrand = normalizeHex(brand) || DEFAULT_BRAND;
    const safeAccent = normalizeHex(accent) || DEFAULT_ACCENT;
    if (!name.trim()) {
      toast.error('Nama cafe wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await updateTenant(tenant.slug, {
        name: name.trim(),
        tagline: tagline.trim(),
        logo: logo.trim(),
        theme: { brand: safeBrand, accent: safeAccent },
      });
      toast.success('Branding disimpan');
    } catch {
      toast.error('Gagal menyimpan branding');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="row between gap-3 wrap" style={{ marginBottom: 20 }}>
        <div className="stack gap-1">
          <h1 className="h2">Branding Cafe</h1>
          <p className="muted small">
            Atur nama, logo, dan warna. Perubahan langsung terlihat di seluruh
            halaman.
          </p>
        </div>
        <Link href={`/c/${tenant.slug}`} className="btn btn-ghost btn-sm">
          <Icon name="arrowRight" size={15} />
          Lihat Halaman
        </Link>
      </div>

      <div
        className="responsive-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 22,
          alignItems: 'start',
        }}
      >
        {/* Form */}
        <form onSubmit={save} className="card card-pad stack gap-3">
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="b-name">Nama Cafe</label>
            <input
              id="b-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Kopi Senja"
              required
            />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="b-tag">Tagline / Slogan</label>
            <input
              id="b-tag"
              className="input"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Misal: Kopi enak, suasana hangat"
            />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="b-logo">URL Logo</label>
            <input
              id="b-logo"
              className="input"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://… (kosongkan untuk pakai inisial)"
            />
            <span className="tiny faint">
              Kosongkan untuk memakai huruf pertama nama sebagai logo.
            </span>
          </div>

          <div className="stack gap-2">
            <span className="label">Warna Utama</span>
            <div className="row gap-2 wrap">
              {BRAND_PRESETS.map((p) => {
                const active =
                  normalizeHex(brand) === normalizeHex(p.brand);
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="row gap-2"
                    style={{
                      padding: '6px 12px 6px 6px',
                      borderRadius: 'var(--r-full)',
                      border: active
                        ? `2px solid ${p.brand}`
                        : '1.5px solid var(--line)',
                      background: active ? 'var(--brand-tint)' : 'var(--surface)',
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

          <div className="row gap-3 wrap">
            <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 130 }}>
              <label className="label" htmlFor="b-brand">Warna Brand</label>
              <div className="row gap-2">
                <input
                  id="b-brand"
                  type="color"
                  value={normalizeHex(brand) || DEFAULT_BRAND}
                  onChange={(e) => setBrand(e.target.value)}
                  style={{
                    width: 46,
                    height: 46,
                    padding: 0,
                    border: '1.5px solid var(--line)',
                    borderRadius: 12,
                    background: 'none',
                    cursor: 'pointer',
                  }}
                />
                <input
                  className="input"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="#c2703d"
                />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 130 }}>
              <label className="label" htmlFor="b-accent">Warna Aksen</label>
              <div className="row gap-2">
                <input
                  id="b-accent"
                  type="color"
                  value={normalizeHex(accent) || DEFAULT_ACCENT}
                  onChange={(e) => setAccent(e.target.value)}
                  style={{
                    width: 46,
                    height: 46,
                    padding: 0,
                    border: '1.5px solid var(--line)',
                    borderRadius: 12,
                    background: 'none',
                    cursor: 'pointer',
                  }}
                />
                <input
                  className="input"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  placeholder="#e29a5c"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner" /> Menyimpan…
              </>
            ) : (
              <>
                <Icon name="check" size={16} strokeWidth={2.6} />
                Simpan Branding
              </>
            )}
          </button>
        </form>

        {/* Pratinjau langsung */}
        <div className="stack gap-3" style={{ position: 'sticky', top: 80 }}>
          <span className="label">Pratinjau</span>
          <div
            className="card"
            style={{
              ...preview,
              overflow: 'hidden',
              padding: 0,
            }}
          >
            <div
              style={{
                height: 74,
                background: 'linear-gradient(135deg, var(--brand), var(--accent))',
              }}
            />
            <div className="stack gap-3" style={{ padding: 18 }}>
              <div style={{ ...preview }}>
                <Brand href={null} subtitle={tagline || 'Tagline cafe'} />
              </div>
              <div className="stack gap-2">
                <span className="h3">{name || 'Nama Cafe'}</span>
                <p className="small muted">{tagline || 'Tagline / slogan cafe'}</p>
              </div>
              <div className="row gap-2 wrap">
                <span className="btn btn-primary btn-sm">Lihat Menu</span>
                <span className="btn btn-ghost btn-sm">Pesan</span>
              </div>
              <div className="row gap-2">
                <span className="badge badge-warning">Favorit</span>
                <span className="pill" style={{ fontSize: '0.72rem' }}>Coffee</span>
              </div>
            </div>
          </div>
          <p className="tiny faint">
            Ini hanya perkiraan. Warna turunan (terang/gelap) dihitung otomatis
            dari warna brand.
          </p>
        </div>
      </div>
    </>
  );
}

export default function AdminBrandingPage() {
  return (
    <ToastProvider>
      <BrandingStudio />
    </ToastProvider>
  );
}
