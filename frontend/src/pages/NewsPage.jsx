import React, { useEffect, useState } from 'react';
import usePortfolioStore from '../store/portfolioStore';
import useUiStore from '../store/uiStore';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Newspaper, Search, Bot, ExternalLink } from 'lucide-react';
import { newsApi } from '../api/news';
import { aiApi } from '../api/ai';
import Markdown from 'react-markdown';
import './NewsPage.css';

export default function NewsPage() {
  const { currentPortfolio, stocks } = usePortfolioStore();
  const { addToast } = useUiStore();

  const [news, setNews] = useState([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState('ALL');

  // AI News Impact Analysis state
  const [analyzingNewsId, setAnalyzingNewsId] = useState(null);
  const [impactAnalysis, setImpactAnalysis] = useState('');
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState(null);

  const fetchNewsFeed = async () => {
    setIsLoadingNews(true);
    try {
      let res;
      if (selectedStockSymbol === 'ALL') {
        res = await newsApi.getNews();
      } else {
        res = await newsApi.getStockNews(selectedStockSymbol);
      }
      setNews(res.data || []);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: 'Finans haberleri çekilemedi.',
      });
    } finally {
      setIsLoadingNews(false);
    }
  };

  useEffect(() => {
    fetchNewsFeed();
  }, [selectedStockSymbol, currentPortfolio]);

  const handleAnalyzeImpact = async (newsItem) => {
    if (!currentPortfolio) {
      addToast({
        type: 'error',
        title: 'Hata',
        message: 'Lütfen önce bir portföy seçin.',
      });
      return;
    }

    setSelectedNewsItem(newsItem);
    setImpactAnalysis('');
    setAnalysisModalOpen(true);
    setAnalyzingNewsId(newsItem.title); // use title as temp ID

    try {
      const question = `Aşağıdaki haber başlığı ve özetinin portföyümdeki varlıklarım üzerindeki olası etkilerini değerlendirir misin? Habere göre portföyde riskli bir durum oluşuyor mu?
      
Haber Başlığı: ${newsItem.title}
Haber Özeti: ${newsItem.summary}
Kaynak: ${newsItem.source}`;

      const res = await aiApi.chat(currentPortfolio.id, question);
      setImpactAnalysis(res.data.response);
    } catch (err) {
      setImpactAnalysis('Haber etki analizi yapılamadı. Yapay zeka servisinde bir hata oluştu.');
    } finally {
      setAnalyzingNewsId(null);
    }
  };

  return (
    <div className="news-page-container">
      <div className="news-header">
        <div>
          <h2 className="page-title">Piyasa Haberleri & Etki Analizi</h2>
          <p className="page-subtitle">Türk ve uluslararası finans piyasalarındaki gelişmeler ve portföyünüze etkileri</p>
        </div>

        {stocks.length > 0 && (
          <div className="news-filter-select-wrapper">
            <span className="filter-label">Hisseye Göre Filtrele:</span>
            <select
              value={selectedStockSymbol}
              onChange={(e) => setSelectedStockSymbol(e.target.value)}
              className="news-stock-select font-mono"
            >
              <option value="ALL">Tüm Haberler</option>
              {stocks.map((s) => (
                <option key={s.id} value={s.symbol}>
                  {s.symbol}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoadingNews ? (
        <LoadingSpinner text="Finans kanallarından haberler toplanıyor..." />
      ) : news.length > 0 ? (
        <div className="news-grid">
          {news.map((item, idx) => (
            <div key={idx} className="news-card glassmorphism">
              <div className="news-card-header">
                <span className="news-source">{item.source}</span>
                <span className="news-date">{item.published}</span>
              </div>
              <h3 className="news-title">{item.title}</h3>
              <p className="news-summary">{item.summary}</p>
              
              <div className="news-card-actions">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="read-more-link">
                  Habere Git <ExternalLink size={12} />
                </a>
                
                {currentPortfolio && stocks.length > 0 && (
                  <Button
                    onClick={() => handleAnalyzeImpact(item)}
                    variant="ghost"
                    className="btn-sm ai-impact-btn"
                    loading={analyzingNewsId === item.title}
                  >
                    <Bot size={14} /> AI Etki Analizi
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Haber Akışı Bulunamadı"
          message="Şu anda haber kanallarından veri çekilemiyor. Lütfen internet bağlantınızı kontrol edip daha sonra tekrar deneyin."
          icon={Newspaper}
        />
      )}

      {/* AI News Impact Analysis Modal */}
      {selectedNewsItem && (
        <Modal
          isOpen={analysisModalOpen}
          onClose={() => setAnalysisModalOpen(false)}
          title="Yapay Zekâ Haber Etki Analizi"
          size="md"
        >
          <div className="news-impact-modal-body">
            <div className="news-reference-box">
              <h5>{selectedNewsItem.title}</h5>
              <p>{selectedNewsItem.summary}</p>
              <span className="news-ref-source">{selectedNewsItem.source}</span>
            </div>

            <div className="ai-analysis-response-section">
              <div className="analysis-header-row mb-3">
                <Bot size={18} className="text-green" />
                <span className="font-bold">Yapay Zekâ Değerlendirmesi:</span>
              </div>

              {analyzingNewsId ? (
                <div style={{ padding: '2rem 0' }}>
                  <LoadingSpinner text="Haberin portföyünüze olan etkisi analiz ediliyor..." />
                </div>
              ) : (
                <div className="ai-impact-markdown-content">
                  <Markdown className="markdown-content">{impactAnalysis}</Markdown>
                </div>
              )}
            </div>

            <div className="form-actions mt-4">
              <Button onClick={() => setAnalysisModalOpen(false)} variant="primary">
                Kapat
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
