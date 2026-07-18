"""
Transaction service: create, delete, and recalculate positions.
"""

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.stock import PortfolioStock
from app.models.transaction import Transaction, TransactionType
from app.models.portfolio import Portfolio
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.utils.calculations import calculate_weighted_avg_cost, calculate_realized_pnl
from app.services import analysis_service


async def get_portfolio_transactions(
    portfolio_id: int, user: User, db: AsyncSession
) -> list[TransactionResponse]:
    """
    Get all transactions for a portfolio, ordered by date descending.

    Validates that the portfolio belongs to the user.
    """
    # Verify portfolio ownership
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user.id,
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portföy bulunamadı.",
        )

    # Get all stock IDs in this portfolio
    stock_result = await db.execute(
        select(PortfolioStock.id).where(PortfolioStock.portfolio_id == portfolio_id)
    )
    stock_ids = [row[0] for row in stock_result.all()]

    if not stock_ids:
        return []

    # Get transactions
    txn_result = await db.execute(
        select(Transaction)
        .where(Transaction.portfolio_stock_id.in_(stock_ids))
        .order_by(Transaction.transaction_date.desc())
    )
    transactions = txn_result.scalars().all()
    return [TransactionResponse.model_validate(t) for t in transactions]


async def add_transaction(
    portfolio_id: int,
    txn_data: TransactionCreate,
    user: User,
    db: AsyncSession,
) -> TransactionResponse:
    """
    Add a BUY or SELL transaction and recalculate the stock's position.

    Validates:
    - Portfolio belongs to user.
    - Stock belongs to the portfolio.
    - For SELL: sufficient lots are available.

    Recalculates avg_cost and total_lots after the transaction.
    """
    # Verify portfolio ownership
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user.id,
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portföy bulunamadı.",
        )

    # Verify stock belongs to this portfolio
    stock_result = await db.execute(
        select(PortfolioStock).where(
            PortfolioStock.id == txn_data.portfolio_stock_id,
            PortfolioStock.portfolio_id == portfolio_id,
        )
    )
    stock = stock_result.scalar_one_or_none()

    if stock is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hisse senedi bu portföyde bulunamadı.",
        )

    # For SELL: check sufficient lots
    if txn_data.transaction_type == "SELL" and stock.total_lots < txn_data.lots:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Yetersiz lot sayısı. Mevcut: {stock.total_lots}, Satılmak istenen: {txn_data.lots}",
        )

    # Create transaction
    transaction = Transaction(
        portfolio_stock_id=txn_data.portfolio_stock_id,
        transaction_type=TransactionType(txn_data.transaction_type),
        lots=txn_data.lots,
        price=txn_data.price,
        commission=txn_data.commission,
        transaction_date=txn_data.transaction_date or datetime.now(timezone.utc),
        notes=txn_data.notes,
    )
    db.add(transaction)
    await db.flush()

    # Recalculate position
    await _recalculate_position(stock, db)

    # Trigger portfolio snapshot creation
    try:
        await analysis_service.create_portfolio_snapshot(portfolio_id, user, db)
    except Exception:
        pass

    await db.refresh(transaction)
    return TransactionResponse.model_validate(transaction)


async def delete_transaction(
    transaction_id: int, user: User, db: AsyncSession
) -> dict:
    """
    Delete a transaction and recalculate the stock's position.

    Validates that the transaction's stock belongs to a portfolio owned by the user.
    """
    # Get the transaction
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()

    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="İşlem bulunamadı.",
        )

    # Verify ownership chain: transaction -> stock -> portfolio -> user
    stock_result = await db.execute(
        select(PortfolioStock).where(
            PortfolioStock.id == transaction.portfolio_stock_id
        )
    )
    stock = stock_result.scalar_one_or_none()

    if stock is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="İlgili hisse senedi bulunamadı.",
        )

    portfolio_result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == stock.portfolio_id,
            Portfolio.user_id == user.id,
        )
    )
    if portfolio_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlemi silme yetkiniz yok.",
        )

    await db.delete(transaction)
    await db.flush()

    # Recalculate position
    await _recalculate_position(stock, db)

    # Trigger portfolio snapshot creation
    try:
        await analysis_service.create_portfolio_snapshot(stock.portfolio_id, user, db)
    except Exception:
        pass

    return {"message": "İşlem başarıyla silindi."}


async def _recalculate_position(stock: PortfolioStock, db: AsyncSession) -> None:
    """
    Recalculate a stock's total_lots and avg_cost from its transactions.
    """
    result = await db.execute(
        select(Transaction)
        .where(Transaction.portfolio_stock_id == stock.id)
        .order_by(Transaction.transaction_date.asc())
    )
    transactions = result.scalars().all()

    txn_dicts = [
        {
            "transaction_type": t.transaction_type.value,
            "lots": t.lots,
            "price": t.price,
            "commission": t.commission,
        }
        for t in transactions
    ]

    # Recalculate total lots
    total_lots = 0.0
    for t in txn_dicts:
        if t["transaction_type"] == "BUY":
            total_lots += t["lots"]
        elif t["transaction_type"] == "SELL":
            total_lots -= t["lots"]

    total_lots = max(0.0, total_lots)

    # Recalculate weighted average cost
    avg_cost = calculate_weighted_avg_cost(txn_dicts) if total_lots > 0 else 0.0

    stock.total_lots = round(total_lots, 6)
    stock.avg_cost = round(avg_cost, 4)
    await db.flush()


async def get_stock_pnl(stock: PortfolioStock, db: AsyncSession) -> dict:
    """
    Calculate realized and unrealized P&L for a stock position.
    """
    result = await db.execute(
        select(Transaction)
        .where(Transaction.portfolio_stock_id == stock.id)
        .order_by(Transaction.transaction_date.asc())
    )
    transactions = result.scalars().all()

    txn_dicts = [
        {
            "transaction_type": t.transaction_type.value,
            "lots": t.lots,
            "price": t.price,
            "commission": t.commission,
        }
        for t in transactions
    ]

    realized = calculate_realized_pnl(txn_dicts)

    current_price = stock.current_price or stock.avg_cost
    unrealized = (current_price - stock.avg_cost) * stock.total_lots if stock.total_lots > 0 else 0.0

    return {
        "realized_pnl": round(realized, 2),
        "unrealized_pnl": round(unrealized, 2),
        "total_pnl": round(realized + unrealized, 2),
    }
