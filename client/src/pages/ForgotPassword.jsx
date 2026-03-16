import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <img src="/logo-512.png" alt="AddFi" className={styles.logoImg} />
        <h1 className={styles.logo}>AddFi</h1>

        {sent ? (
          <>
            <p className={styles.subtitle} style={{ marginBottom: 16 }}>
              If an account exists with that email, we've sent a password reset link.
            </p>
            <p className={styles.link}>
              <Link to="/login">Back to Login</Link>
            </p>
          </>
        ) : (
          <>
            <p className={styles.subtitle}>Enter your email to reset your password</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  required
                />
              </div>
              <button className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <p className={styles.link}>
              Remember your password? <Link to="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
