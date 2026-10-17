'use client';

import { useState } from 'react';
import Brand from '@/components/Brand';
import Icon from '@/components/Icon';
import { useTenant } from '@/components/TenantProvider';
import {
  isAuthConfigured,
  adminEmailFor,
  loginAdmin,
  demoAdminLogin,
} from '@/lib/auth';

/**
 * Gerbang login admin satu cafe.
 *
 * - Firebase aktif  → login Firebase Auth (email + password). Akses dicek
 *   lewat custom claim `admin_<slug>` di lib/auth.js.
 * - Mode demo       → PIN in-memory (hanya untuk presentasi).
 */
export default function PinGate({ onAuth }) {
  const tenant = useTenant();
  const [email, setEmail] = useState(adminEmailFor(tenant?.slug || ''));
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  const expectedPin = String(tenant?.pin || '1234');

  const fail = (message) => {
    setError(message);
    setShake(true);
    setPin('');
    setTimeout(() => setShake(false), 450);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isAuthConfigured) {
        await loginAdmin(tenant.slug, email, pin);
      } else if (!demoAdminLogin(tenant.slug, pin, expectedPin)) {
        fail('PIN salah. Coba lagi.');
        return;
      }
      onAuth();
    } catch (err) {
      fail(
        err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password'
          ? 'Email atau kata sandi salah.'
          : err?.message || 'Gagal masuk. Coba lagi.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-center">
      <form
        onSubmit={submit}
        className={`card card-pad stack gap-3 fade-up ${shake ? 'pin-shake' : ''}`}
        style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}
      >
        <div className="stack gap-3" style={{ alignItems: 'center' }}>
          <Brand href={null} size="lg" />
          <span
            className="row"
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'var(--brand-soft)',
              color: 'var(--brand-strong)',
              justifyContent: 'center',
            }}
          >
            <Icon name="lock" size={26} />
          </span>
          <div className="stack gap-1">
            <h1 className="h2">Admin {tenant?.name}</h1>
            <p className="muted small">
              {isAuthConfigured
                ? 'Masuk dengan akun admin untuk mengelola pesanan.'
                : 'Masukkan PIN untuk mengelola pesanan.'}
            </p>
          </div>
        </div>

        {isAuthConfigured ? (
          <div className="field" style={{ marginBottom: 0, textAlign: 'left' }}>
            <label className="label" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              className="input"
              type="email"
              autoComplete="username"
              placeholder="admin@cafe.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              required
            />
          </div>
        ) : null}

        <div className="field" style={{ marginBottom: 0, textAlign: 'left' }}>
          <label className="label" htmlFor="admin-secret">
            {isAuthConfigured ? 'Kata Sandi' : 'PIN'}
          </label>
          <input
            id="admin-secret"
            className="input"
            type="password"
            inputMode={isAuthConfigured ? 'text' : 'numeric'}
            autoComplete="current-password"
            autoFocus={!isAuthConfigured}
            maxLength={isAuthConfigured ? undefined : 8}
            placeholder={isAuthConfigured ? '••••••••' : '• • • •'}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError('');
            }}
            style={
              isAuthConfigured
                ? undefined
                : {
                    textAlign: 'center',
                    fontSize: '1.6rem',
                    letterSpacing: '0.5em',
                    paddingLeft: '0.5em',
                  }
            }
            required
          />
          {error ? (
            <span className="small" style={{ color: 'var(--danger)' }}>
              {error}
            </span>
          ) : !isAuthConfigured && process.env.NODE_ENV !== 'production' ? (
            <span className="tiny faint">Mode dev — PIN demo: {expectedPin}</span>
          ) : null}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={busy}
        >
          {busy ? <span className="spinner" /> : 'Masuk'}
        </button>
      </form>
    </div>
  );
}
