'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Brand from '@/components/Brand';
import Icon from '@/components/Icon';
import PinGate from './PinGate';
import { useTenant } from '@/components/TenantProvider';
import {
  isAuthConfigured,
  subscribeToAuth,
  canAdminTenant,
  logout,
  demoAdminLogout,
  demoAdminSession,
} from '@/lib/auth';

const NAV = [
  { href: '/admin', label: 'Pesanan', icon: 'receipt' },
  { href: '/admin/menu', label: 'Menu', icon: 'book' },
  { href: '/admin/qr', label: 'QR Meja', icon: 'qr' },
  { href: '/admin/branding', label: 'Branding', icon: 'sparkles' },
];

/**
 * Kerangka dashboard admin satu cafe: gerbang login + header + navigasi tab.
 *
 * Bila Firebase aktif, status login berasal dari Firebase Auth dan akses
 * diverifikasi lewat custom claim admin_<slug>. Mode demo memakai flag
 * sessionStorage (hanya UX, bukan keamanan).
 */
export default function AdminShell({ children }) {
  const pathname = usePathname();
  const tenant = useTenant();
  const base = `/c/${tenant.slug}`;

  // Mode demo: status awal dibaca sinkron (tanpa backend, tanpa subscription).
  const [ready, setReady] = useState(!isAuthConfigured);
  const [authed, setAuthed] = useState(
    () => !isAuthConfigured && demoAdminSession(tenant.slug),
  );

  useEffect(() => {
    if (!isAuthConfigured) return () => {};
    // Sesi demo per-slug: reset saat slug berubah.
    const unsub = subscribeToAuth((session) => {
      setAuthed(Boolean(session) && canAdminTenant(session?.claims, tenant.slug));
      setReady(true);
    });
    return () => unsub?.();
  }, [tenant.slug]);

  const login = () => setAuthed(true);

  const handleLogout = async () => {
    if (isAuthConfigured) {
      await logout();
    } else {
      demoAdminLogout(tenant.slug);
    }
    setAuthed(false);
  };

  if (!ready) {
    return (
      <div className="page-center">
        <span className="spinner spinner-dark" />
      </div>
    );
  }

  if (!authed) return <PinGate onAuth={login} />;

  const isActive = (href) => {
    const full = `${base}${href}`;
    return href === '/admin' ? pathname === full : pathname.startsWith(full);
  };

  return (
    <>
      <header className="app-header">
        <div className="shell row between gap-3" style={{ width: '100%' }}>
          <Brand href={base} subtitle="Dashboard Admin" />

          <nav className="row gap-1 hide-sm" aria-label="Navigasi admin">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={`${base}${n.href}`}
                className="btn btn-quiet btn-sm"
                style={
                  isActive(n.href)
                    ? {
                        background: 'var(--brand-tint)',
                        color: 'var(--brand-strong)',
                      }
                    : undefined
                }
              >
                <Icon name={n.icon} size={16} />
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="row gap-1">
            <Link href={base} className="btn btn-ghost btn-sm hide-sm">
              <Icon name="arrowLeft" size={16} />
              <span className="hide-sm">Lihat Menu</span>
            </Link>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
              <Icon name="logout" size={16} />
              <span className="hide-sm">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar mobile */}
      <nav
        className="shell row gap-2"
        style={{ marginTop: 16, overflowX: 'auto' }}
        aria-label="Navigasi admin"
      >
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={`${base}${n.href}`}
            className={`pill ${isActive(n.href) ? 'is-active' : ''}`}
            style={
              isActive(n.href)
                ? {
                    background: 'var(--brand)',
                    borderColor: 'var(--brand)',
                    color: '#fff',
                  }
                : { flex: 1, justifyContent: 'center', whiteSpace: 'nowrap' }
            }
          >
            <Icon name={n.icon} size={15} />
            {n.label}
          </Link>
        ))}
      </nav>

      <main className="shell page">{children}</main>
    </>
  );
}
