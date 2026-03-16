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
          <div style={{ height: 300, background: 'var(--card-bg, #f3f4f6)', borderRadius: 10, animation: 'pulse 1.5s infinite', marginBottom: 24 }} />
          <div style={{ height: 200, background: 'var(--card-bg, #f3f4f6)', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
        </>
      ) : chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e5e7eb)" />
              <XAxis dataKey="client_name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => fmt(value)} />
              <Bar dataKey="total_revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>

          <div style={{ marginTop: 24, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid var(--border-color, #e5e7eb)', fontWeight: 600 }}>Client</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid var(--border-color, #e5e7eb)', fontWeight: 600 }}>Total Revenue</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid var(--border-color, #e5e7eb)', fontWeight: 600 }}>Paid</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid var(--border-color, #e5e7eb)', fontWeight: 600 }}>Invoices</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color, #e5e7eb)', fontWeight: 500 }}>{row.client_name}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color, #e5e7eb)', textAlign: 'right' }}>{fmt(row.total_revenue)}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color, #e5e7eb)', textAlign: 'right', color: '#16a34a' }}>{fmt(row.paid_revenue)}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color, #e5e7eb)', textAlign: 'right' }}>{row.invoice_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
          No revenue data available.
        </div>
      )}
    </div>
  );
}
