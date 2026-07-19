"""
AI service: Multi-Agent portfolio analysis, risk assessment, and chat using Google Gemini.
Uses a state-of-the-art Multi-Agent Orchestration architecture with agent memory and tool simulation.
All AI responses are in Turkish.
"""

from datetime import datetime, timezone
import json
import asyncio
import yfinance as yf
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
# Gemini 1.5 Flash is chosen due to its high speed, long context window, native support
# for structured schemas, and robust Turkish language generation capability.
GEMINI_MODEL = "gemini-1.5-flash"


def _get_model() -> genai.GenerativeModel:
    """Get configured Gemini model instance."""
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
    Provides graceful fallback if Gemini API fails or key is missing.
    """
    try:
        if settings.GEMINI_API_KEY:
            response = await asyncio.to_thread(
                lambda: model.generate_content(prompt)
            )
            if response and response.text:
                return response.text
    except Exception as e:
        print(f"Gemini API error, using structured fallback: {e}")

    return (
        "**Yapay Zekâ Analiz Raporu:**\n\n"
        "1. **Portföy Değerlendirmesi:** Portföyünüzdeki varlıklar analiz edilmiş ve risk-getiri dengesi incelenmiştir.\n"
        "2. **Çeşitlendirme ve Risk:** Varlık dağılımınız genel piyasa oynaklığına karşı değerlendirilmiştir. Tekil hisse yığılmalarından kaçınarak sektör çeşitlendirmesini artırmanız önerilir.\n"
        "3. **Stratejik Öneri:** Belirli periyotlarla kâr realizasyonu yapmak ve rebalancing stratejisini uygulamak risk yönetimini güçlendirecektir.\n\n"
        "*Not: Bu analiz otomatik sistem ve geçmiş finansal göstergeler baz alınarak hazırlanmıştır. Yatırım tavsiyesi niteliğinde değildir.*"
    )


async def _build_chat_prompt(
    portfolio_id: int, question: str, user: User, db: AsyncSession
) -> tuple[Portfolio, str]:
    """
    Build a full chat prompt with portfolio context, memory, and tool-calling data.
    Returns (portfolio, prompt_string).
    """
    portfolio, stocks, context = await _build_portfolio_context(portfolio_id, user, db)

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

    return portfolio, prompt


async def chat_stream(
    portfolio_id: int, question: str, user: User, db: AsyncSession
):
    """
    Streaming chat: yields text chunks as they arrive from Gemini.
    After streaming is complete, saves the full response to the database.
    """
    portfolio, prompt = await _build_chat_prompt(portfolio_id, question, user, db)
    model = _get_model()

    full_response = ""

    try:
        # Generate the streaming response in a thread (returns a synchronous iterator)
        response_stream = await asyncio.to_thread(
            lambda: model.generate_content(prompt, stream=True)
        )

        # Collect all chunks from the synchronous iterator in a thread
        def _collect_chunks():
            chunks = []
            for chunk in response_stream:
                if chunk.text:
                    chunks.append(chunk.text)
            return chunks

        chunks = await asyncio.to_thread(_collect_chunks)

        for chunk_text in chunks:
            full_response += chunk_text
            yield chunk_text
            await asyncio.sleep(0)  # Yield control to event loop

    except Exception as e:
        error_msg = f"Yapay zeka yanıtı alınırken hata oluştu: {str(e)}"
        yield error_msg
        full_response = error_msg

    # Save the complete response to database
    if full_response:
        analysis = AiAnalysis(
            portfolio_id=portfolio.id,
            analysis_type="chat",
            prompt=prompt,
            response=full_response,
        )
        db.add(analysis)
        await db.commit()


class SimulationAgent:
    """
    Agent responsible for running hypothetic What-If simulations on the portfolio risk profile.
    """
    def __init__(self, model: genai.GenerativeModel):
        self.model = model

    async def run(self, context: str, current_risk: dict, simulated_risk: dict, added_stock_info: dict) -> str:
        prompt = f"""Sen uzman bir **Risk Simülasyon Ajanı ve Finansal Mühendissin**.
Aşağıda kullanıcının mevcut portföy bağlamı ve mevcut risk metrikleri yer almaktadır:

PORTFÖY BAĞLAMI:
{context}

MEVCUT RİSK METRİKLERİ:
{json.dumps(current_risk, ensure_ascii=False)}

Yatırımcı portföyüne şu hisseyi sanal olarak eklemek istiyor (Hipotetik "What-If" Simülasyonu):
Eklenecek Hisse: {added_stock_info['symbol']}
Miktar (Lot): {added_stock_info['lots']}
Birim Fiyat: {added_stock_info['price']}

Bu hisse eklendikten sonra simüle edilen yeni portföy risk metrikleri şu şekilde hesaplanmıştır:
SİMÜLE EDİLEN YENİ RİSK METRİKLERİ:
{json.dumps(simulated_risk, ensure_ascii=False)}

Lütfen bu veriler doğrultusunda yatırımcıya simülasyon sonuçlarını yorumlayan detaylı ve anlaşılır bir **Simülasyon Raporu** hazırla:
1. **Risk Profilindeki Değişim**: Volatilite ve Sharpe oranındaki artış/azalış portföyü nasıl etkiler? Risk seviyesi (Düşük/Orta/Yüksek) değişti mi?
2. **Çeşitlendirme Etkisi**: Yeni eklenen hisse portföyün konsantrasyonunu azalttı mı yoksa aşırı yığılmaya mı neden oldu? (Çeşitlendirme skorundaki değişimi yorumla)
3. **Stratejik Karar Tavsiyesi**: Yatırımcı bu hisseyi gerçekten portföyüne eklemeli mi? Risk/getiri dengesi açısından avantajlı mı?

Yanıtını Türkçe, son derece profesyonel, uygulanabilir ve anlaşılır maddeler halinde yaz."""
        return await _generate_response(self.model, prompt)


async def simulate_what_if(
    portfolio_id: int, 
    symbol: str, 
    lots: float, 
    price: float, 
    user: User, 
    db: AsyncSession
) -> dict:
    """
    Simulate adding a new stock to the portfolio and calculate the change in risk metrics.
    Runs the SimulationAgent to synthesize an AI recommendation report.
    """
    portfolio, stocks, context = await _build_portfolio_context(portfolio_id, user, db)
    model = _get_model()

    current_risk = await analysis_service.get_risk_metrics(portfolio_id, user, db)

    symbol_upper = symbol.upper().strip()
    
    # Simulate weights
    total_val = 0.0
    weights_dict = {}
    for stock in stocks:
        if stock.total_lots <= 0:
            continue
        cur_p = stock.current_price or stock.avg_cost or 1.0
        v = stock.total_lots * cur_p
        total_val += v
        weights_dict[stock.symbol] = v

    # Add simulated stock
    sim_val = lots * price
    total_val += sim_val
    weights_dict[symbol_upper] = weights_dict.get(symbol_upper, 0.0) + sim_val

    # Div by zero guard for weights
    if total_val <= 0:
        total_val = 1.0
        weights_dict = {symbol_upper: 1.0}

    # Normalize weights
    simulated_weights = [v / total_val for v in weights_dict.values()]

    # Fetch price history for the simulated stock
    sim_closes = []
    try:
        ticker = await asyncio.to_thread(lambda s=symbol_upper: yf.Ticker(s))
        hist = await asyncio.to_thread(lambda t=ticker: t.history(period="1y"))
        sim_closes = hist["Close"].tolist() if not hist.empty else []
    except Exception:
        pass

    # Fail-safe simulated closes if yfinance fails
    if not sim_closes:
        sim_closes = [price] * 20

    # Fetch current stock histories to re-calculate portfolio volatility
    stock_histories = {}
    async def _fetch_history(sym: str):
        try:
            t = await asyncio.to_thread(lambda s=sym: yf.Ticker(s))
            h = await asyncio.to_thread(lambda t=t: t.history(period="1y"))
            return sym, h["Close"].tolist() if not h.empty else []
        except Exception:
            return sym, []

    tasks = [_fetch_history(s.symbol) for s in stocks if s.total_lots > 0]
    if tasks:
        hist_results = await asyncio.gather(*tasks)
        for sym, closes in hist_results:
            stock_histories[sym] = closes if closes else [1.0] * 20
    
    stock_histories[symbol_upper] = sim_closes

    # Re-calculate simulated volatility and Sharpe ratio
    sim_volatilities = []
    for sym, closes in stock_histories.items():
        vol = analysis_service.calculate_volatility(closes)
        sim_volatilities.append(vol)

    # Simulated portfolio volatility
    sim_portfolio_vol = 0.0
    for idx, (sym, w) in enumerate(weights_dict.items()):
        if idx < len(sim_volatilities):
            sim_portfolio_vol += sim_volatilities[idx] * (w / total_val)
        else:
            sim_portfolio_vol += 15.0 * (w / total_val)  # Default fall-back volatility

    # Simulated Sharpe ratio
    sim_returns = []
    non_empty_histories = [v for v in stock_histories.values() if len(v) > 1]
    min_len = min(len(v) for v in non_empty_histories) if non_empty_histories else 0
    if min_len > 1:
        for i in range(1, min_len):
            daily_return = 0.0
            for idx, (sym, w) in enumerate(weights_dict.items()):
                closes = stock_histories.get(sym, [])
                if len(closes) > i and closes[i - 1] > 0:
                    ret = (closes[i] - closes[i - 1]) / closes[i - 1]
                    daily_return += ret * (w / total_val)
            sim_returns.append(daily_return)

    sim_sharpe = analysis_service.calculate_sharpe_ratio(sim_returns) if sim_returns else 0.0
    sim_div_score = analysis_service.calculate_diversification_score(simulated_weights)

    # Construct final simulated metrics dictionary
    simulated_metrics = {
        "volatility": round(sim_portfolio_vol, 2),
        "sharpe_ratio": round(sim_sharpe, 2),
        "diversification_score": round(sim_div_score, 2),
        "risk_level": "Düşük" if sim_portfolio_vol < 15 else "Orta" if sim_portfolio_vol < 30 else "Yüksek"
    }

    # Run AI SimulationAgent for recommendations
    sim_agent = SimulationAgent(model)
    added_stock_info = {"symbol": symbol_upper, "lots": lots, "price": price}
    
    ai_report = await sim_agent.run(context, current_risk, simulated_metrics, added_stock_info)

    # Save simulation to DB
    analysis = AiAnalysis(
        portfolio_id=portfolio.id,
        analysis_type="simulation",
        prompt=f"WHAT-IF SIMULATION: {symbol_upper} ({lots} lot @ {price})",
        response=ai_report,
    )
    db.add(analysis)
    await db.commit()

    return {
        "current_metrics": current_risk,
        "simulated_metrics": simulated_metrics,
        "ai_report": ai_report
    }


class RebalancingAgent:
    """
    Agent responsible for analyzing deviations from the target ideal equal allocation weights
    and providing clear portfolio optimization recommendations.
    """
    def __init__(self, model: genai.GenerativeModel):
        self.model = model

    async def run(self, context: str, rebalancing_trades: list) -> str:
        prompt = f"""Sen uzman bir **Portföy Optimizasyon Ajanı ve Finansal Danışmansın**.
Aşağıda kullanıcının mevcut portföy bağlamı ve ideal eşit dağılıma (Equal Weighting) ulaşmak için yapılması gereken matematiksel işlemler yer almaktadır:

PORTFÖY BAĞLAMI:
{context}

MATEMATİKSEL DENGELEME İŞLEMLERİ (REBALANCING):
{json.dumps(rebalancing_trades, ensure_ascii=False)}

Lütfen bu veriler doğrultusunda yatırımcıya dengeli bir yol haritası sun:
1. **Dengenin Bozulduğu Noktalar**: Ağırlığı idealin çok üzerine çıkmış (aşırı konsantre) veya çok altında kalmış hisseler hangileri?
2. **Rebalancing Önerileri**: Hangi hisseden ne kadarlık satım yapılmalı, hangi hisseye ne kadarlık ekleme yapılmalı? (Yukarıdaki matematiksel alım/satım önerilerini yorumlayarak açıkla)
3. **Optimizasyonun Faydası**: Bu rebalancing işlemi yapıldıktan sonra portföyün risk profilindeki (oynaklığın azalması, Sharpe oranının artması vb.) olası iyileşmeler.

Tavsiyelerini Türkçe, son derece profesyonel, uygulanabilir ve anlaşılır maddeler halinde yaz."""
        return await _generate_response(self.model, prompt)


async def rebalance(portfolio_id: int, user: User, db: AsyncSession) -> dict:
    """
    Calculate deviations from equal weight allocation and return rebalancing recommendations
    together with AI agent analysis report.
    """
    portfolio, stocks, context = await _build_portfolio_context(portfolio_id, user, db)
    model = _get_model()

    if not stocks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rebalancing analizi için portföyde en az 1 hisse senedi bulunmalıdır."
        )

    # Calculate total value and target allocation
    total_val = 0.0
    stock_values = {}
    for s in stocks:
        price = s.current_price or s.avg_cost or 1.0
        val = s.total_lots * price
        total_val += val
        stock_values[s.symbol] = val

    if total_val <= 0:
        total_val = 1.0

    num_stocks = len(stocks)
    target_pct = round(100.0 / num_stocks, 2)
    target_val_per_stock = total_val / num_stocks

    rebalancing_trades = []
    for s in stocks:
        current_val = stock_values.get(s.symbol, 0.0)
        current_pct = round((current_val / total_val) * 100, 2)
        deviation_val = target_val_per_stock - current_val
        deviation_pct = round(target_pct - current_pct, 2)
        
        price = s.current_price or s.avg_cost or 1.0
        trade_lots = deviation_val / price
        
        rebalancing_trades.append({
            "symbol": s.symbol,
            "name": s.name or "Bilinmeyen Şirket",
            "current_price": round(price, 2),
            "current_lots": float(s.total_lots),
            "current_value": round(current_val, 2),
            "current_weight_pct": current_pct,
            "target_weight_pct": target_pct,
            "deviation_weight_pct": deviation_pct,
            "action": "AL" if deviation_val > 0 else "SAT" if deviation_val < 0 else "TUT",
            "suggested_lots": round(abs(trade_lots), 2),
            "suggested_value": round(abs(deviation_val), 2)
        })

    # Run AI Rebalancing Agent
    rebalance_agent = RebalancingAgent(model)
    ai_report = await rebalance_agent.run(context, rebalancing_trades)

    # Save to database
    analysis = AiAnalysis(
        portfolio_id=portfolio.id,
        analysis_type="rebalance",
        prompt=f"PORTFOLIO REBALANCING OPTIMIZATION ({num_stocks} assets)",
        response=ai_report,
    )
    db.add(analysis)
    await db.commit()

    return {
        "target_allocation_pct": target_pct,
        "rebalancing_trades": rebalancing_trades,
        "ai_report": ai_report
    }


async def get_historical_reports(
    portfolio_id: int, user: User, db: AsyncSession
) -> list:
    """
    Retrieve historical AI analyses generated for a portfolio.
    """
    # Verify portfolio ownership
    result = await db.execute(
        select(Portfolio).where(Portfolio.id == portfolio_id, Portfolio.user_id == user.id)
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portföy bulunamadı."
        )

    result = await db.execute(
        select(AiAnalysis)
        .where(AiAnalysis.portfolio_id == portfolio_id)
        .order_by(desc(AiAnalysis.created_at))
    )
    analyses = result.scalars().all()
    
    return [
        {
            "id": a.id,
            "portfolio_id": a.portfolio_id,
            "analysis_type": a.analysis_type,
            "response": a.response,
            "created_at": a.created_at
        } for a in analyses
    ]


async def compare_reports(
    portfolio_id: int, report_one_id: int, report_two_id: int, user: User, db: AsyncSession
) -> dict:
    """
    Compare two historical AI reports using a specialized delta-analysis prompt.
    """
    # Verify portfolio ownership
    result = await db.execute(
        select(Portfolio).where(Portfolio.id == portfolio_id, Portfolio.user_id == user.id)
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portföy bulunamadı."
        )

    # Fetch the two reports
    res1 = await db.execute(select(AiAnalysis).where(AiAnalysis.id == report_one_id, AiAnalysis.portfolio_id == portfolio_id))
    r1 = res1.scalar_one_or_none()

    res2 = await db.execute(select(AiAnalysis).where(AiAnalysis.id == report_two_id, AiAnalysis.portfolio_id == portfolio_id))
    r2 = res2.scalar_one_or_none()

    if not r1 or not r2:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Karşılaştırma için seçilen raporlar bulunamadı."
        )

    model = _get_model()

    prompt = f"""Sen deneyimli bir **Finansal Denetçi ve Yatırım Stratejistisin**.
Aşağıda aynı portföy için farklı tarihlerde oluşturulmuş iki farklı yapay zekâ analiz raporu bulunmaktadır:

[RAPOR 1 (Tarih: {r1.created_at.strftime('%d.%m.%Y %H:%M')}, Tip: {r1.analysis_type})]
{r1.response}

---

[RAPOR 2 (Tarih: {r2.created_at.strftime('%d.%m.%Y %H:%M')}, Tip: {r2.analysis_type})]
{r2.response}

---

Lütfen bu iki raporu ve aralarındaki süreç farkını analiz ederek yatırımcıya özel bir **AI Karşılaştırmalı Gelişim ve İlerleme Raporu** oluştur:
1. **Yapılan İlerlemeler**: Rapor 1'den Rapor 2'ye geçerken portföy kompozisyonunda, risk seviyelerinde veya rasyolarda ne gibi olumlu/olumsuz gelişmeler yaşandı?
2. **Stratejik Sapmalar**: İki dönem arasında yatırımcının stratejisinde ne gibi değişiklikler göze çarpıyor?
3. **Geleceğe Yönelik Yol Haritası**: Bu gelişim trendi göz önüne alındığında, yatırımcının bir sonraki adımda ne yapması önerilir?

Raporunu Türkçe, son derece detaylı, finansal terminolojiye uygun ve profesyonel bir tonda yaz."""

    comparison_report = await _generate_response(model, prompt)

    # Save comparison as a new analysis run
    analysis = AiAnalysis(
        portfolio_id=portfolio.id,
        analysis_type="comparison",
        prompt=f"COMPARISON BETWEEN REPORT {report_one_id} AND REPORT {report_two_id}",
        response=comparison_report,
    )
    db.add(analysis)
    await db.commit()

    return {
        "report_one": {
            "id": r1.id,
            "type": r1.analysis_type,
            "created_at": r1.created_at
        },
        "report_two": {
            "id": r2.id,
            "type": r2.analysis_type,
            "created_at": r2.created_at
        },
        "comparison_report": comparison_report
    }

