import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  ArrowLeftRight,
  BarChart3,
  Bot,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', label: 'Gösterge Paneli', icon: LayoutDashboard },
  { path: '/portfolio', label: 'Portföy', icon: Briefcase },
  { path: '/transactions', label: 'İşlemler', icon: ArrowLeftRight },
  { path: '/analysis', label: 'Analiz', icon: BarChart3 },
  { path: '/ai-insights', label: 'AI Yorumları', icon: Bot },
  { path: '/news', label: 'Haberler', icon: Newspaper },
];

export default function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={toggleSidebar}
          id="sidebar-overlay"
        />
      )}

      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar--open' : 'sidebar--collapsed'}`}
        id="sidebar"
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <TrendingUp size={24} />
          </div>
          {sidebarOpen && (
            <span className="sidebar-logo-text">PortföyTakip</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
                id={`nav-${item.path.slice(1)}`}
                title={item.label}
              >
                <span className="sidebar-link-icon">
                  <Icon size={20} />
                </span>
                {sidebarOpen && (
                  <span className="sidebar-link-label">{item.label}</span>
                )}
                {isActive && <span className="sidebar-link-indicator" />}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        {sidebarOpen && user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">
                {user.full_name || user.username}
              </span>
              <span className="sidebar-user-email">{user.email}</span>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          id="sidebar-toggle"
          aria-label="Menüyü aç/kapat"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </aside>
    </>
  );
}
