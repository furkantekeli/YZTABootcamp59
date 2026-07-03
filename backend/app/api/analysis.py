"""
Analysis API endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services import analysis_service

router = APIRouter(prefix="/portfolios/{portfolio_id}/analysis", tags=["analysis"])


@router.get("/performance")
async def get_performance(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get absolute and percentage performance metrics for the portfolio and individual stocks."""
    return await analysis_service.get_performance_metrics(portfolio_id, current_user, db)


@router.get("/allocation")
async def get_allocation(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get stock and sector weight allocations based on current market values."""
    return await analysis_service.get_allocation(portfolio_id, current_user, db)


@router.get("/risk")
async def get_risk(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get portfolio risk metrics such as volatility, Sharpe ratio, max drawdown, and diversification score."""
    return await analysis_service.get_risk_metrics(portfolio_id, current_user, db)
