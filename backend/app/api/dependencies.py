"""
Reusable FastAPI dependencies: DB session, pagination, auth, and RBAC.
"""
from typing import Annotated

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import TokenType, decode_token
from app.db.database import get_db
from app.models.user import User
from app.schemas.enums import UserRole

DEFAULT_PAGE_SIZE = 10000
MAX_PAGE_SIZE = 10000

_bearer = HTTPBearer(auto_error=False)

_credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid or expired token",
    headers={"WWW-Authenticate": "Bearer"},
)


def pagination_params(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Max records to return"
    ),
) -> dict:
    """Standard pagination parameters for list endpoints."""
    return {"skip": skip, "limit": limit}


PaginationParams = Annotated[dict, Depends(pagination_params)]


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate the current user from the JWT access token."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials, expected_type=TokenType.ACCESS)
    if not payload:
        raise _credentials_exception

    user_id = payload.get("sub")
    if not user_id:
        raise _credentials_exception

    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
    except (ValueError, TypeError):
        raise _credentials_exception

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def require_role(*allowed_roles: UserRole):
    """Dependency factory for role-based access control."""

    def check_role(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {', '.join(r.value for r in allowed_roles)}",
            )
        return user

    return check_role


require_admin = require_role(UserRole.ADMIN)
require_receptionist = require_role(UserRole.ADMIN, UserRole.RECEPTIONIST)
require_lab_tech = require_role(UserRole.ADMIN, UserRole.LAB_TECH, UserRole.LAB_TECH_PLUS)
require_lab_tech_plus = require_role(UserRole.ADMIN, UserRole.LAB_TECH_PLUS)
require_sample_collector = require_role(
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.LAB_TECH,
    UserRole.LAB_TECH_PLUS,
)
