import { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useReports } from '../../hooks/useReports';

export default function RevenueByClient() {
  const { data, loading, fetchReport } = useReports();

  useEffect(() => {
    fetchReport('/reports/revenue-by-client');
  }, [fetchReport]);

  const chartData = data?.chart || [];
  const tableData = data?.table || [];

  const fmt = (n) => {
    if (n == null) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Revenue by Client</h2>

      {loading ? (
        <>
          <div className="card" style={{ height: 300, opacity: 0.5, marginBottom: 24 }} />
          <div className="card" style={{ height: 200, opacity: 0.5 }} />
        </>
      ) : chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="client_name" tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} formatter={(value) => fmt(value)} />
              <Bar dataKey="total_revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>

          <div className="card" style={{ marginTop: 24, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid var(--color-border)', fontWeight: 600 }}>Client</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid var(--color-border)', fontWeight: 600 }}>Total Revenue</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid var(--color-border)', fontWeight: 600 }}>Paid</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid var(--color-border)', fontWeight: 600 }}>Invoices</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', fontWeight: 500 }}>{row.client_name}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>{fmt(row.total_revenue)}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', textAlign: 'right', color: 'var(--color-success)' }}>{fmt(row.paid_revenue)}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>{row.invoice_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-secondary)' }}>
          No revenue data available.
        </div>
      )}
    </div>
  );
}
