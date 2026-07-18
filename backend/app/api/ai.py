"""
AI Analysis API endpoints.
"""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.transaction import AiAnalysisRequest, AiAnalysisResponse, AiChatRequest, WhatIfRequest
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/analyze", response_model=AiAnalysisResponse)
async def analyze(
    request: AiAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Perform a comprehensive AI analysis of the portfolio."""
    analysis = await ai_service.analyze_portfolio(request.portfolio_id, current_user, db)
    await db.commit()
    return analysis


@router.post("/risk", response_model=AiAnalysisResponse)
async def risk(
    request: AiAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Perform an AI-powered risk assessment of the portfolio."""
    analysis = await ai_service.assess_risk(request.portfolio_id, current_user, db)
    await db.commit()
    return analysis


@router.post("/chat", response_model=AiAnalysisResponse)
async def chat_qna(
    request: AiChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Ask a free-form question about the portfolio to the AI assistant."""
    analysis = await ai_service.chat(request.portfolio_id, request.question, current_user, db)
    await db.commit()
    return analysis


@router.post("/chat/stream")
async def chat_stream(
    request: AiChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Streaming chat endpoint using Server-Sent Events (SSE).
    Delivers AI response token-by-token in real-time for a ChatGPT-like experience.
    """

    async def event_generator():
        async for chunk in ai_service.chat_stream(
            request.portfolio_id, request.question, current_user, db
        ):
            # SSE format: data: <text>\n\n
            yield f"data: {chunk}\n\n"
        # Signal stream completion
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/simulate")
async def simulate(
    request: WhatIfRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Simulate what-if scenarios by virtually adding a stock to a portfolio."""
    return await ai_service.simulate_what_if(
        request.portfolio_id,
        request.symbol,
        request.lots,
        request.price,
        current_user,
        db
    )


@router.get("/rebalance/{portfolio_id}")
async def rebalance(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Calculate and return rebalancing recommendations alongside AI guidance."""
    return await ai_service.rebalance(portfolio_id, current_user, db)


@router.get("/reports/{portfolio_id}")
async def get_reports(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve list of historical AI analyses."""
    return await ai_service.get_historical_reports(portfolio_id, current_user, db)


@router.post("/compare")
async def compare(
    portfolio_id: int,
    report_one_id: int,
    report_two_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Compare two historical reports and output a delta report using AI."""
    return await ai_service.compare_reports(portfolio_id, report_one_id, report_two_id, current_user, db)
