"""
Portfolio-related Pydantic schemas.
"""

from datetime import datetime
from pydantic import BaseModel, Field


class PortfolioCreate(BaseModel):
    """Schema for creating a new portfolio."""
    name: str = Field(..., min_length=1, max_length=255, description="Portföy adı")
    description: str | None = Field(None, description="Portföy açıklaması")
    currency: str = Field(default="TRY", max_length=10, description="Para birimi (TRY, USD, EUR, GBP)")


class PortfolioUpdate(BaseModel):
    """Schema for updating a portfolio."""
    name: str | None = Field(None, min_length=1, max_length=255, description="Portföy adı")
    description: str | None = Field(None, description="Portföy açıklaması")
    currency: str | None = Field(None, max_length=10, description="Para birimi")


class PortfolioResponse(BaseModel):
    """Schema for portfolio data in API responses."""
    id: int
    user_id: int
    name: str
    description: str | None = None
    currency: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StockSummaryItem(BaseModel):
    """Summarized stock info used inside PortfolioSummary."""
    symbol: str
    name: str
    total_lots: float
    avg_cost: float
    current_price: float | None = None
    market_value: float | None = None
    profit_loss: float | None = None
    profit_loss_pct: float | None = None
    currency: str


class PortfolioSummary(BaseModel):
    """Comprehensive portfolio summary with P&L and stock details."""
    id: int
    name: str
    currency: str
    total_cost: float = 0.0
    total_market_value: float = 0.0
    total_profit_loss: float = 0.0
    total_profit_loss_pct: float = 0.0
    daily_change: float = 0.0
    daily_change_pct: float = 0.0
    stock_count: int = 0
    stocks: list[StockSummaryItem] = []
