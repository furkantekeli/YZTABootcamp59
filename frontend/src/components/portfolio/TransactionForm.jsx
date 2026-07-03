import React, { useState } from 'react';
import usePortfolioStore from '../../store/portfolioStore';
import useUiStore from '../../store/uiStore';
import Button from '../common/Button';
import Input from '../common/Input';
import './TransactionForm.css';

export default function TransactionForm({ portfolioId, stock = null, onClose }) {
  const { stocks, addTransaction } = usePortfolioStore();
  const { addToast } = useUiStore();

  const [selectedStockId, setSelectedStockId] = useState(stock ? stock.id : (stocks[0]?.id || ''));
  const [txnType, setTxnType] = useState('BUY'); // BUY or SELL
  const [lots, setLots] = useState('');
  const [price, setPrice] = useState('');
  const [commission, setCommission] = useState('0.0');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStockId) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: 'Lütfen işlem yapmak istediğiniz hisse senedini seçin.',
      });
      return;
    }

    const currentStock = stock || stocks.find((s) => s.id === parseInt(selectedStockId));
    if (txnType === 'SELL' && currentStock && currentStock.total_lots < parseFloat(lots)) {
      addToast({
        type: 'error',
        title: 'Yetersiz Bakiye',
        message: `Bu hissede satabileceğiniz maksimum lot sayısı: ${currentStock.total_lots}`,
      });
      return;
    }

    setIsSubmitting(true);
    const result = await addTransaction(portfolioId, {
      portfolio_stock_id: parseInt(selectedStockId),
      transaction_type: txnType,
      lots: parseFloat(lots),
      price: parseFloat(price),
      commission: parseFloat(commission || 0),
      transaction_date: date ? new Date(date).toISOString() : null,
      notes: notes || null,
    });
    setIsSubmitting(false);

    if (result.success) {
      addToast({
        type: 'success',
        title: 'Başarılı',
        message: 'Alım/Satım işlemi başarıyla kaydedildi.',
      });
      onClose();
    } else {
      addToast({
        type: 'error',
        title: 'Hata',
        message: result.error || 'İşlem eklenirken bir hata oluştu.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="txn-form">
      {!stock && (
        <div className="form-group mb-4">
          <label className="input-label">Hisse Senedi Seçin</label>
          <select
            value={selectedStockId}
            onChange={(e) => setSelectedStockId(e.target.value)}
            className="common-select"
            required
          >
            <option value="" disabled>Seçiniz...</option>
            {stocks.map((s) => (
              <option key={s.id} value={s.id}>
                {s.symbol} - {s.name} (Mevcut: {s.total_lots} Lot)
              </option>
            ))}
          </select>
        </div>
      )}

      {stock && (
        <div className="txn-stock-info-banner">
          <div>
            <span className="info-label">Seçili Hisse</span>
            <span className="info-val font-mono">{stock.symbol}</span>
          </div>
          <div>
            <span className="info-label">Mevcut Bakiye</span>
            <span className="info-val font-mono">{stock.total_lots} Lot</span>
          </div>
        </div>
      )}

      <div className="form-group mb-4">
        <label className="input-label">İşlem Tipi</label>
        <div className="txn-type-toggle">
          <button
            type="button"
            className={`toggle-btn buy-btn ${txnType === 'BUY' ? 'active' : ''}`}
            onClick={() => setTxnType('BUY')}
          >
            ALIŞ
          </button>
          <button
            type="button"
            className={`toggle-btn sell-btn ${txnType === 'SELL' ? 'active' : ''}`}
            onClick={() => setTxnType('SELL')}
          >
            SATIŞ
          </button>
        </div>
      </div>

      <div className="form-grid mb-4">
        <Input
          label="Lot Miktarı"
          type="number"
          step="any"
          placeholder="0.00"
          value={lots}
          onChange={(e) => setLots(e.target.value)}
          required
        />
        <Input
          label={`Birim Fiyat (${stock?.currency || 'Para Birimi'})`}
          type="number"
          step="any"
          placeholder="0.00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>

      <div className="form-grid mb-4">
        <Input
          label="Komisyon"
          type="number"
          step="any"
          placeholder="0.00"
          value={commission}
          onChange={(e) => setCommission(e.target.value)}
        />
        <Input
          label="İşlem Tarihi"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="form-group mb-6">
        <label className="input-label">Notlar</label>
        <textarea
          placeholder="İşlemle ilgili not alabilirsiniz..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="common-textarea"
          rows={3}
        />
      </div>

      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onClose}>
          İptal
        </Button>
        <Button type="submit" variant={txnType === 'BUY' ? 'primary' : 'danger'} loading={isSubmitting}>
          {txnType === 'BUY' ? 'Alış Kaydet' : 'Satış Kaydet'}
        </Button>
      </div>
    </form>
  );
}
