import styles from './UsageBar.module.css';

export default function UsageBar({ label, used, limit }) {
  if (limit === null || limit === undefined) {
    return (
      <div className={styles.usage}>
        <div className={styles.label}>
          <span>{label}</span>
          <span className={styles.count}>{used} used (unlimited)</span>
        </div>
        <div className={styles.barBg}>
          <div className={styles.barFill} style={{ width: '0%', background: 'var(--color-success)' }} />
        </div>
      </div>
    );
  }

  const pct = Math.min((used / limit) * 100, 100);
  const color = pct >= 90 ? 'var(--color-danger)' : pct >= 70 ? '#FF9500' : 'var(--color-primary)';

  return (
    <div className={styles.usage}>
      <div className={styles.label}>
        <span>{label}</span>
        <span className={styles.count}>{used} / {limit}</span>
      </div>
      <div className={styles.barBg}>
        <div className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
