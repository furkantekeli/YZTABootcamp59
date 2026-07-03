"""
Authentication API endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, TokenRefresh
from app.services.auth_service import register_user, authenticate_user, refresh_tokens

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user and get access/refresh tokens."""
    tokens = await register_user(user_data, db)
    await db.commit()
    return tokens


@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login an existing user and get access/refresh tokens."""
    tokens = await authenticate_user(login_data, db)
    await db.commit()
    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh(refresh_data: TokenRefresh, db: AsyncSession = Depends(get_db)):
    """Refresh JWT access and refresh tokens using a refresh token."""
    tokens = await refresh_tokens(refresh_data.refresh_token, db)
    await db.commit()
    return tokens


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the authenticated user's profile info."""
    return UserResponse.model_validate(current_user)
