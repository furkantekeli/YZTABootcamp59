import React, { useEffect, useState } from 'react';
import usePortfolioStore from '../store/portfolioStore';
import useUiStore from '../store/uiStore';
import AllocationPie from '../components/charts/AllocationPie';
import PerformanceArea from '../components/charts/PerformanceArea';
import ProfitLossChart from '../components/charts/ProfitLossChart';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import { BarChart2, Shield, Percent, TrendingUp, Scale, AlertCircle, Play, ArrowRight, Bot } from 'lucide-react';
import { analysisApi } from '../api/analysis';
import { aiApi } from '../api/ai';
import Markdown from 'react-markdown';
import './AnalysisPage.css';

export default function AnalysisPage() {
  const { currentPortfolio, summary, stocks } = usePortfolioStore();
  const { addToast } = useUiStore();

  const [allocationData, setAllocationData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [benchmarkSymbol, setBenchmarkSymbol] = useState('XU100.IS');
  const [snapshots, setSnapshots] = useState([]);
  
  // Rebalancing States
  const [rebalanceData, setRebalanceData] = useState(null);
  const [isRebalancingLoading, setIsRebalancingLoading] = useState(false);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingBenchmark, setIsLoadingBenchmark] = useState(false);

  const loadAnalysisData = async () => {
    if (!currentPortfolio?.id || stocks.length === 0) return;
    setIsLoadingData(true);
    try {
      const [allocRes, riskRes, benchRes, snapshotsRes] = await Promise.all([
        analysisApi.getAllocation(currentPortfolio.id),
        analysisApi.getRisk(currentPortfolio.id),
        analysisApi.getBenchmark(currentPortfolio.id, benchmarkSymbol),
        analysisApi.getSnapshots(currentPortfolio.id)
      ]);

      setAllocationData(allocRes.data);
      setRiskData(riskRes.data);
      setBenchmarkData(benchRes.data);
      setSnapshots(snapshotsRes.data || []);
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

  useEffect(() => {
    loadAnalysisData();
    // Reset rebalancing when portfolio changes
    setRebalanceData(null);
  }, [currentPortfolio, stocks]);

  // Load benchmark separately when benchmark symbol changes
  useEffect(() => {
    if (!currentPortfolio?.id || stocks.length === 0 || isLoadingData) return;

    const loadBenchmarkOnly = async () => {
      setIsLoadingBenchmark(true);
      try {
        const res = await analysisApi.getBenchmark(currentPortfolio.id, benchmarkSymbol);
        setBenchmarkData(res.data);
      } catch (err) {
        console.error('Failed to load benchmark comparison', err);
      } finally {
        setIsLoadingBenchmark(false);
      }
    };

    loadBenchmarkOnly();
  }, [benchmarkSymbol]);

  // Run AI Rebalancing recommendations
  const handleCalculateRebalancing = async () => {
    setIsRebalancingLoading(true);
    try {
      const res = await aiApi.rebalance(currentPortfolio.id);
      setRebalanceData(res.data);
      addToast({
        type: 'success',
        title: 'Rebalancing Tamamlandı',
        message: 'Yapay zekâ portföy dengeleme önerileri başarıyla oluşturuldu.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: err.response?.data?.detail || 'Rebalancing hesaplanırken hata oluştu.',
      });
    } finally {
      setIsRebalancingLoading(false);
    }
  };

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

  // If we have actual historical snapshots, use them for Performance Graph, otherwise fall back to benchmark comparison data
  const hasSnapshots = snapshots.length > 1;
  const graphDates = hasSnapshots ? snapshots.map(s => s.date) : benchmarkData?.dates;
  
  // Calculate historical returns series from snapshot values or use cumulative returns
  const graphPortfolio = hasSnapshots 
    ? snapshots.map((s, idx) => {
        if (idx === 0) return 0.0;
        const startValue = snapshots[0].total_value || 1.0;
        return round(((s.total_value - startValue) / startValue) * 100, 2);
      }) 
    : benchmarkData?.portfolio_returns;

  const graphBenchmark = hasSnapshots
    ? snapshots.map((s, idx) => {
        // Map benchmark returns alignment if we have snapshots
        if (benchmarkData && benchmarkData.benchmark_returns && benchmarkData.benchmark_returns.length > idx) {
          return benchmarkData.benchmark_returns[idx];
        }
        return 0.0;
      })
    : benchmarkData?.benchmark_returns;

  function round(num, decimalPlaces = 2) {
    return parseFloat(num.toFixed(decimalPlaces));
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
            <h3 className="card-title">
              Portföy Performansı (Toplam Getiri) 
              {hasSnapshots && <span className="snapshots-badge font-semibold">Tarihsel Snapshot Modu</span>}
            </h3>
            <div className="benchmark-select-wrapper ml-auto">
              <select
                value={benchmarkSymbol}
                onChange={(e) => setBenchmarkSymbol(e.target.value)}
                className="common-select p-1 text-xs"
                disabled={isLoadingBenchmark}
                style={{ minWidth: '130px', margin: 0 }}
              >
                <option value="XU100.IS">BIST-100 (TRY)</option>
                <option value="^GSPC">S&P 500 (USD)</option>
                <option value="^IXIC">NASDAQ (USD)</option>
              </select>
            </div>
          </div>
          <div className="chart-container">
            {isLoadingBenchmark ? (
              <LoadingSpinner text="Karşılaştırma verileri güncelleniyor..." />
            ) : (
              <PerformanceArea
                portfolioReturns={graphPortfolio}
                benchmarkReturns={graphBenchmark}
                dates={graphDates}
                benchmarkName={benchmarkSymbol === 'XU100.IS' ? 'BIST-100' : benchmarkSymbol === '^GSPC' ? 'S&P 500' : 'NASDAQ'}
              />
            )}
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
                    <td>Beta Katsayısı (BIST-100'e göre Duyarlılık)</td>
                    <td className={`font-mono text-right ${riskData.beta > 1 ? 'text-danger' : 'text-success'}`}>
                      {riskData.beta?.toFixed(2)}
                    </td>
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

      {/* Row 3: AI Rebalancing & Portfolio Optimization */}
      <div className="analysis-card rebalancing-card-full glassmorphism">
        <div className="card-title-row">
          <Scale size={18} className="text-blue" />
          <h3 className="card-title">Yapay Zekâ ile Portföy Rebalancing (Dengeleme)</h3>
        </div>

        {!rebalanceData ? (
          <div className="rebalancing-start-view text-center py-6">
            <Scale size={40} className="text-secondary mx-auto mb-4" />
            <h4 className="font-bold">Eşit Ağırlıklı Portföy Optimizasyonu</h4>
            <p className="text-secondary max-w-lg mx-auto mb-6 text-sm">
              Sistem portföyünüzdeki tüm hisseleri analiz ederek eşit dağılım hedefine göre sapmaları hesaplar. 
              Yapay zekâ rebalancing asistanı, portföyünüzü optimize edecek alım/satım işlemlerini raporlar.
            </p>
            <Button onClick={handleCalculateRebalancing} variant="primary" loading={isRebalancingLoading} className="flex items-center gap-2 mx-auto">
              <Play size={14} /> Rebalancing Analizini Başlat
            </Button>
          </div>
        ) : (
          <div className="rebalancing-results-grid">
            {/* Rebalancing Trades Table */}
            <div className="rebalancing-left-col">
              <h4 className="font-bold text-sm mb-3">Matematiksel Dengeleme Önerileri</h4>
              <div className="rebalancing-table-wrapper">
                <table className="rebalancing-table">
                  <thead>
                    <tr>
                      <th>Hisse</th>
                      <th className="text-right">Mevcut Ağırlık</th>
                      <th className="text-right">Hedef Ağırlık</th>
                      <th className="text-right">Sapma</th>
                      <th className="text-right">İşlem Kararı</th>
                      <th className="text-right">Gereken Lot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rebalanceData.rebalancing_trades?.map((trade) => {
                      const isBuy = trade.trade_action === 'BUY';
                      return (
                        <tr key={trade.symbol}>
                          <td className="font-mono font-bold">{trade.symbol}</td>
                          <td className="font-mono text-right">{trade.current_weight_pct}%</td>
                          <td className="font-mono text-right">{trade.target_weight_pct}%</td>
                          <td className={`font-mono text-right ${trade.deviation_pct >= 0 ? 'text-danger' : 'text-success'}`}>
                            {trade.deviation_pct > 0 ? '+' : ''}{trade.deviation_pct}%
                          </td>
                          <td className="text-right">
                            <span className={`txn-type-badge ${isBuy ? 'badge-buy' : 'badge-sell'}`} style={{ display: 'inline-block', fontSize: '0.7rem', padding: '2px 6px' }}>
                              {isBuy ? 'AL' : 'SAT'}
                            </span>
                          </td>
                          <td className="font-mono text-right font-bold text-primary">
                            {trade.required_lots} Lot
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rebalancing AI Guidance Report */}
            <div className="rebalancing-right-col">
              <div className="rebal-ai-report-card">
                <div className="rebal-ai-header">
                  <Bot size={18} className="text-green" />
                  <h4 className="font-bold text-sm">Yapay Zekâ Dengeleme Yol Haritası</h4>
                </div>
                <div className="rebal-ai-body">
                  <Markdown className="markdown-content">{rebalanceData.ai_report}</Markdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
