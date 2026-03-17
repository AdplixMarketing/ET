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
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14, background: 'var(--color-surface)', color: 'var(--color-text)' }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card" style={{ height: 140, opacity: 0.5 }} />
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {QUARTERS.map((q, i) => {
              const qData = quarters[i] || {};
              return (
                <div key={q} className="card">
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--color-primary)' }}>{q}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Income</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{fmt(qData.income)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Expenses</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{fmt(qData.expenses)}</span>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Net</span>
                      <span style={{ fontWeight: 700, color: (qData.net || 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {fmt(qData.net)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card" style={{ border: '2px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <DollarSign size={18} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: 16, fontWeight: 700 }}>Annual Totals ({year})</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Total Income</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-success)' }}>{fmt(annual.income)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Total Expenses</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-danger)' }}>{fmt(annual.expenses)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Net Profit/Loss</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: (annual.net || 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
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
