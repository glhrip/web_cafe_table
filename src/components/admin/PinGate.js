'use client';

import { useState } from 'react';
import Brand from '@/components/Brand';
import Icon from '@/components/Icon';
import { useTenant } from '@/components/TenantProvider';

/** Layar PIN sebelum masuk dashboard admin (PIN milik cafe ini). */
export default function PinGate({ onAuth }) {
  const tenant = useTenant();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const expected = String(tenant?.pin || '1234');

  const submit = (e) => {
    e.preventDefault();
    if (pin === expected) {
      onAuth();
    } else {
      setError('PIN salah. Coba lagi.');
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 450);
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
            <p className="muted small">Masukkan PIN untuk mengelola pesanan.</p>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <input
            className="input"
            type="password"
            inputMode="numeric"
            autoFocus
            maxLength={8}
            placeholder="• • • •"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError('');
            }}
            style={{
              textAlign: 'center',
              fontSize: '1.6rem',
              letterSpacing: '0.5em',
              paddingLeft: '0.5em',
            }}
            required
          />
          {error ? (
            <span className="small" style={{ color: 'var(--danger)' }}>
              {error}
            </span>
          ) : process.env.NODE_ENV !== 'production' ? (
            <span className="tiny faint">Mode dev — PIN demo: {expected}</span>
          ) : null}
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg">
          Masuk
        </button>
      </form>
    </div>
  );
}
