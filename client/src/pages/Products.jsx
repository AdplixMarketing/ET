import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import toast from 'react-hot-toast';
import UpgradePrompt from '../components/ui/UpgradePrompt';
import Skeleton from '../components/ui/Skeleton';
import { Plus, Pencil, Trash2, X, Check, Package } from 'lucide-react';
import { formatMoney, parseMoney } from '../utils/formatters';
import styles from './Products.module.css';

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', rate: '' });
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch {
      // handled by upgrade prompt
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.plan === 'pro' || user?.plan === 'max') {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [user, fetchProducts]);

  if (user?.plan !== 'pro' && user?.plan !== 'max') {
    return (
      <div className="page">
        <div className="container">
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Products & Services</h1>
          <UpgradePrompt message="Save your products and services to quickly add them to invoices. Available on Pro and Max." />
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setForm({ name: '', description: '', rate: '' });
    setEditingId(null);
    setShowAdd(false);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description || '', rate: formatMoney(String(parseFloat(p.rate))) });
    setShowAdd(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name, description: form.description, rate: parseMoney(form.rate || '0') };
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.success('Updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product added');
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Deleted');
      fetchProducts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className={styles.header}>
          <h1>Products & Services</h1>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowAdd(true); }}>
            <Plus size={18} /> New
          </button>
        </div>

        {/* Add / Edit form */}
        {(showAdd || editingId) && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              {editingId ? 'Edit Product' : 'New Product'}
            </h3>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                placeholder="e.g. Web Design, Consulting Hour"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                placeholder="Optional description for invoices"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Default Rate ($)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: formatMoney(e.target.value) })}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                <Check size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="btn btn-outline" onClick={resetForm} style={{ flex: 1 }}>
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={64} style={{ borderRadius: 10, marginBottom: 8 }} />
            ))}
          </div>
        ) : products.length === 0 && !showAdd ? (
          <div className="empty-state">
            <Package size={48} strokeWidth={1} />
            <p style={{ marginTop: 12 }}>No products or services yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Add items you frequently use on invoices</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowAdd(true)}>
              Add your first product
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {products.map((p) => (
              <div key={p.id} className={styles.item}>
                <div className={styles.info}>
                  <span className={styles.name}>{p.name}</span>
                  {p.description && <span className={styles.desc}>{p.description}</span>}
                </div>
                <span className={styles.rate}>${parseFloat(p.rate).toFixed(2)}</span>
                <div className={styles.actions}>
                  <button className={styles.actionBtn} onClick={() => startEdit(p)}>
                    <Pencil size={15} />
                  </button>
                  <button className={styles.actionBtn} onClick={() => handleDelete(p.id)} style={{ color: 'var(--color-danger)' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
