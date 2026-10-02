"""User management business logic."""
import logging

from app.domains.audit.service import AuditEmitter
from app.domains.users.models import User
from app.domains.users.schemas import UserCreate, UserUpdate
from app.platform.security import get_password_hash
from app.shared.contracts.enums import UserRole
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

_SELF_DISABLE_DETAIL = "You cannot disable your own account"
_LAST_ADMIN_DISABLE_DETAIL = "Cannot disable the last active administrator"
_LAST_ADMIN_DEMOTE_DETAIL = "Cannot change the role of the last active administrator"


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.emitter = AuditEmitter(db)

    def list_all(self) -> list[User]:
        return self.db.query(User).all()

    def list_lookup(self) -> list[User]:
        """Return every user, including disabled accounts, so historical names still resolve."""
        return self.db.query(User).all()

    def get_by_id(self, user_id: int) -> User:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found",
            )
        return user

    def _count_active_administrators(self) -> int:
        return (
            self.db.query(User)
            .filter(User.role == UserRole.ADMIN, User.isActive.is_(True))
            .count()
        )

    def _is_last_active_administrator(self, user: User) -> bool:
        return user.role == UserRole.ADMIN and bool(user.isActive) and self._count_active_administrators() <= 1

    def _assert_account_lifecycle_guards(
        self,
        user: User,
        update_data: dict,
        actor_user_id: int,
    ) -> None:
        """Reject self-disable and last-active-admin disable/demotion."""
        next_is_active = update_data.get("isActive", user.isActive)
        next_role = update_data.get("role", user.role)

        if next_is_active is False and user.id == actor_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=_SELF_DISABLE_DETAIL,
            )

        if not self._is_last_active_administrator(user):
            return

        if next_is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=_LAST_ADMIN_DISABLE_DETAIL,
            )

        if next_role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=_LAST_ADMIN_DEMOTE_DETAIL,
            )

    def _update_audit_metadata(self, update_data: dict) -> dict | None:
        metadata: dict = {}
        if "role" in update_data:
            role = update_data["role"]
            metadata["role"] = role.value if isinstance(role, UserRole) else role
        if "isActive" in update_data:
            metadata["isActive"] = update_data["isActive"]
        return metadata or None

    def create(self, user_data: UserCreate, actor_user_id: int) -> User:
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
            isActive=True,
        )
        try:
            self.db.add(user)
            self.db.flush()
            self.emitter.user_created(user.id, actor_user_id)
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

    def update(self, user_id: int, user_data: UserUpdate, actor_user_id: int) -> User:
        user = self.get_by_id(user_id)
        update_data = user_data.model_dump(exclude_unset=True)
        self._assert_account_lifecycle_guards(user, update_data, actor_user_id)

        for field, value in update_data.items():
            if field == "password":
                user.hashedPassword = get_password_hash(value)
            else:
                setattr(user, field, value)
        try:
            self.emitter.user_updated(
                user_id,
                actor_user_id,
                metadata=self._update_audit_metadata(update_data),
            )
            self.db.commit()
            self.db.refresh(user)
        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            logger.exception("Failed to update user %s", user_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user",
            )
        return user

    def delete(self, user_id: int, actor_user_id: int) -> None:
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
