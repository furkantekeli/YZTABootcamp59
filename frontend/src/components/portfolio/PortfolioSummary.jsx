import React from 'react';
import './PortfolioSummary.css';

export default function PortfolioSummary({ summary }) {
  if (!summary) return null;

  const {
    total_cost,
    total_market_value,
    total_profit_loss,
    total_profit_loss_pct,
    stock_count,
    currency
  } = summary;

  const isProfit = total_profit_loss >= 0;

  const formatCurrency = (val) => {
    const displayCurrency = localStorage.getItem('app_currency') || currency || 'TRY';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val || 0) + ' ' + displayCurrency;
  };

  return (
    <div className="portfolio-summary-grid">
      <div className="summary-card glassmorphism">
        <span className="summary-label">Toplam Değer</span>
        <h2 className="summary-value font-mono">{formatCurrency(total_market_value)}</h2>
        <span className="summary-subtext">Güncel piyasa değeri</span>
      </div>

      <div className="summary-card glassmorphism">
        <span className="summary-label">Toplam Yatırım (Maliyet)</span>
        <h2 className="summary-value font-mono">{formatCurrency(total_cost)}</h2>
        <span className="summary-subtext">Toplam alım maliyeti</span>
      </div>

      <div className="summary-card glassmorphism">
        <span className="summary-label">Toplam Kâr / Zarar</span>
        <h2 className={`summary-value font-mono ${isProfit ? 'profit-text' : 'loss-text'}`}>
          {isProfit ? '+' : ''}{formatCurrency(total_profit_loss)}
        </h2>
        <span className={`summary-badge ${isProfit ? 'badge-profit' : 'badge-loss'}`}>
          {isProfit ? '▲' : '▼'} {total_profit_loss_pct.toFixed(2)}%
        </span>
      </div>

      <div className="summary-card glassmorphism">
        <span className="summary-label">Aktif Hisseler</span>
        <h2 className="summary-value font-mono">{stock_count} adet</h2>
        <span className="summary-subtext">Portföydeki farklı hisseler</span>
      </div>
    </div>
  );
}
