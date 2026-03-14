import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import styles from './UpgradeModal.module.css';

export default function UpgradeModal({ title, message, onClose }) {
  const navigate = useNavigate();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <Sparkles size={36} className={styles.icon} />
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.text}>{message}</p>
        <div className={styles.actions}>
          <button
            className="btn btn-primary btn-full"
            onClick={() => navigate('/settings')}
          >
            See AddFi Pro Plans
          </button>
          <button className={styles.dismiss} onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
