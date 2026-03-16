import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, FileText, Crown } from 'lucide-react';
import UpgradeModal from '../components/ui/UpgradeModal';
import Skeleton from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import styles from './Reports.module.css';

const CashFlowReport = lazy(() => import('../components/reports/CashFlowReport'));
const TaxSummary = lazy(() => import('../components/reports/TaxSummary'));
const ExpenseTrends = lazy(() => import('../components/reports/ExpenseTrends'));
const RevenueByClient = lazy(() => import('../components/reports/RevenueByClient'));
const PeriodComparison = lazy(() => import('../components/reports/PeriodComparison'));

const MAX_TABS = [
  { key: 'cashflow', label: 'Cash Flow' },
  { key: 'tax', label: 'Tax' },
  { key: 'trends', label: 'Trends' },
  { key: 'clients', label: 'By Client' },
  { key: 'compare', label: 'Compare' },
];

const PRESETS = [
  { label: 'This Month', getRange: () => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
    };
  }},
  { label: 'Last Month', getRange: () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) };
  }},
  { label: 'This Year', getRange: () => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
    };
  }},
];

export default function Reports() {
  const { user } = useAuth();
  const isMax = user?.plan === 'max';
  const [activeTab, setActiveTab] = useState('pnl');
  const [dateRange, setDateRange] = useState(PRESETS[0].getRange());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeType, setUpgradeType] = useState('export');

  useEffect(() => {
    setLoading(true);
    api.get('/reports/pnl', { params: dateRange })
      .then((res) => setData(res.data))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  }, [dateRange]);

  const handleExport = async (format) => {
    try {
      const url = `/reports/export/${format}?from=${dateRange.from}&to=${dateRange.to}`;
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `report.${format}`;
      link.click();
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (err) {
      if (err.response?.status === 403) {
        setUpgradeType('export');
        setShowUpgrade(true);
      } else {
        toast.error('Export failed');
      }
    }
  };

  const expenseChartData = data?.expenses.categories.map((c) => ({
    name: c.category || 'Uncategorized',
    total: parseFloat(c.total),
    color: c.color || '#868E96',
  })) || [];

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Reports</h1>

        {/* Report Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <button
            className={styles.preset}
            style={{ padding: '8px 14px', fontWeight: activeTab === 'pnl' ? 700 : 400, background: activeTab === 'pnl' ? 'var(--color-primary)' : undefined, color: activeTab === 'pnl' ? '#fff' : undefined }}
            onClick={() => setActiveTab('pnl')}
          >
            P&L
          </button>
          {isMax && MAX_TABS.map((t) => (
            <button
              key={t.key}
              className={styles.preset}
              style={{ padding: '8px 14px', whiteSpace: 'nowrap', fontWeight: activeTab === t.key ? 700 : 400, background: activeTab === t.key ? 'var(--color-primary)' : undefined, color: activeTab === t.key ? '#fff' : undefined }}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
          {!isMax && (
            <button
              className={styles.preset}
              style={{ padding: '8px 14px', whiteSpace: 'nowrap', color: '#FF9500', fontSize: 12 }}
              onClick={() => { setUpgradeType('max'); setShowUpgrade(true); }}
            >
              <Crown size={12} /> More with Max
            </button>
          )}
        </div>

        {/* Date Range Presets */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, maxWidth: '100%' }}>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className={styles.preset}
              style={{ flex: 1, minWidth: 0, padding: '10px 0' }}
              onClick={() => setDateRange(p.getRange())}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, maxWidth: '100%' }}>
          <div className={`form-group ${styles.dateField}`} style={{ flex: 1, minWidth: 0, marginBottom: 0 }}>
            <label>From</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              style={{ padding: '12px 0' }}
            />
          </div>
          <div className={`form-group ${styles.dateField}`} style={{ flex: 1, minWidth: 0, marginBottom: 0 }}>
            <label>To</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              style={{ padding: '12px 0' }}
            />
          </div>
        </div>

        {/* Max Report Tabs */}
        {activeTab !== 'pnl' && isMax && (
          <Suspense fallback={<Skeleton height={300} style={{ borderRadius: 12 }} />}>
            {activeTab === 'cashflow' && <CashFlowReport dateRange={dateRange} />}
            {activeTab === 'tax' && <TaxSummary dateRange={dateRange} />}
            {activeTab === 'trends' && <ExpenseTrends dateRange={dateRange} />}
            {activeTab === 'clients' && <RevenueByClient dateRange={dateRange} />}
            {activeTab === 'compare' && <PeriodComparison dateRange={dateRange} />}
          </Suspense>
        )}

        {/* P&L Report */}
        {activeTab === 'pnl' && loading ? (
          <div>
            <Skeleton height={120} style={{ borderRadius: 12, marginBottom: 16 }} />
            <Skeleton height={160} style={{ borderRadius: 12, marginBottom: 16 }} />
            <Skeleton height={160} style={{ borderRadius: 12 }} />
          </div>
        ) : activeTab === 'pnl' && data ? (
          <>
            {/* P&L Summary */}
            <div className={styles.pnlCard}>
              <div className={styles.pnlRow}>
                <span>Total Income</span>
                <span className={styles.incomeVal}>${data.income.total.toLocaleString()}</span>
              </div>
              <div className={styles.pnlRow}>
                <span>Total Expenses</span>
                <span className={styles.expenseVal}>${data.expenses.total.toLocaleString()}</span>
              </div>
              <div className={styles.divider} />
              <div className={styles.pnlRow}>
                <span style={{ fontWeight: 700, fontSize: 18 }}>Net Profit</span>
                <span style={{
                  fontWeight: 700,
                  fontSize: 22,
                  color: data.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                }}>
                  ${data.netProfit.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Income Breakdown */}
            {data.income.categories.length > 0 && (
              <div className="card" style={{ marginTop: 16 }}>
                <h3 className={styles.sectionTitle}>Income Breakdown</h3>
                {data.income.categories.map((c) => (
                  <div key={c.category} className={styles.breakdownRow}>
                    <span className={styles.catDot} style={{ background: c.color || '#34C759' }} />
                    <span className={styles.catName}>{c.category || 'Uncategorized'}</span>
                    <span className={styles.catCount}>{c.count}x</span>
                    <span className={styles.catTotal}>${parseFloat(c.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Expense Breakdown */}
            {data.expenses.categories.length > 0 && (
              <div className="card" style={{ marginTop: 16 }}>
                <h3 className={styles.sectionTitle}>Expense Breakdown</h3>
                {data.expenses.categories.map((c) => (
                  <div key={c.category} className={styles.breakdownRow}>
                    <span className={styles.catDot} style={{ background: c.color || '#FF3B30' }} />
                    <span className={styles.catName}>{c.category || 'Uncategorized'}</span>
                    <span className={styles.catCount}>{c.count}x</span>
                    <span className={styles.catTotal}>${parseFloat(c.total).toLocaleString()}</span>
                  </div>
                ))}

                {/* Chart */}
                <div style={{ marginTop: 20 }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={expenseChartData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                        {expenseChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Export */}
            <div className={styles.exportRow}>
              <button className="btn btn-outline" onClick={() => handleExport('csv')}>
                <Download size={16} /> CSV
              </button>
              <button className="btn btn-outline" onClick={() => handleExport('pdf')}>
                <FileText size={16} /> PDF
              </button>
            </div>
          </>
        ) : null}

        {showUpgrade && (
          <UpgradeModal
            title={upgradeType === 'max' ? 'Advanced Reports' : 'Export with Pro'}
            message={upgradeType === 'max'
              ? 'Upgrade to AddFi Max to unlock Cash Flow tracking, Tax Summaries, Expense Trends, Revenue by Client, and Period Comparisons — everything you need to understand your business at a deeper level.'
              : 'Exporting reports as CSV and PDF is a Pro feature. Upgrade to download your data anytime.'}
            tier={upgradeType === 'max' ? 'max' : 'pro'}
            onClose={() => setShowUpgrade(false)}
          />
        )}
      </div>
    </div>
  );
}
