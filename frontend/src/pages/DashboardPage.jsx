import React, { useEffect, useState } from 'react';
import usePortfolioStore from '../store/portfolioStore';
import useUiStore from '../store/uiStore';
import PortfolioSummary from '../components/portfolio/PortfolioSummary';
import AllocationPie from '../components/charts/AllocationPie';
import PerformanceArea from '../components/charts/PerformanceArea';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { Plus, Briefcase, ChevronRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import './DashboardPage.css';

export default function DashboardPage() {
  const {
    portfolios,
    currentPortfolio,
    summary,
    stocks,
    transactions,
    isLoading,
    fetchPortfolios,
    setCurrentPortfolio,
    createPortfolio,
  } = usePortfolioStore();

  const { addToast } = useUiStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDesc, setNewPortfolioDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const handleCreatePortfolio = async (e) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;

    setIsSubmitting(true);
    const result = await createPortfolio({
      name: newPortfolioName,
      description: newPortfolioDesc,
      currency: localStorage.getItem('app_currency') || 'TRY',
    });
    setIsSubmitting(false);

    if (result.success) {
      addToast({
        type: 'success',
        title: 'Başarılı',
        message: `"${newPortfolioName}" portföyü başarıyla oluşturuldu.`,
      });
      setNewPortfolioName('');
      setNewPortfolioDesc('');
      setIsModalOpen(false);
    } else {
      addToast({
        type: 'error',
        title: 'Hata',
        message: result.error || 'Portföy oluşturulamadı.',
      });
    }
  };

  if (isLoading && portfolios.length === 0) {
    return <LoadingSpinner text="Portföy verileri yükleniyor..." />;
  }

  if (portfolios.length === 0) {
    return (
      <div className="dashboard-empty-container">
        <EmptyState
          title="Henüz Portföyünüz Yok"
          message="Borsa yatırımlarınızı takip etmek, yapay zekâ analizi almak ve kâr-zarar durumunuzu görmek için ilk portföyünüzü oluşturun."
          actionText="İlk Portföyümü Oluştur"
          onAction={() => setIsModalOpen(true)}
          icon={Briefcase}
        />

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Portföy Oluştur">
          <form onSubmit={handleCreatePortfolio} className="create-portfolio-form">
            <Input
              label="Portföy Adı"
              value={newPortfolioName}
              onChange={(e) => setNewPortfolioName(e.target.value)}
              placeholder="Ör: Hisse Senedi Portföyüm, Emeklilik Yatırımlarım"
              required
            />
            <div className="form-group mb-4">
              <label className="input-label">Açıklama (Opsiyonel)</label>
              <textarea
                value={newPortfolioDesc}
                onChange={(e) => setNewPortfolioDesc(e.target.value)}
                placeholder="Portföy hedefleri veya açıklaması..."
                className="common-textarea"
                rows={3}
              />
            </div>
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                İptal
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Portföy Oluştur
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // Find top 3 performing stocks in this portfolio
  const topStocks = [...(summary?.stocks || [])]
    .sort((a, b) => (b.profit_loss_pct || 0) - (a.profit_loss_pct || 0))
    .slice(0, 3);

  const recentTransactions = transactions.slice(0, 4);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-row">
        <div className="portfolio-selector-wrapper">
          <select
            value={currentPortfolio?.id || ''}
            onChange={(e) => {
              const selected = portfolios.find((p) => p.id === parseInt(e.target.value));
              if (selected) setCurrentPortfolio(selected);
            }}
            className="portfolio-select font-bold"
          >
            {portfolios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button onClick={() => setIsModalOpen(true)} variant="ghost" className="btn-sm add-port-btn">
            <Plus size={16} /> Yeni Portföy
          </Button>
        </div>
      </div>

      {summary && <PortfolioSummary summary={summary} />}

      {summary && summary.stocks.length > 0 ? (
        <div className="dashboard-charts-grid">
          <div className="chart-card glassmorphism">
            <h3 className="chart-card-title">Portföy Dağılımı (Hisse Ağırlıkları)</h3>
            <div className="chart-wrapper">
              <AllocationPie data={summary.stocks} />
            </div>
          </div>

          <div className="chart-card glassmorphism">
            <h3 className="chart-card-title">Performans Eğrisi</h3>
            <div className="chart-wrapper">
              <PerformanceArea />
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-no-assets-banner glassmorphism">
          <h3>Portföyünüzde henüz hisse senedi bulunmuyor!</h3>
          <p>Alım-satım işlemlerinizi kaydetmek ve AI analizlerini açmak için hemen hisse ekleyin.</p>
          <Link to="/portfolio">
            <Button variant="primary">Hisse Senedi Yönetimine Git</Button>
          </Link>
        </div>
      )}

      {summary && summary.stocks.length > 0 && (
        <div className="dashboard-details-grid">
          <div className="detail-card glassmorphism">
            <div className="card-header-row">
              <h3 className="detail-card-title">En İyi Performans Gösteren Hisseler</h3>
              <TrendingUp size={16} className="text-success" />
            </div>
            <div className="top-stocks-list">
              {topStocks.map((stock) => {
                const isProfit = stock.profit_loss >= 0;
                return (
                  <div key={stock.symbol} className="top-stock-item">
                    <div>
                      <span className="stock-sym font-mono">{stock.symbol}</span>
                      <span className="stock-name-lbl">{stock.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="stock-val-lbl font-mono">
                        {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(stock.market_value)} {stock.currency}
                      </span>
                      <span className={`stock-pnl-lbl font-mono ${isProfit ? 'profit-text' : 'loss-text'}`}>
                        {isProfit ? '+' : ''}{stock.profit_loss_pct?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="detail-card glassmorphism">
            <div className="card-header-row">
              <h3 className="detail-card-title">Son İşlemler</h3>
              <Link to="/transactions" className="view-all-link">
                Tümü <ChevronRight size={14} />
              </Link>
            </div>
            <div className="recent-txns-list">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((txn) => {
                  const matchingStock = stocks.find((s) => s.id === txn.portfolio_stock_id);
                  const isBuy = txn.transaction_type === 'BUY';
                  return (
                    <div key={txn.id} className="recent-txn-item">
                      <div className="txn-type-indicator">
                        <span className={`txn-type-badge ${isBuy ? 'badge-buy' : 'badge-sell'}`}>
                          {isBuy ? 'AL' : 'SAT'}
                        </span>
                      </div>
                      <div className="txn-info-col">
                        <span className="txn-sym font-mono">{matchingStock?.symbol || 'Hisse'}</span>
                        <span className="txn-date-lbl">
                          {new Date(txn.transaction_date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <div className="txn-details-col font-mono text-right">
                        <span className="txn-lots">{txn.lots} Lot</span>
                        <span className="txn-price">{new Intl.NumberFormat('tr-TR').format(txn.price)} {matchingStock?.currency || 'TRY'}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-txns-placeholder">Henüz yapılmış alım-satım işlemi bulunmuyor.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for creating a new portfolio */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Portföy Oluştur">
        <form onSubmit={handleCreatePortfolio} className="create-portfolio-form">
          <Input
            label="Portföy Adı"
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
            placeholder="Ör: Hisse Senedi Portföyüm, Emeklilik Yatırımlarım"
            required
          />
          <div className="form-group mb-4">
            <label className="input-label">Açıklama (Opsiyonel)</label>
            <textarea
              value={newPortfolioDesc}
              onChange={(e) => setNewPortfolioDesc(e.target.value)}
              placeholder="Portföy hedefleri veya açıklaması..."
              className="common-textarea"
              rows={3}
            />
          </div>
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Portföy Oluştur
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
