import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useReports } from '../../hooks/useReports';

const PERIODS = [
  { value: 3, label: '3 Months' },
  { value: 6, label: '6 Months' },
  { value: 12, label: '12 Months' },
];

const COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#16a34a', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function ExpenseTrends() {
  const { data, loading, fetchReport } = useReports();
  const [period, setPeriod] = useState(6);

  useEffect(() => {
    fetchReport('/reports/expense-trends', { months: period });
  }, [fetchReport, period]);

  const chartData = data?.months || [];
  const categories = data?.categories || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Expense Trends</h2>
        <div style={{ display: 'flex', gap: 4, background: 'var(--card-bg, #f3f4f6)', borderRadius: 8, padding: 2 }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer',
                fontSize: 13, fontWeight: period === p.value ? 600 : 400,
                background: period === p.value ? '#6366f1' : 'transparent',
                color: period === p.value ? '#fff' : '#6b7280',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ height: 350, background: 'var(--card-bg, #f3f4f6)', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e5e7eb)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {categories.map((cat, i) => (
              <Line
                key={cat}
                type="monotone"
                dataKey={cat}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                name={cat}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
          No expense data available for this period.
        </div>
      )}
    </div>
  );
}
