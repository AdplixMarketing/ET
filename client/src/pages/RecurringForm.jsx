import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { formatMoney, parseMoney } from '../utils/formatters';

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

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
      ? { amount: parseMoney(amount), type: txType, description, vendor_or_client: vendorOrClient }
      : { client_name: clientName, client_email: clientEmail, items: items.map(i => ({ ...i, qty: Number(i.qty), rate: parseMoney(i.rate) })) };

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
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate('/recurring')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text)' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>
            {isEdit ? 'Edit Recurring Rule' : 'New Recurring Rule'}
          </h1>
        </div>

        {/* Entity Type Tabs */}
        <div className="toggle-group" style={{ marginBottom: 20 }}>
          <button className={entityType === 'transaction' ? 'active' : ''} onClick={() => setEntityType('transaction')}>
            Transaction
          </button>
          <button className={entityType === 'invoice' ? 'active' : ''} onClick={() => setEntityType('invoice')}>
            Invoice
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Frequency & Dates */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Schedule</h3>
            <div className="form-group">
              <label>Frequency</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)}>
                {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="form-group" style={{ width: '48%' }}>
                <label>Next Run Date</label>
                <input type="date" value={nextRunDate} onChange={e => setNextRunDate(e.target.value)} required style={{ padding: '12px 0', width: '100%' }} />
              </div>
              <div className="form-group" style={{ width: '48%' }}>
                <label>End Date (optional)</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '12px 0', width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Transaction Fields */}
          {entityType === 'transaction' && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Transaction Details</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="form-group" style={{ width: '48%' }}>
                  <label>Amount</label>
                  <input type="text" inputMode="decimal" value={amount} onChange={e => setAmount(formatMoney(e.target.value))} required placeholder="0.00" style={{ width: '100%' }} />
                </div>
                <div className="form-group" style={{ width: '48%' }}>
                  <label>Type</label>
                  <select value={txType} onChange={e => setTxType(e.target.value)} style={{ width: '100%' }}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Monthly rent" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Vendor / Client</label>
                <input type="text" value={vendorOrClient} onChange={e => setVendorOrClient(e.target.value)} placeholder="e.g. Landlord" />
              </div>
            </div>
          )}

          {/* Invoice Fields */}
          {entityType === 'invoice' && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Invoice Details</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="form-group" style={{ width: '48%' }}>
                  <label>Client Name</label>
                  <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} required placeholder="Client name" style={{ width: '100%' }} />
                </div>
                <div className="form-group" style={{ width: '48%' }}>
                  <label>Client Email</label>
                  <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@email.com" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Line Items</label>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input type="text" placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                    <input type="number" placeholder="Qty" value={item.qty} min={1} onChange={e => updateItem(idx, 'qty', e.target.value)} />
                    <input type="text" inputMode="decimal" placeholder="Rate" value={item.rate} onChange={e => updateItem(idx, 'rate', formatMoney(e.target.value))} />
                    <button type="button" onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline" onClick={addItem} style={{ marginTop: 4, fontSize: 13 }}>
                  <Plus size={14} /> Add Item
                </button>
              </div>
            </div>
          )}

          <button className="btn btn-primary btn-full" type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Rule' : 'Create Recurring Rule'}
          </button>
        </form>
      </div>
    </div>
  );
}
