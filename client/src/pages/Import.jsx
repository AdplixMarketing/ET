import { useState } from 'react';
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

      // Auto-map columns by name
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

  const stepIndicator = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700,
            background: i <= step ? '#6366f1' : 'var(--card-bg, #e5e7eb)',
            color: i <= step ? '#fff' : '#6b7280',
          }}>
            {i < step ? <CheckCircle size={16} /> : i + 1}
          </div>
          <span style={{ fontSize: 13, fontWeight: i === step ? 700 : 400, color: i === step ? '#111' : '#6b7280' }}>{s}</span>
          {i < STEPS.length - 1 && <div style={{ width: 32, height: 2, background: i < step ? '#6366f1' : '#d1d5db' }} />}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Import Transactions</h1>
      <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 14 }}>Upload a CSV or QBO file to import transactions.</p>

      {stepIndicator}

      {/* Step 1: Upload */}
      {step === 0 && (
        <div style={{ textAlign: 'center', padding: 48, border: '2px dashed var(--border-color, #d1d5db)', borderRadius: 12 }}>
          <Upload size={48} style={{ color: '#6b7280', marginBottom: 16 }} />
          <p style={{ marginBottom: 16, color: '#6b7280' }}>Select a CSV or QBO file</p>
          <input
            type="file"
            accept=".csv,.qbo"
            onChange={handleFileSelect}
            style={{ marginBottom: 16 }}
          />
          {file && (
            <p style={{ fontSize: 13, color: '#374151', marginBottom: 16 }}>
              Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
          <div>
            <button
              onClick={handleUpload}
              disabled={!file}
              style={{
                padding: '10px 24px', background: '#6366f1', color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
                opacity: file ? 1 : 0.5,
              }}
            >
              Upload & Parse <ArrowRight size={16} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Map Columns */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Map Columns</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
            Map each detected column to a transaction field.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {columns.map(col => (
              <div key={col} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{col}</span>
                <select
                  value={mapping[col] || ''}
                  onChange={e => setMapping({ ...mapping, [col]: e.target.value })}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8,
                    border: '1px solid var(--border-color, #d1d5db)', fontSize: 14,
                  }}
                >
                  {MAPPABLE_FIELDS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(0)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'var(--card-bg, #f3f4f6)', border: '1px solid var(--border-color, #d1d5db)', borderRadius: 8, cursor: 'pointer' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Preview <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Preview (first 5 rows)</h2>
          <div style={{ overflowX: 'auto', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid var(--border-color, #e5e7eb)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {col}
                      {mapping[col] && (
                        <span style={{ display: 'block', fontSize: 11, color: '#6366f1', fontWeight: 400 }}>
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
                      <td key={col} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
                        {row[col] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
            Total rows to import: <strong>{allRows.length}</strong>
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'var(--card-bg, #f3f4f6)', border: '1px solid var(--border-color, #d1d5db)', borderRadius: 8, cursor: 'pointer' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 24px', background: '#16a34a', color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
                opacity: importing ? 0.6 : 1,
              }}
            >
              {importing ? 'Importing...' : 'Start Import'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 3 && result && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <CheckCircle size={56} style={{ color: '#16a34a', marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Import Complete</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24 }}>
            <div style={{ padding: 16, background: '#dcfce7', borderRadius: 10, minWidth: 120 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#166534' }}>{result.imported ?? 0}</div>
              <div style={{ fontSize: 13, color: '#166534' }}>Imported</div>
            </div>
            <div style={{ padding: 16, background: '#fef3c7', borderRadius: 10, minWidth: 120 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#92400e' }}>{result.skipped ?? 0}</div>
              <div style={{ fontSize: 13, color: '#92400e' }}>Skipped</div>
            </div>
            {result.errors > 0 && (
              <div style={{ padding: 16, background: '#fecaca', borderRadius: 10, minWidth: 120 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#991b1b' }}>{result.errors}</div>
                <div style={{ fontSize: 13, color: '#991b1b' }}>Errors</div>
              </div>
            )}
          </div>
          <button
            onClick={() => { setStep(0); setFile(null); setResult(null); }}
            style={{
              padding: '10px 24px', background: '#6366f1', color: '#fff',
              border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}
