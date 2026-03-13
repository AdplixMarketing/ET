import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCategories } from '../hooks/useCategories';
import api from '../api/client';
import toast from 'react-hot-toast';
import { LogOut, Plus, Trash2, Edit3, Sparkles, XCircle, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import UpgradeModal from '../components/ui/UpgradeModal';
import styles from './Settings.module.css';

export default function Settings() {
  const { user, logout, updateProfile } = useAuth();
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();
  const { theme, setTheme } = useTheme();

  const [email, setEmail] = useState(user?.email || '');
  const [businessName, setBusinessName] = useState(user?.business_name || '');
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState(null);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', type: 'expense', color: '#4A90E2' });
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    api.get('/billing/subscription')
      .then((res) => setSubscription(res.data))
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const data = { business_name: businessName };
      if (email !== user?.email) data.email = email;
      await updateProfile(data);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async (plan) => {
    try {
      const res = await api.post('/billing/checkout', { plan });
      window.location.href = res.data.url;
    } catch {
      toast.error('Failed to start checkout');
    }
  };

  const handleCancelSub = async () => {
    if (!confirm('Cancel your FlowFi Pro subscription? You\'ll keep access until the end of your billing period.')) return;
    try {
      await api.post('/billing/cancel');
      toast.success('Subscription will cancel at end of billing period');
      const res = await api.get('/billing/subscription');
      setSubscription(res.data);
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const handleSaveCategory = async () => {
    if (!catForm.name.trim()) {
      toast.error('Enter a category name');
      return;
    }
    try {
      if (editingCat) {
        await updateCategory(editingCat, { name: catForm.name, color: catForm.color });
        toast.success('Category updated');
      } else {
        await createCategory(catForm);
        toast.success('Category created');
      }
      setShowCatForm(false);
      setEditingCat(null);
      setCatForm({ name: '', type: 'expense', color: '#4A90E2' });
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.upgrade) {
        setShowUpgrade(true);
      } else {
        toast.error(err.response?.data?.error || 'Failed to save category');
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await deleteCategory(id);
      toast.success('Category deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const startEdit = (cat) => {
    setEditingCat(cat.id);
    setCatForm({ name: cat.name, type: cat.type, color: cat.color });
    setShowCatForm(true);
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Settings</h1>

        {/* Subscription */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className={styles.sectionTitle}>Subscription</h3>
          {user?.plan === 'pro' ? (
            <div>
              <div className={styles.planBadge}>
                <Sparkles size={16} /> FlowFi Pro
              </div>
              {subscription?.subscription && (
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>
                  {subscription.subscription.cancel_at_period_end
                    ? `Cancels on ${new Date(subscription.subscription.current_period_end).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.subscription.current_period_end).toLocaleDateString()}`
                  }
                </p>
              )}
              {!subscription?.subscription?.cancel_at_period_end && (
                <button
                  className="btn btn-outline"
                  style={{ marginTop: 12, fontSize: 13, padding: '8px 12px' }}
                  onClick={handleCancelSub}
                >
                  <XCircle size={14} /> Cancel Subscription
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className={styles.planBadgeFree}>
                FlowFi Free
              </div>
              <p style={{ fontSize: 14, marginBottom: 16, marginTop: 12, color: 'var(--color-text-secondary)' }}>
                Upgrade for unlimited features.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1, minWidth: 0, padding: '14px 0' }} onClick={() => handleUpgrade('monthly')}>
                  $6.99/mo
                </button>
                <button className="btn btn-success" style={{ flex: 1, minWidth: 0, padding: '14px 0', overflow: 'visible', flexDirection: 'column', gap: 2 }} onClick={() => handleUpgrade('yearly')}>
                  <span>$4.99/mo</span>
                  <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>billed yearly</span>
                </button>
              </div>
              <p style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--color-success)', marginTop: 6 }}>
                Save 29% with yearly
              </p>
            </div>
          )}
        </div>

        {/* Appearance */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className={styles.sectionTitle}>Appearance</h3>
          <div className={styles.themeOptions}>
            <button
              className={`${styles.themeBtn} ${theme === 'light' ? styles.themeBtnActive : ''}`}
              onClick={() => setTheme('light')}
            >
              <Sun size={20} />
              <span>Light</span>
            </button>
            <button
              className={`${styles.themeBtn} ${theme === 'dark' ? styles.themeBtnActive : ''}`}
              onClick={() => setTheme('dark')}
            >
              <Moon size={20} />
              <span>Dark</span>
            </button>
            <button
              className={`${styles.themeBtn} ${theme === 'system' ? styles.themeBtnActive : ''}`}
              onClick={() => {
                const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                setTheme(sys);
              }}
            >
              <Monitor size={20} />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* Profile */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className={styles.sectionTitle}>Profile</h3>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          <div className="form-group">
            <label>Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your business name"
            />
          </div>
          <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Categories */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className={styles.catHeader}>
            <h3 className={styles.sectionTitle}>Categories</h3>
            <button
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: 13 }}
              onClick={() => { setShowCatForm(true); setEditingCat(null); setCatForm({ name: '', type: 'expense', color: '#4A90E2' }); }}
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {showCatForm && (
            <div className={styles.catForm}>
              <input
                type="text"
                placeholder="Category name"
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                className={styles.catInput}
              />
              {!editingCat && (
                <select
                  value={catForm.type}
                  onChange={(e) => setCatForm({ ...catForm, type: e.target.value })}
                  className={styles.catSelect}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              )}
              <input
                type="color"
                value={catForm.color}
                onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                className={styles.colorPicker}
              />
              <button className="btn btn-primary" style={{ padding: '8px 12px', minWidth: 0 }} onClick={handleSaveCategory}>
                {editingCat ? 'Update' : 'Add'}
              </button>
              <button className="btn btn-outline" style={{ padding: '8px 10px', minWidth: 0 }} onClick={() => { setShowCatForm(false); setEditingCat(null); }}>
                Cancel
              </button>
            </div>
          )}

          <h4 className={styles.catTypeTitle}>Expense Categories</h4>
          {expenseCategories.map((c) => (
            <div key={c.id} className={styles.catItem}>
              <span className={styles.catDot} style={{ background: c.color }} />
              <span className={styles.catName}>{c.name}</span>
              <button className={styles.iconBtn} onClick={() => startEdit(c)}><Edit3 size={14} /></button>
              {!c.is_default && (
                <button className={styles.iconBtn} onClick={() => handleDeleteCategory(c.id)}><Trash2 size={14} /></button>
              )}
            </div>
          ))}

          <h4 className={styles.catTypeTitle}>Income Categories</h4>
          {incomeCategories.map((c) => (
            <div key={c.id} className={styles.catItem}>
              <span className={styles.catDot} style={{ background: c.color }} />
              <span className={styles.catName}>{c.name}</span>
              <button className={styles.iconBtn} onClick={() => startEdit(c)}><Edit3 size={14} /></button>
              {!c.is_default && (
                <button className={styles.iconBtn} onClick={() => handleDeleteCategory(c.id)}><Trash2 size={14} /></button>
              )}
            </div>
          ))}
        </div>

        {/* Logout */}
        <button className="btn btn-danger btn-full" onClick={logout}>
          <LogOut size={18} /> Sign Out
        </button>

        {showUpgrade && (
          <UpgradeModal
            title="Custom Categories"
            message="Custom categories are a Pro feature. Upgrade to organize your transactions your way."
            onClose={() => setShowUpgrade(false)}
          />
        )}
      </div>
    </div>
  );
}
