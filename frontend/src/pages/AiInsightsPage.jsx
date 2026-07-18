import React, { useState, useEffect, useRef } from 'react';
import usePortfolioStore from '../store/portfolioStore';
import useUiStore from '../store/uiStore';
import AiChat from '../components/ai/AiChat';
import RiskMeter from '../components/ai/RiskMeter';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import { Bot, Sparkles, AlertTriangle, HelpCircle, Search, Play, ArrowRight, History, FileText, CheckSquare, Square, ClipboardCopy } from 'lucide-react';
import { aiApi } from '../api/ai';
import { analysisApi } from '../api/analysis';
import { stocksApi } from '../api/stocks';
import Markdown from 'react-markdown';
import './AiInsightsPage.css';

export default function AiInsightsPage() {
  const { currentPortfolio, stocks } = usePortfolioStore();
  const { addToast } = useUiStore();

  const [generalAnalysis, setGeneralAnalysis] = useState('');
  const [riskAnalysis, setRiskAnalysis] = useState('');
  const [riskMetrics, setRiskMetrics] = useState(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRiskAnalyzing, setIsRiskAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'risk', 'simulation', 'history', 'chat'

  // What-If Simulation States
  const [simSearchQuery, setSimSearchQuery] = useState('');
  const [simSearchResults, setSimSearchResults] = useState([]);
  const [isSimSearching, setIsSimSearching] = useState(false);
  const [simSelectedStock, setSimSelectedStock] = useState(null);
  const [simLots, setSimLots] = useState('');
  const [simPrice, setSimPrice] = useState('');
  const [simResult, setSimResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Reports History & Comparison States
  const [historyReports, setHistoryReports] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  const searchTimeoutRef = useRef(null);

  const loadInitialRiskData = async () => {
    if (!currentPortfolio?.id) return;
    try {
      const res = await analysisApi.getRisk(currentPortfolio.id);
      setRiskMetrics(res.data);
    } catch (e) {}
  };

  const fetchReportsHistory = async () => {
    if (!currentPortfolio?.id) return;
    setIsHistoryLoading(true);
    try {
      const res = await aiApi.getReportsHistory(currentPortfolio.id);
      setHistoryReports(res.data || []);
    } catch (e) {
      console.error("Failed to load reports history", e);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!currentPortfolio?.id || stocks.length === 0) return;

    // Reset states
    setGeneralAnalysis('');
    setRiskAnalysis('');
    setSimResult(null);
    setSimSelectedStock(null);
    setSimSearchQuery('');
    setHistoryReports([]);
    setSelectedReportIds([]);
    setComparisonResult(null);

    loadInitialRiskData();
  }, [currentPortfolio, stocks]);

  // Load history if activeTab becomes history
  useEffect(() => {
    if (activeTab === 'history') {
      fetchReportsHistory();
    }
  }, [activeTab, currentPortfolio]);

  // Debounced search for simulation
  useEffect(() => {
    if (simSearchQuery.trim().length < 2 || (simSelectedStock && simSelectedStock.symbol === simSearchQuery)) {
      setSimSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSimSearching(true);
      try {
        const response = await stocksApi.searchStocks(simSearchQuery);
        setSimSearchResults(response.data || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSimSearching(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [simSearchQuery, simSelectedStock]);

  const handleSelectSimStock = (stock) => {
    setSimSelectedStock(stock);
    setSimSearchQuery(stock.symbol);
    setSimSearchResults([]);
    
    if (stock.symbol) {
      stocksApi.getStockPrice(stock.symbol).then((res) => {
        if (res.data?.current_price) {
          setSimPrice(res.data.current_price.toString());
        }
      }).catch(() => {});
    }
  };

  const handleRunSimulation = async (e) => {
    e.preventDefault();
    if (!simSelectedStock || !simLots || !simPrice) return;

    setIsSimulating(true);
    try {
      const res = await aiApi.simulateWhatIf(
        currentPortfolio.id,
        simSelectedStock.symbol,
        parseFloat(simLots),
        parseFloat(simPrice)
      );
      setSimResult(res.data);
      addToast({
        type: 'success',
        title: 'Simülasyon Tamamlandı',
        message: 'Portföy simülasyonu ve yapay zekâ analizi başarıyla tamamlandı.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: err.response?.data?.detail || 'Simülasyon yapılırken hata oluştu.',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleGenerateAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await aiApi.analyzePortfolio(currentPortfolio.id);
      setGeneralAnalysis(res.data.response);
      addToast({
        type: 'success',
        title: 'Analiz Tamamlandı',
        message: 'Portföy analizi başarıyla tamamlandı.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: err.response?.data?.detail || 'Analiz yapılırken hata oluştu.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateRiskAnalysis = async () => {
    setIsRiskAnalyzing(true);
    try {
      const res = await aiApi.assessRisk(currentPortfolio.id);
      setRiskAnalysis(res.data.response);
      addToast({
        type: 'success',
        title: 'Analiz Tamamlandı',
        message: 'Risk değerlendirmesi başarıyla tamamlandı.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: err.response?.data?.detail || 'Risk analizi yapılırken hata oluştu.',
      });
    } finally {
      setIsRiskAnalyzing(false);
    }
  };

  // Toggle report selection for comparison
  const handleToggleSelectReport = (id) => {
    setSelectedReportIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        // Limit to max 2 reports
        addToast({
          type: 'warning',
          title: 'Uyarı',
          message: 'Karşılaştırma için en fazla 2 rapor seçebilirsiniz.',
        });
        return prev;
      }
      return [...prev, id];
    });
  };

  // Run AI Comparison
  const handleCompareReports = async () => {
    if (selectedReportIds.length !== 2) return;
    setIsComparing(true);
    try {
      const res = await aiApi.compareReports(
        currentPortfolio.id,
        selectedReportIds[0],
        selectedReportIds[1]
      );
      setComparisonResult(res.data);
      addToast({
        type: 'success',
        title: 'Karşılaştırma Hazır',
        message: 'Yapay zekâ karşılaştırmalı gelişim analizi başarıyla oluşturuldu.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: err.response?.data?.detail || 'Raporlar karşılaştırılırken hata oluştu.',
      });
    } finally {
      setIsComparing(false);
    }
  };

  if (!currentPortfolio) {
    return (
      <div className="ai-insights-page-empty">
        <EmptyState
          title="Seçili Portföy Bulunmuyor"
          message="Lütfen yapay zekâ analizleri almak için bir portföy seçin veya oluşturun."
          icon={Bot}
        />
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="ai-insights-page-empty">
        <EmptyState
          title="Portföyünüz Boş"
          message="Yapay zekânın portföyünüzü yorumlayabilmesi için en az bir adet hisse senedi eklemiş olmanız gerekmektedir."
          icon={Bot}
        />
      </div>
    );
  }

  const getRiskScore = () => {
    if (!riskMetrics) return 1;
    const vol = riskMetrics.volatility || 10;
    return Math.min(10, Math.max(1, vol / 5));
  };

  return (
    <div className="ai-insights-page-container">
      <div className="ai-insights-header">
        <div className="title-section">
          <h2 className="page-title">Yapay Zekâ Destekli Yorumlar</h2>
          <p className="page-subtitle">Portföyünüzün risk dağılımını, performansını ve olası fırsatlarını AI ile yorumlayın</p>
        </div>
      </div>

      <div className="insights-layout-grid">
        {/* Left column: Quick metrics & Tabs */}
        <div className="insights-left-col">
          <div className="risk-metrics-widget-card glassmorphism mb-4">
            <h3 className="widget-title">Hesaplanan Portföy Riski</h3>
            <RiskMeter
              score={getRiskScore()}
              label={riskMetrics?.risk_level || 'Hesaplanıyor'}
            />
          </div>

          <div className="ai-actions-widget-card glassmorphism">
            <h3 className="widget-title">Yapay Zekâ Analiz Modülleri</h3>
            <div className="ai-modules-list">
              <button
                className={`ai-module-item-btn ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                <Sparkles size={16} /> Genel Portföy Yorumu
              </button>
              <button
                className={`ai-module-item-btn ${activeTab === 'risk' ? 'active' : ''}`}
                onClick={() => setActiveTab('risk')}
              >
                <AlertTriangle size={16} /> Risk Değerlendirmesi
              </button>
              <button
                className={`ai-module-item-btn ${activeTab === 'simulation' ? 'active' : ''}`}
                onClick={() => setActiveTab('simulation')}
              >
                <HelpCircle size={16} /> What-If Simülasyonu
              </button>
              <button
                className={`ai-module-item-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={16} /> Rapor Karşılaştırma
              </button>
              <button
                className={`ai-module-item-btn ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <Bot size={16} /> Asistanla Sohbet
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Content panel */}
        <div className="insights-right-col">
          {activeTab === 'general' && (
            <div className="analysis-panel-content glassmorphism">
              <div className="panel-header">
                <Sparkles size={18} className="text-green" />
                <h3 className="panel-title">Kapsamlı Portföy Yorumu</h3>
              </div>

              {generalAnalysis ? (
                <div className="panel-body-markdown">
                  <Markdown className="markdown-content">{generalAnalysis}</Markdown>
                  <Button onClick={handleGenerateAnalysis} variant="outline" className="mt-6" loading={isAnalyzing}>
                    Yeniden Analiz Et
                  </Button>
                </div>
              ) : (
                <div className="panel-empty-body">
                  <Bot size={40} className="panel-placeholder-icon" />
                  <h4>Yapay Zekâ Analizi Hazır Değil</h4>
                  <p>Portföyünüzün çeşitliliğini, güçlü ve zayıf yönlerini analiz etmek için hemen butona tıklayın.</p>
                  <Button onClick={handleGenerateAnalysis} variant="primary" loading={isAnalyzing}>
                    Portföyü Analiz Et
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="analysis-panel-content glassmorphism">
              <div className="panel-header">
                <AlertTriangle size={18} className="text-yellow" />
                <h3 className="panel-title">AI Risk Değerlendirmesi</h3>
              </div>

              {riskAnalysis ? (
                <div className="panel-body-markdown">
                  <Markdown className="markdown-content">{riskAnalysis}</Markdown>
                  <Button onClick={handleGenerateRiskAnalysis} variant="outline" className="mt-6" loading={isRiskAnalyzing}>
                    Yeniden Değerlendir
                  </Button>
                </div>
              ) : (
                <div className="panel-empty-body">
                  <Bot size={40} className="panel-placeholder-icon" />
                  <h4>Risk Analizi Hazır Değil</h4>
                  <p>Hisselerin konsantrasyon riskini, piyasa ve kur riskini yapay zekâya yorumlatmak için hemen butona tıklayın.</p>
                  <Button onClick={handleGenerateRiskAnalysis} variant="primary" loading={isRiskAnalyzing}>
                    Risk Değerlendirmesi Yap
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'simulation' && (
            <div className="analysis-panel-content glassmorphism">
              <div className="panel-header">
                <HelpCircle size={18} className="text-blue" />
                <h3 className="panel-title">Hipotetik "What-If" Simülasyonu</h3>
              </div>

              <div className="simulation-workspace">
                <form onSubmit={handleRunSimulation} className="simulation-form">
                  <div className="sim-search-group">
                    <label className="input-label">Eklenecek Sanal Hisse Senedi</label>
                    <div className="sim-search-input-wrapper">
                      <Search className="search-icon" size={16} />
                      <input
                        type="text"
                        placeholder="Ör: THYAO, AAPL, EREGL.IS..."
                        value={simSearchQuery}
                        onChange={(e) => setSimSearchQuery(e.target.value)}
                        className="sim-search-input"
                        required
                      />
                    </div>

                    {!simSelectedStock && simSearchResults.length > 0 && (
                      <div className="sim-search-results-dropdown">
                        {simSearchResults.map((stock) => (
                          <div
                            key={stock.symbol}
                            className="sim-search-result-item"
                            onClick={() => handleSelectSimStock(stock)}
                          >
                            <span className="font-mono text-blue font-bold">{stock.symbol}</span>
                            <span className="text-xs text-secondary truncate">{stock.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="sim-inputs-row">
                    <div className="form-group">
                      <label className="input-label">Lot Sayısı</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ör: 100"
                        value={simLots}
                        onChange={(e) => setSimLots(e.target.value)}
                        className="common-input font-mono"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="input-label">Alım Fiyatı</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ör: 320.50"
                        value={simPrice}
                        onChange={(e) => setSimPrice(e.target.value)}
                        className="common-input font-mono"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" variant="primary" className="w-full flex items-center justify-center gap-2" loading={isSimulating}>
                    <Play size={14} /> Simülasyonu Çalıştır
                  </Button>
                </form>

                {simResult && (
                  <div className="simulation-results-panel mt-6">
                    <h4 className="sim-results-title">Karşılaştırmalı Risk & Çeşitlilik Metrikleri</h4>
                    
                    <div className="sim-metrics-comparison-grid">
                      <div className="sim-metric-comparison-card">
                        <span className="sim-metric-label">Portföy Volatilitesi</span>
                        <div className="sim-metric-values">
                          <span className="value-prev font-mono">{simResult.current_metrics.volatility}%</span>
                          <ArrowRight size={14} className="text-secondary" />
                          <span className="value-next font-mono text-orange">{simResult.simulated_metrics.volatility}%</span>
                        </div>
                      </div>

                      <div className="sim-metric-comparison-card">
                        <span className="sim-metric-label">Sharpe Rasyosu</span>
                        <div className="sim-metric-values">
                          <span className="value-prev font-mono">{simResult.current_metrics.sharpe_ratio}</span>
                          <ArrowRight size={14} className="text-secondary" />
                          <span className="value-next font-mono text-green">{simResult.simulated_metrics.sharpe_ratio}</span>
                        </div>
                      </div>

                      <div className="sim-metric-comparison-card">
                        <span className="sim-metric-label">Çeşitlendirme Skoru</span>
                        <div className="sim-metric-values">
                          <span className="value-prev font-mono">{(simResult.current_metrics.diversification_score * 100).toFixed(0)}</span>
                          <ArrowRight size={14} className="text-secondary" />
                          <span className="value-next font-mono text-blue">{(simResult.simulated_metrics.diversification_score * 100).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="sim-ai-report-card mt-6">
                      <div className="sim-ai-header">
                        <Bot size={18} className="text-green" />
                        <h4 className="font-bold text-sm">Yapay Zekâ Simülasyon Raporu</h4>
                      </div>
                      <div className="sim-ai-body">
                        <Markdown className="markdown-content">{simResult.ai_report}</Markdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="analysis-panel-content glassmorphism">
              <div className="panel-header">
                <History size={18} className="text-purple" />
                <h3 className="panel-title">Rapor Geçmişi ve Karşılaştırma</h3>
              </div>

              <div className="reports-history-workspace">
                <div className="history-desc-banner text-xs text-secondary mb-4">
                  * Geçmişte oluşturduğunuz raporlardan <strong>2 adet</strong> seçerek aralarındaki gelişim/değişimi Yapay Zekâya analiz ettirebilirsiniz.
                </div>

                {isHistoryLoading ? (
                  <LoadingSpinner text="Geçmiş raporlar listeleniyor..." />
                ) : historyReports.length > 0 ? (
                  <div className="reports-list-grid mb-6">
                    {historyReports.map((report) => {
                      const isSelected = selectedReportIds.includes(report.id);
                      return (
                        <div
                          key={report.id}
                          className={`report-history-item-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleSelectReport(report.id)}
                        >
                          <div className="report-history-select-box">
                            {isSelected ? <CheckSquare size={18} className="text-blue" /> : <Square size={18} className="text-muted" />}
                          </div>
                          <div className="report-history-details">
                            <div className="report-history-meta">
                              <span className="report-type font-semibold uppercase">{report.analysis_type}</span>
                              <span className="report-date font-mono text-xs text-muted">{report.created_at}</span>
                            </div>
                            <p className="report-snippet" title={report.response}>
                              {report.response.slice(0, 120)}...
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="Kayıtlı Analiz Raporu Yok"
                    message="Henüz bu portföy için oluşturulmuş bir analiz raporu geçmişi bulunmuyor."
                    icon={FileText}
                  />
                )}

                {selectedReportIds.length === 2 && (
                  <Button
                    onClick={handleCompareReports}
                    variant="primary"
                    className="w-full flex items-center justify-center gap-2 mb-6"
                    loading={isComparing}
                  >
                    <ClipboardCopy size={16} /> Seçili Raporları AI ile Karşılaştır
                  </Button>
                )}

                {comparisonResult && (
                  <div className="comparison-report-card">
                    <div className="comparison-report-header">
                      <Bot size={18} className="text-green" />
                      <h4 className="font-bold text-sm">AI Karşılaştırmalı Gelişim Raporu</h4>
                    </div>
                    <div className="comparison-report-body">
                      <Markdown className="markdown-content">{comparisonResult.comparison_report}</Markdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <AiChat portfolioId={currentPortfolio.id} />
          )}
        </div>
      </div>
    </div>
  );
}
