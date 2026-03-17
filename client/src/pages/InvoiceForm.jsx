import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import styles from './InvoiceForm.module.css';
import { formatMoney, parseMoney, localDate } from '../utils/formatters';

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const [clientsList, setClientsList] = useState([]);

  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    client_id: '',
    due_date: localDate(new Date(Date.now() + 30 * 86400000)),
    notes: '',
    tax_rate: 0,
    template_id: '',
    portal_payment_enabled: false,
  });
  const [templates, setTemplates] = useState([]);

  const [items, setItems] = useState([
    { description: '', quantity: '1', rate: '' },
  ]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch clients and templates for Max users
    if (user?.plan === 'max') {
      api.get('/clients').then((res) => setClientsList(res.data)).catch(() => {});
      api.get('/templates').then((res) => setTemplates(res.data)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (isEdit) {
      api.get(`/invoices/${id}`).then((res) => {
        const inv = res.data;
        setForm({
          client_name: inv.client_name,
          client_email: inv.client_email || '',
          due_date: inv.due_date?.slice(0, 10),
          notes: inv.notes || '',
          tax_rate: parseFloat(inv.tax_rate) || 0,
        });
        if (inv.items?.length > 0) {
          setItems(inv.items.map((i) => ({
            description: i.description,
            quantity: String(parseFloat(i.quantity)),
            rate: formatMoney(String(parseFloat(i.rate))),
          })));
        }
      });
    }
  }, [id, isEdit]);

  const subtotal = items.reduce((s, i) => s + ((parseFloat(i.quantity) || 0) * parseMoney(i.rate || '0')), 0);
  const taxAmount = subtotal * (form.tax_rate / 100);
  const total = subtotal + taxAmount;

  const addItem = () => setItems([...items, { description: '', quantity: '1', rate: '' }]);

  const removeItem = (idx) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_name.trim()) {
      toast.error('Enter client name');
      return;
    }
    if (items.some((i) => !i.description.trim() || i.rate <= 0)) {
      toast.error('Fill in all line items');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        items: items.map((i) => ({
          description: i.description,
          quantity: parseFloat(i.quantity) || 0,
          rate: parseMoney(i.rate || '0'),
        })),
      };
      if (isEdit) {
        await api.put(`/invoices/${id}`, payload);
        toast.success('Invoice updated');
      } else {
        const res = await api.post('/invoices', payload);
        toast.success(`Invoice ${res.data.invoice_number} created`);
      }
      navigate('/invoices');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className={styles.topBar}>
          <button className={styles.back} onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1>{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Client Details</h3>
            {clientsList.length > 0 && (
              <div className="form-group">
                <label>Select Client</label>
                <select
                  value={form.client_id}
                  onChange={(e) => {
                    const clientId = e.target.value;
                    if (clientId) {
                      const c = clientsList.find((cl) => cl.id === clientId);
                      if (c) {
                        setForm({ ...form, client_id: clientId, client_name: c.name, client_email: c.email || '' });
                      }
                    } else {
                      setForm({ ...form, client_id: '' });
                    }
                  }}
                >
                  <option value="">Enter manually</option>
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Client Name *</label>
              <input
                type="text"
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                placeholder="Client or business name"
                required
              />
            </div>
            <div className="form-group">
              <label>Client Email</label>
              <input
                type="email"
                value={form.client_email}
                onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                placeholder="client@email.com"
              />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                style={{ padding: '12px 0' }}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Line Items</h3>

            {items.map((item, idx) => (
              <div key={idx} className={styles.lineItem}>
                <div className="form-group" style={{ flex: 2, marginBottom: 8 }}>
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  />
                </div>
                <div className={styles.lineNumbers}>
                  <div className="form-group" style={{ marginBottom: 8, flex: 1, minWidth: 0 }}>
                    <label style={{ fontSize: 11 }}>Qty</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value.replace(/[^0-9.]/g, ''))}
                      style={{ width: '100%', minWidth: 0 }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 8, flex: 1.4, minWidth: 0 }}>
                    <label style={{ fontSize: 11 }}>Rate ($)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.rate}
                      onChange={(e) => updateItem(idx, 'rate', formatMoney(e.target.value))}
                      style={{ width: '100%', minWidth: 0 }}
                    />
                  </div>
                  <span className={styles.lineTotal}>
                    ${((parseFloat(item.quantity) || 0) * parseMoney(item.rate || '0')).toFixed(2)}
                  </span>
                  {items.length > 1 && (
                    <button type="button" className={styles.removeBtn} onClick={() => removeItem(idx)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button type="button" className="btn btn-outline" onClick={addItem} style={{ marginTop: 8 }}>
              <Plus size={16} /> Add Item
            </button>
          </div>

          {/* Totals */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.totalRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Tax</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.tax_rate}
                  onChange={(e) => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })}
                  style={{ width: 60, padding: 6, fontSize: 14 }}
                />
                <span>%</span>
              </div>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className={styles.totalRow} style={{ fontWeight: 700, fontSize: 20, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Payment terms, thank you note, etc."
              />
            </div>
          </div>

          {/* Template & Payment (Max only) */}
          {user?.plan === 'max' && (
            <div className="card" style={{ marginBottom: 16 }}>
              {templates.length > 0 && (
                <div className="form-group">
                  <label>Invoice Template</label>
                  <select value={form.template_id} onChange={(e) => setForm({ ...form, template_id: e.target.value })}>
                    <option value="">Default template</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="portal_payment"
                  checked={form.portal_payment_enabled}
                  onChange={(e) => setForm({ ...form, portal_payment_enabled: e.target.checked })}
                  style={{ width: 18, height: 18 }}
                />
                <label htmlFor="portal_payment" style={{ fontSize: 14, cursor: 'pointer' }}>
                  Enable online payment (3.5% fee)
                </label>
              </div>
            </div>
          )}

          <button className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Invoice' : 'Create Invoice'}
          </button>
        </form>
      </div>
    </div>
  );
}
