import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ArrowLeft, Edit3, Mail, Phone, MapPin, Building } from 'lucide-react';

const STATUS_COLORS = { draft: '#8E8E93', sent: '#4A90E2', paid: '#34C759', overdue: '#FF3B30' };

export default function ClientView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/clients/${id}`)
      .then((res) => setClient(res.data))
      .catch(() => toast.error('Failed to load client'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner" />;
  if (!client) return null;

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onClick={() => navigate('/clients')}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>{client.name}</h1>
          <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={() => navigate(`/clients/${id}/edit`)}>
            <Edit3 size={16} /> Edit
          </button>
        </div>

        {/* Contact info */}
        <div className="card" style={{ marginBottom: 16 }}>
          {client.company && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 8 }}>
              <Building size={16} style={{ color: 'var(--color-text-secondary)' }} /> {client.company}
            </div>
          )}
          {client.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 8 }}>
              <Mail size={16} style={{ color: 'var(--color-text-secondary)' }} /> {client.email}
            </div>
          )}
          {client.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 8 }}>
              <Phone size={16} style={{ color: 'var(--color-text-secondary)' }} /> {client.phone}
            </div>
          )}
          {client.address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 8 }}>
              <MapPin size={16} style={{ color: 'var(--color-text-secondary)' }} /> {client.address}
            </div>
          )}
        </div>

        {/* Revenue summary */}
        <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-success)' }}>
              ${parseFloat(client.stats?.total_revenue || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Total Revenue</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>
              {client.stats?.invoice_count || 0}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Invoices</div>
          </div>
        </div>

        {/* Invoices */}
        {client.invoices?.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Invoices</h3>
            {client.invoices.map((inv) => (
              <div
                key={inv.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                onClick={() => navigate(`/invoices/${inv.id}`)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.invoice_number}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Due {format(new Date(inv.due_date), 'MMM d, yyyy')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>${parseFloat(inv.total).toLocaleString()}</div>
                  <span style={{ fontSize: 12, color: STATUS_COLORS[inv.status] }}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {client.notes && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Notes</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{client.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
