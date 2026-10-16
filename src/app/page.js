'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Brand from '@/components/Brand';
import Icon from '@/components/Icon';
import { CAFE_TAGLINE } from '@/lib/constants';

const QUICK_TABLES = [1, 2, 3, 4, 5, 6];

export default function LandingPage() {
  const router = useRouter();
  const [tableNo, setTableNo] = useState('');

  const go = (value) => {
    const n = String(value).trim();
    if (n) router.push(`/table/${n}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    go(tableNo);
  };

  return (
    <div className="page-center">
      <div
        className="stack gap-4 fade-up"
        style={{ width: '100%', maxWidth: 460, alignItems: 'center' }}
      >
        <Brand href={null} subtitle="Pesan langsung dari meja" size="lg" />

        <div className="stack gap-2 text-center" style={{ marginTop: 4 }}>
          <span className="eyebrow">Selamat datang</span>
          <h1 className="display">Pesan tanpa antre</h1>
          <p className="muted" style={{ maxWidth: 360, margin: '0 auto' }}>
            {CAFE_TAGLINE}. Scan QR di meja atau masukkan nomor meja untuk mulai
            memesan.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card card-pad stack gap-3"
          style={{ width: '100%', marginTop: 4 }}
        >
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="table-no">
              Nomor Meja
            </label>
            <div style={{ position: 'relative' }}>
              <Icon
                name="qr"
                size={20}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ink-3)',
                }}
              />
              <input
                id="table-no"
                className="input"
                type="number"
                inputMode="numeric"
                min="1"
                placeholder="Contoh: 7"
                value={tableNo}
                onChange={(e) => setTableNo(e.target.value)}
                style={{ paddingLeft: 44, fontSize: '1.15rem', fontWeight: 650 }}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg">
            <Icon name="coffee" size={19} />
            Lihat Menu
          </button>

          <div className="stack gap-2">
            <span className="tiny faint text-center">Meja populer</span>
            <div className="row gap-2 wrap" style={{ justifyContent: 'center' }}>
              {QUICK_TABLES.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="pill"
                  onClick={() => go(n)}
                  style={{ minWidth: 44, justifyContent: 'center' }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </form>

        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => router.push('/admin')}
        >
          <Icon name="lock" size={16} />
          Masuk sebagai Admin
        </button>
      </div>
    </div>
  );
}
