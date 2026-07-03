"""
SQLAlchemy models package.
Import all models here so Alembic and Base.metadata.create_all() can discover them.
"""

from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.stock import PortfolioStock
from app.models.transaction import Transaction, AiAnalysis

__all__ = [
    "User",
    "Portfolio",
    "PortfolioStock",
    "Transaction",
    "AiAnalysis",
]
