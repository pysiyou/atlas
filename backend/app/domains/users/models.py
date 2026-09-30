"""
User Model - All fields use camelCase
"""
from app.platform.database import Base, contract_enum
from app.shared.contracts.enums import UserRole
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashedPassword = Column("hashed_password", String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(contract_enum(UserRole), nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(
        "updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
