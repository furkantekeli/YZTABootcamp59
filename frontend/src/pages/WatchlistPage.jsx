import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, Eye, TrendingUp, TrendingDown, RefreshCw, Briefcase } from 'lucide-react';
import { watchlistApi } from '../api/watchlist';
import { stocksApi } from '../api/stocks';
import usePortfolioStore from '../store/portfolioStore';
import useUiStore from '../store/uiStore';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import AddStockModal from '../components/portfolio/AddStockModal';
import './WatchlistPage.css';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  
  // Portföye hızlı ekleme modalı
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [stockToAddToPortfolio, setStockToAddToPortfolio] = useState(null);

  const { currentPortfolio } = usePortfolioStore();
  const { addToast } = useUiStore();
  const searchTimeoutRef = useRef(null);

  const fetchWatchlist = async () => {
    setIsLoading(true);
    try {
      const res = await watchlistApi.getWatchlist();
      setWatchlist(res.data || []);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: err.message || 'İzleme listesi yüklenemedi.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
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

  const handleAddToWatchlist = async (stock) => {
    try {
      // Determine exchange and currency based on symbol suffix
      let exchange = 'BIST';
      let currency = 'TRY';
      if (stock.symbol.endsWith('.IS')) {
        exchange = 'BIST';
        currency = 'TRY';
      } else if (stock.symbol.endsWith('.L')) {
        exchange = 'LSE';
        currency = 'GBP';
      } else {
        exchange = stock.exchange || 'US';
        currency = stock.currency || 'USD';
      }

      await watchlistApi.addToWatchlist({
        symbol: stock.symbol,
        name: stock.name,
        exchange: exchange,
        currency: currency,
      });

      addToast({
        type: 'success',
        title: 'Başarılı',
        message: `${stock.symbol} izleme listesine eklendi.`,
      });

      setSearchQuery('');
      setSearchResults([]);
      fetchWatchlist();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: err.message || 'İzleme listesine eklenirken hata oluştu.',
      });
    }
  };

  const handleRemoveFromWatchlist = async (id, symbol) => {
    try {
      await watchlistApi.removeFromWatchlist(id);
      addToast({
        type: 'success',
        title: 'Başarılı',
        message: `${symbol} izleme listesinden kaldırıldı.`,
      });
      setWatchlist((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: err.message || 'Kayıt silinemedi.',
      });
    }
  };

  const handleOpenAddPortfolioModal = (item) => {
    if (!currentPortfolio) {
      addToast({
        type: 'warning',
        title: 'Uyarı',
        message: 'Lütfen önce aktif bir portföy seçin.',
      });
      return;
    }
    setStockToAddToPortfolio(item);
    setIsAddStockOpen(true);
  };

  return (
    <div className="watchlist-page-container">
      <div className="watchlist-header">
        <div>
          <h2 className="page-title">İzleme Listesi (Watchlist)</h2>
          <p className="page-subtitle">Takip etmek istediğiniz hisse senetlerinin canlı fiyatlarını ve değişimlerini izleyin</p>
        </div>
        <Button onClick={fetchWatchlist} variant="ghost" className="btn-sm text-secondary">
          <RefreshCw size={16} /> Güncelle
        </Button>
      </div>

      {/* Arama Barı */}
      <div className="watchlist-search-card glassmorphism">
        <label className="input-label">Yeni Hisse Takip Et</label>
        <div className="watchlist-search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="İzlemek istediğiniz hisse sembolünü veya adını girin (Ör: THYAO, AAPL)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="watchlist-search-input"
          />
        </div>

        {isSearching && <LoadingSpinner text="Arama yapılıyor..." />}

        {!isSearching && searchResults.length > 0 && (
          <div className="watchlist-results-list">
            {searchResults.map((stock) => {
              const isAlreadyWatched = watchlist.some((item) => item.symbol === stock.symbol);
              return (
                <div key={stock.symbol} className="watchlist-result-item">
                  <div>
                    <span className="result-symbol font-mono">{stock.symbol}</span>
                    <span className="result-name">{stock.name}</span>
                  </div>
                  <div className="watchlist-result-actions">
                    <span className="result-exchange badge-primary mr-2">
                      {stock.exchange || 'Global'}
                    </span>
                    {isAlreadyWatched ? (
                      <span className="text-success text-xs font-semibold">Takip ediliyor</span>
                    ) : (
                      <button
                        onClick={() => handleAddToWatchlist(stock)}
                        className="watchlist-add-btn"
                        title="İzleme Listesine Ekle"
                      >
                        <Plus size={16} /> İzle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Liste */}
      {isLoading ? (
        <LoadingSpinner text="İzleme listesi yükleniyor..." />
      ) : watchlist.length > 0 ? (
        <div className="watchlist-grid">
          {watchlist.map((item) => {
            const isUp = item.change_pct > 0;
            const isDown = item.change_pct < 0;
            const isNeutral = item.change_pct === 0 || item.change_pct === null || item.change_pct === undefined;
            return (
              <div key={item.id} className="watchlist-card glassmorphism">
                <div className="watchlist-card-header">
                  <div>
                    <span className="watchlist-card-symbol font-mono">{item.symbol}</span>
                    <h4 className="watchlist-card-name" title={item.name}>{item.name || 'Bilinmeyen Şirket'}</h4>
                  </div>
                  <button
                    onClick={() => handleRemoveFromWatchlist(item.id, item.symbol)}
                    className="watchlist-card-remove-btn"
                    title="Takibi Bırak"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="watchlist-card-body">
                  <div className="watchlist-price-section">
                    <span className="watchlist-price font-mono">
                      {item.current_price !== null && item.current_price !== undefined ? (
                        `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(item.current_price)} ${item.currency}`
                      ) : (
                        'Yükleniyor...'
                      )}
                    </span>
                    {item.change_pct !== null && item.change_pct !== undefined && (
                      <span className={`watchlist-change font-mono ${isUp ? 'up' : isDown ? 'down' : 'neutral'}`}>
                        {isUp ? <TrendingUp size={14} /> : isDown ? <TrendingDown size={14} /> : null}
                        {isUp ? '+' : ''}{item.change_pct.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  
                  {item.previous_close !== null && item.previous_close !== undefined && (
                    <div className="watchlist-prev-close">
                      <span>Dünkü Kapanış:</span>
                      <span className="font-mono">{item.previous_close.toFixed(2)} {item.currency}</span>
                    </div>
                  )}
                </div>

                <div className="watchlist-card-footer">
                  <Button
                    onClick={() => handleOpenAddPortfolioModal(item)}
                    variant="primary"
                    className="btn-sm w-full flex items-center justify-center gap-1"
                  >
                    <Briefcase size={14} /> Portföye Ekle
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="İzleme Listeniz Boş"
          message="Henüz takip ettiğiniz bir hisse senedi bulunmuyor. Üstteki arama kutusunu kullanarak izlemek istediğiniz hisseleri ekleyebilirsiniz."
          icon={Eye}
        />
      )}

      {/* Portföye Hızlı Ekleme Modalı */}
      {isAddStockOpen && stockToAddToPortfolio && (
        <AddStockModal
          isOpen={isAddStockOpen}
          onClose={() => {
            setIsAddStockOpen(false);
            setStockToAddToPortfolio(null);
          }}
          portfolioId={currentPortfolio.id}
          initialStock={stockToAddToPortfolio} // AddStockModal'a varsayılan hisse göndereceğiz
        />
      )}
    </div>
  );
}
