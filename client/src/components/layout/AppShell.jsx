import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppShell() {
  return (
    <>
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}
