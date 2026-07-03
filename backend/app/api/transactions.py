"""
Transaction API endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.services import transaction_service

router = APIRouter(tags=["transactions"])


@router.get("/portfolios/{portfolio_id}/transactions", response_model=list[TransactionResponse])
async def list_transactions(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all transactions for a specific portfolio."""
    return await transaction_service.get_portfolio_transactions(portfolio_id, current_user, db)


@router.post("/portfolios/{portfolio_id}/transactions", response_model=TransactionResponse)
async def create_transaction(
    portfolio_id: int,
    txn_data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a BUY or SELL transaction, automatically updating stock average cost and total lots."""
    transaction = await transaction_service.add_transaction(portfolio_id, txn_data, current_user, db)
    await db.commit()
    return transaction


@router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a transaction, automatically recalculating stock average cost and total lots."""
    result = await transaction_service.delete_transaction(transaction_id, current_user, db)
    await db.commit()
    return result
