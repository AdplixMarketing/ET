import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import api from '../api/client';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function AutomationRuleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { categories } = useCategories();

  const [form, setForm] = useState({
    name: '',
    rule_type: 'auto_categorize',
    match_field: 'vendor_or_client',
    match_value: '',
    match_type: 'contains',
    category_id: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get('/automation').then((res) => {
        const rule = res.data.find((r) => r.id === parseInt(id));
        if (rule) {
          setForm({
            name: rule.name,
            rule_type: rule.rule_type,
            match_field: rule.match_field,
            match_value: rule.match_value,
            match_type: rule.match_type,
            category_id: rule.category_id || '',
          });
        }
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.match_value.trim()) {
      toast.error('Name and match value are required');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/automation/${id}`, form);
        toast.success('Rule updated');
      } else {
        await api.post('/automation', form);
        toast.success('Rule created');
      }
      navigate('/automation');
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
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{isEdit ? 'Edit Rule' : 'New Rule'}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Rule Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Categorize Uber as Transport" required />
            </div>

            <div className="form-group">
              <label>When</label>
              <select value={form.match_field} onChange={(e) => setForm({ ...form, match_field: e.target.value })}>
                <option value="vendor_or_client">Vendor / Client</option>
                <option value="description">Description</option>
              </select>
            </div>

            <div className="form-group">
              <label>Match Type</label>
              <select value={form.match_type} onChange={(e) => setForm({ ...form, match_type: e.target.value })}>
                <option value="contains">Contains</option>
                <option value="exact">Equals exactly</option>
                <option value="starts_with">Starts with</option>
              </select>
            </div>

            <div className="form-group">
              <label>Match Value *</label>
              <input type="text" value={form.match_value} onChange={(e) => setForm({ ...form, match_value: e.target.value })} placeholder="e.g. Uber, Amazon, Starbucks" required />
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Then assign category</h3>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Rule' : 'Create Rule'}
          </button>
        </form>
      </div>
    </div>
  );
}
