'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getMenuItems, createOrder } from '@/lib/db';

export default function TableMenu({ params }) {
  // In Next.js 15, page params is a promise, but for client components we can use the `use` hook or just destructure if we treat it as sync.
  // Actually, Next.js 13+ params in client components might be a promise in newer versions. We'll use React.use() to unwrap.
  const resolvedParams = use(params);
  const tableId = resolvedParams.id;
  const router = useRouter();
  
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({}); // { itemId: quantity }
  const [showCart, setShowCart] = useState(false);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('kasir');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadMenu() {
      try {
        const items = await getMenuItems();
        setMenu(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, []);

  const addToCart = (item) => {
    setCart(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
  };

  const removeFromCart = (item) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[item.id] > 1) {
        newCart[item.id] -= 1;
      } else {
        delete newCart[item.id];
      }
      return newCart;
    });
  };

  const cartTotal = Object.entries(cart).reduce((total, [itemId, qty]) => {
    const item = menu.find(i => i.id === itemId);
    return total + (item?.price || 0) * qty;
  }, 0);

  const cartItemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cartItemCount === 0) return;
    
    setSubmitting(true);
    try {
      const orderItems = Object.entries(cart).map(([itemId, qty]) => {
        const item = menu.find(i => i.id === itemId);
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          qty: qty
        };
      });

      const orderData = {
        tableNo: tableId,
        customerName,
        customerPhone,
        paymentMethod,
        items: orderItems,
        total: cartTotal,
        status: 'pending',
      };

      const docRef = await createOrder(orderData);
      router.push(`/order/${docRef.id}`);
    } catch (err) {
      console.error(err);
      alert('Gagal membuat pesanan. Coba lagi.');
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat menu...</div>;

  return (
    <div style={{ paddingBottom: '80px' }} className="animate-fade-in">
      <header className="flex-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="title" style={{ marginBottom: 0 }}>Menu Kami</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>Meja {tableId}</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {menu.map(item => (
          <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '200px', backgroundColor: '#e2d9d1', backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{item.name}</h3>
                <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>Rp {item.price.toLocaleString('id-ID')}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>{item.description}</p>
              
              {cart[item.id] ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-full)', padding: '0.25rem' }}>
                  <button onClick={() => removeFromCart(item)} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', fontSize: '1.2rem', fontWeight: 'bold' }}>-</button>
                  <span style={{ fontWeight: 'bold' }}>{cart[item.id]}</span>
                  <button onClick={() => addToCart(item)} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>+</button>
                </div>
              ) : (
                <button className="btn-secondary" style={{ width: '100%' }} onClick={() => addToCart(item)}>
                  Tambah
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {cartItemCount > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'linear-gradient(transparent, var(--bg-color) 20%)', zIndex: 10 }}>
          <div className="container" style={{ padding: 0 }}>
            <button className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '1.25rem', fontSize: '1.1rem', boxShadow: 'var(--shadow-md)', border: 'none' }} onClick={() => setShowCart(true)}>
              <span>{cartItemCount} Item</span>
              <span>Pesan - Rp {cartTotal.toLocaleString('id-ID')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="glass-panel" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', animation: 'fadeIn 0.2s ease' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="title" style={{ marginBottom: 0 }}>Detail Pesanan</h2>
              <button onClick={() => setShowCart(false)} style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>&times;</button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              {Object.entries(cart).map(([itemId, qty]) => {
                const item = menu.find(i => i.id === itemId);
                return (
                  <div key={itemId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{qty} x Rp {item.price.toLocaleString('id-ID')}</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>Rp {(item.price * qty).toLocaleString('id-ID')}</div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', marginTop: '0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent-color)' }}>Rp {cartTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitOrder}>
              <div className="input-group">
                <label className="input-label">Nama Anda</label>
                <input type="text" className="input-field" required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Misal: Budi" />
              </div>
              <div className="input-group">
                <label className="input-label">Nomor HP / WhatsApp</label>
                <input type="tel" className="input-field" required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="0812xxxxxx" />
              </div>
              <div className="input-group" style={{ marginBottom: '0.5rem' }}>
                <label className="input-label">Metode Pembayaran</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="paymentMethod" value="kasir" checked={paymentMethod === 'kasir'} onChange={e => setPaymentMethod(e.target.value)} />
                    Bayar di Kasir
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="paymentMethod" value="qris" checked={paymentMethod === 'qris'} onChange={e => setPaymentMethod(e.target.value)} />
                    QRIS
                  </label>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', marginTop: '1rem' }}>
                {paymentMethod === 'kasir' 
                  ? 'Silakan lakukan pembayaran di kasir setelah mengkonfirmasi pesanan ini. Pesanan akan disiapkan setelah pembayaran berhasil.'
                  : 'Harap selesaikan pembayaran via QRIS dan tunjukkan bukti ke kasir setelah mengkonfirmasi pesanan ini.'}
              </p>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={submitting}>
                {submitting ? 'Memproses...' : 'Konfirmasi Pesanan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
