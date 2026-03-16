import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { useReports } from '../../hooks/useReports';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export default function TaxSummary() {
  const { data, loading, fetchReport } = useReports();
  const [year, setYear] = useState(new Date().getFullYear());

  const years = [];
  for (let y = new Date().getFullYear(); y >= new Date().getFullYear() - 4; y--) {
    years.push(y);
  }

  useEffect(() => {
    fetchReport('/reports/tax-summary', { year });
  }, [fetchReport, year]);

  const fmt = (n) => {
    if (n == null) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  };

  const quarters = data?.quarters || [];
  const annual = data?.annual || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Tax Summary</h2>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          style={{
            padding: '8px 12px', borderRadius: 8,
            border: '1px solid var(--border-color, #d1d5db)', fontSize: 14,
          }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 140, background: 'var(--card-bg, #f3f4f6)', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {QUARTERS.map((q, i) => {
              const qData = quarters[i] || {};
              return (
                <div
                  key={q}
                  style={{
                    padding: 20, background: 'var(--card-bg, #fff)', borderRadius: 10,
                    border: '1px solid var(--border-color, #e5e7eb)',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#6366f1' }}>{q}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#6b7280' }}>Income</span>
                      <span style={{ fontWeight: 600, color: '#16a34a' }}>{fmt(qData.income)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#6b7280' }}>Expenses</span>
                      <span style={{ fontWeight: 600, color: '#ef4444' }}>{fmt(qData.expenses)}</span>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color, #e5e7eb)', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#6b7280' }}>Net</span>
                      <span style={{ fontWeight: 700, color: (qData.net || 0) >= 0 ? '#16a34a' : '#ef4444' }}>
                        {fmt(qData.net)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Annual Totals */}
          <div style={{
            padding: 20, background: 'var(--card-bg, #fff)', borderRadius: 10,
            border: '2px solid #6366f1',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <DollarSign size={18} style={{ color: '#6366f1' }} />
              <span style={{ fontSize: 16, fontWeight: 700 }}>Annual Totals ({year})</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Total Income</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{fmt(annual.income)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Total Expenses</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{fmt(annual.expenses)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Net Profit/Loss</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: (annual.net || 0) >= 0 ? '#16a34a' : '#ef4444' }}>
                  {fmt(annual.net)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
