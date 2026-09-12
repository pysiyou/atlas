"""User management business logic."""
import logging
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> List[User]:
        return self.db.query(User).all()

    def list_lookup(self) -> List[User]:
        return self.db.query(User).all()

    def get_by_id(self, user_id: int) -> User:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found",
            )
        return user

    def create(self, user_data: UserCreate) -> User:
        existing = self.db.query(User).filter(User.username == user_data.username).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username {user_data.username} already exists",
            )
        user = User(
            username=user_data.username,
            hashedPassword=get_password_hash(user_data.password),
            name=user_data.name,
            role=user_data.role,
            email=user_data.email,
            phone=user_data.phone,
        )
        try:
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        except Exception:
            self.db.rollback()
            logger.exception("Failed to create user %s", user_data.username)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user",
            )
        return user

    def update(self, user_id: int, user_data: UserUpdate) -> User:
        user = self.get_by_id(user_id)
        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "password":
                user.hashedPassword = get_password_hash(value)
            else:
                setattr(user, field, value)
        try:
            self.db.commit()
            self.db.refresh(user)
        except Exception:
            self.db.rollback()
            logger.exception("Failed to update user %s", user_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user",
            )
        return user

    def delete(self, user_id: int) -> None:
        user = self.get_by_id(user_id)
        try:
            self.db.delete(user)
            self.db.commit()
        except Exception:
            self.db.rollback()
            logger.exception("Failed to delete user %s", user_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete user",
            )
