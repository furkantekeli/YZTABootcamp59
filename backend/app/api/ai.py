"""
AI Analysis API endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.transaction import AiAnalysisRequest, AiAnalysisResponse, AiChatRequest
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
