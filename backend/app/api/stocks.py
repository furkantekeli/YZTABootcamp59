"""
Stock API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.stock import PortfolioStock
from app.schemas.stock import (
    StockAdd,
    StockResponse,
    StockWithPrice,
    StockSearchResult,
    StockPriceResponse,
    StockHistoryResponse,
)
from app.services import stock_service
from app.services.portfolio_service import get_portfolio_by_id

router = APIRouter(tags=["stocks"])


@router.get("/portfolios/{portfolio_id}/stocks", response_model=list[StockResponse])
async def list_portfolio_stocks(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all stocks inside a specific portfolio."""
    # Verify portfolio ownership
    await get_portfolio_by_id(portfolio_id, current_user, db)

    result = await db.execute(
        select(PortfolioStock).where(PortfolioStock.portfolio_id == portfolio_id)
    )
    stocks = result.scalars().all()
    return [StockResponse.model_validate(s) for s in stocks]


@router.post("/portfolios/{portfolio_id}/stocks", response_model=StockResponse)
async def add_stock_to_portfolio(
    portfolio_id: int,
    stock_data: StockAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a stock to a portfolio. Fetches initial price from yfinance if available."""
    # Verify portfolio ownership
    portfolio = await get_portfolio_by_id(portfolio_id, current_user, db)

    # Check if stock already exists in this portfolio
    symbol_upper = stock_data.symbol.upper().strip()
    existing_result = await db.execute(
        select(PortfolioStock).where(
            PortfolioStock.portfolio_id == portfolio_id,
            PortfolioStock.symbol == symbol_upper
        )
    )
    existing_stock = existing_result.scalar_one_or_none()
    if existing_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{symbol_upper} bu portföyde zaten mevcut."
        )

    # Fetch initial price details from yfinance
    price_info = await stock_service.get_stock_price(symbol_upper)
    current_price = price_info.current_price if price_info.current_price is not None else 0.0

    # Add stock
    stock = PortfolioStock(
        portfolio_id=portfolio_id,
        symbol=symbol_upper,
        name=stock_data.name,
        exchange=stock_data.exchange or price_info.exchange,
        total_lots=0.0,
        avg_cost=0.0,
        current_price=current_price,
        currency=stock_data.currency or price_info.currency or "TRY"
    )
    db.add(stock)
    await db.flush()
    await db.commit()
    await db.refresh(stock)
    return StockResponse.model_validate(stock)


@router.delete("/portfolios/{portfolio_id}/stocks/{stock_id}")
async def remove_stock_from_portfolio(
    portfolio_id: int,
    stock_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a stock from a portfolio and all its transaction records."""
    # Verify portfolio ownership
    await get_portfolio_by_id(portfolio_id, current_user, db)

    # Fetch stock
    result = await db.execute(
        select(PortfolioStock).where(
            PortfolioStock.id == stock_id,
            PortfolioStock.portfolio_id == portfolio_id
        )
    )
    stock = result.scalar_one_or_none()
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hisse senedi portföyde bulunamadı."
        )

    await db.delete(stock)
    await db.commit()
    return {"message": "Hisse senedi portföyden başarıyla kaldırıldı."}


@router.get("/stocks/search", response_model=list[StockSearchResult])
async def search(q: str = Query(..., min_length=1)):
    """Search stocks/indices by query string using yfinance."""
    return await stock_service.search_stock(q)


@router.get("/stocks/{symbol}/price", response_model=StockPriceResponse)
async def get_price(symbol: str):
    """Get current stock price and key market metrics."""
    return await stock_service.get_stock_price(symbol.upper())


@router.get("/stocks/{symbol}/history", response_model=StockHistoryResponse)
async def get_history(symbol: str, period: str = "1mo"):
    """Get stock price history for charting."""
    return await stock_service.get_stock_history(symbol.upper(), period)
