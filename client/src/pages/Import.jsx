import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

const STEPS = ['Upload', 'Map Columns', 'Preview', 'Import'];

const MAPPABLE_FIELDS = [
  { value: '', label: '-- Skip --' },
  { value: 'type', label: 'Type (income/expense)' },
  { value: 'amount', label: 'Amount' },
  { value: 'date', label: 'Date' },
  { value: 'description', label: 'Description' },
  { value: 'vendor_or_client', label: 'Vendor / Client' },
  { value: 'category', label: 'Category' },
  { value: 'payment_method', label: 'Payment Method' },
];

export default function Import() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [mapping, setMapping] = useState({});
  const [previewRows, setPreviewRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [result, setResult] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/imports/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setColumns(res.data.columns || []);
      setPreviewRows(res.data.rows?.slice(0, 5) || []);
      setAllRows(res.data.rows || []);

      const autoMap = {};
      (res.data.columns || []).forEach(col => {
        const lower = col.toLowerCase().replace(/[^a-z]/g, '');
        if (lower.includes('amount')) autoMap[col] = 'amount';
        else if (lower.includes('date')) autoMap[col] = 'date';
        else if (lower.includes('description') || lower.includes('memo')) autoMap[col] = 'description';
        else if (lower.includes('type') || lower.includes('category')) autoMap[col] = 'type';
        else if (lower.includes('vendor') || lower.includes('payee') || lower.includes('client')) autoMap[col] = 'vendor_or_client';
        else if (lower.includes('payment') || lower.includes('method')) autoMap[col] = 'payment_method';
      });
      setMapping(autoMap);
      setStep(1);
    } catch {
      toast.error('Failed to parse file');
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await api.post('/imports/execute', {
        rows: allRows,
        mapping,
        filename: file.name,
      });
      setResult(res.data);
      setStep(3);
      toast.success('Import complete');
    } catch {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', marginBottom: 16, fontSize: 14 }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Import Transactions</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: 14 }}>Upload a CSV or QBO file to import transactions.</p>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 28, overflowX: 'auto' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                background: i <= step ? 'var(--color-primary)' : 'var(--color-surface)',
                color: i <= step ? '#fff' : 'var(--color-text-secondary)',
              }}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: i === step ? 700 : 400, color: i === step ? 'var(--color-text)' : 'var(--color-text-secondary)' }}>{s}</span>
              {i < STEPS.length - 1 && <div style={{ width: 24, height: 2, background: i < step ? 'var(--color-primary)' : 'var(--color-border)' }} />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40, border: '2px dashed var(--color-border)', background: 'transparent' }}>
            <Upload size={44} style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }} />
            <p style={{ marginBottom: 16, color: 'var(--color-text-secondary)' }}>Select a CSV or QBO file</p>
            <input
              type="file"
              accept=".csv,.qbo"
              onChange={handleFileSelect}
              style={{ marginBottom: 16 }}
            />
            {file && (
              <p style={{ fontSize: 13, color: 'var(--color-text)', marginBottom: 16 }}>
                Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
            <div>
              <button className="btn btn-primary" onClick={handleUpload} disabled={!file}>
                Upload & Parse <ArrowRight size={16} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Map Columns */}
        {step === 1 && (
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Map Columns</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 16 }}>
              Map each detected column to a transaction field.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {columns.map(col => (
                <div key={col} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{col}</span>
                  <select
                    value={mapping[col] || ''}
                    onChange={e => setMapping({ ...mapping, [col]: e.target.value })}
                    style={{ flex: 1 }}
                  >
                    {MAPPABLE_FIELDS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-outline" onClick={() => setStep(0)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Preview <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 2 && (
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Preview (first 5 rows)</h3>
            <div style={{ overflowX: 'auto', marginBottom: 24 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th key={col} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid var(--color-border)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {col}
                        {mapping[col] && (
                          <span style={{ display: 'block', fontSize: 11, color: 'var(--color-primary)', fontWeight: 400 }}>
                            → {mapping[col]}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {columns.map(col => (
                        <td key={col} style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
                          {row[col] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 16 }}>
              Total rows to import: <strong>{allRows.length}</strong>
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={importing}
                style={{ background: '#16a34a' }}
              >
                {importing ? 'Importing...' : 'Start Import'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 3 && result && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <CheckCircle size={48} style={{ color: '#16a34a', marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Import Complete</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ padding: 16, background: 'rgba(22, 163, 74, 0.1)', borderRadius: 10, minWidth: 100 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>{result.imported ?? 0}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Imported</div>
              </div>
              <div style={{ padding: 16, background: 'rgba(234, 179, 8, 0.1)', borderRadius: 10, minWidth: 100 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#eab308' }}>{result.skipped ?? 0}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Skipped</div>
              </div>
              {result.errors > 0 && (
                <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 10, minWidth: 100 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{result.errors}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Errors</div>
                </div>
              )}
            </div>
            <button className="btn btn-primary" onClick={() => { setStep(0); setFile(null); setResult(null); }}>
              Import Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
