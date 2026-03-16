import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useReports } from '../../hooks/useReports';

const inputStyle = {
  padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--border-color, #d1d5db)', fontSize: 14,
};

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
    const color = isZero ? '#6b7280' : isPositive ? '#16a34a' : '#ef4444';
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
    { label: 'Income', key: 'income', color: '#16a34a' },
    { label: 'Expenses', key: 'expenses', color: '#ef4444' },
    { label: 'Net', key: 'net', color: '#6366f1' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Period Comparison</h2>

      {/* Date Range Pickers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ padding: 16, background: 'var(--card-bg, #f9fafb)', borderRadius: 10, border: '1px solid var(--border-color, #e5e7eb)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#6b7280' }}>Period 1</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={period1Start} onChange={e => setPeriod1Start(e.target.value)} style={inputStyle} />
            <span style={{ color: '#6b7280' }}>to</span>
            <input type="date" value={period1End} onChange={e => setPeriod1End(e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ padding: 16, background: 'var(--card-bg, #f9fafb)', borderRadius: 10, border: '1px solid var(--border-color, #e5e7eb)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#6b7280' }}>Period 2</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={period2Start} onChange={e => setPeriod2Start(e.target.value)} style={inputStyle} />
            <span style={{ color: '#6b7280' }}>to</span>
            <input type="date" value={period2End} onChange={e => setPeriod2End(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Comparison Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 140, background: 'var(--card-bg, #f3f4f6)', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {cards.map(card => (
            <div
              key={card.key}
              style={{
                padding: 20, background: 'var(--card-bg, #fff)', borderRadius: 10,
                border: '1px solid var(--border-color, #e5e7eb)',
              }}
            >
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, fontWeight: 600 }}>{card.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Period 1</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: card.color }}>{fmt(period1[card.key])}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Period 2</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: card.color }}>{fmt(period2[card.key])}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
                {renderChange(changes[card.key])}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
