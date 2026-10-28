"""Main FastAPI Application Entrypoint."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.errors import setup_exception_handlers
from app.core.logging import logger, setup_logging
from app.core.middleware import (
    RequestIDMiddleware,
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown events."""
    setup_logging(settings.LOG_LEVEL)
    logger.info(f"Starting {settings.APP_NAME} in {settings.APP_ENV} mode")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}")


def create_application() -> FastAPI:
    """FastAPI application factory."""
    application = FastAPI(
        title="MedLab API",
        description="MedLab — Secure Family Medical Records & AI Health Assistant API",
        version="1.0.0",
        openapi_url="/openapi.json" if settings.APP_ENV != "production" else None,
        docs_url="/docs" if settings.APP_ENV != "production" else None,
        redoc_url=None,
        lifespan=lifespan,
    )

    allow_origin_regex = (
        settings.FRONTEND_ORIGIN_REGEX
        if settings.FRONTEND_ORIGIN_REGEX
        else (
            r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
            if settings.APP_ENV != "production"
            else None
        )
    )

    # Middleware execution order (bottom-to-top on request, top-to-bottom on response)
    application.add_middleware(SecurityHeadersMiddleware)
    application.add_middleware(RequestLoggingMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_origin_regex=allow_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
    application.add_middleware(RequestIDMiddleware)

    # Global Exception Handlers
    setup_exception_handlers(application)

    # Register API v1 routes
    application.include_router(api_router, prefix=settings.API_V1_PREFIX)

    @application.get("/health", tags=["Health"])
    async def root_health() -> dict[str, str]:
        """Root health check for platform monitoring."""
        return {"status": "ok", "app": settings.APP_NAME}

    return application


app = create_application()
