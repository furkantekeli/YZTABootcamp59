"""
Portfolio service: CRUD operations and portfolio summary calculations.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.portfolio import Portfolio
from app.models.stock import PortfolioStock
from app.models.user import User
from app.schemas.portfolio import (
    PortfolioCreate,
    PortfolioUpdate,
    PortfolioResponse,
    PortfolioSummary,
    StockSummaryItem,
)
from app.utils.calculations import calculate_unrealized_pnl


async def get_user_portfolios(user: User, db: AsyncSession) -> list[PortfolioResponse]:
    """Get all portfolios belonging to the authenticated user."""
    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.user_id == user.id)
        .order_by(Portfolio.created_at.desc())
    )
    portfolios = result.scalars().all()
    return [PortfolioResponse.model_validate(p) for p in portfolios]


async def create_portfolio(
    user: User, portfolio_data: PortfolioCreate, db: AsyncSession
) -> PortfolioResponse:
    """Create a new portfolio for the authenticated user."""
    portfolio = Portfolio(
        user_id=user.id,
        name=portfolio_data.name,
        description=portfolio_data.description,
        currency=portfolio_data.currency,
    )
    db.add(portfolio)
    await db.flush()
    await db.refresh(portfolio)
    return PortfolioResponse.model_validate(portfolio)


async def get_portfolio_by_id(
    portfolio_id: int, user: User, db: AsyncSession
) -> Portfolio:
    """
    Fetch a portfolio by ID, ensuring it belongs to the given user.

    Raises:
        HTTPException 404: If not found or doesn't belong to the user.
    """
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

    return portfolio


async def update_portfolio(
    portfolio_id: int, user: User, data: PortfolioUpdate, db: AsyncSession
) -> PortfolioResponse:
    """Update an existing portfolio."""
    portfolio = await get_portfolio_by_id(portfolio_id, user, db)

    if data.name is not None:
        portfolio.name = data.name
    if data.description is not None:
        portfolio.description = data.description
    if data.currency is not None:
        portfolio.currency = data.currency

    await db.flush()
    await db.refresh(portfolio)
    return PortfolioResponse.model_validate(portfolio)


async def delete_portfolio(
    portfolio_id: int, user: User, db: AsyncSession
) -> dict:
    """Delete a portfolio and all its associated data (cascading)."""
    portfolio = await get_portfolio_by_id(portfolio_id, user, db)
    await db.delete(portfolio)
    await db.flush()
    return {"message": "Portföy başarıyla silindi."}


async def get_portfolio_summary(
    portfolio_id: int, user: User, db: AsyncSession
) -> PortfolioSummary:
    """
    Generate a comprehensive summary for a portfolio including total value,
    P&L, and per-stock breakdown.
    """
    portfolio = await get_portfolio_by_id(portfolio_id, user, db)

    # Fetch stocks
    result = await db.execute(
        select(PortfolioStock).where(PortfolioStock.portfolio_id == portfolio.id)
    )
    stocks = result.scalars().all()

    total_cost = 0.0
    total_market_value = 0.0
    stock_summaries: list[StockSummaryItem] = []

    for stock in stocks:
        cost = stock.total_lots * stock.avg_cost
        current_price = stock.current_price or stock.avg_cost
        market_value = stock.total_lots * current_price

        pnl, pnl_pct = calculate_unrealized_pnl(
            stock.avg_cost, current_price, stock.total_lots
        )

        total_cost += cost
        total_market_value += market_value

        stock_summaries.append(
            StockSummaryItem(
                symbol=stock.symbol,
                name=stock.name,
                total_lots=stock.total_lots,
                avg_cost=stock.avg_cost,
                current_price=current_price,
                market_value=round(market_value, 2),
                profit_loss=pnl,
                profit_loss_pct=pnl_pct,
                currency=stock.currency,
            )
        )

    total_pnl = total_market_value - total_cost
    total_pnl_pct = ((total_pnl / total_cost) * 100) if total_cost > 0 else 0.0

    return PortfolioSummary(
        id=portfolio.id,
        name=portfolio.name,
        currency=portfolio.currency,
        total_cost=round(total_cost, 2),
        total_market_value=round(total_market_value, 2),
        total_profit_loss=round(total_pnl, 2),
        total_profit_loss_pct=round(total_pnl_pct, 2),
        daily_change=0.0,  # Requires historical data; computed at price-update time
        daily_change_pct=0.0,
        stock_count=len(stocks),
        stocks=stock_summaries,
    )
