"""
Financial calculation utilities for portfolio analysis.
"""

import math
from typing import Any


def calculate_weighted_avg_cost(transactions: list[dict[str, Any]]) -> float:
    """
    Calculate the weighted average cost from a list of BUY transactions.

    Only BUY transactions contribute to the average cost.
    When a SELL occurs, the average cost stays the same (FIFO-like simplification).

    Args:
        transactions: List of dicts with keys: transaction_type, lots, price.

    Returns:
        Weighted average cost per lot, or 0.0 if no buys.
    """
    total_cost = 0.0
    total_lots = 0.0

    for txn in transactions:
        if txn["transaction_type"] == "BUY":
            total_cost += txn["lots"] * txn["price"]
            total_lots += txn["lots"]
        elif txn["transaction_type"] == "SELL":
            if total_lots > 0:
                # Reduce lots but keep the same avg cost
                sell_lots = min(txn["lots"], total_lots)
                avg = total_cost / total_lots if total_lots > 0 else 0
                total_lots -= sell_lots
                total_cost = avg * total_lots

    return total_cost / total_lots if total_lots > 0 else 0.0


def calculate_unrealized_pnl(
    avg_cost: float, current_price: float, lots: float
) -> tuple[float, float]:
    """
    Calculate unrealized profit/loss.

    Args:
        avg_cost: Weighted average cost per lot.
        current_price: Current market price per lot.
        lots: Number of lots currently held.

    Returns:
        Tuple of (absolute P&L, percentage P&L).
    """
    if lots <= 0 or avg_cost <= 0:
        return 0.0, 0.0

    pnl = (current_price - avg_cost) * lots
    pnl_pct = ((current_price - avg_cost) / avg_cost) * 100
    return round(pnl, 2), round(pnl_pct, 2)


def calculate_realized_pnl(transactions: list[dict[str, Any]]) -> float:
    """
    Calculate realized profit/loss from completed SELL transactions.

    Uses running weighted average cost to determine cost basis for sells.

    Args:
        transactions: List of dicts with keys: transaction_type, lots, price, commission.

    Returns:
        Total realized P&L.
    """
    total_cost = 0.0
    total_lots = 0.0
    realized_pnl = 0.0

    for txn in transactions:
        commission = txn.get("commission", 0.0)

        if txn["transaction_type"] == "BUY":
            total_cost += txn["lots"] * txn["price"]
            total_lots += txn["lots"]
        elif txn["transaction_type"] == "SELL":
            if total_lots > 0:
                avg_cost = total_cost / total_lots
                sell_lots = min(txn["lots"], total_lots)
                sell_revenue = sell_lots * txn["price"]
                sell_cost = sell_lots * avg_cost
                realized_pnl += sell_revenue - sell_cost - commission
                total_lots -= sell_lots
                total_cost = avg_cost * total_lots

    return round(realized_pnl, 2)


def calculate_portfolio_value(stocks: list[dict[str, Any]]) -> dict[str, float]:
    """
    Calculate total portfolio value, cost, and P&L.

    Args:
        stocks: List of dicts with keys: total_lots, avg_cost, current_price.

    Returns:
        Dict with total_cost, total_market_value, total_pnl, total_pnl_pct.
    """
    total_cost = 0.0
    total_market_value = 0.0

    for stock in stocks:
        lots = stock.get("total_lots", 0)
        avg_cost = stock.get("avg_cost", 0)
        current_price = stock.get("current_price") or avg_cost  # fallback

        total_cost += lots * avg_cost
        total_market_value += lots * current_price

    total_pnl = total_market_value - total_cost
    total_pnl_pct = ((total_pnl / total_cost) * 100) if total_cost > 0 else 0.0

    return {
        "total_cost": round(total_cost, 2),
        "total_market_value": round(total_market_value, 2),
        "total_pnl": round(total_pnl, 2),
        "total_pnl_pct": round(total_pnl_pct, 2),
    }


def calculate_volatility(price_history: list[float]) -> float:
    """
    Calculate annualized volatility from a list of daily closing prices.

    Args:
        price_history: List of daily closing prices (oldest first).

    Returns:
        Annualized volatility as a percentage, or 0 if insufficient data.
    """
    if len(price_history) < 2:
        return 0.0

    # Calculate daily returns
    returns = []
    for i in range(1, len(price_history)):
        if price_history[i - 1] > 0:
            daily_return = (price_history[i] - price_history[i - 1]) / price_history[i - 1]
            returns.append(daily_return)

    if not returns:
        return 0.0

    # Standard deviation of returns
    mean_return = sum(returns) / len(returns)
    variance = sum((r - mean_return) ** 2 for r in returns) / len(returns)
    daily_volatility = math.sqrt(variance)

    # Annualize (252 trading days)
    annualized_volatility = daily_volatility * math.sqrt(252)
    return round(annualized_volatility * 100, 2)


def calculate_sharpe_ratio(
    returns: list[float], risk_free_rate: float = 0.40
) -> float:
    """
    Calculate the Sharpe ratio.

    Args:
        returns: List of daily returns (as decimals, e.g. 0.01 = 1%).
        risk_free_rate: Annualized risk-free rate (default 40% for Turkey).

    Returns:
        Sharpe ratio, or 0 if insufficient data.
    """
    if len(returns) < 2:
        return 0.0

    mean_return = sum(returns) / len(returns)
    variance = sum((r - mean_return) ** 2 for r in returns) / len(returns)
    std_dev = math.sqrt(variance)

    if std_dev == 0:
        return 0.0

    # Annualize
    annualized_return = mean_return * 252
    annualized_std = std_dev * math.sqrt(252)

    sharpe = (annualized_return - risk_free_rate) / annualized_std
    return round(sharpe, 2)


def calculate_max_drawdown(price_history: list[float]) -> float:
    """
    Calculate the maximum drawdown from a price history.

    Args:
        price_history: List of daily closing prices (oldest first).

    Returns:
        Maximum drawdown as a negative percentage, or 0 if insufficient data.
    """
    if len(price_history) < 2:
        return 0.0

    peak = price_history[0]
    max_dd = 0.0

    for price in price_history:
        if price > peak:
            peak = price
        drawdown = (price - peak) / peak if peak > 0 else 0
        if drawdown < max_dd:
            max_dd = drawdown

    return round(max_dd * 100, 2)


def calculate_diversification_score(allocations: list[float]) -> float:
    """
    Calculate a portfolio diversification score (0-100).

    Uses the Herfindahl-Hirschman Index (HHI) inverted to a 0-100 scale.
    A perfectly diversified portfolio among N stocks scores close to 100.

    Args:
        allocations: List of allocation weights (as decimals, should sum to ~1.0).

    Returns:
        Diversification score between 0 and 100.
    """
    if not allocations:
        return 0.0

    n = len(allocations)
    if n == 1:
        return 0.0

    # HHI = sum of squared weights
    hhi = sum(w ** 2 for w in allocations)

    # Minimum HHI for n assets = 1/n, maximum = 1.0
    min_hhi = 1.0 / n
    max_hhi = 1.0

    if max_hhi == min_hhi:
        return 100.0

    # Normalize to 0-100 (lower HHI = better diversification)
    score = ((max_hhi - hhi) / (max_hhi - min_hhi)) * 100
    return round(max(0.0, min(100.0, score)), 2)
