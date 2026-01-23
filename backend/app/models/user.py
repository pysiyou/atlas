"""
User Model - All fields use camelCase
"""
from sqlalchemy import Column, String, Integer, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashedPassword = Column("hashed_password", String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
