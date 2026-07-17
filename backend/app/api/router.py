"""
Main API router combining all sub-routers.
"""

from fastapi import APIRouter

from app.api import auth, portfolio, stocks, transactions, analysis, ai, news, alerts, watchlist

api_router = APIRouter()

# Include sub-routers
api_router.include_router(auth.router)
api_router.include_router(portfolio.router)
api_router.include_router(stocks.router)
api_router.include_router(transactions.router)
api_router.include_router(analysis.router)
api_router.include_router(ai.router)
api_router.include_router(news.router)
api_router.include_router(alerts.router)
api_router.include_router(watchlist.router)

