"""
AI service: Multi-Agent portfolio analysis, risk assessment, and chat using Google Gemini.
Uses a state-of-the-art Multi-Agent Orchestration architecture with agent memory and tool simulation.
All AI responses are in Turkish.
"""

from datetime import datetime, timezone
import json
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi import HTTPException, status

import google.generativeai as genai

from app.config import settings
from app.models.portfolio import Portfolio
from app.models.stock import PortfolioStock
from app.models.transaction import AiAnalysis
from app.models.user import User
from app.schemas.transaction import AiAnalysisResponse
from app.utils.calculations import calculate_unrealized_pnl
from app.services import analysis_service, news_service

# Configure Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

# Model selection justification:
# Gemini 2.0 Flash is chosen due to its high speed, long context window, native support
# for structured schemas, and robust Turkish language generation capability.
GEMINI_MODEL = "models/gemini-3.1-flash-lite"


def _get_model() -> genai.GenerativeModel:
    """Get configured Gemini model instance."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Yapay zeka servisi yapılandırılmamış. GEMINI_API_KEY ayarlanmalı.",
        )
    return genai.GenerativeModel(GEMINI_MODEL)


async def _get_chat_history(portfolio_id: int, db: AsyncSession, limit: int = 5) -> str:
    """
    Retrieve previous chat conversations for context (Memory system).
    """
    try:
        result = await db.execute(
            select(AiAnalysis)
            .where(
                AiAnalysis.portfolio_id == portfolio_id,
                AiAnalysis.analysis_type.in_(["chat", "general"])
            )
            .order_by(desc(AiAnalysis.created_at))
            .limit(limit)
        )
        analyses = result.scalars().all()
        
        if not analyses:
            return "Daha önceki bir sohbet geçmişi bulunmuyor."
            
        history_lines = []
        # Reverse to get chronological order
        for analysis in reversed(analyses):
            # Parse query from prompt if possible
            query = "Genel Portföy Analizi Talebi"
            if "KULLANICININ SORUSU:" in analysis.prompt:
                query = analysis.prompt.split("KULLANICININ SORUSU:")[-1].strip()
            
            history_lines.append(f"Kullanıcı: {query}")
            history_lines.append(f"Yapılan Analiz/Yanıt: {analysis.response[:300]}...")
            
        return "\n\n".join(history_lines)
    except Exception:
        return "Sohbet geçmişi yüklenirken bir hata oluştu."


async def _build_portfolio_context(
    portfolio_id: int, user: User, db: AsyncSession
) -> tuple[Portfolio, list[PortfolioStock], str]:
    """
    Build a rich text description of the portfolio for AI prompts.
    """
    # Fetch portfolio
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user.id,
        )
    )
    portfolio = result.scalar_one_or_none()

    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portföy bulunamadı.",
        )

    # Fetch stocks
    stock_result = await db.execute(
        select(PortfolioStock).where(PortfolioStock.portfolio_id == portfolio_id)
    )
    stocks = list(stock_result.scalars().all())

    # Build context
    total_cost = 0.0
    total_value = 0.0
    stock_lines = []

    for stock in stocks:
        current_price = stock.current_price or stock.avg_cost
        market_value = stock.total_lots * current_price
        cost = stock.total_lots * stock.avg_cost
        pnl, pnl_pct = calculate_unrealized_pnl(stock.avg_cost, current_price, stock.total_lots)

        total_cost += cost
        total_value += market_value

        stock_lines.append(
            f"  - {stock.symbol} ({stock.name}): "
            f"{stock.total_lots} lot, "
            f"Ortalama Maliyet: {stock.avg_cost:.2f} {stock.currency}, "
            f"Güncel Fiyat: {current_price:.2f} {stock.currency}, "
            f"Piyasa Değeri: {market_value:.2f} {stock.currency}, "
            f"Kâr/Zarar: {pnl:.2f} ({pnl_pct:.2f}%)"
        )

    total_pnl = total_value - total_cost
    total_pnl_pct = ((total_pnl / total_cost) * 100) if total_cost > 0 else 0.0

    context = f"""
PORTFÖY ÖZETİ:
Portföy Adı: {portfolio.name}
Para Birimi: {portfolio.currency}
Toplam Maliyet: {total_cost:.2f} {portfolio.currency}
Toplam Piyasa Değeri: {total_value:.2f} {portfolio.currency}
Toplam Kâr/Zarar: {total_pnl:.2f} {portfolio.currency} ({total_pnl_pct:.2f}%)
Hisse Sayısı: {len(stocks)}

HİSSE SENETLERİ AYRINTILARI:
{chr(10).join(stock_lines) if stock_lines else '  Portföyde henüz hisse senedi yok.'}

Tarih: {datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')}
""".strip()

    return portfolio, stocks, context


# =====================================================================
# MULTI-AGENT ORCHESTRATION SYSTEM
# =====================================================================

class PortfolioAnalystAgent:
    """Agent specialized in performance and asset allocation analysis."""
    
    def __init__(self, model: genai.GenerativeModel):
        self.model = model

    async def run(self, context: str, perf_metrics: dict, allocation: dict) -> str:
        prompt = f"""Sen bir **Portföy Analist Ajanısın**. Görevin portföyün dağılımını ve performans verilerini analiz etmektir.
        
{context}

SİSTEM TARAFINDAN SAĞLANAN ANALİTİK VERİLER:
Performans Metrikleri: {json.dumps(perf_metrics, ensure_ascii=False)}
Dağılım Bilgileri: {json.dumps(allocation, ensure_ascii=False)}

Lütfen bu verileri yorumla:
- Varlık ve sektör bazlı dağılım dengeli mi? (Konsantrasyon riski var mı?)
- En yüksek performans gösteren varlıklar hangileri?
- Ortalama maliyetler ve güncel durum analizi.

Yanıtını Türkçe, profesyonel, analitik ve net maddeler halinde yaz."""
        
        return await _generate_response(self.model, prompt)


class RiskManagerAgent:
    """Agent specialized in risk metrics, volatility, and downside protection."""
    
    def __init__(self, model: genai.GenerativeModel):
        self.model = model

    async def run(self, context: str, risk_metrics: dict) -> str:
        prompt = f"""Sen bir **Risk Yönetimi Ajanısın**. Görevin portföyün risk profilini ve oynaklık metriklerini analiz etmektir.
        
{context}

SİSTEM TARAFINDAN SAĞLANAN RİSK METRİKLERİ:
Risk Verileri: {json.dumps(risk_metrics, ensure_ascii=False)}

Lütfen bu risk verilerini analiz et:
- Portföyün volatilite seviyesi ve risk düzeyi (Düşük/Orta/Yüksek) yorumu.
- Sharpe oranı üzerinden riske göre düzeltilmiş getiri analizi.
- Maksimum kayıp (Max Drawdown) ve çeşitlendirme skoru yorumu.
- Risk azaltıcı önlemler neler olabilir?

Yanıtını Türkçe, net, gerçekçi ve yatırımcıyı koruyucu bir dille yaz."""
        
        return await _generate_response(self.model, prompt)


class MarketNewsAgent:
    """Agent specialized in parsing news and performing financial sentiment analysis."""
    
    def __init__(self, model: genai.GenerativeModel):
        self.model = model

    async def run(self, stocks: list[PortfolioStock]) -> str:
        # Fetch news for stocks in the portfolio
        all_news = []
        for stock in stocks[:5]: # Limit to top 5 stocks to manage context
            news = await news_service.get_stock_news(stock.symbol)
            all_news.extend(news[:2]) # Top 2 news per stock
            
        if not all_news:
            # Get general financial news
            all_news = await news_service.get_financial_news()
            all_news = all_news[:5]

        prompt = f"""Sen bir **Piyasa Duyarlılık (Sentiment) Ajanısın**. Görevin portföydeki şirketler veya genel piyasa hakkında çıkan son haberleri inceleyerek duygu analizi yapmaktır.
        
HABERLER:
{json.dumps(all_news, ensure_ascii=False)}

Lütfen bu haber başlıklarını ve özetlerini analiz ederek:
- Haberlerin genel havasını değerlendir (Pozitif/Negatif/Nötr).
- Portföydeki hisseleri doğrudan etkileyecek önemli bir gelişme var mı?
- Piyasa trendleri yatırımcıyı nasıl etkileyebilir?

Yanıtını Türkçe, özetleyici ve piyasa duyarlılığını yansıtacak şekilde ver."""
        
        return await _generate_response(self.model, prompt)


async def analyze_portfolio(
    portfolio_id: int, user: User, db: AsyncSession
) -> AiAnalysisResponse:
    """
    Comprehensive Multi-Agent analysis of a portfolio.
    Orchestrates PortfolioAnalystAgent, RiskManagerAgent, and MarketNewsAgent.
    """
    portfolio, stocks, context = await _build_portfolio_context(portfolio_id, user, db)
    model = _get_model()
    
    # 1. Gather quantitative analysis from service tools (Tool Calling Simulation)
    perf_metrics = await analysis_service.get_performance_metrics(portfolio_id, user, db)
    allocation = await analysis_service.get_allocation(portfolio_id, user, db)
    risk_metrics = await analysis_service.get_risk_metrics(portfolio_id, user, db)
    
    # 2. Run specialized agents in parallel
    analyst_agent = PortfolioAnalystAgent(model)
    risk_agent = RiskManagerAgent(model)
    news_agent = MarketNewsAgent(model)
    
    analyst_task = analyst_agent.run(context, perf_metrics, allocation)
    risk_task = risk_agent.run(context, risk_metrics)
    news_task = news_agent.run(stocks)
    
    analyst_report, risk_report, news_report = await asyncio.gather(
        analyst_task, risk_task, news_task
    )
    
    # 3. Orchestrator Synthesizer
    synthesis_prompt = f"""Sen bir **Baş Portföy Orkestratörü ve Stratejistisin**. Aşağıda farklı uzman yapay zeka ajanlarının oluşturduğu raporlar bulunmaktadır.
    
{context}

AJAN RAPORLARI:
---
[Portföy Analist Ajanı Raporu]
{analyst_report}

---
[Risk Yönetim Ajanı Raporu]
{risk_report}

---
[Piyasa Duyarlılık Ajanı Raporu]
{news_report}
---

Görevin bu üç raporu sentezleyip yatırımcıya tek bir tutarlı, anlaşılır, zengin ve profesyonel **Portföy Değerlendirme ve Strateji Raporu** sunmaktır.
Lütfen yanıtını şu yapıda oluştur:
1. **Genel Durum & Özet Değerlendirme**: Mevcut durumun kısa özeti.
2. **Dağılım ve Kompozisyon Analizi**: Analist ajanından gelen verilerin sentezi.
3. **Risk Yönetimi ve Oynaklık Skoru**: Risk ajanından gelen volatilite, Sharpe ve drawdown yorumları.
4. **Piyasa Haberleri & Sentiment**: Haber ajansının duygu analizi özetleri.
5. **Stratejik Yol Haritası ve Öneriler**: Yatırımcının uygulayabileceği somut, uygulanabilir tavsiyeler.

Yanıtın sonunda mutlaka hangi ajanların çalıştığına dair küçük bir "Ajan İş Birliği Künyesi" ekle.
Yanıt dili tamamen Türkçe ve son derece profesyonel olmalıdır."""

    try:
        response = await _generate_response(model, synthesis_prompt)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Yapay zeka orkestrasyonu sırasında hata oluştu: {str(e)}",
        )

    # Save analysis
    analysis = AiAnalysis(
        portfolio_id=portfolio.id,
        analysis_type="general",
        prompt=synthesis_prompt,
        response=response,
    )
    db.add(analysis)
    await db.flush()
    await db.refresh(analysis)

    return AiAnalysisResponse(
        id=analysis.id,
        portfolio_id=analysis.portfolio_id,
        analysis_type=analysis.analysis_type,
        response=analysis.response,
        created_at=analysis.created_at,
    )


async def assess_risk(
    portfolio_id: int, user: User, db: AsyncSession
) -> AiAnalysisResponse:
    """
    Specialized Risk Assessment.
    Calls RiskManagerAgent and Synthesizes a risk-focused roadmap.
    """
    portfolio, stocks, context = await _build_portfolio_context(portfolio_id, user, db)
    model = _get_model()
    
    risk_metrics = await analysis_service.get_risk_metrics(portfolio_id, user, db)
    
    risk_agent = RiskManagerAgent(model)
    risk_report = await risk_agent.run(context, risk_metrics)
    
    synthesis_prompt = f"""Sen bir **Risk Yönetimi Uzmanısın**. Aşağıdaki temel analiz ve portföy risk profili doğrultusunda, yatırımcıya özel detaylı bir **Risk Raporu** oluştur.

{context}

RİSK AJANI RAPORU:
{risk_report}

Lütfen bu raporu daha da derinleştirerek şu başlıklarda yatırımcıya sun:
1. **Risk Profil Sınıflandırması**: Yatırımcının risk toleransı ve portföy uyumu.
2. **Hisse Bazlı Konsantrasyon Riski**: Ağırlığı yüksek hisselerin oluşturduğu riskler.
3. **Piyasa ve Likidite Senaryoları**: Olası kriz veya dalgalanma senaryolarında portföyün direnci.
4. **Risk Azaltma & Çeşitlendirme Yol Haritası**: Somut tavsiyeler.

Dil Türkçe ve profesyonel olmalıdır."""

    try:
        response = await _generate_response(model, synthesis_prompt)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Risk analizi sentezlenirken hata oluştu: {str(e)}",
        )

    # Save analysis
    analysis = AiAnalysis(
        portfolio_id=portfolio.id,
        analysis_type="risk",
        prompt=synthesis_prompt,
        response=response,
    )
    db.add(analysis)
    await db.flush()
    await db.refresh(analysis)

    return AiAnalysisResponse(
        id=analysis.id,
        portfolio_id=analysis.portfolio_id,
        analysis_type=analysis.analysis_type,
        response=analysis.response,
        created_at=analysis.created_at,
    )


async def chat(
    portfolio_id: int, question: str, user: User, db: AsyncSession
) -> AiAnalysisResponse:
    """
    Interactive Q&A using Portfolio Context, Memory of previous interactions, and Gemini.
    """
    portfolio, stocks, context = await _build_portfolio_context(portfolio_id, user, db)
    model = _get_model()
    
    # Retrieve previous conversation memory
    chat_history = await _get_chat_history(portfolio_id, db, limit=4)
    
    # Simulating tools: fetch metrics if the user is asking about returns, allocations, or risk
    additional_data = ""
    question_lower = question.lower()
    if any(x in question_lower for x in ["risk", "volatilite", "sharpe", "oynak", "kayıp"]):
        risk_metrics = await analysis_service.get_risk_metrics(portfolio_id, user, db)
        additional_data = f"\nİlgili Risk Metrikleri: {json.dumps(risk_metrics, ensure_ascii=False)}"
    elif any(x in question_lower for x in ["dağılım", "sektör", "oran", "yüzde"]):
        allocation = await analysis_service.get_allocation(portfolio_id, user, db)
        additional_data = f"\nİlgili Dağılım Metrikleri: {json.dumps(allocation, ensure_ascii=False)}"
    elif any(x in question_lower for x in ["kar", "zarar", "maliyet", "pnl", "performans"]):
        perf_metrics = await analysis_service.get_performance_metrics(portfolio_id, user, db)
        additional_data = f"\nİlgili Performans Metrikleri: {json.dumps(perf_metrics, ensure_ascii=False)}"

    prompt = f"""Sen kullanıcının kişisel yatırım asistanısın. Kullanıcının portföyü hakkındaki sorusunu yanıtla.

{context}
{additional_data}

SOHBET GEÇMİŞİ (HAFIZA):
{chat_history}

KULLANICININ YENİ SORUSU:
{question}

Lütfen bu soruya yanıt verirken:
- Varsa sohbet geçmişindeki bağlamı göz önünde bulundur.
- Portföyün güncel durumunu ve hisse senedi detaylarını temel alarak somut rakamlar ve yüzdeler kullan.
- Türkçe, kibar, profesyonel ve finansal okuryazarlığı destekleyen bir tonda yanıt yaz.
- Yatırım tavsiyesi olmadığını hatırlatacak profesyonel duruşu koru."""

    try:
        response = await _generate_response(model, prompt)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Yapay zeka yanıtı alınırken hata oluştu: {str(e)}",
        )

    # Save analysis
    analysis = AiAnalysis(
        portfolio_id=portfolio.id,
        analysis_type="chat",
        prompt=prompt,
        response=response,
    )
    db.add(analysis)
    await db.flush()
    await db.refresh(analysis)

    return AiAnalysisResponse(
        id=analysis.id,
        portfolio_id=analysis.portfolio_id,
        analysis_type=analysis.analysis_type,
        response=analysis.response,
        created_at=analysis.created_at,
    )


async def _generate_response(model: genai.GenerativeModel, prompt: str) -> str:
    """
    Generate a response from Gemini, handling async execution.
    """
    response = await asyncio.to_thread(
        lambda: model.generate_content(prompt)
    )

    if response and response.text:
        return response.text

    raise ValueError("Yapay zekadan yanıt alınamadı.")
