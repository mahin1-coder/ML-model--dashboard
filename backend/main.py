"""
ML Dashboard Backend - FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import auth, datasets, models, predictions, users, billing
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan handler."""
    # Startup
    try:
        from database.connection import create_tables
        await create_tables()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.warning(f"Database initialization failed (will retry on first request): {e}")
    yield
    # Shutdown
    logger.info("Application shutting down")


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Production-ready ML SaaS Platform API",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins for Railway deployment
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(users.router, prefix="/api/users", tags=["Users"])
    app.include_router(datasets.router, prefix="/api/datasets", tags=["Datasets"])
    app.include_router(models.router, prefix="/api/models", tags=["Models"])
    app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
    app.include_router(billing.router, prefix="/api/billing", tags=["Billing"])
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "version": settings.APP_VERSION}
    
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "health": "/health"
        }
    
    return app


app = create_application()
