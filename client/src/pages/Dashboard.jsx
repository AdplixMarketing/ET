import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../hooks/useAuth';
import SummaryCards from '../components/dashboard/SummaryCards';
import MonthlyChart from '../components/dashboard/MonthlyChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import Skeleton from '../components/ui/Skeleton';
import { Plus, Camera, RefreshCw, AlertTriangle } from 'lucide-react';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { summary, chartData, recent, loading, error, fetch } = useDashboard();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <Skeleton height={32} width="60%" style={{ marginBottom: 8 }} />
          <Skeleton height={16} width="30%" style={{ marginBottom: 24 }} />
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Skeleton height={80} style={{ flex: 1, borderRadius: 12 }} />
            <Skeleton height={80} style={{ flex: 1, borderRadius: 12 }} />
            <Skeleton height={80} style={{ flex: 1, borderRadius: 12 }} />
          </div>
          <Skeleton height={200} style={{ borderRadius: 12, marginBottom: 16 }} />
          <Skeleton height={16} width="40%" style={{ marginBottom: 12 }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={52} style={{ borderRadius: 8, marginBottom: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container">
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <AlertTriangle size={40} style={{ color: 'var(--color-danger)', marginBottom: 12 }} />
            <p style={{ fontSize: 15, marginBottom: 16 }}>{error}</p>
            <button className="btn btn-primary" onClick={() => fetch()}>
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>
              {user?.business_name || 'Dashboard'}
            </h1>
            <p className={styles.date}>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <SummaryCards summary={summary} />

        {chartData.length > 0 && (
          <div className="card" style={{ marginTop: 16, padding: '16px 8px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, paddingLeft: 8 }}>
              Monthly Overview
            </h3>
            <MonthlyChart data={chartData} />
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            Recent Transactions
          </h3>
          <RecentTransactions transactions={recent} />
        </div>

        <button
          className={styles.fabScan}
          onClick={() => navigate('/scan')}
        >
          <Camera size={20} />
        </button>
        <button
          className={styles.fab}
          onClick={() => navigate('/transactions/new')}
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}
