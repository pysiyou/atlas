"""
FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base

# Import routers
from app.api.v1 import auth, patients, tests, orders, samples, results, users

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX, tags=["auth"])
app.include_router(patients.router, prefix=settings.API_V1_PREFIX, tags=["patients"])
app.include_router(tests.router, prefix=settings.API_V1_PREFIX, tags=["tests"])
app.include_router(orders.router, prefix=settings.API_V1_PREFIX, tags=["orders"])
app.include_router(samples.router, prefix=settings.API_V1_PREFIX, tags=["samples"])
app.include_router(results.router, prefix=settings.API_V1_PREFIX, tags=["results"])
app.include_router(users.router, prefix=settings.API_V1_PREFIX, tags=["users"])

