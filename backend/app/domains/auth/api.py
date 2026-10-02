"""
Authentication API Routes.

Provides login, logout, token refresh, and user info endpoints.
Uses JWT tokens with distinct access/refresh types for security.
"""
from datetime import UTC, datetime

from app.domains.audit.service import AuditEmitter
from app.domains.users.models import User
from app.domains.users.schemas import LoginRequest, Token, UserResponse
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from app.platform.security import (
    TokenType,
    create_access_token,
    create_tokens,
    decode_token,
    verify_password,
)
from app.shared.schemas.error import MessageResponse
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RefreshRequest(BaseModel):
    """Request body for token refresh."""

    refresh_token: str


class RefreshResponse(BaseModel):
    """Response for token refresh."""

    access_token: str
    token_type: str = "bearer"


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------


@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return access/refresh tokens.

    Returns 401 for invalid credentials or a disabled account.
    """
    user = db.query(User).filter(User.username == credentials.username).first()

    if not user or not verify_password(credentials.password, user.hashedPassword):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token, refresh_token = create_tokens(user.id)

    user.loggedInAt = datetime.now(UTC)
    AuditEmitter(db).user_login(user.id)
    db.commit()

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
    )


@router.post("/refresh", response_model=RefreshResponse)
def refresh_token(request: RefreshRequest, db: Session = Depends(get_db)):
    """
    Exchange a valid refresh token for a new access token.

    The refresh token must be valid and not expired.
    Returns 401 if the refresh token is invalid or the user no longer exists.
    """
    payload = decode_token(request.refresh_token, expected_type=TokenType.REFRESH)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # Verify user still exists and is allowed to refresh
    user = db.query(User).filter(User.id == int(user_id)).first()
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

    return RefreshResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the current authenticated user, including persisted last-login time."""
    return current_user


@router.post("/logout", response_model=MessageResponse)
def logout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """
    Logout endpoint.

    Note: JWT tokens are stateless - the client must discard tokens.
    This endpoint exists for API completeness and future token blacklisting.
    """
    AuditEmitter(db).user_logout(current_user.id)
    db.commit()
    return MessageResponse(message="Logged out successfully")
