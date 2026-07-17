"""
Pydantic schemas for Price Alert and Watchlist features.
"""

from datetime import datetime
from pydantic import BaseModel, Field


# ─── Price Alert Schemas ─────────────────────────────────────

class PriceAlertCreate(BaseModel):
    """Schema for creating a new price alert."""
    symbol: str = Field(..., max_length=20)
    name: str | None = Field(None, max_length=200)
    target_price: float = Field(..., gt=0)
    alert_type: str = Field(..., pattern="^(ABOVE|BELOW)$")


class PriceAlertResponse(BaseModel):
    """Schema for price alert response."""
    id: int
    user_id: int
    symbol: str
    name: str | None
    target_price: float
    alert_type: str
    is_triggered: bool
    is_active: bool
    triggered_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PriceAlertCheck(BaseModel):
    """Schema for alert check results."""
    alert_id: int
    symbol: str
    target_price: float
    current_price: float
    alert_type: str
    is_triggered: bool
    message: str


# ─── Watchlist Schemas ───────────────────────────────────────

class WatchlistItemCreate(BaseModel):
    """Schema for adding a stock to the watchlist."""
    symbol: str = Field(..., max_length=20)
    name: str | None = Field(None, max_length=200)
    exchange: str | None = Field(None, max_length=50)
    currency: str = Field("USD", max_length=10)
    notes: str | None = None


class WatchlistItemResponse(BaseModel):
    """Schema for watchlist item response (includes live price data)."""
    id: int
    symbol: str
    name: str | None
    exchange: str | None
    currency: str
    notes: str | None
    current_price: float | None = None
    previous_close: float | None = None
    change_pct: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
