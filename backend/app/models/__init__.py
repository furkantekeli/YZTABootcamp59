"""
SQLAlchemy models package.
Import all models here so Alembic and Base.metadata.create_all() can discover them.
"""

from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.stock import PortfolioStock
from app.models.transaction import Transaction, AiAnalysis
from app.models.alert import PriceAlert
from app.models.watchlist import WatchlistItem
from app.models.snapshot import PortfolioSnapshot

__all__ = [
    "User",
    "Portfolio",
    "PortfolioStock",
    "Transaction",
    "AiAnalysis",
    "PriceAlert",
    "WatchlistItem",
    "PortfolioSnapshot",
]
