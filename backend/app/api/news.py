"""
News API endpoints.
"""

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models.user import User
from app.services import news_service

router = APIRouter(prefix="/news", tags=["news"])


@router.get("")
async def get_general_news(
    current_user: User = Depends(get_current_user)
):
    """Get general financial news parsed from RSS feeds."""
    return await news_service.get_financial_news()


@router.get("/stock/{symbol}")
async def get_stock_specific_news(
    symbol: str,
    current_user: User = Depends(get_current_user)
):
    """Get news articles specific to a stock symbol (filters local news and fetches from yfinance)."""
    return await news_service.get_stock_news(symbol)
