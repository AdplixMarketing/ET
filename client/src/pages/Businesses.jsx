import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Star, ChevronLeft, Trash2 } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function Businesses() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBusinesses = async () => {
    try {
      const res = await api.get('/businesses');
      setBusinesses(res.data);
    } catch {
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBusinesses(); }, []);

  const handleSetDefault = async (id) => {
    try {
      await api.post(`/businesses/${id}/default`);
      toast.success('Default business updated');
      fetchBusinesses();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this business? This cannot be undone.')) return;
    try {
      await api.delete(`/businesses/${id}`);
      toast.success('Business deleted');
      fetchBusinesses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete');
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-text)' }}>
            <ChevronLeft size={24} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>Businesses</h1>
          <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={() => navigate('/businesses/new')}>
            <Plus size={16} /> Add
          </button>
        </div>

        {loading ? (
          <div className="card" style={{ height: 200, opacity: 0.5 }} />
        ) : businesses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <Building2 size={40} strokeWidth={1} style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No businesses yet</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              Add your first business to get started with multi-business management.
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/businesses/new')}>
              <Plus size={16} /> Add Business
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {businesses.map((biz) => (
              <div key={biz.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: biz.is_default ? 'var(--color-primary)' : 'var(--color-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Building2 size={20} style={{ color: biz.is_default ? '#fff' : 'var(--color-text-secondary)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{biz.name}</div>
                  {biz.address && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{biz.address}</div>}
                  {biz.is_default && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-primary)', fontWeight: 600, marginTop: 4 }}>
                      <Star size={10} fill="currentColor" /> Default
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!biz.is_default && (
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: 12, minWidth: 0 }}
                      onClick={() => handleSetDefault(biz.id)}
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    className="btn btn-outline"
                    style={{ padding: '6px 10px', fontSize: 12, minWidth: 0 }}
                    onClick={() => navigate(`/businesses/${biz.id}/edit`)}
                  >
                    Edit
                  </button>
                  {!biz.is_default && (
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--color-danger)' }}
                      onClick={() => handleDelete(biz.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
