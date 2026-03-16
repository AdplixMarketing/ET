import { useNavigate } from 'react-router-dom';
import { Sparkles, Crown } from 'lucide-react';
import styles from './UpgradeModal.module.css';

export default function UpgradeModal({ title, message, tier, onClose }) {
  const navigate = useNavigate();
  const isMax = tier === 'max';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {isMax ? (
          <Crown size={36} className={styles.icon} style={{ color: '#FF9500' }} />
        ) : (
          <Sparkles size={36} className={styles.icon} />
        )}
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.text}>{message}</p>
        <div className={styles.actions}>
          <button
            className="btn btn-primary btn-full"
            onClick={() => navigate('/settings')}
          >
            {isMax ? 'See AddFi Max Plans' : 'See AddFi Pro Plans'}
          </button>
          <button className={styles.dismiss} onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
