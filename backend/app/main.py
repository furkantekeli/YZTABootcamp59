"""
FastAPI application entry point.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_tables
from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Run database migrations/tables creation
    try:
        await create_tables()
    except Exception as e:
        print(f"Error creating tables on startup: {e}")
    yield


app = FastAPI(
    title="Portföy Takip API",
    description="Yapay Zeka Destekli Portföy Takip Sistemi Backend Servisi",
    version="1.0.0",
    lifespan=lifespan,
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include main API router
app.include_router(api_router, prefix="/api")


@app.get("/api/health", tags=["health"])
async def health_check():
    """Health check endpoint for container monitoring."""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0"
    }
