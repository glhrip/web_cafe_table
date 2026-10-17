'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { subscribeToTenant } from '@/lib/tenants';
import { themeCss } from '@/lib/theme';

const TenantCtx = createContext(null);

/** Ambil data cafe (tenant) aktif dari context. */
export function useTenant() {
  return useContext(TenantCtx);
}

function Center({ children }) {
  return (
    <div className="page-center">
      <div className="stack gap-3" style={{ alignItems: 'center', maxWidth: 420 }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Membungkus semua halaman milik satu cafe: memuat data tenant, menerapkan
 * tema warna (CSS var), dan menangani keadaan memuat / tidak ditemukan.
 */
export default function TenantProvider({ slug, children }) {
  const [tenant, setTenant] = useState(null);
  // Saat slug berubah, komponen ini di-remount lewat key di bawah, jadi
  // status awal cukup 'loading' dan tidak perlu di-set ulang di effect.
  const [state, setState] = useState('loading'); // loading | ready | missing | error

  useEffect(() => {
    const unsub = subscribeToTenant(
      slug,
      (data) => {
        if (data) {
          setTenant(data);
          setState('ready');
        } else {
          setState('missing');
        }
      },
      () => setState('error'),
    );
    return () => unsub?.();
  }, [slug]);

  // Suntikkan CSS tema ke <head> supaya seluruh halaman memakai warna cafe.
  useEffect(() => {
    if (state !== 'ready' || !tenant) return;
    const id = 'tenant-theme';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = themeCss(tenant.theme);
    return () => {
      /* biarkan sampai provider lain menimpanya */
    };
  }, [state, tenant]);

  const value = useMemo(
    () => (tenant ? { ...tenant, slug } : null),
    [tenant, slug],
  );

  if (state === 'loading') {
    return (
      <Center>
        <span className="spinner spinner-dark" />
        <span className="muted small">Memuat…</span>
      </Center>
    );
  }

  if (state === 'missing') {
    return (
      <Center>
        <span
          className="row"
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            justifyContent: 'center',
          }}
        >
          <Icon name="alert" size={26} />
        </span>
        <h1 className="h2 text-center">Cafe tidak ditemukan</h1>
        <p className="muted small text-center">
          Alamat <strong>/c/{slug}</strong> tidak terdaftar. Periksa kembali
          tautan dari QR di meja Anda.
        </p>
        <Link href="/" className="btn btn-primary">
          <Icon name="arrowLeft" size={16} />
          Ke Halaman Utama
        </Link>
      </Center>
    );
  }

  if (state === 'error') {
    return (
      <Center>
        <span
          className="row"
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'var(--warning-bg)',
            color: 'var(--warning)',
            justifyContent: 'center',
          }}
        >
          <Icon name="alert" size={26} />
        </span>
        <h1 className="h2 text-center">Gagal memuat data cafe</h1>
        <p className="muted small text-center">
          Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          <Icon name="refresh" size={16} />
          Muat Ulang
        </button>
      </Center>
    );
  }

  return <TenantCtx.Provider value={value}>{children}</TenantCtx.Provider>;
}
