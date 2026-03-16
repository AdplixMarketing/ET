import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import BusinessSwitcher from './BusinessSwitcher';

export default function AppShell() {
  return (
    <>
      <BusinessSwitcher />
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}
