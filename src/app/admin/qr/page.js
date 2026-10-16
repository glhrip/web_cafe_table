'use client';

import { useState } from 'react';

export default function QRGenerator() {
  const [baseUrl, setBaseUrl] = useState('');
  const [tableCount, setTableCount] = useState(10);
  const [showQR, setShowQR] = useState(false);

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!baseUrl.startsWith('http')) {
      alert('Masukkan URL yang valid (dimulai dengan http:// atau https://)');
      return;
    }
    // Remove trailing slash if any
    const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    setBaseUrl(cleanUrl);
    setShowQR(true);
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '2rem' }}>
      
      {/* Hide controls when printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          .print-grid { 
            display: grid !important; 
            grid-template-columns: repeat(3, 1fr) !important; 
            gap: 20px !important; 
            page-break-inside: avoid;
          }
          .qr-card { border: 1px solid #ccc; padding: 1rem; text-align: center; break-inside: avoid; }
        }
      `}} />

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="title">Cetak QR Code Meja</h1>
        <button className="btn-secondary" onClick={() => window.location.href = '/admin'}>Kembali ke Dashboard</button>
      </div>

      <div className="card no-print" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <p className="subtitle" style={{ marginBottom: '1.5rem' }}>
          Masukkan alamat website cafe Anda (setelah di-online-kan), lalu tentukan jumlah meja. 
          Sistem akan membuatkan QR Code untuk setiap meja yang bisa langsung Anda cetak.
        </p>

        <form onSubmit={handleGenerate} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Alamat Website Utama</label>
            <input 
              type="url" 
              className="input-field" 
              placeholder="https://cafe-anda.vercel.app" 
              required 
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Jumlah Meja</label>
            <input 
              type="number" 
              className="input-field" 
              min="1" 
              max="100" 
              required 
              value={tableCount}
              onChange={e => setTableCount(Number(e.target.value))}
              style={{ width: '120px' }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Buat QR</button>
        </form>
      </div>

      {showQR && (
        <>
          <div className="no-print" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <button className="btn-primary" onClick={() => window.print()} style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
              🖨️ Cetak Semua QR Code Sekarang
            </button>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Tekan tombol cetak, lalu gunting dan tempel di fisik meja.</p>
          </div>

          <div className="print-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {tables.map(num => {
              const url = `${baseUrl}/table/${num}`;
              const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
              
              return (
                <div key={num} className="card qr-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Meja {num}</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>Scan untuk pesan</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrApi} alt={`QR Meja ${num}`} style={{ width: '100%', maxWidth: '150px', height: 'auto', marginBottom: '1rem' }} />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{url}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
