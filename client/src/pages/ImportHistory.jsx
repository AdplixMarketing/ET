import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useImport } from '../hooks/useImport';

export default function ImportHistory() {
  const navigate = useNavigate();
  const { history, loading, fetch } = useImport();

  useEffect(() => { fetch(); }, [fetch]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />;
      case 'failed': return <AlertCircle size={14} style={{ color: 'var(--color-danger)' }} />;
      default: return <Clock size={14} style={{ color: '#eab308' }} />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return { background: 'rgba(22, 163, 74, 0.1)', color: 'var(--color-success)' };
      case 'failed': return { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' };
      default: return { background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' };
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text)' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Import History</h1>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="card" style={{ height: 64, opacity: 0.5 }} />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-secondary)' }}>
            <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <p style={{ fontSize: 16 }}>No imports yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(item => (
              <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FileText size={20} style={{ color: 'var(--color-text-secondary)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.filename}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{item.imported_count ?? 0}</span> imported
                    {item.skipped_count > 0 && (
                      <>, <span style={{ color: '#eab308', fontWeight: 600 }}>{item.skipped_count}</span> skipped</>
                    )}
                  </div>
                  <span style={{
                    ...getStatusStyle(item.status),
                    padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    {getStatusIcon(item.status)} {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
