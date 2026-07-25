import { useState } from 'react';
import { Bot, Maximize2, MessageCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortfolioStore } from '../../store/portfolioStore';
import AiChat from './AiChat';
import './FloatingAiAssistant.css';

export default function FloatingAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const currentPortfolio = usePortfolioStore(
    (state) => state.currentPortfolio
  );

  const openFullPage = () => {
    setIsOpen(false);
    navigate('/ai-insights');
  };

  return (
    <>
      {isOpen && (
        <section
          className="floating-ai-panel"
          aria-label="Yapay zekâ yatırım asistanı"
        >
          <div className="floating-ai-panel__header">
            <div className="floating-ai-panel__identity">
              <span className="floating-ai-panel__icon">
                <Bot size={20} />
              </span>

              <div>
                <strong>Yatırım Asistanı</strong>
                <small>
                  {currentPortfolio?.name || 'Portföy seçilmedi'}
                </small>
              </div>
            </div>

            <div className="floating-ai-panel__actions">
              <button
                type="button"
                onClick={openFullPage}
                title="Tam ekran AI sayfasına git"
                aria-label="Tam ekran AI sayfasına git"
              >
                <Maximize2 size={17} />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Asistanı kapat"
                aria-label="Asistanı kapat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="floating-ai-panel__content">
            {currentPortfolio?.id ? (
              <AiChat portfolioId={currentPortfolio.id} />
            ) : (
              <div className="floating-ai-panel__empty">
                <MessageCircle size={34} />
                <strong>Önce bir portföy oluşturun</strong>
                <p>
                  Asistanın analiz yapabilmesi için aktif bir portföyünüz
                  bulunmalıdır.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        className={`floating-ai-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Yapay zekâ asistanını kapat' : 'Yapay zekâ asistanını aç'}
      >
        {isOpen ? <X size={23} /> : <Bot size={23} />}
        {!isOpen && <span>AI Asistan</span>}
      </button>
    </>
  );
}