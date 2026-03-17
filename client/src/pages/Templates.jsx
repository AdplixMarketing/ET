import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import toast from 'react-hot-toast';
import UpgradePrompt from '../components/ui/UpgradePrompt';
import { Plus, Palette, Edit3, Trash2, Layout } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';

export default function Templates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMax = user?.plan === 'max';

  useEffect(() => {
    if (!isMax) {
      setLoading(false);
      return;
    }
    api
      .get('/templates')
      .then((res) => setTemplates(res.data))
      .catch(() => toast.error('Failed to load templates'))
      .finally(() => setLoading(false));
  }, [isMax]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete template "${name}"?`)) return;
    try {
      await api.delete(`/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success('Template deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (!isMax) {
    return (
      <div className="page">
        <div className="container">
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Invoice Templates</h1>
          <UpgradePrompt message="Customize your invoice look with branded templates, custom colors, and layouts. Available on the Max plan." />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Templates</h1>
          <button className="btn btn-primary" onClick={() => navigate('/templates/new')}>
            <Plus size={18} /> New
          </button>
        </div>

        {loading ? (
          <div>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={80} style={{ borderRadius: 10, marginBottom: 8 }} />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="empty-state">
            <Palette size={48} strokeWidth={1} />
            <p style={{ marginTop: 12 }}>No templates yet</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => navigate('/templates/new')}
            >
              Create your first template
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templates.map((template) => (
              <div
                key={template.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/templates/${template.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                  {/* Color Preview */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: `linear-gradient(135deg, ${template.primary_color || '#4A90E2'}, ${template.secondary_color || '#7B61FF'})`,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {template.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Layout size={11} />
                      {template.layout || 'standard'}
                      {template.hide_branding && (
                        <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--color-surface)', padding: '1px 6px', borderRadius: 4 }}>
                          No branding
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '6px 10px', minWidth: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/templates/${template.id}`);
                    }}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 10px', minWidth: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template.id, template.name);
                    }}
                  >
                    <Trash2 size={14} />
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
