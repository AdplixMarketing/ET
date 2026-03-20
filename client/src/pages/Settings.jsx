import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCategories } from '../hooks/useCategories';
import { useUsage } from '../hooks/useUsage';
import api from '../api/client';
import toast from 'react-hot-toast';
import { LogOut, Plus, Trash2, Edit3, Sparkles, Sun, Moon, Monitor, Download, Crown, Mail } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import UpgradeModal from '../components/ui/UpgradeModal';
import CancelModal from '../components/ui/CancelModal';
import UsageBar from '../components/ui/UsageBar';
import { formatPhone } from '../utils/formatters';
import styles from './Settings.module.css';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();
  const { theme, setTheme } = useTheme();

  const [email, setEmail] = useState(user?.email || '');
  const [businessName, setBusinessName] = useState(user?.business_name || '');
  const [businessAddress, setBusinessAddress] = useState(user?.business_address || '');
  const [businessPhone, setBusinessPhone] = useState(user?.business_phone || '');
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState(null);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', type: 'expense', color: '#4A90E2' });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const { usage, fetch: fetchUsage } = useUsage();

  useEffect(() => {
    api.get('/billing/subscription')
      .then((res) => setSubscription(res.data))
      .catch(() => {});
    fetchUsage();
  }, [fetchUsage]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const data = { business_name: businessName, business_address: businessAddress, business_phone: businessPhone };
      if (email !== user?.email) data.email = email;
      await updateProfile(data);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async (tier, plan) => {
    try {
      const res = await api.post('/billing/checkout', { tier, plan });
      window.location.href = res.data.url;
    } catch {
      toast.error('Failed to start checkout');
    }
  };

  const handleCancelSub = async ({ reason, feedback }) => {
    try {
      await api.post('/billing/cancel');
      console.log('Cancel reason:', reason, '| Feedback:', feedback);
      toast.success('Subscription will cancel at end of billing period');
      setShowCancel(false);
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
          {user?.plan === 'max' ? (
            <div>
              <div className={styles.planBadge} style={{ background: 'linear-gradient(135deg, #FF9500, #FF6B6B)', color: '#fff', border: 'none' }}>
                <Crown size={16} /> AddFi Max
              </div>
              {subscription?.subscription?.current_period_end && (
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>
                  {subscription.subscription.cancel_at_period_end
                    ? `Cancels on ${new Date(subscription.subscription.current_period_end).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.subscription.current_period_end).toLocaleDateString()}`
                  }
                </p>
              )}
            </div>
          ) : user?.plan === 'pro' ? (
            <div>
              <div className={styles.planBadge}>
                <Sparkles size={16} /> AddFi Pro
              </div>
              {subscription?.subscription?.current_period_end && (
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>
                  {subscription.subscription.cancel_at_period_end
                    ? `Cancels on ${new Date(subscription.subscription.current_period_end).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.subscription.current_period_end).toLocaleDateString()}`
                  }
                </p>
              )}
              {usage && (
                <div style={{ marginTop: 16 }}>
                  <UsageBar label="Transactions" used={usage.transactions.used} limit={usage.transactions.limit} />
                  <UsageBar label="Receipt Scans" used={usage.scans.used} limit={usage.scans.limit} />
                </div>
              )}
              <div style={{ marginTop: 16, padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Need more? Upgrade to Max</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Unlimited everything, client database, custom invoices, payment portal & more.</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1, minWidth: 0, padding: '10px 0', fontSize: 13 }} onClick={() => handleUpgrade('max', 'monthly')}>
                    $79/mo
                  </button>
                  <button className="btn btn-success" style={{ flex: 1, minWidth: 0, padding: '10px 0', fontSize: 13 }} onClick={() => handleUpgrade('max', 'yearly')}>
                    $59/mo yearly
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className={styles.planBadgeFree}>
                AddFi Free
              </div>
              {usage && (
                <div style={{ marginTop: 12, marginBottom: 16 }}>
                  <UsageBar label="Transactions" used={usage.transactions.used} limit={usage.transactions.limit} />
                  <UsageBar label="Receipt Scans" used={usage.scans.used} limit={usage.scans.limit} />
                </div>
              )}
              <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--color-text-secondary)' }}>
                Upgrade for more features.
              </p>
              {/* Pro tier */}
              <div style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}><Sparkles size={14} /> AddFi Pro</div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '6px 0 12px' }}>200 txns/mo, 80 scans/mo, invoicing, reports export</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1, minWidth: 0, padding: '10px 0', fontSize: 13 }} onClick={() => handleUpgrade('pro', 'monthly')}>
                    $7.99/mo
                  </button>
                  <button className="btn btn-success" style={{ flex: 1, minWidth: 0, padding: '10px 0', fontSize: 13 }} onClick={() => handleUpgrade('pro', 'yearly')}>
                    $5.99/mo yearly
                  </button>
                </div>
              </div>
              {/* Max tier */}
              <div style={{ padding: 12, border: '2px solid #FF9500', borderRadius: 8, background: 'rgba(255, 149, 0, 0.04)' }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}><Crown size={14} /> AddFi Max</div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '6px 0 12px' }}>Unlimited everything, clients, custom invoices, payment portal, imports, advanced reports</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1, minWidth: 0, padding: '10px 0', fontSize: 13 }} onClick={() => handleUpgrade('max', 'monthly')}>
                    $79/mo
                  </button>
                  <button className="btn btn-success" style={{ flex: 1, minWidth: 0, padding: '10px 0', fontSize: 13 }} onClick={() => handleUpgrade('max', 'yearly')}>
                    $59/mo yearly
                  </button>
                </div>
              </div>
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
          <div className="form-group">
            <label>Business Address</label>
            <textarea
              rows={2}
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="123 Main St, City, State ZIP"
            />
          </div>
          <div className="form-group">
            <label>Business Phone</label>
            <input
              type="tel"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(formatPhone(e.target.value))}
              placeholder="(555) 123-4567"
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

        {/* Multi-Business (Max only) */}
        {user?.plan === 'max' && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 className={styles.sectionTitle}>Businesses</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Manage multiple businesses from one account. Each business has its own transactions, invoices, and clients.
            </p>
            <button className="btn btn-outline" onClick={() => navigate('/businesses')}>
              Manage Businesses
            </button>
          </div>
        )}

        {/* Stripe Connect (Max only) */}
        {user?.plan === 'max' && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 className={styles.sectionTitle}>Payment Processing</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Accept payments on invoices through your client portal. 3.5% processing fee per payment.
            </p>
            {user?.stripe_connect_onboarded ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(52, 199, 89, 0.1)', borderRadius: 8 }}>
                <span style={{ color: '#34C759', fontWeight: 600, fontSize: 14 }}>Connected</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>You can accept payments on invoices</span>
              </div>
            ) : (
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    // Step 1: Create connect account if needed
                    await api.post('/connect/account');
                    // Step 2: Get onboarding link
                    const res = await api.post('/connect/onboarding-link');
                    if (res.data.url) {
                      window.location.href = res.data.url;
                    } else {
                      toast.error('No onboarding URL returned');
                    }
                  } catch (err) {
                    console.error('Connect error:', err.response?.data || err.message);
                    toast.error(err.response?.data?.error || 'Failed to start onboarding');
                  }
                }}
              >
                Connect with Stripe
              </button>
            )}
          </div>
        )}

        {/* Data Export */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className={styles.sectionTitle}>Your Data</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Download all your data as a JSON file.
          </p>
          <button
            className="btn btn-outline"
            onClick={async () => {
              try {
                const res = await api.get('/data/export', { responseType: 'blob' });
                const url = URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement('a');
                a.href = url;
                a.download = 'addfi-data-export.json';
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Data exported');
              } catch {
                toast.error('Export failed');
              }
            }}
          >
            <Download size={16} /> Export My Data
          </button>
        </div>

        {/* Support */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className={styles.sectionTitle}>Support</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Found a bug or need help? Reach out and we'll get back to you.
          </p>
          <a
            href="mailto:support@addfi.co?subject=Bug Report / Feedback"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            <Mail size={16} /> support@addfi.co
          </a>
        </div>

        {/* Logout */}
        <button className="btn btn-danger btn-full" onClick={logout}>
          <LogOut size={18} /> Sign Out
        </button>

        {/* Billing — buried at the bottom */}
        {(user?.plan === 'pro' || user?.plan === 'max') && (!subscription?.subscription || !subscription.subscription.cancel_at_period_end) && (
          <div style={{ textAlign: 'center', marginTop: 24, paddingBottom: 12 }}>
            <button className={styles.cancelLink} onClick={() => setShowCancel(true)}>
              Cancel subscription
            </button>
          </div>
        )}

        {showUpgrade && (
          <UpgradeModal
            title="Custom Categories"
            message="Custom categories are a Pro feature. Upgrade to organize your transactions your way."
            onClose={() => setShowUpgrade(false)}
          />
        )}

        {showCancel && (
          <CancelModal
            onConfirm={handleCancelSub}
            onClose={() => setShowCancel(false)}
          />
        )}
      </div>
    </div>
  );
}
