import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, PlayCircle, PauseCircle, RefreshCw, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useRecurring } from '../hooks/useRecurring';
import UpgradePrompt from '../components/ui/UpgradePrompt';

export default function Recurring() {
  const navigate = useNavigate();
  const { rules, loading, fetch } = useRecurring();
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    fetch();
    api.get('/auth/me').then(res => setPlan(res.data.plan)).catch(() => {});
  }, [fetch]);

  const handleToggle = async (id) => {
    try {
      await api.post(`/recurring/${id}/toggle`);
      toast.success('Rule status updated');
      fetch();
    } catch {
      toast.error('Failed to toggle rule');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring rule?')) return;
    try {
      await api.delete(`/recurring/${id}`);
      toast.success('Rule deleted');
      fetch();
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { background: '#dcfce7', color: '#166534' },
      paused: { background: '#fef3c7', color: '#92400e' },
    };
    const s = styles[status] || styles.paused;
    return (
      <span style={{ ...s, padding: '2px 10px', borderRadius: 12, fontSize: 13, fontWeight: 500 }}>
        {status}
      </span>
    );
  };

  const getFrequencyLabel = (freq) => {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    };
    return labels[freq] || freq;
  };

  if (plan && plan !== 'max') {
    return (
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Recurring Rules</h1>
        <UpgradePrompt feature="recurring transactions" requiredPlan="Max" />
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Recurring Rules</h1>
        <button
          onClick={() => navigate('/recurring/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: '#6366f1', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
          }}
        >
          <Plus size={18} /> New Rule
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 72, background: 'var(--card-bg, #f3f4f6)', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
          <RefreshCw size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
          <p style={{ fontSize: 16 }}>No recurring rules yet.</p>
          <p style={{ fontSize: 14, marginTop: 4 }}>Create one to automate your transactions or invoices.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rules.map(rule => (
            <div
              key={rule.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 16, background: 'var(--card-bg, #fff)', borderRadius: 10,
                border: '1px solid var(--border-color, #e5e7eb)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    {rule.entity_type === 'invoice' ? 'Invoice' : 'Transaction'}
                  </span>
                  {getStatusBadge(rule.status)}
                  <span style={{
                    background: '#ede9fe', color: '#5b21b6',
                    padding: '2px 10px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                  }}>
                    {getFrequencyLabel(rule.frequency)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13 }}>
                  <Calendar size={14} />
                  <span>Next run: {rule.next_run_date ? new Date(rule.next_run_date).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => handleToggle(rule.id)}
                  title={rule.status === 'active' ? 'Pause' : 'Resume'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}
                >
                  {rule.status === 'active' ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
                </button>
                <button
                  onClick={() => navigate(`/recurring/${rule.id}/edit`)}
                  style={{
                    padding: '6px 14px', background: 'var(--card-bg, #f3f4f6)',
                    border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 6,
                    cursor: 'pointer', fontSize: 13,
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
