import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { useAuth } from '../hooks/useAuth';
import UpgradePrompt from '../components/ui/UpgradePrompt';
import Skeleton from '../components/ui/Skeleton';
import { Search, Plus, Users } from 'lucide-react';
import styles from './Clients.module.css';

export default function Clients() {
  const { user } = useAuth();
  const { clients, loading, fetch } = useClients();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.plan === 'max') {
      fetch(search ? { q: search } : {});
    }
  }, [user, search, fetch]);

  if (user?.plan !== 'max') {
    return (
      <div className="page">
        <div className="container">
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Clients</h1>
          <UpgradePrompt message="Manage your clients, track revenue per client, and auto-populate invoices. Available on AddFi Max." />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className={styles.header}>
          <h1>Clients</h1>
          <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>
            <Plus size={18} /> New
          </button>
        </div>

        <div className={styles.search}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ marginTop: 8 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={72} style={{ borderRadius: 10, marginBottom: 8 }} />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <Users size={48} strokeWidth={1} />
            <p style={{ marginTop: 12 }}>No clients yet</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/clients/new')}>
              Add your first client
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {clients.map((c) => (
              <div key={c.id} className={styles.item} onClick={() => navigate(`/clients/${c.id}`)}>
                <div className={styles.avatar}>{c.name.charAt(0).toUpperCase()}</div>
                <div className={styles.info}>
                  <span className={styles.name}>{c.name}</span>
                  <span className={styles.meta}>
                    {c.company ? `${c.company} · ` : ''}
                    {c.invoice_count} invoice{c.invoice_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className={styles.revenue}>
                  ${parseFloat(c.total_revenue || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
