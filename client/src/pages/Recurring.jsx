import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, PlayCircle, PauseCircle, RefreshCw, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useRecurring } from '../hooks/useRecurring';
import UpgradePrompt from '../components/ui/UpgradePrompt';
import { parseLocalDate } from '../utils/formatters';

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

  const getFrequencyLabel = (freq) => {
    const labels = {
      daily: 'Daily', weekly: 'Weekly', biweekly: 'Bi-weekly',
      monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
    };
    return labels[freq] || freq;
  };

  if (plan && plan !== 'max') {
    return (
      <div className="page">
        <div className="container">
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Recurring Rules</h1>
          <UpgradePrompt feature="recurring transactions" requiredPlan="Max" />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Recurring Rules</h1>
          <button className="btn btn-primary" onClick={() => navigate('/recurring/new')}>
            <Plus size={18} /> New Rule
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="card" style={{ height: 72, opacity: 0.5 }} />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-secondary)' }}>
            <RefreshCw size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <p style={{ fontSize: 16 }}>No recurring rules yet.</p>
            <p style={{ fontSize: 14, marginTop: 4 }}>Create one to automate your transactions or invoices.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rules.map(rule => (
              <div key={rule.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      {rule.entity_type === 'invoice' ? 'Invoice' : 'Transaction'}
                    </span>
                    <span style={{
                      background: rule.status === 'active' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                      color: rule.status === 'active' ? 'var(--color-success)' : '#eab308',
                      padding: '2px 10px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                    }}>
                      {rule.status}
                    </span>
                    <span style={{
                      background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)',
                      padding: '2px 10px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                    }}>
                      {getFrequencyLabel(rule.frequency)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: 13 }}>
                    <Calendar size={14} />
                    <span>Next run: {rule.next_run_date ? parseLocalDate(rule.next_run_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => handleToggle(rule.id)}
                    title={rule.status === 'active' ? 'Pause' : 'Resume'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4 }}
                  >
                    {rule.status === 'active' ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
                  </button>
                  <button className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => navigate(`/recurring/${rule.id}/edit`)}>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4 }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
