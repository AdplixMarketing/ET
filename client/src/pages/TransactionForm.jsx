import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import api from '../api/client';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, Upload, Image, ExternalLink, X, AlertTriangle } from 'lucide-react';
import UpgradeModal from '../components/ui/UpgradeModal';
import styles from './TransactionForm.module.css';
import { format } from 'date-fns';
import { formatMoney, parseMoney, localDate, parseLocalDate } from '../utils/formatters';

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
    date: localDate(),
    vendor_or_client: '',
    payment_method: '',
    description: '',
    notes: '',
  });
  const [receipt, setReceipt] = useState(null);
  const [existingReceipt, setExistingReceipt] = useState(null);
  const [receiptBlobUrl, setReceiptBlobUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const { categories } = useCategories(type);

  useEffect(() => {
    if (isEdit) {
      api.get(`/transactions/${id}`).then((res) => {
        const tx = res.data;
        setType(tx.type);
        setForm({
          amount: formatMoney(String(tx.amount)),
          category_id: tx.category_id || '',
          date: tx.date?.slice(0, 10),
          vendor_or_client: tx.vendor_or_client || '',
          payment_method: tx.payment_method || '',
          description: tx.description || '',
          notes: tx.notes || '',
        });
        if (tx.receipt_path) {
          setExistingReceipt(tx.receipt_path);
          // Fetch receipt image through authenticated API to get a viewable blob URL
          api.get(`/transactions/${id}/receipt`, { responseType: 'blob' })
            .then((imgRes) => {
              setReceiptBlobUrl(URL.createObjectURL(imgRes.data));
            })
            .catch(() => {});
        }
      });
    }
    return () => {
      // Clean up blob URL on unmount
      setReceiptBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseMoney(form.amount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('type', type);
      fd.append('amount', amount);
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
        if (res.data.duplicate_warning) {
          setDuplicateWarning(res.data.duplicate_warning);
          return;
        }
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
    if (!window.confirm('Delete this transaction?')) return;
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
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: formatMoney(e.target.value) })}
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
              style={{ padding: '12px 0', width: '50%' }}
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

          {/* Receipt */}
          <div className="form-group">
            <label>Receipt</label>
            {existingReceipt && !receipt && receiptBlobUrl && (
              <div className={styles.receiptPreview}>
                <div className={styles.receiptWrapper}>
                  <img
                    src={receiptBlobUrl}
                    alt="Receipt"
                    className={styles.receiptImage}
                    onClick={() => window.open(receiptBlobUrl, '_blank')}
                  />
                  <button
                    type="button"
                    className={styles.removeReceipt}
                    onClick={async () => {
                      if (!window.confirm('Remove this receipt?')) return;
                      try {
                        await api.delete(`/transactions/${id}/receipt`);
                        URL.revokeObjectURL(receiptBlobUrl);
                        setReceiptBlobUrl(null);
                        setExistingReceipt(null);
                        toast.success('Receipt removed');
                      } catch {
                        toast.error('Failed to remove receipt');
                      }
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <span className={styles.receiptHint}>Tap to view full size</span>
              </div>
            )}
            <div className={styles.uploadRow}>
              <label className={styles.uploadBtn}>
                <Upload size={18} />
                {receipt ? receipt.name : existingReceipt ? 'Replace receipt' : 'Upload receipt image'}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceipt(e.target.files[0])}
                  hidden
                />
              </label>
              {receipt && (
                <button type="button" className={styles.removeNewReceipt} onClick={() => setReceipt(null)}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <button className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Transaction' : 'Save Transaction'}
          </button>
        </form>

        {duplicateWarning && (
          <div style={{ margin: '16px 0', padding: 12, background: 'rgba(255, 149, 0, 0.1)', border: '1px solid #FF9500', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AlertTriangle size={16} style={{ color: '#FF9500' }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: '#FF9500' }}>Possible duplicate</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              Transaction saved, but similar entries exist:
            </p>
            {duplicateWarning.matches.map((d) => (
              <div key={d.id} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
                ${parseFloat(d.amount).toFixed(2)} &middot; {d.vendor_or_client || 'Unknown'} &middot; {format(parseLocalDate(d.date), 'MMM d, yyyy')}
              </div>
            ))}
            <button className="btn btn-outline" style={{ marginTop: 8, fontSize: 12, padding: '6px 12px' }} onClick={() => { setDuplicateWarning(null); navigate(-1); }}>
              Dismiss & Go Back
            </button>
          </div>
        )}

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
