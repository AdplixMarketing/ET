import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Home, ArrowLeftRight, BarChart3, Settings,
  FileText, Users, LayoutTemplate, Repeat, Upload, Zap, Building2, X, CalendarCheck, Package,
} from 'lucide-react';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [menuOpen]);

  const isPro = user?.plan === 'pro';
  const isMax = user?.plan === 'max';
  const isPaid = isPro || isMax;

  const proMenuItems = [
    { to: '/invoices', icon: FileText, label: 'Invoices' },
    { to: '/products', icon: Package, label: 'Products' },
  ];

  const maxMenuItems = [
    { to: '/invoices', icon: FileText, label: 'Invoices' },
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/jobs', icon: CalendarCheck, label: 'Schedule' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/templates', icon: LayoutTemplate, label: 'Templates' },
    { to: '/recurring', icon: Repeat, label: 'Recurring' },
    { to: '/import', icon: Upload, label: 'Import' },
    { to: '/automation', icon: Zap, label: 'Automation' },
    { to: '/businesses', icon: Building2, label: 'Businesses' },
  ];

  const menuItems = isMax ? maxMenuItems : proMenuItems;
  const centerActive = isPaid && menuItems.some((item) => location.pathname.startsWith(item.to));

  return (
    <nav className={styles.nav}>
      <NavLink to="/" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
        <Home size={22} />
        <span>Home</span>
      </NavLink>

      <NavLink to="/transactions" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
        <ArrowLeftRight size={22} />
        <span>Transactions</span>
      </NavLink>

      {/* Center: drop-up menu for Pro/Max, direct Invoices link for free */}
      {isPaid ? (
        <div className={styles.centerWrap} ref={menuRef}>
          {menuOpen && (
            <div className={styles.dropUp}>
              {menuItems.map(({ to, icon: Icon, label }) => (
                <button
                  key={to}
                  className={`${styles.dropUpItem} ${location.pathname.startsWith(to) ? styles.dropUpActive : ''}`}
                  onClick={() => { navigate(to); setMenuOpen(false); }}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
          <button
            className={`${styles.center} ${centerActive ? styles.centerIsActive : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <img src="/logo-192.png" alt="Menu" className={styles.centerLogo} />}
          </button>
        </div>
      ) : (
        <NavLink to="/invoices" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
          <FileText size={22} />
          <span>Invoices</span>
        </NavLink>
      )}

      <NavLink to="/reports" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
        <BarChart3 size={22} />
        <span>Reports</span>
      </NavLink>

      <NavLink to="/settings" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
        <Settings size={22} />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}
