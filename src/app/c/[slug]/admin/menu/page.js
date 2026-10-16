'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/Icon';
import { ToastProvider, useToast } from '@/components/Toast';
import { useTenant } from '@/components/TenantProvider';
import {
  subscribeToMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  isFirebaseConfigured,
} from '@/lib/db';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';

const EMPTY = {
  name: '',
  price: '',
  category: DEFAULT_CATEGORIES[0],
  description: '',
  image: '',
  popular: false,
};

function MenuManager() {
  const toast = useToast();
  const tenant = useTenant();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    const unsub = subscribeToMenu(
      tenant.slug,
      (data) => {
        setMenu(data);
        setLoading(false);
        setLoadError(false);
      },
      () => {
        setLoading(false);
        setLoadError(true);
      },
    );
    return () => unsub?.();
  }, [tenant.slug]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      price: String(item.price ?? ''),
      category: item.category || DEFAULT_CATEGORIES[0],
      description: item.description || '',
      image: item.image || '',
      popular: Boolean(item.popular),
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.price === '') {
      toast.error('Nama dan harga wajib diisi');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category,
      description: form.description.trim(),
      image: form.image.trim(),
      popular: form.popular,
    };
    try {
      if (editingId) {
        await updateMenuItem(tenant.slug, editingId, payload);
        toast.success('Menu diperbarui');
      } else {
        await addMenuItem(tenant.slug, payload);
        toast.success('Menu ditambahkan');
      }
      reset();
    } catch {
      toast.error('Gagal menyimpan menu');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Hapus "${item.name}"?`)) return;
    try {
      await deleteMenuItem(tenant.slug, item.id);
      toast.success('Menu dihapus');
    } catch {
      toast.error('Gagal menghapus menu');
    }
  };

  const filtered = menu.filter((m) =>
    m.name?.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <>
      <div className="row between gap-3 wrap" style={{ marginBottom: 20 }}>
        <div className="stack gap-1">
          <h1 className="h2">Kelola Menu</h1>
          <p className="muted small">{menu.length} menu terdaftar di {tenant.name}.</p>
        </div>
        {!isFirebaseConfigured ? (
          <span className="pill" style={{ color: 'var(--warning)', borderColor: 'var(--warning-bg)' }}>
            <Icon name="alert" size={14} />
            Mode Demo — perubahan tidak tersimpan permanen
          </span>
        ) : null}
      </div>

      {/* Form */}
      <form
        onSubmit={save}
        className="card card-pad stack gap-3"
        style={{ marginBottom: 26 }}
      >
        <div className="row between gap-2">
          <h2 className="h3">{editingId ? 'Edit Menu' : 'Tambah Menu Baru'}</h2>
          {editingId ? (
            <button type="button" className="btn btn-quiet btn-sm" onClick={reset}>
              <Icon name="close" size={15} />
              Batal
            </button>
          ) : null}
        </div>

        <div
          className="responsive-grid"
          style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 14 }}
        >
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="m-name">Nama Menu</label>
            <input
              id="m-name"
              className="input"
              placeholder="Misal: Kopi Susu Gula Aren"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="m-price">Harga (Rp)</label>
            <input
              id="m-price"
              className="input"
              type="number"
              min="0"
              placeholder="25000"
              value={form.price}
              onChange={(e) => set({ price: e.target.value })}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="m-cat">Kategori</label>
            <select
              id="m-cat"
              className="select"
              value={form.category}
              onChange={(e) => set({ category: e.target.value })}
            >
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label" htmlFor="m-desc">Deskripsi</label>
          <textarea
            id="m-desc"
            className="textarea"
            placeholder="Deskripsi singkat yang menggoda…"
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label" htmlFor="m-img">URL Gambar</label>
          <input
            id="m-img"
            className="input"
            placeholder="https://…"
            value={form.image}
            onChange={(e) => set({ image: e.target.value })}
          />
          <span className="tiny faint">
            Tempel link gambar langsung (mis. dari Postimages/Imgur).
          </span>
        </div>

        <div className="row between gap-3 wrap">
          <label className="row gap-2" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.popular}
              onChange={(e) => set({ popular: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: 'var(--brand)' }}
            />
            <span className="small" style={{ fontWeight: 600 }}>
              Tandai sebagai favorit
            </span>
          </label>

          <div className="row gap-2">
            {form.image ? (
              <span
                style={{
                  position: 'relative',
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid var(--line)',
                }}
              >
                <Image src={form.image} alt="Pratinjau" fill style={{ objectFit: 'cover' }} sizes="44px" unoptimized />
              </span>
            ) : null}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner" /> Menyimpan…
                </>
              ) : (
                <>
                  <Icon name="check" size={16} strokeWidth={2.6} />
                  {editingId ? 'Simpan Perubahan' : 'Tambah Menu'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Daftar */}
      <div className="row between gap-2" style={{ marginBottom: 14 }}>
        <h2 className="h3">Daftar Menu</h2>
        <div style={{ position: 'relative', maxWidth: 240, flex: 1 }}>
          <Icon
            name="search"
            size={17}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-3)',
            }}
          />
          <input
            className="input"
            placeholder="Cari…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ paddingLeft: 38, padding: '9px 12px 9px 38px' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="stack gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 68 }} />
          ))}
        </div>
      ) : loadError ? (
        <div
          className="card card-pad stack gap-3 text-center"
          style={{ alignItems: 'center', padding: 40, borderColor: 'var(--warning-bg)' }}
        >
          <Icon name="alert" size={34} style={{ color: 'var(--warning)' }} />
          <h2 className="h3">Gagal memuat menu</h2>
          <p className="muted small" style={{ maxWidth: 420 }}>
            Tidak dapat terhubung ke database. Periksa koneksi internet dan
            konfigurasi Firebase.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            <Icon name="refresh" size={16} />
            Muat Ulang
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="card"
          style={{ padding: 40, textAlign: 'center', borderStyle: 'dashed', background: 'transparent', boxShadow: 'none' }}
        >
          <p className="muted">Belum ada menu. Tambahkan menu pertama di atas.</p>
        </div>
      ) : (
        <div className="stack gap-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="card row gap-3"
              style={{ padding: 12, alignItems: 'center' }}
            >
              <span
                style={{
                  position: 'relative',
                  width: 54,
                  height: 54,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: 'var(--brand-soft)',
                  flexShrink: 0,
                }}
              >
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="54px" unoptimized />
                ) : (
                  <span className="row" style={{ height: '100%', justifyContent: 'center', color: 'var(--brand)' }}>
                    <Icon name="coffee" size={22} />
                  </span>
                )}
              </span>

              <div className="stack gap-1 grow" style={{ minWidth: 0 }}>
                <div className="row gap-2 wrap">
                  <span style={{ fontWeight: 700 }}>{item.name}</span>
                  {item.popular ? <span className="badge badge-warning">Favorit</span> : null}
                </div>
                <span className="small muted">
                  {item.category} · {formatCurrency(item.price)}
                </span>
              </div>

              <div className="row gap-1">
                <button
                  type="button"
                  className="btn btn-quiet btn-icon"
                  onClick={() => startEdit(item)}
                  aria-label={`Edit ${item.name}`}
                >
                  <Icon name="edit" size={17} />
                </button>
                <button
                  type="button"
                  className="btn btn-quiet btn-icon"
                  onClick={() => remove(item)}
                  aria-label={`Hapus ${item.name}`}
                  style={{ color: 'var(--danger)' }}
                >
                  <Icon name="trash" size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function AdminMenuPage() {
  return (
    <ToastProvider>
      <MenuManager />
    </ToastProvider>
  );
}
