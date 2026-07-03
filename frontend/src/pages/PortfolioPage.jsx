import React, { useState, useEffect } from 'react';
import usePortfolioStore from '../store/portfolioStore';
import useUiStore from '../store/uiStore';
import PortfolioSummary from '../components/portfolio/PortfolioSummary';
import StockCard from '../components/portfolio/StockCard';
import AddStockModal from '../components/portfolio/AddStockModal';
import TransactionForm from '../components/portfolio/TransactionForm';
import PriceChart from '../components/charts/PriceChart';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Plus, Briefcase, BarChart2, Receipt } from 'lucide-react';
import { stocksApi } from '../api/stocks';
import './PortfolioPage.css';

export default function PortfolioPage() {
  const {
    currentPortfolio,
    summary,
    stocks,
    isLoading,
    isStocksLoading,
    fetchStocks,
    fetchSummary,
    removeStock,
  } = usePortfolioStore();

  const { addToast, searchQuery } = useUiStore();
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  
  // Stock details modal states
  const [stockHistory, setStockHistory] = useState([]);
  const [historyPeriod, setHistoryPeriod] = useState('1mo');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' or 'transaction'

  useEffect(() => {
    if (currentPortfolio?.id) {
      fetchStocks(currentPortfolio.id);
      fetchSummary(currentPortfolio.id);
    }
  }, [currentPortfolio]);

  // Load history when stock is selected or period changes
  useEffect(() => {
    if (!selectedStock) return;

    const loadHistory = async () => {
      setIsHistoryLoading(true);
      try {
        const response = await stocksApi.getStockHistory(selectedStock.symbol, historyPeriod);
        setStockHistory(response.data?.data || []);
      } catch (err) {
        console.error('History load error:', err);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    loadHistory();
  }, [selectedStock, historyPeriod]);

  const handleRemoveStock = async (stockId) => {
    const result = await removeStock(currentPortfolio.id, stockId);
    if (result.success) {
      addToast({
        type: 'success',
        title: 'Başarılı',
        message: 'Hisse senedi portföyden kaldırıldı.',
      });
    } else {
      addToast({
        type: 'error',
        title: 'Hata',
        message: result.error || 'Hisse senedi silinemedi.',
      });
    }
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
    setActiveTab('chart');
    setHistoryPeriod('1mo');
  };

  if (!currentPortfolio) {
    return (
      <div className="portfolio-page-empty">
        <EmptyState
          title="Seçili Portföy Bulunmuyor"
          message="Lütfen Gösterge Panelinden bir portföy seçin veya yeni bir portföy oluşturun."
          icon={Briefcase}
        />
      </div>
    );
  }

  // Filter stocks based on header search query
  const filteredStocks = (summary?.stocks || []).map((stock) => {
    const fullStock = stocks.find((s) => s.symbol === stock.symbol);
    return { ...fullStock, ...stock };
  }).filter((stock) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      stock.symbol?.toLowerCase().includes(query) ||
      stock.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="portfolio-page-container">
      <div className="portfolio-header">
        <div>
          <h2 className="page-title">{currentPortfolio.name}</h2>
          <p className="page-subtitle">{currentPortfolio.description || 'Portföy varlık yönetimi'}</p>
        </div>
        <Button onClick={() => setIsAddStockOpen(true)} variant="primary" className="btn-sm">
          <Plus size={16} /> Hisse Ekle
        </Button>
      </div>

      {summary && <PortfolioSummary summary={summary} />}

      {isStocksLoading ? (
        <LoadingSpinner text="Hisse senetleri listeleniyor..." />
      ) : stocks.length > 0 ? (
        filteredStocks.length > 0 ? (
          <div className="stocks-grid">
            {filteredStocks.map((stock) => (
              <StockCard
                key={stock.symbol}
                stock={stock}
                onRemove={handleRemoveStock}
                onClick={() => handleStockClick(stock)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sonuç Bulunamadı"
            message={`"${searchQuery}" aramanızla eşleşen bir hisse senedi portföyünüzde bulunmuyor.`}
            icon={BarChart2}
          />
        )
      ) : (
        <EmptyState
          title="Portföyünüz Boş"
          message="Portföyünüzde henüz takip edilen bir hisse senedi bulunmuyor. Eklemek için yukarıdaki 'Hisse Ekle' butonunu kullanın."
          actionText="Hisse Senedi Ekle"
          onAction={() => setIsAddStockOpen(true)}
          icon={BarChart2}
        />
      )}

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={isAddStockOpen}
        onClose={() => setIsAddStockOpen(false)}
        portfolioId={currentPortfolio.id}
      />

      {/* Stock Details / Chart / Transaction Modal */}
      {selectedStock && (
        <Modal
          isOpen={!!selectedStock}
          onClose={() => setSelectedStock(null)}
          title={`${selectedStock.symbol} - Hisse Detayları`}
          size="lg"
        >
          <div className="stock-details-modal-content">
            <div className="details-tab-header">
              <button
                className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
                onClick={() => setActiveTab('chart')}
              >
                <BarChart2 size={16} /> Fiyat Grafiği
              </button>
              <button
                className={`tab-btn ${activeTab === 'transaction' ? 'active' : ''}`}
                onClick={() => setActiveTab('transaction')}
              >
                <Receipt size={16} /> Yeni Alım / Satış İşlemi
              </button>
            </div>

            <div className="details-tab-body">
              {activeTab === 'chart' && (
                <div className="chart-tab-content">
                  <div className="period-selector-row">
                    {['5d', '1mo', '3mo', '6mo', '1y', 'max'].map((p) => (
                      <button
                        key={p}
                        className={`period-btn ${historyPeriod === p ? 'active' : ''}`}
                        onClick={() => setHistoryPeriod(p)}
                      >
                        {p === '1mo' ? '1 Ay' : p === '3mo' ? '3 Ay' : p === '6mo' ? '6 Ay' : p === '1y' ? '1 Yıl' : p === '5d' ? '5 Gün' : 'Tümü'}
                      </button>
                    ))}
                  </div>

                  {isHistoryLoading ? (
                    <LoadingSpinner text="Grafik verileri yükleniyor..." />
                  ) : (
                    <PriceChart
                      symbol={selectedStock.symbol}
                      data={stockHistory}
                      period={historyPeriod}
                    />
                  )}
                </div>
              )}

              {activeTab === 'transaction' && (
                <TransactionForm
                  portfolioId={currentPortfolio.id}
                  stock={selectedStock}
                  onClose={() => setSelectedStock(null)}
                />
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
