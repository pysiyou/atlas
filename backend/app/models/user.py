"""
User Model - All fields use camelCase
"""
from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashedPassword = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
