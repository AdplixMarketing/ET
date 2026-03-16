import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Home, ArrowLeftRight, FileText, BarChart3, Settings, Users } from 'lucide-react';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const { user } = useAuth();

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
    ...(user?.plan === 'max'
      ? [{ to: '/clients', icon: Users, label: 'Clients', center: true }]
      : [{ to: '/invoices', icon: FileText, label: 'Invoices', center: true }]),
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className={styles.nav}>
      {navItems.map(({ to, icon: Icon, label, center }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ''} ${center ? styles.center : ''}`
          }
        >
          <Icon size={center ? 24 : 22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
