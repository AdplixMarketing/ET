import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Eye, Palette } from 'lucide-react';

const LAYOUTS = [
  { value: 'standard', label: 'Standard', desc: 'Classic business layout' },
  { value: 'modern', label: 'Modern', desc: 'Clean with accent colors' },
  { value: 'minimal', label: 'Minimal', desc: 'Simple and compact' },
];

const SAMPLE_ITEMS = [
  { description: 'Web Design Services', quantity: 1, rate: 2500, amount: 2500 },
  { description: 'Logo Design', quantity: 1, rate: 800, amount: 800 },
  { description: 'Hosting (Annual)', quantity: 1, rate: 200, amount: 200 },
];

export default function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const [form, setForm] = useState({
    name: '',
    layout: 'standard',
    primary_color: '#4A90E2',
    secondary_color: '#7B61FF',
    footer_text: 'Thank you for your business.',
    hide_branding: false,
  });

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/templates/${id}`)
      .then((res) => {
        const t = res.data;
        setForm({
          name: t.name || '',
          layout: t.layout || 'standard',
          primary_color: t.primary_color || '#4A90E2',
          secondary_color: t.secondary_color || '#7B61FF',
          footer_text: t.footer_text || '',
          hide_branding: t.hide_branding || false,
        });
      })
      .catch(() => toast.error('Failed to load template'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/templates/${id}`, form);
        toast.success('Template updated');
      } else {
        await api.post('/templates', form);
        toast.success('Template created');
      }
      navigate('/templates');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => navigate('/templates')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text)' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            {isEdit ? 'Edit Template' : 'New Template'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Template Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. My Brand Template"
                required
              />
            </div>

            <div className="form-group">
              <label>Layout</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {LAYOUTS.map((layout) => (
                  <button
                    key={layout.value}
                    type="button"
                    onClick={() => updateField('layout', layout.value)}
                    style={{
                      padding: '14px 12px',
                      border: form.layout === layout.value ? `2px solid var(--color-primary)` : '2px solid var(--color-border)',
                      borderRadius: 10,
                      background: form.layout === layout.value ? 'rgba(74, 144, 226, 0.1)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                      color: 'var(--color-text)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{layout.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{layout.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Colors</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Palette size={14} /> Primary
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => updateField('primary_color', e.target.value)}
                    style={{ width: 40, height: 36, padding: 2, border: '1px solid var(--color-border)', borderRadius: 6, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={form.primary_color}
                    onChange={(e) => updateField('primary_color', e.target.value)}
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Palette size={14} /> Secondary
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={form.secondary_color}
                    onChange={(e) => updateField('secondary_color', e.target.value)}
                    style={{ width: 40, height: 36, padding: 2, border: '1px solid var(--color-border)', borderRadius: 6, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={form.secondary_color}
                    onChange={(e) => updateField('secondary_color', e.target.value)}
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Footer Text</label>
              <textarea
                value={form.footer_text}
                onChange={(e) => updateField('footer_text', e.target.value)}
                placeholder="Thank you for your business."
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="hide_branding"
                checked={form.hide_branding}
                onChange={(e) => updateField('hide_branding', e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <label htmlFor="hide_branding" style={{ fontSize: 14, cursor: 'pointer' }}>
                Hide "Powered by AddFi" branding
              </label>
            </div>
          </div>

          <button
            className="btn btn-primary btn-full"
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
          </button>
        </form>

        {/* Preview — always light background since invoices render on white */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={16} /> Preview
          </h2>
          <div
            style={{
              background: '#fff',
              color: '#111',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                height: 4,
                background:
                  form.layout === 'minimal'
                    ? form.primary_color
                    : `linear-gradient(90deg, ${form.primary_color}, ${form.secondary_color})`,
              }}
            />

            <div style={{ padding: form.layout === 'minimal' ? '16px 20px' : '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: form.layout === 'minimal' ? 16 : 18, fontWeight: 700, color: form.layout === 'modern' ? form.primary_color : '#111' }}>
                    Your Business Name
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>you@email.com</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: form.primary_color, letterSpacing: 1 }}>INVOICE</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>INV-0001</div>
                </div>
              </div>

              {form.layout !== 'minimal' && <hr style={{ border: 'none', borderTop: '1px solid #F0F0F0', margin: '12px 0' }} />}

              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#8E8E93', letterSpacing: 1 }}>BILL TO</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Sample Client</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: '#6B7280' }}>
                  <div>Mar 1, 2026</div>
                  <div>Due: Mar 31, 2026</div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${form.primary_color}20` }}>
                    {['Description', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                      <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '6px 2px', fontSize: 9, fontWeight: 600, color: '#8E8E93', letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ITEMS.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F8F8F8' }}>
                      <td style={{ padding: '6px 2px' }}>{item.description}</td>
                      <td style={{ padding: '6px 2px', textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ padding: '6px 2px', textAlign: 'right' }}>${item.rate.toFixed(2)}</td>
                      <td style={{ padding: '6px 2px', textAlign: 'right' }}>${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: 'right', borderTop: '2px solid #F0F0F0', paddingTop: 8 }}>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>Subtotal: $3,500.00</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: form.layout === 'modern' ? form.primary_color : '#111' }}>
                  Total: $3,500.00
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '10px 20px',
                background: form.layout === 'modern' ? `${form.primary_color}08` : '#F9FAFB',
                textAlign: 'center',
                fontSize: 11,
                color: '#9CA3AF',
              }}
            >
              {form.footer_text || 'Thank you for your business.'}
              {!form.hide_branding && (
                <span style={{ display: 'block', marginTop: 2, fontSize: 10 }}>Powered by AddFi</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
