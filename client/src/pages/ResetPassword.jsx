import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Auth.module.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success('Password reset successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <h1 className={styles.logo}>AddFi</h1>
          <p className={styles.subtitle}>Invalid reset link.</p>
          <Link to="/login" className="btn btn-primary btn-full">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <img src="/logo-512.png" alt="AddFi" className={styles.logoImg} />
        <h1 className={styles.logo}>AddFi</h1>

        {done ? (
          <>
            <p className={styles.subtitle} style={{ marginBottom: 16 }}>
              Your password has been reset. You can now sign in.
            </p>
            <Link to="/login" className="btn btn-primary btn-full">Sign In</Link>
          </>
        ) : (
          <>
            <p className={styles.subtitle}>Choose a new password</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>New Password</label>
                <div className={styles.passwordField}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars, upper + lower + number"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <button className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
