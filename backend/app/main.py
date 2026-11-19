"""
FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.domains.registry  # noqa: F401 — register ORM models
from app.platform.cache import close_redis, get_redis
from app.platform.config import settings
from app.platform.database import Base, engine
from app.platform.http import build_v1_router
from app.platform.middleware import (
    CacheHeadersMiddleware,
    DelayMiddleware,
    register_exception_handlers,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    Base.metadata.create_all(bind=engine)
    from app.platform.database import sync_missing_columns

    sync_missing_columns()
    try:
        from app.domains.catalog.service import CatalogSeedService
        from app.platform.database import SessionLocal

        db = SessionLocal()
        try:
            CatalogSeedService(db).seed_from_contracts()
        finally:
            db.close()
    except Exception:
        logger.exception("Catalog seed skipped")
    redis_client = get_redis()
    if redis_client:
        logger.info("Redis cache connected")
    else:
        logger.warning("Redis cache not available - running without cache")

    yield

    close_redis()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(CacheHeadersMiddleware)
app.add_middleware(DelayMiddleware)

register_exception_handlers(app)


@app.get("/health")
def health_check():
    return {"status": "healthy"}


app.include_router(build_v1_router(), prefix=settings.API_V1_PREFIX)