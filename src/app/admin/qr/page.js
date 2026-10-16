'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Icon from '@/components/Icon';
import { ToastProvider } from '@/components/Toast';
import { CAFE_NAME } from '@/lib/constants';

function QRGenerator() {
  const [baseUrl, setBaseUrl] = useState('');
  const [count, setCount] = useState(10);
  const [generated, setGenerated] = useState('');

  const build = (e) => {
    e.preventDefault();
    const clean = baseUrl.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//.test(clean)) return;
    setGenerated(clean);
  };

  const tables = Array.from({ length: count }, (_, i) => i + 1);
  const preview = generated ? `${generated}/table/1` : 'https://cafe-anda.vercel.app/table/1';

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .shell { max-width: none !important; padding: 0 !important; }
          .qr-grid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 16px !important; }
          .qr-tile { border: 1px solid #ddd !important; break-inside: avoid; box-shadow: none !important; }
        }
      `}</style>

      <div className="no-print row between gap-3 wrap" style={{ marginBottom: 20 }}>
        <div className="stack gap-1">
          <h1 className="h2">QR Code Meja</h1>
          <p className="muted small">
            Buat QR untuk setiap meja, lalu cetak dan tempel.
          </p>
        </div>
        {generated ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.print()}
          >
            <Icon name="printer" size={17} />
            Cetak Semua
          </button>
        ) : null}
      </div>

      {/* Panel kontrol */}
      <form
        onSubmit={build}
        className="card card-pad no-print stack gap-3"
        style={{ marginBottom: 26 }}
      >
        <div className="row gap-3 wrap" style={{ alignItems: 'flex-end' }}>
          <div className="field grow" style={{ marginBottom: 0, minWidth: 240 }}>
            <label className="label" htmlFor="base-url">
              Alamat Website Cafe
            </label>
            <input
              id="base-url"
              className="input"
              type="url"
              placeholder="https://cafe-anda.vercel.app"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 0, width: 130 }}>
            <label className="label" htmlFor="count">
              Jumlah Meja
            </label>
            <input
              id="count"
              className="input"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: 46 }}>
            <Icon name="qr" size={17} />
            Buat QR
          </button>
        </div>
        <p className="tiny faint">
          Tips: gunakan alamat produksi (mis. Vercel) agar QR bisa dipindai
          pelanggan dari HP mereka.
        </p>
      </form>

      {generated ? (
        <>
          <div
            className="no-print card row gap-3 card-pad"
            style={{ marginBottom: 26, alignItems: 'center', background: 'var(--brand-tint)', borderColor: 'var(--brand-soft)' }}
          >
            <span
              className="row"
              style={{
                width: 72,
                height: 72,
                background: '#fff',
                borderRadius: 12,
                padding: 6,
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <QRCodeSVG value={preview} size={60} level="M" />
            </span>
            <div className="stack gap-1">
              <span className="eyebrow">Pratinjau</span>
              <span style={{ fontWeight: 700 }}>{CAFE_NAME}</span>
              <span className="small muted" style={{ wordBreak: 'break-all' }}>
                {preview}
              </span>
            </div>
          </div>

          <div
            className="qr-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
              gap: 18,
            }}
          >
            {tables.map((num) => {
              const url = `${generated}/table/${num}`;
              return (
                <div
                  key={num}
                  className="card qr-tile stack gap-2"
                  style={{ padding: 18, alignItems: 'center', textAlign: 'center' }}
                >
                  <span className="eyebrow" style={{ color: 'var(--ink-3)' }}>
                    {CAFE_NAME}
                  </span>
                  <span className="h3" style={{ fontSize: '1.35rem' }}>
                    Meja {num}
                  </span>
                  <span
                    className="row"
                    style={{
                      background: '#fff',
                      padding: 8,
                      borderRadius: 12,
                      border: '1px solid var(--line)',
                    }}
                  >
                    <QRCodeSVG value={url} size={150} level="M" includeMargin={false} />
                  </span>
                  <span className="tiny faint">Scan untuk pesan</span>
                  <span
                    className="tiny faint"
                    style={{ wordBreak: 'break-all', lineHeight: 1.3 }}
                  >
                    {url}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div
          className="card no-print"
          style={{ padding: 44, textAlign: 'center', borderStyle: 'dashed', background: 'transparent', boxShadow: 'none' }}
        >
          <Icon name="qr" size={38} style={{ color: 'var(--ink-3)', margin: '0 auto 10px' }} />
          <p className="muted">
            Masukkan alamat website, lalu tekan <strong>Buat QR</strong>.
          </p>
        </div>
      )}
    </>
  );
}

export default function AdminQRPage() {
  return (
    <ToastProvider>
      <QRGenerator />
    </ToastProvider>
  );
}
