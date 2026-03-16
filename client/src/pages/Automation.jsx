import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutomation } from '../hooks/useAutomation';
import { Plus, Zap, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function Automation() {
  const { rules, loading, fetch, updateRule, deleteRule } = useAutomation();
  const navigate = useNavigate();

  useEffect(() => { fetch(); }, [fetch]);

  const handleToggle = async (rule) => {
    try {
      await updateRule(rule.id, { is_active: !rule.is_active });
      toast.success(rule.is_active ? 'Rule paused' : 'Rule activated');
      fetch();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await deleteRule(id);
      toast.success('Rule deleted');
      fetch();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Automation</h1>
          <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 14 }} onClick={() => navigate('/automation/new')}>
            <Plus size={16} /> New Rule
          </button>
        </div>

        {loading ? (
          <div>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={72} style={{ borderRadius: 12, marginBottom: 8 }} />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Zap size={48} style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No automation rules yet</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20 }}>
              Auto-categorize transactions based on vendor names, descriptions, and more.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/automation/new')}>
              <Plus size={16} /> Create First Rule
            </button>
          </div>
        ) : (
          <div>
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="card"
                style={{ marginBottom: 8, padding: 16, cursor: 'pointer', opacity: rule.is_active ? 1 : 0.6 }}
                onClick={() => navigate(`/automation/${rule.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{rule.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      When <strong>{rule.match_field.replace(/_/g, ' ')}</strong>{' '}
                      {rule.match_type === 'exact' ? 'equals' : rule.match_type === 'starts_with' ? 'starts with' : 'contains'}{' '}
                      "<strong>{rule.match_value}</strong>"
                      {rule.category_name && (
                        <span>
                          {' '}&rarr; <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: rule.category_color || '#868E96', marginRight: 4 }} />
                          {rule.category_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: rule.is_active ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
                      onClick={() => handleToggle(rule)}
                    >
                      {rule.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-danger)' }}
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
