"""
Price Alert API endpoints.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.alert import PriceAlert
from app.schemas.alert import PriceAlertCreate, PriceAlertResponse, PriceAlertCheck
from app.services import stock_service

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=list[PriceAlertResponse])
async def get_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all price alerts for the current user."""
    result = await db.execute(
        select(PriceAlert)
        .where(PriceAlert.user_id == current_user.id)
        .order_by(PriceAlert.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=PriceAlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_data: PriceAlertCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new price alert."""
    alert = PriceAlert(
        user_id=current_user.id,
        symbol=alert_data.symbol.upper(),
        name=alert_data.name,
        target_price=alert_data.target_price,
        alert_type=alert_data.alert_type,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a price alert."""
    result = await db.execute(
        select(PriceAlert).where(
            PriceAlert.id == alert_id,
            PriceAlert.user_id == current_user.id,
        )
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alarm bulunamadı.")

    await db.delete(alert)
    await db.commit()


@router.post("/check", response_model=list[PriceAlertCheck])
async def check_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Check all active alerts against current prices and return triggered ones."""
    result = await db.execute(
        select(PriceAlert).where(
            PriceAlert.user_id == current_user.id,
            PriceAlert.is_active == True,
            PriceAlert.is_triggered == False,
        )
    )
    active_alerts = result.scalars().all()
    triggered_results = []

    for alert in active_alerts:
        try:
            price_data = await stock_service.get_stock_price(alert.symbol)
            current_price = price_data.current_price

            if current_price is None:
                continue

            is_triggered = False
            if alert.alert_type == "ABOVE" and current_price >= alert.target_price:
                is_triggered = True
            elif alert.alert_type == "BELOW" and current_price <= alert.target_price:
                is_triggered = True

            if is_triggered:
                # Mark alert as triggered in the database
                alert.is_triggered = True
                alert.triggered_at = datetime.now(timezone.utc)

                direction = "üstüne çıktı" if alert.alert_type == "ABOVE" else "altına düştü"
                message = f"🔔 {alert.symbol} fiyatı {current_price:.2f} olarak hedef fiyat {alert.target_price:.2f}'nin {direction}!"

                triggered_results.append(PriceAlertCheck(
                    alert_id=alert.id,
                    symbol=alert.symbol,
                    target_price=alert.target_price,
                    current_price=current_price,
                    alert_type=alert.alert_type,
                    is_triggered=True,
                    message=message,
                ))
        except Exception:
            continue

    await db.commit()
    return triggered_results
