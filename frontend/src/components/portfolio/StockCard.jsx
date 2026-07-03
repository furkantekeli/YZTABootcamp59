import React from 'react';
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import './StockCard.css';

export default function StockCard({ stock, onRemove, onClick }) {
  const {
    id,
    symbol,
    name,
    total_lots,
    avg_cost,
    current_price,
    market_value,
    profit_loss,
    profit_loss_pct,
    currency
  } = stock;

  const isProfit = (profit_loss ?? 0) >= 0;

  const formatNumber = (val, decimals = 2) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(val || 0);
  };

  return (
    <div className="stock-card glassmorphism" onClick={onClick}>
      <div className="stock-card-header">
        <div>
          <h3 className="stock-symbol font-mono">{symbol}</h3>
          <p className="stock-name" title={name}>{name}</p>
        </div>
        <button
          className="stock-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`${symbol} hissesini portföyden silmek istediğinize emin misiniz? Tüm işlem geçmişi silinecektir.`)) {
              onRemove(id);
            }
          }}
          title="Hisse Sil"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="stock-card-body">
        <div className="stock-stat-row">
          <span className="stock-stat-label">Lot</span>
          <span className="stock-stat-value font-mono">{formatNumber(total_lots, 2)} Lot</span>
        </div>
        <div className="stock-stat-row">
          <span className="stock-stat-label">Ort. Maliyet</span>
          <span className="stock-stat-value font-mono">{formatNumber(avg_cost)} {currency}</span>
        </div>
        <div className="stock-stat-row">
          <span className="stock-stat-label">Güncel Fiyat</span>
          <span className="stock-stat-value font-mono">{formatNumber(current_price)} {currency}</span>
        </div>
        <div className="stock-stat-row">
          <span className="stock-stat-label">Bakiye</span>
          <span className="stock-stat-value font-mono font-bold">
            {formatNumber(market_value)} {currency}
          </span>
        </div>
      </div>

      <div className={`stock-card-footer ${isProfit ? 'profit-bg' : 'loss-bg'}`}>
        <div className="stock-pnl-info">
          {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span className="stock-pnl-value font-mono">
            {isProfit ? '+' : ''}{formatNumber(profit_loss)} {currency}
          </span>
        </div>
        <span className="stock-pnl-pct font-mono">
          {isProfit ? '+' : ''}{formatNumber(profit_loss_pct)}%
        </span>
      </div>
    </div>
  );
}
