"""
Analysis service: performance metrics, allocation, and risk assessment.
"""

import asyncio
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

import yfinance as yf

from app.models.portfolio import Portfolio
from app.models.stock import PortfolioStock
from app.models.snapshot import PortfolioSnapshot
from app.models.user import User
from app.utils.calculations import (
    calculate_unrealized_pnl,
    calculate_volatility,
    calculate_sharpe_ratio,
    calculate_max_drawdown,
    calculate_diversification_score,
)


async def _get_portfolio_with_stocks(
    portfolio_id: int, user: User, db: AsyncSession
) -> tuple[Portfolio, list[PortfolioStock]]:
    """Helper: fetch portfolio + its stocks, verifying ownership."""
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user.id,
        )
    )
    portfolio = result.scalar_one_or_none()
    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portföy bulunamadı.",
        )

    stock_result = await db.execute(
        select(PortfolioStock).where(PortfolioStock.portfolio_id == portfolio_id)
    )
    stocks = list(stock_result.scalars().all())
    return portfolio, stocks


async def get_performance_metrics(
    portfolio_id: int, user: User, db: AsyncSession
) -> dict[str, Any]:
    """
    Calculate performance metrics for a portfolio.

    Returns:
        Dict with total value, cost, P&L (absolute + percentage), daily change, and per-stock details.
    """
    portfolio, stocks = await _get_portfolio_with_stocks(portfolio_id, user, db)

    if not stocks:
        return {
            "portfolio_name": portfolio.name,
            "currency": portfolio.currency,
            "total_cost": 0.0,
            "total_market_value": 0.0,
            "total_pnl": 0.0,
            "total_pnl_pct": 0.0,
            "daily_change": 0.0,
            "daily_change_pct": 0.0,
            "stocks": [],
        }

    total_cost = 0.0
    total_market_value = 0.0
    stock_details = []

    for stock in stocks:
        cost = stock.total_lots * stock.avg_cost
        current_price = stock.current_price or stock.avg_cost
        market_value = stock.total_lots * current_price
        pnl, pnl_pct = calculate_unrealized_pnl(stock.avg_cost, current_price, stock.total_lots)

        total_cost += cost
        total_market_value += market_value

        stock_details.append({
            "symbol": stock.symbol,
            "name": stock.name,
            "total_lots": stock.total_lots,
            "avg_cost": stock.avg_cost,
            "current_price": current_price,
            "market_value": round(market_value, 2),
            "pnl": pnl,
            "pnl_pct": pnl_pct,
            "currency": stock.currency,
        })

    total_pnl = total_market_value - total_cost
    total_pnl_pct = ((total_pnl / total_cost) * 100) if total_cost > 0 else 0.0

    return {
        "portfolio_name": portfolio.name,
        "currency": portfolio.currency,
        "total_cost": round(total_cost, 2),
        "total_market_value": round(total_market_value, 2),
        "total_pnl": round(total_pnl, 2),
        "total_pnl_pct": round(total_pnl_pct, 2),
        "daily_change": 0.0,
        "daily_change_pct": 0.0,
        "stocks": stock_details,
    }


async def get_allocation(
    portfolio_id: int, user: User, db: AsyncSession
) -> dict[str, Any]:
    """
    Calculate stock and sector allocation for a portfolio.

    Returns:
        Dict with stock_allocation list and sector_allocation list.
    """
    portfolio, stocks = await _get_portfolio_with_stocks(portfolio_id, user, db)

    if not stocks:
        return {
            "portfolio_name": portfolio.name,
            "stock_allocation": [],
            "sector_allocation": [],
            "total_value": 0.0,
        }

    # Calculate market values
    total_value = 0.0
    stock_values: list[dict[str, Any]] = []
    symbols: list[str] = []

    for stock in stocks:
        current_price = stock.current_price or stock.avg_cost
        market_value = stock.total_lots * current_price
        total_value += market_value
        stock_values.append({
            "symbol": stock.symbol,
            "name": stock.name,
            "market_value": market_value,
        })
        symbols.append(stock.symbol)

    # Stock allocation
    stock_allocation = []
    for sv in stock_values:
        weight = (sv["market_value"] / total_value * 100) if total_value > 0 else 0
        stock_allocation.append({
            "symbol": sv["symbol"],
            "name": sv["name"],
            "market_value": round(sv["market_value"], 2),
            "weight_pct": round(weight, 2),
        })

    # Sector allocation (fetch from yfinance in parallel)
    sector_map: dict[str, float] = {}

    async def _get_sector(symbol: str, value: float):
        try:
            ticker = await asyncio.to_thread(lambda: yf.Ticker(symbol))
            info = await asyncio.to_thread(lambda: ticker.info)
            sector = info.get("sector", "Bilinmiyor")
        except Exception:
            sector = "Bilinmiyor"
        return sector, value

    tasks = [
        _get_sector(sv["symbol"], sv["market_value"])
        for sv in stock_values
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for res in results:
        if isinstance(res, tuple):
            sector, value = res
            sector_map[sector] = sector_map.get(sector, 0) + value

    sector_allocation = []
    for sector, value in sorted(sector_map.items(), key=lambda x: x[1], reverse=True):
        weight = (value / total_value * 100) if total_value > 0 else 0
        sector_allocation.append({
            "sector": sector,
            "market_value": round(value, 2),
            "weight_pct": round(weight, 2),
        })

    return {
        "portfolio_name": portfolio.name,
        "stock_allocation": stock_allocation,
        "sector_allocation": sector_allocation,
        "total_value": round(total_value, 2),
    }


async def get_risk_metrics(
    portfolio_id: int, user: User, db: AsyncSession
) -> dict[str, Any]:
    """
    Calculate risk metrics for a portfolio:
    volatility, beta, Sharpe ratio, max drawdown, diversification score.

    Uses 1-year daily price history for calculations.
    """
    portfolio, stocks = await _get_portfolio_with_stocks(portfolio_id, user, db)

    if not stocks:
        return {
            "portfolio_name": portfolio.name,
            "volatility": 0.0,
            "beta": 0.0,
            "sharpe_ratio": 0.0,
            "max_drawdown": 0.0,
            "diversification_score": 0.0,
            "risk_level": "Düşük",
            "stock_risks": [],
        }

    # Fetch historical data for each stock
    stock_histories: dict[str, list[float]] = {}

    async def _fetch_history(symbol: str):
        try:
            ticker = await asyncio.to_thread(lambda: yf.Ticker(symbol))
            hist = await asyncio.to_thread(lambda: ticker.history(period="1y"))
            closes = hist["Close"].tolist() if not hist.empty else []
            return symbol, closes
        except Exception:
            return symbol, []

    tasks = [_fetch_history(s.symbol) for s in stocks]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for res in results:
        if isinstance(res, tuple):
            sym, closes = res
            stock_histories[sym] = closes

    # Calculate individual stock volatilities
    stock_risks = []
    total_value = 0.0
    weights: list[float] = []

    for stock in stocks:
        current_price = stock.current_price or stock.avg_cost
        market_value = stock.total_lots * current_price
        total_value += market_value

    for stock in stocks:
        current_price = stock.current_price or stock.avg_cost
        market_value = stock.total_lots * current_price
        weight = market_value / total_value if total_value > 0 else 0
        weights.append(weight)

        closes = stock_histories.get(stock.symbol, [])
        vol = calculate_volatility(closes)

        stock_risks.append({
            "symbol": stock.symbol,
            "name": stock.name,
            "weight_pct": round(weight * 100, 2),
            "volatility": vol,
        })

    # Portfolio-level metrics
    # Approximate portfolio volatility (weighted sum – simplified)
    portfolio_vol = sum(
        sr["volatility"] * sr["weight_pct"] / 100
        for sr in stock_risks
    )

    # Calculate portfolio returns for Sharpe ratio
    portfolio_returns: list[float] = []
    if stock_histories:
        # Use weighted returns across all stocks
        min_len = min(len(v) for v in stock_histories.values() if v) if stock_histories else 0
        if min_len > 1:
            for i in range(1, min_len):
                daily_return = 0.0
                for stock, weight_val in zip(stocks, weights):
                    closes = stock_histories.get(stock.symbol, [])
                    if len(closes) > i and closes[i - 1] > 0:
                        stock_return = (closes[i] - closes[i - 1]) / closes[i - 1]
                        daily_return += stock_return * weight_val
                portfolio_returns.append(daily_return)

    # ─── Calculate true Beta against BIST-100 index (XU100.IS) ───
    beta_val = 0.0
    benchmark_returns = []
    try:
        # Fetch BIST-100 historical data for beta calculation
        benchmark_ticker = await asyncio.to_thread(lambda: yf.Ticker("XU100.IS"))
        benchmark_hist = await asyncio.to_thread(lambda: benchmark_ticker.history(period="1y"))
        benchmark_closes = benchmark_hist["Close"].tolist() if not benchmark_hist.empty else []
        
        if len(benchmark_closes) > 1:
            for i in range(1, len(benchmark_closes)):
                if benchmark_closes[i - 1] > 0:
                    benchmark_returns.append((benchmark_closes[i] - benchmark_closes[i - 1]) / benchmark_closes[i - 1])
            
            # Align length of returns
            min_ret_len = min(len(portfolio_returns), len(benchmark_returns))
            if min_ret_len > 5:
                p_rets = portfolio_returns[-min_ret_len:]
                b_rets = benchmark_returns[-min_ret_len:]
                
                # Calculate covariance and variance
                mean_p = sum(p_rets) / min_ret_len
                mean_b = sum(b_rets) / min_ret_len
                
                covariance = sum((p - mean_p) * (b - mean_b) for p, b in zip(p_rets, b_rets)) / min_ret_len
                variance_b = sum((b - mean_b) ** 2 for b in b_rets) / min_ret_len
                
                if variance_b > 0:
                    beta_val = round(covariance / variance_b, 2)
    except Exception:
        pass

    sharpe = calculate_sharpe_ratio(portfolio_returns) if portfolio_returns else 0.0

    # Max drawdown from portfolio value series
    if portfolio_returns:
        portfolio_values = [100.0]  # start at 100
        for r in portfolio_returns:
            portfolio_values.append(portfolio_values[-1] * (1 + r))
        max_dd = calculate_max_drawdown(portfolio_values)
    else:
        max_dd = 0.0

    # Diversification score
    div_score = calculate_diversification_score(weights) if weights else 0.0

    # Risk level classification
    if portfolio_vol < 15:
        risk_level = "Düşük"
    elif portfolio_vol < 30:
        risk_level = "Orta"
    elif portfolio_vol < 50:
        risk_level = "Yüksek"
    else:
        risk_level = "Çok Yüksek"

    return {
        "portfolio_name": portfolio.name,
        "volatility": round(portfolio_vol, 2),
        "beta": beta_val,
        "sharpe_ratio": sharpe,
        "max_drawdown": max_dd,
        "diversification_score": div_score,
        "risk_level": risk_level,
        "stock_risks": stock_risks,
    }


async def get_benchmark_comparison(
    portfolio_id: int, benchmark_symbol: str, user: User, db: AsyncSession
) -> dict[str, Any]:
    """
    Generate date-by-date cumulative percentage returns comparing
    the portfolio performance against a market benchmark (e.g. BIST-100 or S&P 500).
    """
    portfolio, stocks = await _get_portfolio_with_stocks(portfolio_id, user, db)

    # Use XU100.IS as fallback if benchmark not specified
    if not benchmark_symbol:
        benchmark_symbol = "XU100.IS"

    # Default result if no holdings
    if not stocks:
        return {"dates": [], "portfolio_returns": [], "benchmark_returns": [], "benchmark": benchmark_symbol}

    # Fetch daily price histories for last 30 trading days to construct trend series
    stock_histories = {}
    async def _fetch_history(symbol: str):
        try:
            ticker = await asyncio.to_thread(lambda: yf.Ticker(symbol))
            hist = await asyncio.to_thread(lambda: ticker.history(period="1mo"))
            closes = hist["Close"].tolist() if not hist.empty else []
            dates = [d.strftime("%Y-%m-%d") for d in hist.index] if not hist.empty else []
            return symbol, closes, dates
        except Exception:
            return symbol, [], []

    # Fetch portfolio stock histories
    tasks = [_fetch_history(s.symbol) for s in stocks]
    # Fetch benchmark history
    tasks.append(_fetch_history(benchmark_symbol))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    benchmark_closes = []
    benchmark_dates = []

    # Parse results
    for res in results:
        if isinstance(res, tuple):
            sym, closes, dates = res
            if sym == benchmark_symbol:
                benchmark_closes = closes
                benchmark_dates = dates
            else:
                stock_histories[sym] = (closes, dates)

    # Calculate portfolio weights based on current market values
    total_value = 0.0
    weights = []
    for stock in stocks:
        current_price = stock.current_price or stock.avg_cost
        val = stock.total_lots * current_price
        total_value += val

    for stock in stocks:
        current_price = stock.current_price or stock.avg_cost
        val = stock.total_lots * current_price
        weight = val / total_value if total_value > 0 else 0
        weights.append(weight)

    # Construct overlapping timeline dates
    if not benchmark_dates:
        return {"dates": [], "portfolio_returns": [], "benchmark_returns": [], "benchmark": benchmark_symbol}

    dates_list = benchmark_dates
    portfolio_cum_returns = []
    benchmark_cum_returns = []

    # Initial values (cumulative performance starts at 0.0%)
    portfolio_cum_returns.append(0.0)
    benchmark_cum_returns.append(0.0)

    # Calculating daily returns
    portfolio_daily_history_value = [100.0]
    benchmark_daily_history_value = [100.0]

    for i in range(1, len(dates_list)):
        # Calculate daily change for benchmark
        b_change = 0.0
        if len(benchmark_closes) > i and benchmark_closes[i - 1] > 0:
            b_change = (benchmark_closes[i] - benchmark_closes[i - 1]) / benchmark_closes[i - 1]

        # Calculate daily change for portfolio
        p_change = 0.0
        for stock, weight_val in zip(stocks, weights):
            if stock.symbol in stock_histories:
                closes, dates = stock_histories[stock.symbol]
                # Find matching date index or close relative
                if len(closes) > i and closes[i - 1] > 0:
                    s_change = (closes[i] - closes[i - 1]) / closes[i - 1]
                    p_change += s_change * weight_val

        # Calculate cumulative returns
        p_val = portfolio_daily_history_value[-1] * (1 + p_change)
        portfolio_daily_history_value.append(p_val)
        portfolio_cum_returns.append(round(p_val - 100.0, 2))

        b_val = benchmark_daily_history_value[-1] * (1 + b_change)
        benchmark_daily_history_value.append(b_val)
        benchmark_cum_returns.append(round(b_val - 100.0, 2))

    return {
        "dates": dates_list,
        "portfolio_returns": portfolio_cum_returns,
        "benchmark_returns": benchmark_cum_returns,
        "benchmark": benchmark_symbol
    }


async def create_portfolio_snapshot(
    portfolio_id: int, user: User, db: AsyncSession
) -> PortfolioSnapshot | None:
    """
    Take a snapshot of the current portfolio value and cost and save it to the DB.
    """
    try:
        metrics = await get_performance_metrics(portfolio_id, user, db)
        if not metrics or metrics.get("total_cost", 0) == 0:
            return None

        snapshot = PortfolioSnapshot(
            portfolio_id=portfolio_id,
            total_value=metrics.get("total_market_value", 0.0),
            total_cost=metrics.get("total_cost", 0.0)
        )
        db.add(snapshot)
        await db.flush()
        return snapshot
    except Exception as e:
        print(f"Snapshot creation failed: {e}")
        return None


async def get_portfolio_snapshots(
    portfolio_id: int, user: User, db: AsyncSession
) -> list[dict]:
    """
    Get all historical snapshots for a portfolio to plot performance over time.
    """
    # Verify ownership
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user.id
        )
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portföy bulunamadı."
        )

    snapshot_result = await db.execute(
        select(PortfolioSnapshot)
        .where(PortfolioSnapshot.portfolio_id == portfolio_id)
        .order_by(PortfolioSnapshot.created_at.asc())
    )
    snapshots = snapshot_result.scalars().all()

    return [
        {
            "id": s.id,
            "portfolio_id": s.portfolio_id,
            "total_value": s.total_value,
            "total_cost": s.total_cost,
            "date": s.created_at.strftime("%Y-%m-%d")
        }
        for s in snapshots
    ]


