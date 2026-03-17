import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { formatPhone } from '../utils/formatters';

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', address: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/clients/${id}`).then((res) => {
        const c = res.data;
        setForm({
          name: c.name || '', email: c.email || '', phone: c.phone || '',
          company: c.company || '', address: c.address || '', notes: c.notes || '',
        });
      }).catch(() => toast.error('Failed to load client'));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Enter client name'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/clients/${id}`, form);
        toast.success('Client updated');
      } else {
        await api.post('/clients', form);
        toast.success('Client created');
      }
      navigate('/clients');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this client?')) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Client deleted');
      navigate('/clients');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>{isEdit ? 'Edit Client' : 'New Client'}</h1>
          {isEdit && (
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }} onClick={handleDelete}>
              <Trash2 size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Client name" required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@email.com" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(555) 123-4567" />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address" />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes about this client" />
            </div>
          </div>
          <button className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
          </button>
        </form>
      </div>
    </div>
  );
}
