import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import api from '../api/client';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, Upload } from 'lucide-react';
import UpgradeModal from '../components/ui/UpgradeModal';
import styles from './TransactionForm.module.css';

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Check', 'Other'];

export default function TransactionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteTransaction } = useTransactions();
  const isEdit = Boolean(id);

  const [type, setType] = useState('expense');
  const [form, setForm] = useState({
    amount: '',
    category_id: '',
    date: new Date().toISOString().slice(0, 10),
    vendor_or_client: '',
    payment_method: '',
    description: '',
    notes: '',
  });
  const [receipt, setReceipt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { categories } = useCategories(type);

  useEffect(() => {
    if (isEdit) {
      api.get(`/transactions/${id}`).then((res) => {
        const tx = res.data;
        setType(tx.type);
        setForm({
          amount: tx.amount,
          category_id: tx.category_id || '',
          date: tx.date?.slice(0, 10),
          vendor_or_client: tx.vendor_or_client || '',
          payment_method: tx.payment_method || '',
          description: tx.description || '',
          notes: tx.notes || '',
        });
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('type', type);
      fd.append('amount', form.amount);
      fd.append('date', form.date);
      if (form.category_id) fd.append('category_id', form.category_id);
      if (form.vendor_or_client) fd.append('vendor_or_client', form.vendor_or_client);
      if (form.payment_method) fd.append('payment_method', form.payment_method);
      if (form.description) fd.append('description', form.description);
      if (form.notes) fd.append('notes', form.notes);
      if (receipt) fd.append('receipt', receipt);

      if (isEdit) {
        await api.put(`/transactions/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Transaction added');
      }
      navigate(-1);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.upgrade) {
        setShowUpgrade(true);
      } else {
        toast.error(err.response?.data?.error || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await deleteTransaction(id);
      toast.success('Deleted');
      navigate('/transactions');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className={styles.topBar}>
          <button className={styles.back} onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1>{isEdit ? 'Edit Transaction' : 'New Transaction'}</h1>
          {isEdit && (
            <button className={styles.deleteBtn} onClick={handleDelete}>
              <Trash2 size={20} />
            </button>
          )}
        </div>

        {/* Type Toggle */}
        <div className="toggle-group" style={{ marginBottom: 20 }}>
          <button className={type === 'expense' ? 'active' : ''} onClick={() => setType('expense')}>
            Expense
          </button>
          <button className={type === 'income' ? 'active' : ''} onClick={() => setType('income')}>
            Income
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Amount */}
          <div className={styles.amountGroup}>
            <span className={styles.dollar}>$</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={styles.amountInput}
              autoFocus
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label>Category</label>
            <div className={styles.categoryGrid}>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.categoryBtn} ${form.category_id === c.id ? styles.categoryActive : ''}`}
                  style={{ '--cat-color': c.color }}
                  onClick={() => setForm({ ...form, category_id: c.id })}
                >
                  <span className={styles.catDot} style={{ background: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={{ padding: '12px 0' }}
            />
          </div>

          <div className="form-group">
            <label>{type === 'income' ? 'Client / Source' : 'Vendor'}</label>
            <input
              type="text"
              placeholder={type === 'income' ? 'Who paid you?' : 'Where did you spend?'}
              value={form.vendor_or_client}
              onChange={(e) => setForm({ ...form, vendor_or_client: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Payment Method</label>
            <select
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
            >
              <option value="">Select...</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              placeholder="Brief description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows={3}
              placeholder="Additional notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Receipt Upload */}
          <div className="form-group">
            <label>Receipt</label>
            <label className={styles.uploadBtn}>
              <Upload size={18} />
              {receipt ? receipt.name : 'Upload receipt image'}
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setReceipt(e.target.files[0])}
                hidden
              />
            </label>
          </div>

          <button className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Transaction' : 'Save Transaction'}
          </button>
        </form>

        {showUpgrade && (
          <UpgradeModal
            title="Transaction Limit Reached"
            message="You've used all 15 free transactions this month. Upgrade to Pro for unlimited transactions."
            onClose={() => setShowUpgrade(false)}
          />
        )}
      </div>
    </div>
  );
}
