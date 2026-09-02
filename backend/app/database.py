"""
Database connection and session management
"""
import enum
from typing import TypeVar

from sqlalchemy import Enum as SAEnum
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

E = TypeVar("E", bound=enum.Enum)


def contract_enum(enum_cls: type[E], **kwargs) -> SAEnum:
    """Bind a SQLAlchemy enum column to contract string values (enum.value), not member names."""
    return SAEnum(
        enum_cls,
        values_callable=lambda members: [member.value for member in members],
        **kwargs,
    )


# Create engine for PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=False,  # Set to True for SQL query logging
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
