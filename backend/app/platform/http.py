"""
HTTP layer: auth/pagination dependencies and the v1 API router.

Domain routers are imported inside ``build_v1_router`` so this module can load
without a circular import from those routers.
"""
from __future__ import annotations

from typing import Annotated

from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.security import TokenType, decode_token
from app.shared.contracts.enums import QualityIssueTargetType, UserRole
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

DEFAULT_PAGE_SIZE = 50
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

    user = db.query(User).filter(User.id == str(user_id)).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled",
            headers={"WWW-Authenticate": "Bearer"},
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
require_lab_tech = require_role(UserRole.ADMIN, UserRole.LAB_TECH, UserRole.LAB_TECH_PLUS)
require_sample_collector = require_role(
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.LAB_TECH,
    UserRole.LAB_TECH_PLUS,
)

_LAB_TECH_ROLES = frozenset({UserRole.ADMIN, UserRole.LAB_TECH, UserRole.LAB_TECH_PLUS})
_SAMPLE_COLLECTOR_ROLES = frozenset(
    {
        UserRole.ADMIN,
        UserRole.RECEPTIONIST,
        UserRole.LAB_TECH,
        UserRole.LAB_TECH_PLUS,
    }
)


def assert_quality_issue_target_access(user: User, target_type: QualityIssueTargetType) -> None:
    """Validation targets require lab tech; specimen targets allow collectors."""
    allowed = (
        _LAB_TECH_ROLES if target_type == QualityIssueTargetType.TEST else _SAMPLE_COLLECTOR_ROLES
    )
    if user.role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Requires role: {', '.join(r.value for r in allowed)}",
        )


def build_v1_router() -> APIRouter:
    """Assemble every domain router under ``/api/v1``."""
    from app.domains.audit.api import router as audit_router
    from app.domains.auth.api import router as auth_router
    from app.domains.catalog.api import router as catalog_router
    from app.domains.config.api import router as config_router
    from app.domains.dashboard.api import router as dashboard_router
    from app.domains.lab.api.router import router as lab_router
    from app.domains.orders.api import router as orders_router
    from app.domains.patients.api import router as patients_router
    from app.domains.payments.api import router as payments_router
    from app.domains.referent_doctors.api import router as referent_doctors_router
    from app.domains.reports.api import router as reports_router
    from app.domains.users.api import router as users_router

    root = APIRouter()
    root.include_router(config_router, tags=["config"])
    root.include_router(auth_router)
    root.include_router(audit_router)
    root.include_router(patients_router, tags=["patients"])
    root.include_router(catalog_router, tags=["catalog"])
    root.include_router(orders_router, tags=["orders"])
    root.include_router(referent_doctors_router, tags=["referent-doctors"])
    root.include_router(users_router, tags=["users"])
    root.include_router(payments_router, tags=["payments"])
    root.include_router(lab_router)
    root.include_router(dashboard_router)
    root.include_router(reports_router)
    return root
