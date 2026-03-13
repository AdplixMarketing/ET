import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import styles from './SummaryCards.module.css';

function formatMoney(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function SummaryCards({ summary }) {
  const { income, expenses, profit } = summary;

  return (
    <div className={styles.grid}>
      <div className={`${styles.card} ${styles.income}`}>
        <div className={styles.icon}><TrendingUp size={20} /></div>
        <span className={styles.label}>Income</span>
        <span className={styles.value}>{formatMoney(income)}</span>
      </div>
      <div className={`${styles.card} ${styles.expense}`}>
        <div className={styles.icon}><TrendingDown size={20} /></div>
        <span className={styles.label}>Expenses</span>
        <span className={styles.value}>{formatMoney(expenses)}</span>
      </div>
      <div className={`${styles.card} ${styles.profit}`}>
        <div className={styles.icon}><DollarSign size={20} /></div>
        <span className={styles.label}>Net Profit</span>
        <span className={styles.value}>{formatMoney(profit)}</span>
      </div>
    </div>
  );
}
