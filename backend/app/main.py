"""
FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.core.cache import get_redis, close_redis
from app.middleware import CacheHeadersMiddleware
from app.middleware.error_handlers import register_exception_handlers

# Import routers
from app.api.v1 import auth, patients, tests, orders, samples, results, users, payments, affiliations, critical_values, analyzer, audit


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    Base.metadata.create_all(bind=engine)
    # Initialize Redis connection (optional - will fail gracefully if not available)
    redis_client = get_redis()
    if redis_client:
        print("Redis cache connected")
    else:
        print("Redis cache not available - running without cache")

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

