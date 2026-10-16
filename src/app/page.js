'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [tableNo, setTableNo] = useState('');

  const handleGo = (e) => {
    e.preventDefault();
    if (tableNo.trim()) {
      router.push(`/table/${tableNo}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
      <div className="card animate-fade-in" style={{ padding: '3rem', maxWidth: '400px', width: '100%' }}>
        <h1 className="title" style={{ color: 'var(--accent-color)', fontSize: '2rem' }}>Web POS Cafe</h1>
        <p className="subtitle">Scan QR di meja Anda atau masukkan nomor meja di bawah ini.</p>
        
        <form onSubmit={handleGo} className="input-group" style={{ marginTop: '2rem' }}>
          <input 
            type="number" 
            placeholder="Nomor Meja" 
            className="input-field" 
            value={tableNo}
            onChange={(e) => setTableNo(e.target.value)}
            style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: '1rem' }}
            required
            min="1"
          />
          <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '1.1rem' }}>
            Lihat Menu
          </button>
        </form>

        <div style={{ marginTop: '3rem' }}>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => router.push('/admin')}
          >
            Masuk sebagai Admin
          </button>
        </div>
      </div>
    </div>
  );
}
