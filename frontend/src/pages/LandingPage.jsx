import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  TrendingUp, Bot, Zap, ChevronDown, ArrowRight, Sparkles,
  BarChart3, Activity, LayoutDashboard, Sun, Moon,
  Shield, Layers, CheckCircle, Newspaper, RefreshCw, Play, Pause
} from 'lucide-react';
import './LandingPage.css';

/* ── Animated Counter ─────────────────────────────────────────────────── */
function useCountUp(target, duration = 1800, suffix = '') {
  const [count, setCount] = useState('0');
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        if (isNaN(parseFloat(target))) { setCount(target); return; }
        const end = parseFloat(target);
        let startTime = null;
        const step = (ts) => {
          if (!startTime) startTime = ts;
          const p = Math.min((ts - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          const cur = Math.round(end * ease);
          setCount(suffix === '%' ? `%${cur}` : `${cur}${suffix}`);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, suffix]);

  return { ref, count };
}

function StatItem({ target, suffix, label }) {
  const { ref, count } = useCountUp(target, 1800, suffix);
  return (
    <div className="stat-item" ref={ref}>
      <div className="stat-item-num">{count}</div>
      <div className="stat-item-desc">{label}</div>
    </div>
  );
}

/* ── Interactive Stage Mockup Cards ───────────────────────────────────── */
function VisualPortfolio() {
  return (
    <div className="stage-card">
      <div className="stage-card-header">
        <div className="stage-card-title">
          <Activity size={16} style={{ color: 'var(--c-emerald)' }} />
          <span>Canlı Portföy & Borsa Takibi</span>
        </div>
        <span className="live-pill"><span className="live-dot" />BIST & NASDAQ</span>
      </div>

      <div className="portfolio-balance-box">
        <div>
          <span className="balance-label">Toplam Portföy Değeri</span>
          <div className="balance-amount">₺342,850.00</div>
        </div>
        <div className="balance-badge positive">
          <TrendingUp size={14} /> +₺42,650 (+14.2%)
        </div>
      </div>

      <div className="stocks-mini-grid">
        {[
          { ticker: 'THYAO', price: '₺312.50', chg: '+3.4%', pos: true },
          { ticker: 'BIST100', price: '₺9,840.20', chg: '+1.1%', pos: true },
          { ticker: 'EREGL', price: '₺46.80', chg: '-0.8%', pos: false },
        ].map((s, i) => (
          <div key={i} className="stock-mini-card">
            <div className="stock-ticker-row">
              <span className="stock-ticker">{s.ticker}</span>
              <span className={`stock-chg ${s.pos ? 'pos' : 'neg'}`}>{s.chg}</span>
            </div>
            <div className="stock-price">{s.price}</div>
          </div>
        ))}
      </div>

      <div className="chart-preview">
        <div className="chart-preview-label">30 Günlük Getiri İvmesi</div>
        <div className="chart-bars-row">
          {[35, 48, 42, 65, 58, 76, 70, 88, 82, 94, 90, 100].map((h, i) => (
            <div key={i} className="preview-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VisualAgents() {
  const agents = [
    { label: 'Portföy Analisti', status: 'Tamamlandı', msg: 'Varlık dağılımı: %42 THYAO, %28 EREGL, %30 Nakit', color: 'var(--c-emerald)', state: 'done' },
    { label: 'Risk Yöneticisi', status: 'Tamamlandı', msg: 'Sharpe Oranı: 2.34 · Volatilite: %12.3 (Düşük)', color: 'var(--c-blue)', state: 'done' },
    { label: 'Sentiment Ajanı', status: 'Taranıyor...', msg: 'Bloomberg HT & KAP haberleri işleniyor', color: 'var(--c-purple)', state: 'active' },
    { label: 'Baş Orkestratör', status: 'Beklemede', msg: 'Ajan raporları sentezlenerek strateji oluşturulacak', color: 'var(--c-amber)', state: 'wait' },
  ];
  return (
    <div className="stage-card">
      <div className="stage-card-header">
        <div className="stage-card-title">
          <Bot size={16} style={{ color: 'var(--c-purple)' }} />
          <span>Multi-Agent AI Komuta Merkezi</span>
        </div>
        <span className="live-pill purple"><span className="live-dot purple" />4 AKTİF AJAN</span>
      </div>

      <div className="agents-live-list">
        {agents.map((a, i) => (
          <div key={i} className="agent-live-row" style={{ animationDelay: `${i * 0.12}s` }}>
            <div className="agent-live-avatar" style={{ background: `${a.color}22`, color: a.color }}>
              <Bot size={16} />
            </div>
            <div className="agent-live-details">
              <div className="agent-live-head">
                <span className="agent-live-name">{a.label}</span>
                <span className="agent-live-badge" style={{ color: a.color, background: `${a.color}15` }}>
                  {a.status}
                </span>
              </div>
              <div className="agent-live-msg">{a.msg}</div>
            </div>
            <div className="agent-live-state">
              {a.state === 'done' && <CheckCircle size={16} style={{ color: 'var(--c-emerald)' }} />}
              {a.state === 'active' && <RefreshCw size={16} className="spin-icon" style={{ color: 'var(--c-purple)' }} />}
              {a.state === 'wait' && <div className="pulse-dots"><span /><span /><span /></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisualRisk() {
  return (
    <div className="stage-card">
      <div className="stage-card-header">
        <div className="stage-card-title">
          <BarChart3 size={16} style={{ color: 'var(--c-blue)' }} />
          <span>Risk & Performans Analizi</span>
        </div>
        <span className="live-pill blue"><span className="live-dot blue" />MATEMATİKSEL</span>
      </div>

      <div className="risk-dial-container">
        <div className="risk-dial-svg-wrap">
          <svg viewBox="0 0 140 80" className="risk-svg">
            <path d="M 15 70 A 55 55 0 0 1 125 70" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
            <path d="M 15 70 A 55 55 0 0 1 125 70" fill="none" stroke="url(#risk-grad-4)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray="172" strokeDashoffset="48"
            />
            <defs>
              <linearGradient id="risk-grad-4" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--c-emerald)" />
                <stop offset="100%" stopColor="var(--c-blue)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="risk-dial-text">
            <span className="dial-score">2.34</span>
            <span className="dial-label">Sharpe Oranı</span>
          </div>
        </div>
      </div>

      <div className="risk-grid-2x2">
        {[
          { label: 'Volatilite (30G)', val: '%12.3', desc: 'Düşük Risk', color: 'var(--c-emerald)' },
          { label: 'Maks. Kayıp (Drawdown)', val: '-8.3%', desc: 'Kontrollü', color: 'var(--c-blue)' },
          { label: 'Sektör Çeşitlendirmesi', val: '8.4 / 10', desc: 'Dengeli', color: 'var(--c-purple)' },
          { label: 'What-If Risk Skoru', val: 'A+', desc: 'Güçlü Dayanıklılık', color: 'var(--c-amber)' },
        ].map((m, i) => (
          <div key={i} className="risk-mini-card">
            <span className="risk-mini-label">{m.label}</span>
            <div className="risk-mini-val" style={{ color: m.color }}>{m.val}</div>
            <span className="risk-mini-desc">{m.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisualNews() {
  const news = [
    { ticker: 'THYAO', headline: 'THY yeni filo yatırımıyla yolcu kapasitesini artırıyor', score: 88, pos: true, src: 'Bloomberg HT' },
    { ticker: 'BIST100', headline: 'Merkez Bankası faiz kararı sonrası borsada yükseliş', score: 72, pos: true, src: 'Hürriyet Ekonomi' },
    { ticker: 'EREGL', headline: 'Küresel çelik talebinde kısa vadeli durgunluk sinyali', score: 31, pos: false, src: 'Dünya Gazetesi' },
  ];
  return (
    <div className="stage-card">
      <div className="stage-card-header">
        <div className="stage-card-title">
          <Newspaper size={16} style={{ color: 'var(--c-amber)' }} />
          <span>Haber Sentiment & Duygu Analizi</span>
        </div>
        <span className="live-pill amber"><span className="live-dot amber" />RSS AKIŞI</span>
      </div>

      <div className="news-feed-list">
        {news.map((n, i) => (
          <div key={i} className="news-feed-card">
            <div className="news-feed-top">
              <span className={`news-ticker-tag ${n.pos ? 'pos' : 'neg'}`}>{n.ticker}</span>
              <span className="news-feed-src">{n.src}</span>
            </div>
            <div className="news-feed-headline">{n.headline}</div>
            <div className="news-feed-sentiment">
              <div className="sentiment-label">AI Duygu Skoru</div>
              <div className="sentiment-bar-wrap">
                <div className="sentiment-bar-fill" style={{ width: `${n.score}%`, background: n.pos ? 'var(--c-emerald)' : 'var(--c-red)' }} />
              </div>
              <span className={`sentiment-score-text ${n.pos ? 'pos' : 'neg'}`}>%{n.score} {n.pos ? 'Pozitif' : 'Negatif'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Ultra-Premium Landing Page Component ────────────────────────── */
export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('yz_theme') || 'dark');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('yz_theme', theme);
  }, [theme]);

  /* Scroll reveal observer */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('is-visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal-on-scroll').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* Auto-advance stage timer */
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  const features = [
    {
      num: '01',
      tag: 'Portföy Takibi',
      title: 'Tüm borsalar ve varlıklar tek ekranda',
      desc: 'BIST 100, NYSE ve NASDAQ hisselerinizi ekleyin. Canlı piyasa verileri ile kâr/zarar durumunuzu, maliyetlerinizi ve ağırlık dağılımınızı anlık takip edin.',
      bullets: [
        'BIST & Dünya borsalarında canlı hisse takibi',
        'Otomatik kâr / zarar ve maliyet hesabı',
        'Görsel portföy varlık dağılım grafiği'
      ],
      color: 'var(--c-emerald)',
      icon: <Activity size={18} />,
      visual: <VisualPortfolio />
    },
    {
      num: '02',
      tag: 'Multi-Agent AI',
      title: '4 uzman yapay zeka ajanı ortaklaşa çalışır',
      desc: 'Portföyünüzü tek bir prompt ile değil; Portföy Analisti, Risk Yöneticisi, Sentiment Ajanı ve Baş Orkestratör adındaki 4 uzman ajan ile eş zamanlı analiz edin.',
      bullets: [
        'Portföy Analisti: Varlık ve maliyet analizi',
        'Risk Yöneticisi: Sharpe ve volatilite hesabı',
        'Baş Orkestratör: Uzman raporlarını harmanlayan stratejist'
      ],
      color: 'var(--c-purple)',
      icon: <Bot size={18} />,
      visual: <VisualAgents />
    },
    {
      num: '03',
      tag: 'Risk Metrikleri',
      title: 'Riskinizi matematiksel modellerle ölçün',
      desc: 'Tahminlerle değil, Sharpe Oranı, Maksimum Kayıp (Drawdown) ve volatilite simülasyonları ile portföyünüzün dayanıklılığını test edin.',
      bullets: [
        'Sharpe ve Sortino oranları',
        'What-If sanal alım/satım simülasyonu',
        'Sektörel çeşitlendirme risk skoru'
      ],
      color: 'var(--c-blue)',
      icon: <BarChart3 size={18} />,
      visual: <VisualRisk />
    },
    {
      num: '04',
      tag: 'Haber Analizi',
      title: 'Piyasa haberlerini tarayan Sentiment AI',
      desc: 'Sentiment AI ajanı finansal RSS kanallarını (Bloomberg HT, KAP, Hürriyet Ekonomi vb.) tarar ve haberlerin portföyünüzdeki hisselere etkisini anlık puanlar.',
      bullets: [
        'Canlı finansal haber akış taraması',
        'Hisse bazlı duygu ve sentiment skoru (%0-100)',
        'Sektörel fırsat ve tehdit uyarıları'
      ],
      color: 'var(--c-amber)',
      icon: <Newspaper size={18} />,
      visual: <VisualNews />
    },
  ];

  const currentFeat = features[activeTab];

  const faqData = [
    {
      q: 'YatırımZekası nedir ve geleneksel portföy takip araçlarından farkı ne?',
      a: 'YatırımZekası sadece portföyünüzün kâr/zararını göstermekle kalmaz; arka planda çalışan 4 farklı Yapay Zeka Ajanı sayesinde varlık dağılımınızı, volatilite risklerinizi ve güncel borsa haberlerinin duyarlık analizini harmanlayarak size özel profesyonel raporlar sunar.',
    },
    {
      q: 'Sistem ücretsiz mi? Hangi borsaları destekliyor?',
      a: 'Evet, YatırımZekası YZTA Bootcamp 2026 kapsamında tamamen ücretsiz bir platformdur. BIST (Borsa İstanbul), NYSE, NASDAQ, LSE ve Frankfurt borsalarında anlık hisse senedi takibi yapabilirsiniz.',
    },
    {
      q: 'Yapay Zeka (Multi-Agent) mimarisi nasıl çalışır?',
      a: 'Sistem monolitik tek bir yapay zeka yerine işi 4 uzman ajana böler: Portföy Analisti varlık dağılımınızı incelemekte, Risk Yöneticisi Sharpe oranı ve volatiliteyi hesaplamakta, Piyasa Sentiment Ajanı haberleri puanlamakta, Baş Orkestratör ise tüm verileri sentezleyip anlaşılır bir strateji raporu üretmektedir.',
    },
    {
      q: 'Yapay zeka tavsiyeleri yatırım tavsiyesi yerine geçer mi?',
      a: 'Hayır. Sistem tamamen veri analitiği, risk simülasyonları ve haber duygu özetleri üretir. Üretilen analizler bilgilendirme amaçlıdır ve kesinlikle yasal yatırım tavsiyesi niteliği taşımaz.',
    },
    {
      q: 'Veri güvenliği ve hesabımın gizliliği nasıl sağlanıyor?',
      a: 'Kullanıcı verileri JWT tabanlı 256-bit şifrelenmiş kimlik doğrulama mimarisi ve bcrypt parola hashleme algoritmaları ile korunur. Finansal verileriniz 3. taraflarla asla paylaşılmaz.',
    },
  ];

  return (
    <div className="landing-container">

      {/* ── Floating Capsule Navbar ────────────────────────────────────── */}
      <header className="landing-navbar">
        <div className="nav-content">
          <Link to="/" className="brand-logo">
            <div className="brand-icon-box"><TrendingUp size={18} /></div>
            <div className="brand-title">Yatırım<span>Zekası</span></div>
          </Link>
          <ul className="nav-links">
            <li><a href="#features">Özellikler</a></li>
            <li><a href="#showcase">Canlı Deneyim</a></li>
            <li><a href="#ai-agents">Multi-Agent AI</a></li>
            <li><a href="#faq">SSS</a></li>
          </ul>
          <div className="nav-actions">
            <button onClick={toggleTheme} className="btn-theme-toggle" aria-label="Tema değiştir">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-nav-start">
                <LayoutDashboard size={15} /> Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-nav-login">Giriş Yap</Link>
                <Link to="/register" className="btn-nav-start">
                  Kayıt Ol <ArrowRight size={15} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section (Ultra-Premium Obsidian Canvas) ───────────────── */}
      <section className="hero-section">
        <div className="hero-mesh">
          <div className="mesh-blob mesh-blob-1" />
          <div className="mesh-blob mesh-blob-2" />
          <div className="mesh-blob mesh-blob-3" />
        </div>
        <div className="hero-inner">
          <h1 className="hero-headline" style={{ marginTop: '1.5rem' }}>
            Borsa Portföyünüzü<br />
            <span className="hero-gradient-text">Yapay Zekâ Ajanları</span><br />
            ile Yönetin
          </h1>
          <p className="hero-subheadline">
            4 uzman AI ajanı; volatilitenizi, Sharpe oranınızı ve piyasa haberlerini eş zamanlı analiz ederek
            size özel stratejik raporlar üretir.
          </p>
          <div className="hero-cta-group">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-hero-main">
                <LayoutDashboard size={18} /> Dashboard'a Git
              </Link>
            ) : (
              <Link to="/register" className="btn-hero-main">
                Hemen Başla <ArrowRight size={18} />
              </Link>
            )}
          </div>

          {/* Animated Conic Gradient Dashboard Mockup */}
          <div className="mockup-frame reveal-on-scroll">
            <div className="mockup-gradient-border">
              <div className="mockup-inner">
                <div className="mockup-header">
                  <div className="mockup-dots">
                    <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
                  </div>
                  <div className="mockup-url-bar">yatirimzekasi.com/dashboard</div>
                  <div style={{ width: 40 }} />
                </div>
                <div className="mockup-body">
                  <div className="mockup-left">
                    <div className="mockup-metrics">
                      {[
                        { l: 'Portföy Değeri', v: '₺342,850', b: '▲ +14.2%', bc: true },
                        { l: 'Sharpe Oranı', v: '2.34', b: 'Mükemmel', bc: true },
                        { l: 'AI Risk Skoru', v: 'Düşük', b: 'Çeşitlendirilmiş', bc: null },
                      ].map((m, i) => (
                        <div key={i} className="metric-box">
                          <div className="metric-label">{m.l}</div>
                          <div className="metric-val" style={m.bc === null ? { color: 'var(--c-purple)' } : {}}>{m.v}</div>
                          <div className={`metric-badge ${m.bc === true ? 'positive' : ''}`}
                            style={m.bc === null ? { color: 'var(--c-purple)', background: 'rgba(139,92,246,0.1)' } : {}}>{m.b}</div>
                        </div>
                      ))}
                    </div>
                    <div className="chart-sim">
                      {[40, 55, 45, 70, 62, 85, 78, 92, 88, 96].map((h, i) => (
                        <div key={i} className="chart-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />
                      ))}
                    </div>
                  </div>
                  <div className="mockup-right">
                    {[
                      { cls: 'purple', icon: <Bot size={14} />, title: 'Orkestratör', msg: '"THYAO ağırlığı %42 — rebalancing önerilir."' },
                      { cls: 'emerald', icon: <TrendingUp size={14} />, title: 'Sentiment', msg: '"Havacılık sektörü: %84 Pozitif."' },
                      { cls: 'blue', icon: <Shield size={14} />, title: 'Risk Ajanı', msg: '"Max Drawdown: -8.3%. Kontrollü."' },
                    ].map((c, i) => (
                      <div key={i} className="ai-card">
                        <div className={`ai-card-header ${c.cls}`}>{c.icon} {c.title}</div>
                        <div className="ai-card-text">{c.msg}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar Section ──────────────────────────────────────────── */}
      <section className="stats-section" id="metrics">
        <div className="stats-inner">
          <StatItem target="4" suffix="+" label="Uzman AI Ajanı" />
          <div className="stats-divider" />
          <StatItem target="5" suffix="+" label="Küresel Borsa" />
          <div className="stats-divider" />
          <div className="stat-item">
            <div className="stat-item-num stat-special">&lt;200ms</div>
            <div className="stat-item-desc">Analiz Hızı</div>
          </div>
          <div className="stats-divider" />
          <StatItem target="100" suffix="%" label="JWT Şifreli" />
        </div>
      </section>

      {/* ── Linear-Style Bento Grid Features Section ────────────────────── */}
      <section className="bento-section" id="features">
        <div className="section-container">
          <div className="section-header reveal-on-scroll">
            <div className="section-tag">Neden YatırımZekası?</div>
            <h2 className="section-title">Geleneksel takip araçlarını unutun</h2>
            <p className="section-desc">
              Sadece sayısal kâr/zarar değil — portföyünüzün arkasındaki yapay zeka zekasını ve matematiksel risk gücünü keşfedin.
            </p>
          </div>

          <div className="bento-grid reveal-on-scroll">
            <div className="bento-card bento-wide">
              <div className="bento-glow bento-glow-purple" />
              <div className="bento-icon icon-purple"><Bot size={24} /></div>
              <h3 className="bento-title">Çoklu Yapay Zeka Ajanları Mimarisi</h3>
              <p className="bento-desc">
                Portföy Analisti, Risk Yöneticisi ve Piyasa Sentiment Ajanı verilerinizi bağımsız olarak inceler.
                Baş Orkestratör bu uzman raporları harmanlayarak size özel finansal strateji üretir.
              </p>
            </div>

            <div className="bento-card">
              <div className="bento-glow bento-glow-emerald" />
              <div className="bento-icon icon-emerald"><Activity size={24} /></div>
              <h3 className="bento-title">Anlık Borsa Takibi</h3>
              <p className="bento-desc">
                yfinance entegrasyonu ile BIST 100, NYSE ve NASDAQ hisselerinin canlı piyasa değerlerini anlık görüntüleyin.
              </p>
            </div>

            <div className="bento-card">
              <div className="bento-glow bento-glow-blue" />
              <div className="bento-icon icon-blue"><BarChart3 size={24} /></div>
              <h3 className="bento-title">Sharpe & Risk Metrikleri</h3>
              <p className="bento-desc">
                Volatilite, Sharpe Oranı, Max Drawdown ve çeşitlendirme skorlarını matematiksel modellerle ölçün.
              </p>
            </div>

            <div className="bento-card bento-wide">
              <div className="bento-glow bento-glow-amber" />
              <div className="bento-icon icon-amber"><Zap size={24} /></div>
              <h3 className="bento-title">What-If Simülasyonu & AI Rebalancing</h3>
              <p className="bento-desc">
                "100 lot THYAO daha alsaydım risk skorum nasıl değişirdi?" sorusunu sanal olarak test edin.
                Yapay zekanın ideal portföy dengeleme önerilerini alın.
              </p>
            </div>

            <div className="bento-card">
              <div className="bento-glow bento-glow-indigo" />
              <div className="bento-icon icon-indigo"><Layers size={24} /></div>
              <h3 className="bento-title">Haber Duygu Analizi</h3>
              <p className="bento-desc">
                Finansal RSS akışlarını (Bloomberg HT, KAP, Hürriyet Ekonomi) tarayan Sentiment AI haberleri anlık puanlar.
              </p>
            </div>

            <div className="bento-card">
              <div className="bento-glow bento-glow-slate" />
              <div className="bento-icon icon-slate"><Shield size={24} /></div>
              <h3 className="bento-title">Kurumsal Güvenlik</h3>
              <p className="bento-desc">
                JWT + bcrypt ile şifrelenmiş kimlik doğrulama. Finansal verileriniz 3. taraflarla asla paylaşılmaz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Product Stage Section ───────────────────────────── */}
      <section className="showcase-section" id="showcase">
        <div className="section-container">
          <div className="section-header reveal-on-scroll">
            <div className="section-tag">Ürün Özellikleri</div>
            <h2 className="section-title">
              YatırımZekası'nın Öne Çıkan<br />
              <span className="hero-gradient-text">Temel Özellikleri</span>
            </h2>
            <p className="section-desc">
              Portföyünüzü yapay zekâ desteğiyle yönetmeniz için geliştirilmiş gelişmiş araçlar.
            </p>
          </div>

          <div className="showcase-stage-card reveal-on-scroll">
            <div className="showcase-tabs-nav">
              {features.map((feat, idx) => (
                <button
                  key={idx}
                  className={`showcase-tab-btn ${activeTab === idx ? 'active' : ''}`}
                  onClick={() => setActiveTab(idx)}
                >
                  <span style={{ color: feat.color }}>{feat.icon}</span>
                  <span style={{ opacity: 0.6, fontSize: '0.78rem', fontWeight: 800 }}>{feat.num}.</span>
                  <span>{feat.tag}</span>
                  {activeTab === idx && (
                    <div className="showcase-tab-progress" style={{ background: feat.color }} />
                  )}
                </button>
              ))}
              <button
                className="showcase-play-btn"
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? "Otomatik Geçişi Durdur" : "Otomatik Geçişi Başlat"}
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              </button>
            </div>

            <div className="showcase-stage-body">
              <div className="stage-left-content">
                <div className="stage-feature-badge" style={{ color: currentFeat.color, background: `${currentFeat.color}15` }}>
                  {currentFeat.icon} {currentFeat.num} · {currentFeat.tag}
                </div>
                <h3 className="stage-feature-title">{currentFeat.title}</h3>
                <p className="stage-feature-desc">{currentFeat.desc}</p>
                <ul className="stage-feature-bullets">
                  {currentFeat.bullets.map((bullet, i) => (
                    <li key={i}>
                      <CheckCircle size={16} style={{ color: currentFeat.color, flexShrink: 0 }} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="stage-cta-row">
                  <Link to="/register" className="btn-stage-primary" style={{ background: currentFeat.color }}>
                    Hemen Başla <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <div className="stage-right-visual">
                <div key={activeTab} className="stage-visual-container">
                  {currentFeat.visual}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Multi-Agent Architecture Section ───────────────────────────── */}
      <section className="agent-section" id="ai-agents">
        <div className="section-container">
          <div className="section-header reveal-on-scroll">
            <div className="section-tag" style={{ color: 'var(--c-purple)' }}>Ajan Orkestrasyonu</div>
            <h2 className="section-title">Uzman yapay zeka ekibiniz iş başında</h2>
            <p className="section-desc">
              Tek bir prompt yerine 4 uzman ajan portföyünüz için birlikte çalışır.
            </p>
          </div>
          <div className="agents-grid reveal-on-scroll">
            {[
              { initials: 'PA', cls: 'agent-emerald', role: 'Portföy Analisti', desc: 'Varlık dağılımını, maliyetleri ve kâr/zarar performansını değerlendirir.' },
              { initials: 'RM', cls: 'agent-red', role: 'Risk Yöneticisi', desc: 'Volatilite, Sharpe Oranı ve Max Drawdown risk skorlarını hesaplar.' },
              { initials: 'SA', cls: 'agent-blue', role: 'Sentiment Ajanı', desc: 'Finansal RSS akışlarını tarayıp haberlerin hisselerinize etkisini puanlar.' },
              { initials: 'CO', cls: 'agent-purple', role: 'Baş Orkestratör', desc: 'Tüm ajan raporlarını sentezleyerek nihai strateji raporunu sunar.' },
            ].map((a, i) => (
              <div key={i} className="agent-card">
                <div className={`agent-avatar ${a.cls}`}>{a.initials}</div>
                <div className="agent-role">{a.role}</div>
                <div className="agent-desc">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ─────────────────────────────────────────────────── */}
      <section className="faq-section" id="faq">
        <div className="faq-container">
          <div className="section-header reveal-on-scroll">
            <div className="section-tag">Sıkça Sorulan Sorular</div>
            <h2 className="section-title">Aklınıza takılanlar</h2>
          </div>
          <div className="faq-list reveal-on-scroll">
            {faqData.map((item, idx) => (
              <div key={idx} className={`faq-item ${openFaq === idx ? 'faq-open' : ''}`}>
                <button className="faq-question" onClick={() => toggleFaq(idx)}>
                  <span>{item.q}</span>
                  <ChevronDown size={17} className="faq-chevron" />
                </button>
                <div className="faq-answer-wrap">
                  <div className="faq-answer">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────── */}
      <section className="cta-section reveal-on-scroll">
        <div className="cta-mesh">
          <div className="cta-blob cta-blob-1" />
          <div className="cta-blob cta-blob-2" />
        </div>
        <div className="cta-box">
          <h2 className="cta-title">Yatırımlarınıza yapay zeka zekası katın</h2>
          <p className="cta-subtitle">
            Hesabınızı oluşturun, portföyünüzü ekleyin ve ilk AI analiz raporunuzu saniyeler içinde alın.
          </p>
          <div className="cta-actions">
            <Link to="/register" className="btn-hero-main">
              Hesap Oluştur <ArrowRight size={17} />
            </Link>
            <Link to="/login" className="btn-hero-ghost">Giriş Yap</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand-icon-box" style={{ width: 28, height: 28 }}>
              <TrendingUp size={14} color="#fff" />
            </div>
            <span className="footer-brand-name">YatırımZekası</span>
          </div>
          <div className="footer-meta">YZTA Bootcamp 2026 · <strong>Takım 59</strong></div>
          <div className="footer-team">
            PO: Cevahir Atıç &nbsp;·&nbsp; SM: Halit Kılıç &nbsp;·&nbsp; Dev: Cavit Furkan Tekeli
          </div>
        </div>
        <div className="footer-disclaimer">
          ⚠️ <strong>Yasal Uyarı:</strong> Bu uygulama yatırım tavsiyesi vermez. Yapay zekâ çıktıları yalnızca bilgilendirme amaçlıdır.
        </div>
      </footer>
    </div>
  );
}
