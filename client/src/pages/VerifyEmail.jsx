import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import { CheckCircle, XCircle } from 'lucide-react';
import styles from './Auth.module.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.card} style={{ textAlign: 'center' }}>
        <img src="/logo-512.png" alt="AddFi" className={styles.logoImg} />
        <h1 className={styles.logo}>AddFi</h1>

        {status === 'verifying' && (
          <p className={styles.subtitle}>Verifying your email...</p>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} style={{ color: 'var(--color-success)', margin: '16px auto' }} />
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>Email Verified!</h2>
            <p className={styles.subtitle}>Your email has been verified. You can now use all features.</p>
            <Link to="/dashboard" className="btn btn-primary btn-full" style={{ marginTop: 16 }}>
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} style={{ color: 'var(--color-danger)', margin: '16px auto' }} />
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>Verification Failed</h2>
            <p className={styles.subtitle}>This link may be expired or invalid.</p>
            <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: 16 }}>
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
