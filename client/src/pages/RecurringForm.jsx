import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid var(--border-color, #d1d5db)', fontSize: 14,
  background: 'var(--input-bg, #fff)',
};

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' };

export default function RecurringForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [entityType, setEntityType] = useState('transaction');
  const [frequency, setFrequency] = useState('monthly');
  const [nextRunDate, setNextRunDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Transaction fields
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState('expense');
  const [description, setDescription] = useState('');
  const [vendorOrClient, setVendorOrClient] = useState('');

  // Invoice fields
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [items, setItems] = useState([{ description: '', qty: 1, rate: '' }]);

  useEffect(() => {
    if (isEdit) {
      api.get(`/recurring/${id}`).then(res => {
        const r = res.data;
        setEntityType(r.entity_type || 'transaction');
        setFrequency(r.frequency || 'monthly');
        setNextRunDate(r.next_run_date ? r.next_run_date.split('T')[0] : '');
        setEndDate(r.end_date ? r.end_date.split('T')[0] : '');
        if (r.template_data) {
          const t = r.template_data;
          if (r.entity_type === 'transaction') {
            setAmount(t.amount || '');
            setTxType(t.type || 'expense');
            setDescription(t.description || '');
            setVendorOrClient(t.vendor_or_client || '');
          } else {
            setClientName(t.client_name || '');
            setClientEmail(t.client_email || '');
            setItems(t.items || [{ description: '', qty: 1, rate: '' }]);
          }
        }
      }).catch(() => toast.error('Failed to load rule'));
    }
  }, [id, isEdit]);

  const addItem = () => setItems([...items, { description: '', qty: 1, rate: '' }]);

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
    setSaving(true);

    const templateData = entityType === 'transaction'
      ? { amount: parseFloat(amount), type: txType, description, vendor_or_client: vendorOrClient }
      : { client_name: clientName, client_email: clientEmail, items: items.map(i => ({ ...i, qty: Number(i.qty), rate: parseFloat(i.rate) })) };

    const payload = {
      entity_type: entityType,
      frequency,
      next_run_date: nextRunDate,
      end_date: endDate || null,
      template_data: templateData,
    };

    try {
      if (isEdit) {
        await api.put(`/recurring/${id}`, payload);
        toast.success('Rule updated');
      } else {
        await api.post('/recurring', payload);
        toast.success('Rule created');
      }
      navigate('/recurring');
    } catch {
      toast.error('Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 680, margin: '0 auto' }}>
      <button
        onClick={() => navigate('/recurring')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', marginBottom: 16, fontSize: 14 }}
      >
        <ArrowLeft size={16} /> Back to Recurring Rules
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        {isEdit ? 'Edit Recurring Rule' : 'New Recurring Rule'}
      </h1>

      {/* Entity Type Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color, #d1d5db)' }}>
        {['transaction', 'invoice'].map(type => (
          <button
            key={type}
            onClick={() => setEntityType(type)}
            style={{
              flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
              background: entityType === type ? '#6366f1' : 'var(--card-bg, #fff)',
              color: entityType === type ? '#fff' : '#6b7280',
            }}
          >
            {type === 'transaction' ? 'Transaction' : 'Invoice'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Frequency & Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={labelStyle}>Frequency</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value)} style={inputStyle}>
              {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Next Run Date</label>
            <input type="date" value={nextRunDate} onChange={e => setNextRunDate(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>End Date (optional)</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Transaction Fields */}
        {entityType === 'transaction' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Amount</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={txType} onChange={e => setTxType(e.target.value)} style={inputStyle}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Monthly rent" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Vendor / Client</label>
              <input type="text" value={vendorOrClient} onChange={e => setVendorOrClient(e.target.value)} placeholder="e.g. Landlord" style={inputStyle} />
            </div>
          </div>
        )}

        {/* Invoice Fields */}
        {entityType === 'invoice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Client Name</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} required placeholder="Client name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Client Email</label>
                <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@email.com" style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Line Items</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text" placeholder="Description" value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="number" placeholder="Qty" value={item.qty} min={1}
                      onChange={e => updateItem(idx, 'qty', e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="number" step="0.01" placeholder="Rate" value={item.rate}
                      onChange={e => updateItem(idx, 'rate', e.target.value)}
                      style={inputStyle}
                    />
                    <button
                      type="button" onClick={() => removeItem(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button" onClick={addItem}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
                  background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: 13, fontWeight: 600,
                }}
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
          </div>
        )}

        <button
          type="submit" disabled={saving}
          style={{
            width: '100%', padding: '12px 0', background: '#6366f1', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : isEdit ? 'Update Rule' : 'Create Recurring Rule'}
        </button>
      </form>
    </div>
  );
}
