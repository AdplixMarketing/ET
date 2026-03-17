import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import toast from 'react-hot-toast';
import UpgradePrompt from '../components/ui/UpgradePrompt';
import { Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import Skeleton from '../components/ui/Skeleton';
import { parseLocalDate } from '../utils/formatters';
import styles from './Invoices.module.css';

const STATUS_COLORS = {
  draft: '#8E8E93',
  sent: '#4A90E2',
  paid: '#34C759',
  overdue: '#FF3B30',
};

export default function Invoices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (user?.plan !== 'pro' && user?.plan !== 'max') {
      setLoading(false);
      return;
    }
    const params = filter ? { status: filter } : {};
    api.get('/invoices', { params })
      .then((res) => setInvoices(res.data))
      .catch(() => toast.error('Failed to load invoices'))
      .finally(() => setLoading(false));
  }, [user, filter]);

  if (user?.plan !== 'pro' && user?.plan !== 'max') {
    return (
      <div className="page">
        <div className="container">
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Invoices</h1>
          <UpgradePrompt message="Create and send professional invoices to your clients. Paid invoices automatically become income." />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className={styles.header}>
          <h1>Invoices</h1>
          <button className="btn btn-primary" onClick={() => navigate('/invoices/new')}>
            <Plus size={18} /> New
          </button>
        </div>

        <div className={styles.filters}>
          {['', 'draft', 'sent', 'paid', 'overdue'].map((s) => (
            <button
              key={s}
              className={`${styles.chip} ${filter === s ? styles.chipActive : ''}`}
              onClick={() => { setFilter(s); setLoading(true); }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ marginTop: 8 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={72} style={{ borderRadius: 10, marginBottom: 8 }} />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} strokeWidth={1} />
            <p style={{ marginTop: 12 }}>No invoices yet</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => navigate('/invoices/new')}
            >
              Create your first invoice
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className={styles.item}
                onClick={() => navigate(`/invoices/${inv.id}`)}
              >
                <div className={styles.left}>
                  <span className={styles.number}>{inv.invoice_number}</span>
                  <span className={styles.client}>{inv.client_name}</span>
                  <span className={styles.date}>
                    Due {format(parseLocalDate(inv.due_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className={styles.right}>
                  <span className={styles.total}>${parseFloat(inv.total).toLocaleString()}</span>
                  <span
                    className={styles.status}
                    style={{ color: STATUS_COLORS[inv.status], background: `${STATUS_COLORS[inv.status]}15` }}
                  >
                    {inv.status}
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
