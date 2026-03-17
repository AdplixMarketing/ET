import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useReports } from '../../hooks/useReports';

export default function PeriodComparison() {
  const { data, loading, fetchReport } = useReports();

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const formatDate = (d) => d.toISOString().split('T')[0];

  const [period1Start, setPeriod1Start] = useState(formatDate(sixtyDaysAgo));
  const [period1End, setPeriod1End] = useState(formatDate(thirtyDaysAgo));
  const [period2Start, setPeriod2Start] = useState(formatDate(thirtyDaysAgo));
  const [period2End, setPeriod2End] = useState(formatDate(today));

  useEffect(() => {
    fetchReport('/reports/period-comparison', {
      period1_start: period1Start,
      period1_end: period1End,
      period2_start: period2Start,
      period2_end: period2End,
    });
  }, [fetchReport, period1Start, period1End, period2Start, period2End]);

  const fmt = (n) => {
    if (n == null) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  };

  const renderChange = (pct) => {
    if (pct == null) return null;
    const isPositive = pct > 0;
    const isZero = pct === 0;
    const color = isZero ? 'var(--color-text-secondary)' : isPositive ? 'var(--color-success)' : 'var(--color-danger)';
    const Icon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color, fontSize: 13, fontWeight: 600 }}>
        <Icon size={14} />
        {Math.abs(pct).toFixed(1)}%
      </div>
    );
  };

  const period1 = data?.period1 || {};
  const period2 = data?.period2 || {};
  const changes = data?.changes || {};

  const cards = [
    { label: 'Income', key: 'income', color: 'var(--color-success)' },
    { label: 'Expenses', key: 'expenses', color: 'var(--color-danger)' },
    { label: 'Net', key: 'net', color: 'var(--color-primary)' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Period Comparison</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Period 1</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={period1Start} onChange={e => setPeriod1Start(e.target.value)} style={{ flex: 1, padding: '8px 4px' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>to</span>
            <input type="date" value={period1End} onChange={e => setPeriod1End(e.target.value)} style={{ flex: 1, padding: '8px 4px' }} />
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Period 2</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={period2Start} onChange={e => setPeriod2Start(e.target.value)} style={{ flex: 1, padding: '8px 4px' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>to</span>
            <input type="date" value={period2End} onChange={e => setPeriod2End(e.target.value)} style={{ flex: 1, padding: '8px 4px' }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ height: 140, opacity: 0.5 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {cards.map(card => (
            <div key={card.key} className="card">
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12, fontWeight: 600 }}>{card.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>Period 1</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: card.color }}>{fmt(period1[card.key])}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>Period 2</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: card.color }}>{fmt(period2[card.key])}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
                {renderChange(changes[card.key])}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
