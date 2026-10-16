'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export default function MenuManagement() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', description: '', category: 'Food', image: '' });

  const loadMenu = async () => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      alert("Demo Mode: Firebase belum dikonfigurasi. Data tidak tersimpan.");
      setLoading(false);
      return;
    }
    const snapshot = await getDocs(collection(db, 'menu'));
    setMenu(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { loadMenu(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;
    
    const dataToSave = { ...formData, price: Number(formData.price) };
    if (isEditing) {
      await updateDoc(doc(db, 'menu', isEditing), dataToSave);
    } else {
      await addDoc(collection(db, 'menu'), dataToSave);
    }
    setFormData({ name: '', price: '', description: '', category: 'Food', image: '' });
    setIsEditing(null);
    loadMenu();
  };

  const handleDelete = async (id) => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;
    if (confirm('Hapus menu ini?')) {
      await deleteDoc(doc(db, 'menu', id));
      loadMenu();
    }
  };

  const editItem = (item) => {
    setIsEditing(item.id);
    setFormData({ name: item.name, price: item.price, description: item.description, category: item.category, image: item.image || '' });
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container animate-fade-in">
      <div className="flex-header" style={{ marginBottom: '2rem' }}>
        <h1 className="title">Kelola Menu</h1>
        <button className="btn-secondary" onClick={() => window.location.href = '/admin'}>Kembali ke Dashboard</button>
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 className="subtitle">{isEditing ? 'Edit Menu' : 'Tambah Menu Baru'}</h2>
        <form onSubmit={handleSubmit} className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Nama Menu</label>
            <input className="input-field" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="input-group">
            <label className="input-label">Harga (Rp)</label>
            <input type="number" className="input-field" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label className="input-label">Deskripsi</label>
            <input className="input-field" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label className="input-label">URL Gambar</label>
            <input className="input-field" placeholder="https://..." value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Upload gambar Anda ke situs gratis seperti <a href="https://postimages.org/" target="_blank" rel="noreferrer" style={{color: 'var(--accent-color)', textDecoration: 'underline'}}>Postimages</a> lalu tempelkan link (Direct Link) nya ke sini.
            </p>
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-primary">{isEditing ? 'Simpan Perubahan' : 'Tambah Menu'}</button>
            {isEditing && <button type="button" className="btn-secondary" onClick={() => { setIsEditing(null); setFormData({name: '', price: '', description: '', category: 'Food', image: ''}); }}>Batal</button>}
          </div>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
        {menu.map(item => (
          <div key={item.id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Rp {item.price.toLocaleString('id-ID')}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => editItem(item)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
              <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
