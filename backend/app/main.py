"""
FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    affiliations,
    analyzer,
    audit,
    auth,
    billing,
    command_center,
    critical_values,
    dashboard,
    orders,
    patients,
    payments,
    quality_issues,
    recollection_requests,
    reports,
    results,
    samples,
    tests,
    users,
    worklists,
)
from app.core.cache import close_redis, get_redis
from app.core.config import settings
from app.db.database import Base, engine
from app.middleware import CacheHeadersMiddleware, DelayMiddleware
from app.middleware.error_handlers import register_exception_handlers

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    Base.metadata.create_all(bind=engine)
    # Initialize Redis connection (optional - will fail gracefully if not available)
    redis_client = get_redis()
    if redis_client:
        logger.info("Redis cache connected")
    else:
        logger.warning("Redis cache not available - running without cache")

    yield

    # Shutdown
    close_redis()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HTTP caching headers middleware
app.add_middleware(CacheHeadersMiddleware)
# Optional artificial delay for API v1 (for testing loading UI). Add last so it runs first.
app.add_middleware(DelayMiddleware)

# Register global exception handlers
register_exception_handlers(app)


# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Include routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(patients.router, prefix=settings.API_V1_PREFIX, tags=["patients"])
app.include_router(tests.router, prefix=settings.API_V1_PREFIX, tags=["tests"])
app.include_router(orders.router, prefix=settings.API_V1_PREFIX, tags=["orders"])
app.include_router(samples.router, prefix=settings.API_V1_PREFIX, tags=["samples"])
app.include_router(results.router, prefix=settings.API_V1_PREFIX, tags=["results"])
app.include_router(users.router, prefix=settings.API_V1_PREFIX, tags=["users"])
app.include_router(payments.router, prefix=settings.API_V1_PREFIX, tags=["payments"])
app.include_router(affiliations.router, prefix=settings.API_V1_PREFIX, tags=["affiliations"])
app.include_router(critical_values.router, prefix=settings.API_V1_PREFIX, tags=["critical-values"])
app.include_router(analyzer.router, prefix=settings.API_V1_PREFIX, tags=["analyzer"])
app.include_router(audit.router, prefix=settings.API_V1_PREFIX, tags=["audit"])
app.include_router(quality_issues.router, prefix=settings.API_V1_PREFIX, tags=["quality-issues"])
app.include_router(
    recollection_requests.router, prefix=settings.API_V1_PREFIX, tags=["recollection-requests"]
)
app.include_router(command_center.router, prefix=settings.API_V1_PREFIX, tags=["command-center"])
app.include_router(worklists.router, prefix=settings.API_V1_PREFIX)
app.include_router(billing.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
