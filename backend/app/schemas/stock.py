"""
Stock-related Pydantic schemas.
"""

from datetime import datetime
from pydantic import BaseModel, Field


class StockAdd(BaseModel):
    """Schema for adding a stock to a portfolio."""
    symbol: str = Field(..., min_length=1, max_length=20, description="Hisse senedi sembolü (ör: THYAO.IS, AAPL)")
    name: str = Field(..., min_length=1, max_length=255, description="Hisse senedi adı")
    exchange: str | None = Field(None, max_length=50, description="Borsa (ör: BIST, NYSE, NASDAQ)")
    currency: str = Field(default="TRY", max_length=10, description="Para birimi")


class StockResponse(BaseModel):
    """Schema for stock data in API responses."""
    id: int
    portfolio_id: int
    symbol: str
    name: str
    exchange: str | None = None
    total_lots: float
    avg_cost: float
    current_price: float | None = None
    currency: str
    last_price_update: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StockWithPrice(BaseModel):
    """Stock data enriched with live price and P&L info."""
    id: int
    symbol: str
    name: str
    exchange: str | None = None
    total_lots: float
    avg_cost: float
    current_price: float | None = None
    market_value: float | None = None
    profit_loss: float | None = None
    profit_loss_pct: float | None = None
    daily_change: float | None = None
    daily_change_pct: float | None = None
    currency: str


class StockSearchResult(BaseModel):
    """Schema for stock search results from yfinance."""
    symbol: str
    name: str
    exchange: str | None = None
    stock_type: str | None = None
    currency: str | None = None


class StockPriceResponse(BaseModel):
    """Schema for current stock price response."""
    symbol: str
    current_price: float | None = None
    previous_close: float | None = None
    open_price: float | None = None
    day_high: float | None = None
    day_low: float | None = None
    volume: int | None = None
    market_cap: float | None = None
    currency: str | None = None
    name: str | None = None


class StockHistoryPoint(BaseModel):
    """Single data point in stock price history."""
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class StockHistoryResponse(BaseModel):
    """Schema for stock price history response."""
    symbol: str
    period: str
    data: list[StockHistoryPoint] = []
