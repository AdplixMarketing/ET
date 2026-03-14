import { useState } from 'react';
import styles from './CancelModal.module.css';

const reasons = [
  'Too expensive',
  'Not using it enough',
  'Missing features I need',
  'Switching to another tool',
  'Just testing it out',
  'Other',
];

export default function CancelModal({ onConfirm, onClose }) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const handleConfirm = async () => {
    setCancelling(true);
    await onConfirm({ reason, feedback });
    setCancelling(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {step === 1 && (
          <div className={styles.stepContent} key="step1">
            <h3 className={styles.title}>We're sorry to see you go</h3>
            <p className={styles.subtitle}>
              What's the main reason you're cancelling?
            </p>

            <div className={styles.reasons}>
              {reasons.map((r) => (
                <button
                  key={r}
                  className={`${styles.reasonBtn} ${reason === r ? styles.reasonBtnActive : ''}`}
                  onClick={() => setReason(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className={styles.feedbackGroup}>
              <label className={styles.feedbackLabel}>
                How can we make AddFi better?
              </label>
              <textarea
                className={styles.feedbackInput}
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Your feedback helps us improve..."
              />
            </div>

            <div className={styles.actions}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>
                Keep AddFi Pro
              </button>
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setStep(2)}
                disabled={!reason}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepContent} key="step2">
            <h3 className={styles.title}>Are you sure?</h3>
            <p className={styles.subtitle}>
              If you cancel, you'll lose access to these Pro features at the end of your billing period:
            </p>

            <ul className={styles.featureList}>
              <li>Unlimited transactions & receipt scans</li>
              <li>Invoicing</li>
              <li>PDF & CSV export</li>
              <li>Custom categories</li>
              <li>Advanced reports</li>
            </ul>

            <div className={styles.actions}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>
                Keep AddFi Pro
              </button>
              <button
                className="btn btn-outline"
                style={{ flex: 1, color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                onClick={handleConfirm}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Cancel subscription'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
