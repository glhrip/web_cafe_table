'use client';

import { useEffect, useState, use } from 'react';
import { subscribeToSingleOrder } from '@/lib/db';

export default function OrderTracking({ params }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToSingleOrder(orderId, (data) => {
      setOrder(data);
    });
    return () => unsubscribe();
  }, [orderId]);

  if (!order) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Memuat status pesanan...</p>
      </div>
    );
  }

  const steps = [
    { id: 'pending', label: 'Menunggu', icon: '⏳' },
    { id: 'preparing', label: 'Disiapkan', icon: '🍳' },
    { id: 'ready', label: 'Siap Diambil', icon: '🎉' },
    { id: 'completed', label: 'Selesai', icon: '✅' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === order.status);
  
  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <header style={{ textAlign: 'center', margin: '2rem 0' }}>
        <h1 className="title">Status Pesanan</h1>
        <p className="subtitle">ID: {orderId.substring(0, 8).toUpperCase()}</p>
      </header>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
          {/* Progress Line */}
          <div style={{ position: 'absolute', top: '24px', left: '10%', right: '10%', height: '4px', backgroundColor: 'var(--border-color)', zIndex: 1 }} />
          <div style={{ position: 'absolute', top: '24px', left: '10%', right: '10%', height: '4px', backgroundColor: 'var(--accent-color)', zIndex: 2, width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%`, transition: 'width 0.5s ease' }} />

          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            return (
              <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '80px' }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '50%', 
                  backgroundColor: isCompleted ? 'var(--accent-color)' : 'var(--card-bg)', 
                  border: `4px solid ${isCompleted ? 'var(--accent-color)' : 'var(--border-color)'}`,
                  display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem',
                  transition: 'all 0.3s ease',
                  boxShadow: isCurrent ? '0 0 0 4px rgba(209, 143, 80, 0.3)' : 'none'
                }}>
                  {step.icon}
                </div>
                <span className="progress-step-text" style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)', textAlign: 'center' }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {order.status === 'ready' && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '2rem', border: '1px solid #10b981' }}>
            <h2 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Pesanan Siap!</h2>
            <p style={{ fontWeight: 600 }}>Halo {order.customerName}, silakan ambil pesanan Anda di kasir sekarang.</p>
          </div>
        )}

        {order.status === 'pending' && (
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '2rem', border: '1px solid #f59e0b' }}>
            <h2 style={{ color: '#d97706', marginBottom: '0.5rem' }}>Menunggu Konfirmasi Pembayaran</h2>
            <p>Silakan menuju kasir untuk melakukan pembayaran dengan QRIS / Tunai.</p>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Rincian</h3>
          {order.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>{item.qty}x {item.name}</span>
              <span>Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)', fontWeight: 700, fontSize: '1.2rem' }}>
            <span>Total</span>
            <span style={{ color: 'var(--accent-color)' }}>Rp {order.total?.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
