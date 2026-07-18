"""
PriceAlert model for tracking stock price threshold notifications.
"""

from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class AlertType(str, enum.Enum):
    """Enumeration for alert trigger direction."""
    ABOVE = "ABOVE"
    BELOW = "BELOW"


class PriceAlert(Base):
    """Represents a price alert set by a user for a specific stock symbol."""

    __tablename__ = "price_alerts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    symbol: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    target_price: Mapped[float] = mapped_column(Float, nullable=False)
    alert_type: Mapped[str] = mapped_column(String(10), nullable=False)  # ABOVE or BELOW
    is_triggered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    triggered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="price_alerts", lazy="selectin")  # noqa: F821

    def __repr__(self) -> str:
        return f"<PriceAlert(id={self.id}, symbol='{self.symbol}', target={self.target_price}, type={self.alert_type})>"
