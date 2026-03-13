import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../hooks/useAuth';
import SummaryCards from '../components/dashboard/SummaryCards';
import MonthlyChart from '../components/dashboard/MonthlyChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import { Plus, Camera } from 'lucide-react';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { summary, chartData, recent, loading, fetch } = useDashboard();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div className="spinner" />;

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
