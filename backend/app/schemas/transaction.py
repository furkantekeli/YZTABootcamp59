"""
Transaction and AI analysis Pydantic schemas.
"""

from datetime import datetime
from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    """Schema for creating a new transaction."""
    portfolio_stock_id: int = Field(..., description="Portföydeki hisse senedi ID'si")
    transaction_type: str = Field(..., pattern="^(BUY|SELL)$", description="İşlem tipi: BUY veya SELL")
    lots: float = Field(..., gt=0, description="Lot sayısı")
    price: float = Field(..., gt=0, description="İşlem fiyatı")
    commission: float = Field(default=0.0, ge=0, description="Komisyon tutarı")
    transaction_date: datetime | None = Field(None, description="İşlem tarihi")
    notes: str | None = Field(None, description="İşlem notları")


class TransactionResponse(BaseModel):
    """Schema for transaction data in API responses."""
    id: int
    portfolio_stock_id: int
    transaction_type: str
    lots: float
    price: float
    commission: float
    transaction_date: datetime
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AiAnalysisRequest(BaseModel):
    """Schema for AI analysis request."""
    portfolio_id: int = Field(..., description="Analiz edilecek portföy ID'si")
    analysis_type: str = Field(
        default="general",
        description="Analiz türü: general, risk, performance",
    )


class AiChatRequest(BaseModel):
    """Schema for free-form AI chat about a portfolio."""
    portfolio_id: int = Field(..., description="Portföy ID'si")
    question: str = Field(..., min_length=1, max_length=2000, description="Sorunuz")


class AiAnalysisResponse(BaseModel):
    """Schema for AI analysis response."""
    id: int | None = None
    portfolio_id: int
    analysis_type: str
    response: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class WhatIfRequest(BaseModel):
    """Schema for what-if simulation request."""
    portfolio_id: int = Field(..., description="Portföy ID'si")
    symbol: str = Field(..., min_length=1, description="Hisse sembolü (örn: EREGL.IS)")
    lots: float = Field(..., gt=0, description="Lot sayısı")
    price: float = Field(..., gt=0, description="Alım fiyatı")
