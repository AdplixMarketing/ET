import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useReports } from '../../hooks/useReports';

const PERIODS = [
  { value: 3, label: '3 Months' },
  { value: 6, label: '6 Months' },
  { value: 12, label: '12 Months' },
];

export default function CashFlowReport() {
  const { data, loading, fetchReport } = useReports();
  const [period, setPeriod] = useState(6);

  useEffect(() => {
    fetchReport('/reports/cash-flow', { months: period });
  }, [fetchReport, period]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Cash Flow</h2>
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
        <div style={{ height: 300, background: 'var(--card-bg, #f3f4f6)', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
      ) : data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e5e7eb)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="inflow" stroke="#16a34a" strokeWidth={2} name="Inflow" dot={{ r: 4 }} />
            <Line type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2} name="Outflow" dot={{ r: 4 }} />
            <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} name="Running Balance" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
          No data available for this period.
        </div>
      )}
    </div>
  );
}
