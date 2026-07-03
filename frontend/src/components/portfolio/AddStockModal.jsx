import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { stocksApi } from '../../api/stocks';
import usePortfolioStore from '../../store/portfolioStore';
import useUiStore from '../../store/uiStore';
import './AddStockModal.css';

export default function AddStockModal({ isOpen, onClose, portfolioId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedStock, setSelectedStock] = useState(null);
  const [exchange, setExchange] = useState('BIST');
  const [currency, setCurrency] = useState('TRY');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addStock } = usePortfolioStore();
  const { addToast } = useUiStore();
  const searchTimeoutRef = useRef(null);

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
    
    // Automatically set exchange/currency based on suffix
    if (stock.symbol.endsWith('.IS')) {
      setExchange('BIST');
      setCurrency('TRY');
    } else if (stock.symbol.endsWith('.L')) {
      setExchange('LSE');
      setCurrency('GBP');
    } else if (stock.exchange === 'GER') {
      setExchange('XETRA');
      setCurrency('EUR');
    } else {
      setExchange(stock.exchange || 'US');
      setCurrency(stock.currency || 'USD');
    }
  };

  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStock) return;

    setIsSubmitting(true);
    const result = await addStock(portfolioId, {
      symbol: selectedStock.symbol,
      name: selectedStock.name,
      exchange: exchange,
      currency: currency,
    });

    setIsSubmitting(false);

    if (result.success) {
      addToast({
        type: 'success',
        title: 'Başarılı',
        message: `${selectedStock.symbol} portföye eklendi.`,
      });
      // Reset state
      setSelectedStock(null);
      setSearchQuery('');
      onClose();
    } else {
      addToast({
        type: 'error',
        title: 'Hata',
        message: result.error || 'Hisse senedi eklenirken bir hata oluştu.',
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Portföye Hisse Ekle">
      <div className="add-stock-modal-body">
        {!selectedStock ? (
          <div className="search-section">
            <label className="input-label">Hisse Senedi Ara (Sembol veya İsim)</label>
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Ör: THYAO, AAPL, GARAN.IS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                autoFocus
              />
              {searchQuery && (
                <button className="clear-btn" onClick={() => setSearchQuery('')}>
                  <X size={16} />
                </button>
              )}
            </div>

            {isSearching && <LoadingSpinner text="Hisseler aranıyor..." />}

            {!isSearching && searchResults.length > 0 && (
              <div className="search-results-list">
                {searchResults.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="search-result-item"
                    onClick={() => handleSelectStock(stock)}
                  >
                    <div>
                      <span className="result-symbol font-mono">{stock.symbol}</span>
                      <span className="result-name">{stock.name}</span>
                    </div>
                    <span className="result-exchange badge-primary">
                      {stock.exchange || 'Global'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <div className="no-results-msg">
                Hisse senedi bulunamadı. Lütfen sembolü doğru yazdığınızdan emin olun (BIST için sonuna .IS ekleyebilirsiniz, ör: THYAO.IS).
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleAddStockSubmit} className="add-stock-form">
            <div className="selected-stock-banner">
              <div>
                <h4 className="font-mono">{selectedStock.symbol}</h4>
                <p>{selectedStock.name}</p>
              </div>
              <button
                type="button"
                className="change-stock-btn"
                onClick={() => setSelectedStock(null)}
              >
                Değiştir
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="input-label">Borsa (Exchange)</label>
                <input
                  type="text"
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  className="common-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="input-label">Para Birimi</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="common-select"
                  required
                >
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={onClose}>
                İptal
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Portföye Ekle
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
