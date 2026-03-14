import { useState } from 'react';
import api from '../../api/client';
import { Sparkles } from 'lucide-react';
import styles from './UpgradePrompt.module.css';

export default function UpgradePrompt({ message }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState('monthly');

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await api.post('/billing/checkout', { plan });
      window.location.href = res.data.url;
    } catch {
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Sparkles size={32} className={styles.icon} />
      <h3 className={styles.title}>Upgrade to FlowFi Pro</h3>
      <p className={styles.message}>{message || 'Unlock unlimited features with FlowFi Pro.'}</p>

      <div className={styles.planToggle}>
        <button
          className={`${styles.planBtn} ${plan === 'monthly' ? styles.planBtnActive : ''}`}
          onClick={() => setPlan('monthly')}
        >
          <span className={styles.planName}>Monthly</span>
          <span className={styles.planPrice}>$7.99/mo</span>
        </button>
        <button
          className={`${styles.planBtn} ${plan === 'yearly' ? styles.planBtnActive : ''}`}
          onClick={() => setPlan('yearly')}
        >
          <span className={styles.planName}>Yearly</span>
          <span className={styles.planPrice}>$5.99/mo</span>
          <span className={styles.planBilled}>billed yearly</span>
          <span className={styles.planSave}>Save 25%</span>
        </button>
      </div>

      <ul className={styles.features}>
        <li>Unlimited transactions &amp; receipt scans</li>
        <li>PDF & CSV export</li>
        <li>Custom categories</li>
        <li>Invoicing</li>
        <li>Advanced reports</li>
      </ul>
      <button className="btn btn-primary btn-full" onClick={handleUpgrade} disabled={loading}>
        {loading ? 'Loading...' : `Get FlowFi Pro${plan === 'yearly' ? ' Yearly' : ''}`}
      </button>
    </div>
  );
}
