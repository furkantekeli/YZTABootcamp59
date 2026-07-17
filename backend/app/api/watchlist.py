"""
Watchlist API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.watchlist import WatchlistItem
from app.schemas.alert import WatchlistItemCreate, WatchlistItemResponse
from app.services import stock_service

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.get("/", response_model=list[WatchlistItemResponse])
async def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all watchlist items with live prices for the current user."""
    result = await db.execute(
        select(WatchlistItem)
        .where(WatchlistItem.user_id == current_user.id)
        .order_by(WatchlistItem.created_at.desc())
    )
    items = result.scalars().all()

    response_items = []
    for item in items:
        # Fetch live price
        current_price = None
        previous_close = None
        change_pct = None

        try:
            price_data = await stock_service.get_stock_price(item.symbol)
            current_price = price_data.current_price
            previous_close = price_data.previous_close
            if current_price and previous_close and previous_close > 0:
                change_pct = round(((current_price - previous_close) / previous_close) * 100, 2)
        except Exception:
            pass

        response_items.append(WatchlistItemResponse(
            id=item.id,
            symbol=item.symbol,
            name=item.name,
            exchange=item.exchange,
            currency=item.currency,
            notes=item.notes,
            current_price=current_price,
            previous_close=previous_close,
            change_pct=change_pct,
            created_at=item.created_at,
        ))

    return response_items


@router.post("/", response_model=WatchlistItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    item_data: WatchlistItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a stock to the watchlist."""
    # Check for duplicates
    existing = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.user_id == current_user.id,
            WatchlistItem.symbol == item_data.symbol.upper(),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu hisse zaten izleme listenizde bulunuyor.",
        )

    item = WatchlistItem(
        user_id=current_user.id,
        symbol=item_data.symbol.upper(),
        name=item_data.name,
        exchange=item_data.exchange,
        currency=item_data.currency,
        notes=item_data.notes,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    return WatchlistItemResponse(
        id=item.id,
        symbol=item.symbol,
        name=item.name,
        exchange=item.exchange,
        currency=item.currency,
        notes=item.notes,
        current_price=None,
        previous_close=None,
        change_pct=None,
        created_at=item.created_at,
    )


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a stock from the watchlist."""
    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.id == item_id,
            WatchlistItem.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="İzleme listesinde bu kayıt bulunamadı.")

    await db.delete(item)
    await db.commit()
