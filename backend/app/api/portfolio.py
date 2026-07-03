"""
Portfolio API endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate, PortfolioResponse, PortfolioSummary
from app.services import portfolio_service

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


@router.get("", response_model=list[PortfolioResponse])
async def list_portfolios(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all portfolios belonging to the current user."""
    return await portfolio_service.get_user_portfolios(current_user, db)


@router.post("", response_model=PortfolioResponse)
async def create(
    portfolio_data: PortfolioCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new portfolio."""
    portfolio = await portfolio_service.create_portfolio(current_user, portfolio_data, db)
    await db.commit()
    return portfolio


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_details(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get portfolio general information by ID."""
    portfolio = await portfolio_service.get_portfolio_by_id(portfolio_id, current_user, db)
    return PortfolioResponse.model_validate(portfolio)


@router.put("/{portfolio_id}", response_model=PortfolioResponse)
async def update(
    portfolio_id: int,
    data: PortfolioUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update portfolio details."""
    portfolio = await portfolio_service.update_portfolio(portfolio_id, current_user, data, db)
    await db.commit()
    return portfolio


@router.delete("/{portfolio_id}")
async def delete(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a portfolio and all its assets/transactions."""
    result = await portfolio_service.delete_portfolio(portfolio_id, current_user, db)
    await db.commit()
    return result


@router.get("/{portfolio_id}/summary", response_model=PortfolioSummary)
async def get_summary(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive portfolio summary (market value, P&L, stock breakdown)."""
    return await portfolio_service.get_portfolio_summary(portfolio_id, current_user, db)
