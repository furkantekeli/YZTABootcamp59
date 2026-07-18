import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, Bell, BellOff, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';
import { alertsApi } from '../api/alerts';
import { stocksApi } from '../api/stocks';
import useUiStore from '../store/uiStore';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import './AlertsPage.css';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);

  // Alarm Form States
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType] = useState('ABOVE'); // ABOVE veya BELOW
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToast } = useUiStore();
  const searchTimeoutRef = useRef(null);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await alertsApi.getAlerts();
      setAlerts(res.data || []);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: err.message || 'Alarmlar yüklenemedi.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await stocksApi.searchStocks(searchQuery);
        setSearchResults(response.data || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery]);

  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setSearchQuery(stock.symbol);
    setSearchResults([]);
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!selectedStock || !targetPrice) return;

    setIsSubmitting(true);
    try {
      await alertsApi.createAlert({
        symbol: selectedStock.symbol,
        name: selectedStock.name,
        target_price: parseFloat(targetPrice),
        alert_type: alertType,
      });

      addToast({
        type: 'success',
        title: 'Alarm Kuruldu',
        message: `${selectedStock.symbol} için ${targetPrice} seviyesine alarm kuruldu.`,
      });

      // Reset form states
      setSelectedStock(null);
      setSearchQuery('');
      setTargetPrice('');
      fetchAlerts();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: err.message || 'Alarm kurulurken hata oluştu.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAlert = async (id, symbol) => {
    try {
      await alertsApi.deleteAlert(id);
      addToast({
        type: 'success',
        title: 'Başarılı',
        message: 'Alarm silindi.',
      });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: err.message || 'Alarm silinemedi.',
      });
    }
  };

  return (
    <div className="alerts-page-container">
      <div className="alerts-header">
        <div>
          <h2 className="page-title">Fiyat Alarmları (Price Alerts)</h2>
          <p className="page-subtitle">Takip ettiğiniz hisse senetleri belirlediğiniz fiyat eşiğine geldiğinde anında haberdar olun</p>
        </div>
        <Button onClick={fetchAlerts} variant="ghost" className="btn-sm text-secondary">
          <RefreshCw size={16} /> Güncelle
        </Button>
      </div>

      <div className="alerts-layout-grid">
        {/* Sol Kolon: Alarm Kurma */}
        <div className="alerts-left-col">
          <div className="alert-create-card glassmorphism">
            <h3 className="widget-title">Yeni Fiyat Alarmı Kur</h3>
            
            {!selectedStock ? (
              <div className="search-section">
                <label className="input-label">Hisse Senedi Ara</label>
                <div className="alert-search-wrapper">
                  <Search className="search-icon" size={18} />
                  <input
                    type="text"
                    placeholder="Ör: THYAO, AAPL, EREGL.IS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="alert-search-input"
                  />
                </div>

                {isSearching && <LoadingSpinner text="Aranıyor..." />}

                {!isSearching && searchResults.length > 0 && (
                  <div className="alert-search-results">
                    {searchResults.map((stock) => (
                      <div
                        key={stock.symbol}
                        className="alert-search-result-item"
                        onClick={() => handleSelectStock(stock)}
                      >
                        <span className="result-symbol font-mono">{stock.symbol}</span>
                        <span className="result-name">{stock.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleCreateAlert} className="alert-form">
                <div className="selected-stock-banner mb-4">
                  <div>
                    <span className="selected-symbol font-mono">{selectedStock.symbol}</span>
                    <p className="selected-name">{selectedStock.name}</p>
                  </div>
                  <button
                    type="button"
                    className="change-stock-btn"
                    onClick={() => setSelectedStock(null)}
                  >
                    Değiştir
                  </button>
                </div>

                <div className="form-group mb-4">
                  <label className="input-label">Hedef Fiyat</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Fiyat girin..."
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="common-input font-mono"
                    required
                  />
                </div>

                <div className="form-group mb-6">
                  <label className="input-label">Alarm Koşulu</label>
                  <div className="alert-condition-toggle">
                    <button
                      type="button"
                      className={`condition-btn ${alertType === 'ABOVE' ? 'active' : ''}`}
                      onClick={() => setAlertType('ABOVE')}
                    >
                      <TrendingUp size={16} /> Fiyat Üstüne Çıkınca
                    </button>
                    <button
                      type="button"
                      className={`condition-btn ${alertType === 'BELOW' ? 'active' : ''}`}
                      onClick={() => setAlertType('BELOW')}
                    >
                      <TrendingDown size={16} /> Fiyat Altına Düşünce
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
                  <Bell size={16} /> Alarm Oluştur
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Sağ Kolon: Alarmlar Listesi */}
        <div className="alerts-right-col">
          <div className="alerts-list-card glassmorphism">
            <h3 className="widget-title">Kurulu Alarmlarınız</h3>

            {isLoading ? (
              <LoadingSpinner text="Alarmlarınız yükleniyor..." />
            ) : alerts.length > 0 ? (
              <div className="alerts-list">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`alert-item-card ${alert.is_triggered ? 'triggered' : ''}`}
                  >
                    <div className="alert-item-header">
                      <div className="alert-item-info">
                        <span className="alert-item-symbol font-mono">{alert.symbol}</span>
                        <p className="alert-item-name">{alert.name}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteAlert(alert.id, alert.symbol)}
                        className="alert-delete-btn"
                        title="Alarmı Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="alert-item-body">
                      <div className="alert-condition-info">
                        {alert.alert_type === 'ABOVE' ? (
                          <span className="condition-badge above">
                            <TrendingUp size={12} /> {alert.target_price.toFixed(2)} Üzeri
                          </span>
                        ) : (
                          <span className="condition-badge below">
                            <TrendingDown size={12} /> {alert.target_price.toFixed(2)} Altı
                          </span>
                        )}
                      </div>

                      <div className="alert-status-info">
                        {alert.is_triggered ? (
                          <span className="status-badge triggered">
                            <AlertCircle size={12} /> Tetiklendi ({new Date(alert.triggered_at).toLocaleDateString('tr-TR')})
                          </span>
                        ) : (
                          <span className="status-badge active">
                            <Bell size={12} /> Beklemede (Aktif)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Kurulu Alarm Yok"
                message="Henüz fiyat alarmı kurmadınız. Soldaki kutuyu kullanarak ilk alarmınızı kurabilirsiniz."
                icon={BellOff}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
