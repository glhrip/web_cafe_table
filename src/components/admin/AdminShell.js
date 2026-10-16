'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Brand from '@/components/Brand';
import Icon from '@/components/Icon';
import PinGate from './PinGate';

const STORAGE_KEY = 'cafe-admin-auth';

const NAV = [
  { href: '/admin', label: 'Pesanan', icon: 'receipt' },
  { href: '/admin/menu', label: 'Menu', icon: 'book' },
  { href: '/admin/qr', label: 'QR Meja', icon: 'qr' },
];

/**
 * Kerangka dashboard admin: gerbang PIN + header + navigasi tab.
 * Semua halaman /admin/* memakai ini lewat app/admin/layout.js.
 */
export default function AdminShell({ children }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    try {
      setAuthed(sessionStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const login = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setAuthed(true);
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
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

  return (
    <>
      <header className="app-header">
        <div className="shell row between gap-3" style={{ width: '100%' }}>
          <Brand href="/admin" subtitle="Dashboard Admin" />

          <nav className="row gap-1 hide-sm" aria-label="Navigasi admin">
            {NAV.map((n) => {
              const active =
                n.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="btn btn-quiet btn-sm"
                  style={
                    active
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
              );
            })}
          </nav>

          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            <Icon name="logout" size={16} />
            <span className="hide-sm">Keluar</span>
          </button>
        </div>
      </header>

      {/* Tab bar mobile */}
      <nav
        className="shell row gap-2"
        style={{ marginTop: 16 }}
        aria-label="Navigasi admin"
      >
        {NAV.map((n) => {
          const active =
            n.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`pill ${active ? 'is-active' : ''}`}
              style={
                active
                  ? {
                      background: 'var(--brand)',
                      borderColor: 'var(--brand)',
                      color: '#fff',
                    }
                  : { flex: 1, justifyContent: 'center' }
              }
            >
              <Icon name={n.icon} size={15} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <main className="shell page">{children}</main>
    </>
  );
}
