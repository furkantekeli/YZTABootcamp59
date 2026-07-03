"""
Transaction and AiAnalysis models.
"""

from datetime import datetime
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, Text, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class TransactionType(str, enum.Enum):
    """Enumeration for transaction types."""
    BUY = "BUY"
    SELL = "SELL"


class Transaction(Base):
    """Represents a buy or sell transaction for a stock in a portfolio."""

    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    portfolio_stock_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("portfolio_stocks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    transaction_type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType), nullable=False
    )
    lots: Mapped[float] = mapped_column(Float, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    commission: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    transaction_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    portfolio_stock: Mapped["PortfolioStock"] = relationship(  # noqa: F821
        "PortfolioStock", back_populates="transactions", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Transaction(id={self.id}, type={self.transaction_type}, lots={self.lots}, price={self.price})>"


class AiAnalysis(Base):
    """Stores AI-generated portfolio analysis results."""

    __tablename__ = "ai_analyses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    portfolio_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True
    )
    analysis_type: Mapped[str] = mapped_column(String(50), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="ai_analyses", lazy="selectin")  # noqa: F821

    def __repr__(self) -> str:
        return f"<AiAnalysis(id={self.id}, type='{self.analysis_type}')>"
