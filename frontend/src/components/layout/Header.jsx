import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import './Header.css';

const pageTitles = {
  '/dashboard': 'Gösterge Paneli',
  '/portfolio': 'Portföy',
  '/transactions': 'İşlemler',
  '/analysis': 'Analiz',
  '/ai-insights': 'AI Yorumları',
  '/news': 'Haberler',
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [updatedName, setUpdatedName] = useState(user?.full_name || user?.username || '');
  const [currencySetting, setCurrencySetting] = useState(localStorage.getItem('app_currency') || 'TRY');
  const [aiSuggestions, setAiSuggestions] = useState(localStorage.getItem('ai_suggestions') !== 'false');
  
  const addToast = useUiStore((s) => s.addToast);

  useEffect(() => {
    if (user) {
      setUpdatedName(user.full_name || user.username || '');
    }
  }, [user]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!updatedName.trim()) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: 'İsim alanı boş bırakılamaz.',
      });
      return;
    }
    const updatedUser = {
      ...user,
      full_name: updatedName,
    };
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    useAuthStore.setState({ user: updatedUser });
    
    addToast({
      type: 'success',
      title: 'Profil Güncellendi',
      message: 'Profil bilgileriniz başarıyla güncellendi.',
    });
    setIsProfileOpen(false);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('app_currency', currencySetting);
    localStorage.setItem('ai_suggestions', aiSuggestions.toString());
    
    addToast({
      type: 'success',
      title: 'Ayarlar Kaydedildi',
      message: 'Uygulama ayarlarınız başarıyla kaydedildi.',
    });
    setIsSettingsOpen(false);
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const pageTitle = pageTitles[location.pathname] || 'PortföyTakip';

  // Reset search query on page change
  useEffect(() => {
    setSearchQuery('');
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header" id="header">
      <div className="header-left">
        <button
          className="header-menu-btn"
          onClick={toggleSidebar}
          aria-label="Menü"
          id="header-menu-toggle"
        >
          <Menu size={20} />
        </button>
        <h1 className="header-title">{pageTitle}</h1>
      </div>

      <div className="header-center">
        <div className="header-search">
          <Search size={16} className="header-search-icon" />
          <input
            type="text"
            className="header-search-input"
            placeholder="Hisse ara... (örn: THYAO)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="header-search"
          />
        </div>
      </div>

      <div className="header-right">
        <button className="header-icon-btn" aria-label="Bildirimler" id="header-notifications">
          <Bell size={20} />
          <span className="header-notification-dot" />
        </button>

        <div className="header-user-menu" ref={dropdownRef}>
          <button
            className="header-user-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            id="header-user-menu"
          >
            <div className="header-user-avatar">
              {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="header-user-name">
              {user?.full_name || user?.username || 'Kullanıcı'}
            </span>
            <ChevronDown size={16} className={`header-chevron ${dropdownOpen ? 'header-chevron--open' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="header-dropdown" id="header-dropdown">
              <div className="header-dropdown-item" onClick={() => { setDropdownOpen(false); setIsProfileOpen(true); }}>
                <User size={16} />
                <span>Profil</span>
              </div>
              <div className="header-dropdown-item" onClick={() => { setDropdownOpen(false); setIsSettingsOpen(true); }}>
                <Settings size={16} />
                <span>Ayarlar</span>
              </div>
              <div className="header-dropdown-divider" />
              <div className="header-dropdown-item header-dropdown-item--danger" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Çıkış Yap</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title="Kullanıcı Profili"
        size="sm"
      >
        <form onSubmit={handleSaveProfile} className="profile-form">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
            <div className="header-user-avatar" style={{ width: '64px', height: '64px', fontSize: '24px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{user?.email}</span>
          </div>

          <Input
            label="Ad Soyad"
            type="text"
            value={updatedName}
            onChange={(e) => setUpdatedName(e.target.value)}
            required
            placeholder="Adınızı ve soyadınızı girin"
          />

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button type="button" variant="outline" onClick={() => setIsProfileOpen(false)}>
              İptal
            </Button>
            <Button type="submit" variant="primary">
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Uygulama Ayarları"
        size="sm"
      >
        <form onSubmit={handleSaveSettings} className="settings-form">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Varsayılan Para Birimi</label>
              <select
                value={currencySetting}
                onChange={(e) => setCurrencySetting(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                <option value="TRY">TRY (₺)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <input
                type="checkbox"
                id="ai-suggestions-toggle"
                checked={aiSuggestions}
                onChange={(e) => setAiSuggestions(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="ai-suggestions-toggle" style={{ fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none' }}>
                Yapay Zekâ Analiz Önerilerini Etkinleştir
              </label>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button type="button" variant="outline" onClick={() => setIsSettingsOpen(false)}>
              İptal
            </Button>
            <Button type="submit" variant="primary">
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </header>
  );
}
