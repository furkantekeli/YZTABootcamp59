import React, { useState, useEffect } from 'react';
import usePortfolioStore from '../store/portfolioStore';
import useUiStore from '../store/uiStore';
import AiChat from '../components/ai/AiChat';
import RiskMeter from '../components/ai/RiskMeter';
import AiInsightCard from '../components/ai/AiInsightCard';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import { Bot, Sparkles, AlertTriangle, Lightbulb } from 'lucide-react';
import { aiApi } from '../api/ai';
import { analysisApi } from '../api/analysis';
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
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'risk', 'chat'

  useEffect(() => {
    if (!currentPortfolio?.id || stocks.length === 0) return;

    // Reset previous loaded analyses
    setGeneralAnalysis('');
    setRiskAnalysis('');

    const loadInitialRiskData = async () => {
      try {
        const res = await analysisApi.getRisk(currentPortfolio.id);
        setRiskMetrics(res.data);
      } catch (e) {}
    };

    loadInitialRiskData();
  }, [currentPortfolio, stocks]);

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
    // Map volatility percentage to 1-10 range roughly
    const vol = riskMetrics.volatility || 10;
    return Math.min(10, Math.max(1, vol / 5)); // e.g. 15% vol = 3 score, 30% vol = 6 score, etc.
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

          {activeTab === 'chat' && (
            <AiChat portfolioId={currentPortfolio.id} />
          )}
        </div>
      </div>
    </div>
  );
}
