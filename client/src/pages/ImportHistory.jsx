import { useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useImport } from '../hooks/useImport';

export default function ImportHistory() {
  const { history, loading, fetch } = useImport();

  useEffect(() => { fetch(); }, [fetch]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} style={{ color: '#16a34a' }} />;
      case 'failed': return <AlertCircle size={16} style={{ color: '#ef4444' }} />;
      default: return <Clock size={16} style={{ color: '#f59e0b' }} />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: { background: '#dcfce7', color: '#166534' },
      failed: { background: '#fecaca', color: '#991b1b' },
      processing: { background: '#fef3c7', color: '#92400e' },
    };
    const s = styles[status] || styles.processing;
    return (
      <span style={{ ...s, padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {getStatusIcon(status)} {status}
      </span>
    );
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Import History</h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 64, background: 'var(--card-bg, #f3f4f6)', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
          <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
          <p style={{ fontSize: 16 }}>No imports yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 16, background: 'var(--card-bg, #fff)', borderRadius: 10,
                border: '1px solid var(--border-color, #e5e7eb)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FileText size={20} style={{ color: '#6b7280' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.filename}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'right', fontSize: 13, color: '#6b7280' }}>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>{item.imported_count ?? 0}</span> imported
                  {item.skipped_count > 0 && (
                    <>, <span style={{ color: '#f59e0b', fontWeight: 600 }}>{item.skipped_count}</span> skipped</>
                  )}
                </div>
                {getStatusBadge(item.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
