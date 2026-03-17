import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useReports } from '../../hooks/useReports';

const PERIODS = [
  { value: 3, label: '3M' },
  { value: 6, label: '6M' },
  { value: 12, label: '12M' },
];

const fmt = (n) => {
  if (n == null) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
};

const fmtFull = (n) => {
  if (n == null) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
};

export default function CashFlowReport() {
  const { data, loading, fetchReport } = useReports();
  const [period, setPeriod] = useState(6);

  useEffect(() => {
    fetchReport('/reports/cash-flow', { months: period });
  }, [fetchReport, period]);

  const totalInflow = (data || []).reduce((s, d) => s + d.inflow, 0);
  const totalOutflow = (data || []).reduce((s, d) => s + d.outflow, 0);
  const netCashFlow = totalInflow - totalOutflow;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Cash Flow</h2>
        <div style={{ display: 'flex', gap: 4, background: 'var(--color-surface)', borderRadius: 8, padding: 2 }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer',
                fontSize: 13, fontWeight: period === p.value ? 600 : 400,
                background: period === p.value ? 'var(--color-primary)' : 'transparent',
                color: period === p.value ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ height: 300, opacity: 0.5 }} />
      ) : data && data.length > 0 ? (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <TrendingUp size={18} style={{ color: 'var(--color-success)', marginBottom: 6 }} />
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Total Inflow</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-success)' }}>{fmt(totalInflow)}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <TrendingDown size={18} style={{ color: 'var(--color-danger)', marginBottom: 6 }} />
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Total Outflow</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-danger)' }}>{fmt(totalOutflow)}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <DollarSign size={18} style={{ color: 'var(--color-primary)', marginBottom: 6 }} />
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Net Cash Flow</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: netCashFlow >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{fmt(netCashFlow)}</div>
            </div>
          </div>

          {/* Chart */}
          <div className="card">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
                <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13 }}
                  formatter={(value) => fmtFull(value)}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="inflow" fill="#16a34a" radius={[6, 6, 0, 0]} name="Inflow" maxBarSize={60} />
                <Bar dataKey="outflow" fill="#ef4444" radius={[6, 6, 0, 0]} name="Outflow" maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Breakdown */}
          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Monthly Breakdown</h3>
            {data.map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < data.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{row.month}</span>
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>+{fmtFull(row.inflow)}</span>
                  <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>-{fmtFull(row.outflow)}</span>
                  <span style={{ fontWeight: 700, color: row.net >= 0 ? 'var(--color-success)' : 'var(--color-danger)', minWidth: 70, textAlign: 'right' }}>
                    {fmtFull(row.net)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-secondary)' }}>
          No data available for this period.
        </div>
      )}
    </div>
  );
}
