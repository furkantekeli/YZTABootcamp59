import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import './Layout.css';

export default function Layout() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const loadUser = useAuthStore((s) => s.loadUser);
  const fetchPortfolios = usePortfolioStore((s) => s.fetchPortfolios);

  useEffect(() => {
    loadUser();
    fetchPortfolios();
  }, []);

  return (
    <div className={`layout ${sidebarOpen ? 'layout--sidebar-open' : 'layout--sidebar-closed'}`} id="app-layout">
      <Sidebar />
      <div className="layout-main">
        <Header />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
