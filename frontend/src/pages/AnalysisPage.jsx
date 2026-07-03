import React, { useEffect, useState } from 'react';
import usePortfolioStore from '../store/portfolioStore';
import useUiStore from '../store/uiStore';
import AllocationPie from '../components/charts/AllocationPie';
import PerformanceArea from '../components/charts/PerformanceArea';
import ProfitLossChart from '../components/charts/ProfitLossChart';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BarChart2, Shield, Percent, TrendingUp } from 'lucide-react';
import { analysisApi } from '../api/analysis';
import './AnalysisPage.css';

export default function AnalysisPage() {
  const { currentPortfolio, summary, stocks } = usePortfolioStore();
  const { addToast } = useUiStore();

  const [allocationData, setAllocationData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (!currentPortfolio?.id || stocks.length === 0) return;

    const loadAnalysisData = async () => {
      setIsLoadingData(true);
      try {
        const [allocRes, riskRes] = await Promise.all([
          analysisApi.getAllocation(currentPortfolio.id),
          analysisApi.getRisk(currentPortfolio.id)
        ]);

        setAllocationData(allocRes.data);
        setRiskData(riskRes.data);
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Hata',
          message: 'Analiz verileri yüklenirken bir hata oluştu.',
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadAnalysisData();
  }, [currentPortfolio, stocks]);

  if (!currentPortfolio) {
    return (
      <div className="analysis-page-empty">
        <EmptyState
          title="Seçili Portföy Bulunmuyor"
          message="Lütfen analiz sekmesini görüntülemek için bir portföy seçin veya oluşturun."
          icon={BarChart2}
        />
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="analysis-page-empty">
        <EmptyState
          title="Portföy Analizi İçin Hisse Ekleyin"
          message="Dağılım, performans ve risk analizlerini inceleyebilmek için portföyünüze en az bir hisse eklemiş olmanız gerekmektedir."
          icon={BarChart2}
        />
      </div>
    );
  }

  if (isLoadingData) {
    return <LoadingSpinner text="Finansal analizler ve risk metrikleri hesaplanıyor..." />;
  }

  return (
    <div className="analysis-page-container">
      <div className="analysis-header">
        <h2 className="page-title">Detaylı Portföy Analizi</h2>
        <p className="page-subtitle">Varlık dağılımı, kâr-zarar karşılaştırmaları ve gelişmiş risk rasyoları</p>
      </div>

      {/* Row 1: Allocation & Performance */}
      <div className="analysis-grid-row">
        <div className="analysis-card glassmorphism">
          <div className="card-title-row">
            <Percent size={18} className="text-blue" />
            <h3 className="card-title">Varlık Dağılımı (Hisseler)</h3>
          </div>
          <div className="chart-container">
            {summary && <AllocationPie data={summary.stocks} />}
          </div>
        </div>

        <div className="analysis-card glassmorphism">
          <div className="card-title-row">
            <TrendingUp size={18} className="text-green" />
            <h3 className="card-title">Portföy Performansı (Toplam)</h3>
          </div>
          <div className="chart-container">
            <PerformanceArea />
          </div>
        </div>
      </div>

      {/* Row 2: Profit Loss Per Stock & Risk Metrics */}
      <div className="analysis-grid-row">
        <div className="analysis-card glassmorphism">
          <div className="card-title-row">
            <BarChart2 size={18} className="text-purple" />
            <h3 className="card-title">Hisse Bazlı Net Kâr / Zarar</h3>
          </div>
          <div className="chart-container">
            {summary && <ProfitLossChart data={summary.stocks} />}
          </div>
        </div>

        <div className="analysis-card glassmorphism">
          <div className="card-title-row">
            <Shield size={18} className="text-yellow" />
            <h3 className="card-title">Gelişmiş Risk Metrikleri</h3>
          </div>
          
          {riskData ? (
            <div className="risk-metrics-table-wrapper">
              <table className="risk-metrics-table">
                <tbody>
                  <tr>
                    <td>Risk Seviyesi</td>
                    <td className="font-bold text-right" style={{ color: riskData.risk_level === 'Düşük' ? 'var(--accent-green)' : riskData.risk_level === 'Orta' ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>
                      {riskData.risk_level}
                    </td>
                  </tr>
                  <tr>
                    <td>Yıllık Volatilite (Standart Sapma)</td>
                    <td className="font-mono text-right">{riskData.volatility?.toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td>Sharpe Rasyosu (Risk-Getiri Oranı)</td>
                    <td className={`font-mono text-right ${riskData.sharpe_ratio >= 1 ? 'profit-text' : riskData.sharpe_ratio > 0 ? 'text-primary' : 'loss-text'}`}>
                      {riskData.sharpe_ratio?.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td>Maksimum Drawdown (En Yüksek Kayıp)</td>
                    <td className="font-mono text-right loss-text">-{riskData.max_drawdown?.toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td>Çeşitlendirme Skoru (0-100)</td>
                    <td className="font-mono text-right font-bold" style={{ color: 'var(--accent-blue)' }}>
                      {(riskData.diversification_score * 100).toFixed(0)} / 100
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="risk-metrics-footer-desc">
                * Bu değerler, hisselerin son 1 yıllık günlük kapanış fiyatları kullanılarak hesaplanmıştır. 
                Sharpe oranının 1.0 üzerinde olması risk-getiri dengesinin iyi olduğunu gösterir.
              </div>
            </div>
          ) : (
            <div className="no-risk-data">Risk analiz verileri hesaplanamadı.</div>
          )}
        </div>
      </div>
    </div>
  );
}
