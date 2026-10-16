'use client';

import { useEffect, useState } from 'react';
import { subscribeToOrders, updateOrderStatus } from '@/lib/db';
import { printReceipt } from '@/lib/printer';

const ADMIN_PIN = '1234';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = subscribeToOrders((data) => {
        setOrders(data);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
    } else {
      alert('PIN Salah!');
      setPin('');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error(err);
      alert('Gagal update status');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <form onSubmit={handleLogin} className="card" style={{ padding: '3rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h2 className="title">Admin Login</h2>
          <p className="subtitle" style={{ marginBottom: '2rem' }}>Masukkan PIN (1234)</p>
          <input 
            type="password" 
            className="input-field" 
            placeholder="PIN" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em', marginBottom: '1.5rem' }}
            required
            maxLength={4}
          />
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Masuk</button>
        </form>
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => o.status === 'preparing' || o.status === 'ready');
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <header className="flex-header" style={{ marginBottom: '2rem', backgroundColor: 'var(--card-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
        <h1 className="title" style={{ marginBottom: 0 }}>Dashboard Admin</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => window.location.href = '/admin/qr'}>🖨️ Cetak QR Meja</button>
          <button className="btn-secondary" onClick={() => window.location.href = '/admin/menu'}>Kelola Menu</button>
          <button className="btn-secondary" onClick={() => setIsAuthenticated(false)}>Keluar</button>
        </div>
      </header>

      {loading ? (
        <p>Memuat pesanan...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          
          {/* Kolom Pesanan Baru */}
          <div>
            <h2 className="subtitle" style={{ color: 'var(--status-pending)', fontWeight: 700 }}>Pesanan Baru ({pendingOrders.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingOrders.map(order => <OrderCard key={order.id} order={order} onUpdate={handleUpdateStatus} />)}
              {pendingOrders.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Tidak ada pesanan baru</p>}
            </div>
          </div>

          {/* Kolom Sedang Proses */}
          <div>
            <h2 className="subtitle" style={{ color: 'var(--status-preparing)', fontWeight: 700 }}>Aktif ({activeOrders.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeOrders.map(order => <OrderCard key={order.id} order={order} onUpdate={handleUpdateStatus} />)}
              {activeOrders.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Tidak ada pesanan aktif</p>}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onUpdate }) {
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="badge status-pending">Menunggu Bayar</span>;
      case 'preparing': return <span className="badge status-preparing">Disiapkan</span>;
      case 'ready': return <span className="badge status-ready">Siap Diambil</span>;
      case 'completed': return <span className="badge status-completed">Selesai</span>;
      case 'cancelled': return <span className="badge status-cancelled">Batal</span>;
      default: return null;
    }
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>Meja {order.tableNo}</div>
          <div style={{ color: 'var(--text-secondary)' }}>{order.customerName} - {order.customerPhone}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            ID: {order.id.substring(0,8).toUpperCase()} • {new Date(order.createdAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
            <br/>Pembayaran: <strong>{order.paymentMethod === 'qris' ? 'QRIS' : 'Kasir'}</strong>
          </div>
        </div>
        {getStatusBadge(order.status)}
      </div>

      <div style={{ padding: '1rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
        {order.items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            <span>{item.qty}x {item.name}</span>
            <span>{(item.price * item.qty).toLocaleString('id-ID')}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
          <span>Total</span>
          <span style={{ color: 'var(--accent-color)' }}>Rp {order.total.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {order.status === 'pending' && (
          <>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => onUpdate(order.id, 'preparing')}>Terima & Bayar</button>
            <button className="btn-secondary" style={{ color: 'var(--status-cancelled)' }} onClick={() => onUpdate(order.id, 'cancelled')}>Batal</button>
          </>
        )}
        
        {order.status === 'preparing' && (
          <button className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--status-ready)' }} onClick={() => onUpdate(order.id, 'ready')}>Panggil: Siap Diambil</button>
        )}

        {order.status === 'ready' && (
          <button className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--status-completed)' }} onClick={() => onUpdate(order.id, 'completed')}>Tandai Selesai</button>
        )}

        <button className="btn-secondary" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Cetak Nota" onClick={() => printReceipt(order)}>
          🖨️
        </button>
      </div>
    </div>
  );
}
