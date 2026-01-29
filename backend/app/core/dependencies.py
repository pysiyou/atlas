"""
FastAPI dependencies for authentication and authorization.

Provides dependency injection for:
- Current user extraction from JWT
- Role-based access control (RBAC)
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_token, TokenType
from app.models.user import User
from app.schemas.enums import UserRole


# Bearer token extractor (auto_error=False for custom error handling)
_bearer = HTTPBearer(auto_error=False)

# Standard auth error
_credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid or expired token",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """
    Extract and validate the current user from the JWT access token.

    Raises:
        HTTPException 401: Missing, invalid, or expired token
        HTTPException 401: User not found
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Decode and validate token type
    payload = decode_token(credentials.credentials, expected_type=TokenType.ACCESS)
    if not payload:
        raise _credentials_exception

    # Extract user ID
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
    """
    Dependency factory for role-based access control.

    Usage:
        @router.get("/admin-only")
        def admin_endpoint(user: User = Depends(require_role(UserRole.ADMIN))):
            ...
    """
    def check_role(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {', '.join(r.value for r in allowed_roles)}",
            )
        return user

    return check_role


# Pre-built role dependencies for common access patterns
require_admin = require_role(UserRole.ADMIN)
require_receptionist = require_role(UserRole.ADMIN, UserRole.RECEPTIONIST)
require_lab_tech = require_role(UserRole.ADMIN, UserRole.LAB_TECH)
require_lab_tech_plus = require_role(UserRole.ADMIN, UserRole.LAB_TECH_PLUS)
# Sample collection: receptionists and lab techs (and lab tech plus) can collect samples
require_sample_collector = require_role(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.LAB_TECH, UserRole.LAB_TECH_PLUS)
