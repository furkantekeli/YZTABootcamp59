"""
User-related Pydantic schemas for request validation and response serialization.
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr = Field(..., description="Kullanıcı e-posta adresi")
    username: str = Field(..., min_length=3, max_length=100, description="Kullanıcı adı")
    password: str = Field(..., min_length=6, max_length=128, description="Şifre (en az 6 karakter)")
    full_name: str | None = Field(None, max_length=255, description="Ad Soyad")


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr = Field(..., description="E-posta adresi")
    password: str = Field(..., description="Şifre")


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    full_name: str | None = Field(None, max_length=255, description="Ad Soyad")
    username: str | None = Field(None, min_length=3, max_length=100, description="Kullanıcı adı")


class UserResponse(BaseModel):
    """Schema for user data in API responses."""
    id: int
    email: str
    username: str
    full_name: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Schema for JWT token pair response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenRefresh(BaseModel):
    """Schema for token refresh request."""
    refresh_token: str = Field(..., description="Yenileme tokeni")
