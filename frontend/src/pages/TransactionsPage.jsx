import React, { useState, useEffect } from 'react';
import usePortfolioStore from '../store/portfolioStore';
import useUiStore from '../store/uiStore';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import TransactionForm from '../components/portfolio/TransactionForm';
import { Plus, Receipt, Search, Trash2 } from 'lucide-react';
import { transactionsApi } from '../api/transactions';
import './TransactionsPage.css';

export default function TransactionsPage() {
  const {
    currentPortfolio,
    transactions,
    stocks,
    isTransactionsLoading,
    fetchTransactions,
    fetchStocks,
    fetchSummary
  } = usePortfolioStore();

  const { addToast } = useUiStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // ALL, BUY, SELL
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentPortfolio?.id) {
      fetchTransactions(currentPortfolio.id);
      fetchStocks(currentPortfolio.id);
    }
  }, [currentPortfolio]);

  const handleDeleteTransaction = async (txnId) => {
    if (!confirm('Bu işlem kaydını silmek istediğinize emin misiniz? Hisse ortalama maliyetiniz yeniden hesaplanacaktır.')) {
      return;
    }

    try {
      await transactionsApi.deleteTransaction(txnId);
      addToast({
        type: 'success',
        title: 'Başarılı',
        message: 'İşlem kaydı başarıyla silindi.',
      });
      // Refresh all related data
      await Promise.all([
        fetchTransactions(currentPortfolio.id),
        fetchStocks(currentPortfolio.id),
        fetchSummary(currentPortfolio.id)
      ]);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: err.response?.data?.detail || 'İşlem silinirken bir hata oluştu.',
      });
    }
  };

  // Filter and search logic
  const filteredTransactions = transactions.filter((txn) => {
    const matchingStock = stocks.find((s) => s.id === txn.portfolio_stock_id);
    const matchesSearch = matchingStock
      ? matchingStock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        matchingStock.name.toLowerCase().includes(searchQuery.toLowerCase())
      : false;

    const matchesType = filterType === 'ALL' || txn.transaction_type === filterType;

    return matchesSearch && matchesType;
  });

  if (!currentPortfolio) {
    return (
      <div className="transactions-page-empty">
        <EmptyState
          title="Seçili Portföy Bulunmuyor"
          message="Lütfen işlem geçmişinizi görüntülemek için bir portföy seçin veya oluşturun."
          icon={Receipt}
        />
      </div>
    );
  }

  return (
    <div className="transactions-page-container">
      <div className="transactions-header">
        <div>
          <h2 className="page-title">İşlem Takibi</h2>
          <p className="page-subtitle">Portföyünüzde gerçekleştirilen tüm alım ve satım hareketleri</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" className="btn-sm" disabled={stocks.length === 0}>
          <Plus size={16} /> Yeni İşlem Ekle
        </Button>
      </div>

      {stocks.length === 0 && (
        <div className="alert alert-warning mb-4 glassmorphism" style={{ borderLeft: '4px solid var(--accent-yellow, #f59e0b)', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          ⚠️ İşlem kaydı girmeden önce en az bir adet hisse senedini portföyünüze eklemelisiniz.
        </div>
      )}

      {transactions.length > 0 ? (
        <div className="transactions-card glassmorphism">
          <div className="table-filter-bar">
            <div className="search-box">
              <Search size={16} className="search-box-icon" />
              <input
                type="text"
                placeholder="Hisse sembolü ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="type-filters">
              <button
                className={`filter-btn ${filterType === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilterType('ALL')}
              >
                Tümü
              </button>
              <button
                className={`filter-btn ${filterType === 'BUY' ? 'active' : ''}`}
                onClick={() => setFilterType('BUY')}
              >
                Alışlar
              </button>
              <button
                className={`filter-btn ${filterType === 'SELL' ? 'active' : ''}`}
                onClick={() => setFilterType('SELL')}
              >
                Satışlar
              </button>
            </div>
          </div>

          {isTransactionsLoading ? (
            <LoadingSpinner text="İşlem kayıtları yükleniyor..." />
          ) : filteredTransactions.length > 0 ? (
            <div className="table-responsive">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Tip</th>
                    <th>Hisse</th>
                    <th className="text-right">Miktar</th>
                    <th className="text-right">Fiyat</th>
                    <th className="text-right">Komisyon</th>
                    <th className="text-right">Toplam Tutar</th>
                    <th>Not</th>
                    <th className="text-center">Aksiyon</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn) => {
                    const matchingStock = stocks.find((s) => s.id === txn.portfolio_stock_id);
                    const isBuy = txn.transaction_type === 'BUY';
                    const totalCost = txn.lots * txn.price + (isBuy ? txn.commission : -txn.commission);

                    return (
                      <tr key={txn.id}>
                        <td className="font-mono text-nowrap">
                          {new Date(txn.transaction_date).toLocaleDateString('tr-TR')}
                        </td>
                        <td>
                          <span className={`txn-badge ${isBuy ? 'badge-buy' : 'badge-sell'}`}>
                            {isBuy ? 'ALIŞ' : 'SATIŞ'}
                          </span>
                        </td>
                        <td>
                          <div className="stock-info-td">
                            <span className="stock-sym font-mono">{matchingStock?.symbol || 'Hisse'}</span>
                            <span className="stock-name-lbl">{matchingStock?.name}</span>
                          </div>
                        </td>
                        <td className="text-right font-mono">{txn.lots} Lot</td>
                        <td className="text-right font-mono">
                          {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(txn.price)} {matchingStock?.currency || 'TRY'}
                        </td>
                        <td className="text-right font-mono">
                          {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(txn.commission)} {matchingStock?.currency || 'TRY'}
                        </td>
                        <td className="text-right font-mono font-bold">
                          {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(totalCost)} {matchingStock?.currency || 'TRY'}
                        </td>
                        <td className="txn-notes-td" title={txn.notes}>{txn.notes || '-'}</td>
                        <td className="text-center">
                          <button
                            className="txn-delete-btn"
                            onClick={() => handleDeleteTransaction(txn.id)}
                            title="İşlemi Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-filtered-results">Arama kriterlerine uygun işlem bulunamadı.</div>
          )}
        </div>
      ) : (
        <EmptyState
          title="Henüz İşlem Kaydı Yok"
          message="Portföyünüzde henüz alım veya satış işlemi kaydetmediniz. İlk işleminizi ekleyerek kâr-zarar takibine başlayın."
          actionText="İlk İşlemimi Ekle"
          onAction={() => setIsModalOpen(true)}
          icon={Receipt}
        />
      )}

      {/* Add Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni İşlem Kaydı Ekle">
        <TransactionForm
          portfolioId={currentPortfolio.id}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
