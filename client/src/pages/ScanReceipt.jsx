import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCategories } from '../hooks/useCategories';
import toast from 'react-hot-toast';
import { Camera, Loader, Check } from 'lucide-react';
import UpgradeModal from '../components/ui/UpgradeModal';
import styles from './ScanReceipt.module.css';

export default function ScanReceipt() {
  const navigate = useNavigate();
  const { categories } = useCategories('expense');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    try {
      const fd = new FormData();
      fd.append('receipt', file);
      const res = await api.post('/ocr/scan', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult({
        vendor: res.data.vendor || '',
        date: res.data.date || new Date().toISOString().slice(0, 10),
        amount: res.data.amount || '',
        category_id: res.data.suggested_category?.id || '',
        receipt_path: res.data.receipt_path,
      });
      toast.success('Receipt scanned!');
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.upgrade) {
        setShowUpgrade(true);
      } else {
        toast.error('Failed to scan receipt');
      }
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!result?.amount) {
      toast.error('Enter an amount');
      return;
    }
    setSaving(true);
    try {
      const body = {
        type: 'expense',
        amount: result.amount,
        date: result.date,
      };
      if (result.vendor) body.vendor_or_client = result.vendor;
      if (result.category_id) body.category_id = result.category_id;
      if (result.receipt_path) body.receipt_path = result.receipt_path;

      await api.post('/transactions', body);
      toast.success('Expense saved!');
      navigate('/transactions');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Scan Receipt</h1>

        {/* Upload area */}
        {!preview ? (
          <label className={styles.uploadArea}>
            <Camera size={48} strokeWidth={1.5} />
            <span>Tap to take a photo or upload a receipt</span>
            <input type="file" accept="image/*" capture="environment" onChange={handleFile} hidden />
          </label>
        ) : (
          <div className={styles.previewArea}>
            <img src={preview} alt="Receipt" className={styles.previewImg} />
            <div className={styles.previewActions}>
              <label className="btn btn-outline" style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}>
                Retake
                <input type="file" accept="image/*" capture="environment" onChange={handleFile} hidden />
              </label>
              {!result && (
                <button className="btn btn-primary" style={{ flex: 1, minWidth: 0 }} onClick={handleScan} disabled={scanning}>
                  {scanning ? <><Loader size={18} className={styles.spin} /> Scanning...</> : 'Scan Receipt'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* OCR Results */}
        {result && (
          <div className={styles.results}>
            <h3 style={{ marginBottom: 16 }}>Extracted Details</h3>

            <div className="form-group">
              <label>Vendor</label>
              <input
                type="text"
                value={result.vendor}
                onChange={(e) => setResult({ ...result, vendor: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                value={result.amount}
                onChange={(e) => setResult({ ...result, amount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={result.date}
                onChange={(e) => setResult({ ...result, date: e.target.value })}
                style={{ padding: '12px 0' }}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={result.category_id}
                onChange={(e) => setResult({ ...result, category_id: e.target.value })}
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <button className="btn btn-success btn-full" onClick={handleSave} disabled={saving}>
              <Check size={18} />
              {saving ? 'Saving...' : 'Save as Expense'}
            </button>
          </div>
        )}
        {showUpgrade && (
          <UpgradeModal
            title="Scan Limit Reached"
            message="You've used all 5 free receipt scans this month. Upgrade to Pro for unlimited scans."
            onClose={() => setShowUpgrade(false)}
          />
        )}
      </div>
    </div>
  );
}
