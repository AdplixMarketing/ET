import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { parseLocalDate } from '../../utils/formatters';
import styles from './RecentTransactions.module.css';

export default function RecentTransactions({ transactions }) {
  const navigate = useNavigate();

  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <p>No transactions yet</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>Tap + to add your first one</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className={styles.item}
          onClick={() => navigate(`/transactions/${tx.id}`)}
        >
          <div
            className={styles.dot}
            style={{ background: tx.category_color || '#868E96' }}
          />
          <div className={styles.info}>
            <span className={styles.name}>
              {tx.vendor_or_client || tx.description || tx.category_name || 'Transaction'}
            </span>
            <span className={styles.meta}>
              {tx.category_name} &middot; {format(parseLocalDate(tx.date), 'MMM d')}
            </span>
          </div>
          <span className={`${styles.amount} ${tx.type === 'income' ? styles.income : styles.expense}`}>
            {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
