import { useBusinesses } from '../../hooks/useBusinesses';
import { Building2 } from 'lucide-react';

export default function BusinessSwitcher() {
  const { businesses, currentBusinessId, switchBusiness } = useBusinesses();

  if (businesses.length <= 1) return null;

  return (
    <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Building2 size={16} style={{ color: 'var(--color-text-secondary)' }} />
        <select
          value={currentBusinessId || ''}
          onChange={(e) => switchBusiness(parseInt(e.target.value))}
          style={{
            flex: 1,
            padding: '6px 8px',
            fontSize: 13,
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
          }}
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
