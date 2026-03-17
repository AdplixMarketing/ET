import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { formatPhone } from '../utils/formatters';

export default function BusinessForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    tax_id: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/businesses/${id}`).then((res) => {
        const b = res.data;
        setForm({ name: b.name || '', address: b.address || '', phone: b.phone || '', tax_id: b.tax_id || '' });
      }).catch(() => toast.error('Failed to load business'));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Enter a business name');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/businesses/${id}`, form);
        toast.success('Business updated');
      } else {
        await api.post('/businesses', form);
        toast.success('Business created');
      }
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{isEdit ? 'Edit Business' : 'New Business'}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Business Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your business name" required />
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, City, State ZIP" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(555) 123-4567" />
            </div>
            <div className="form-group">
              <label>Tax ID</label>
              <input type="text" value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} placeholder="EIN or Tax ID" />
            </div>
          </div>

          <button className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Business' : 'Create Business'}
          </button>
        </form>
      </div>
    </div>
  );
}
