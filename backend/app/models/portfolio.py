"""
Portfolio model representing a user's investment portfolio.
"""

from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Portfolio(Base):
    """Represents an investment portfolio owned by a user."""

    __tablename__ = "portfolios"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="TRY", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="portfolios", lazy="selectin")  # noqa: F821
    stocks: Mapped[list["PortfolioStock"]] = relationship(  # noqa: F821
        "PortfolioStock", back_populates="portfolio", cascade="all, delete-orphan", lazy="selectin"
    )
    ai_analyses: Mapped[list["AiAnalysis"]] = relationship(  # noqa: F821
        "AiAnalysis", back_populates="portfolio", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Portfolio(id={self.id}, name='{self.name}')>"
