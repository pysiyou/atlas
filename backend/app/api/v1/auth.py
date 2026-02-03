"""
Authentication API Routes.

Provides login, logout, token refresh, and user info endpoints.
Uses JWT tokens with distinct access/refresh types for security.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import (
    verify_password,
    create_tokens,
    create_access_token,
    decode_token,
    TokenType,
)
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import LoginRequest, Token, UserResponse
from app.schemas.responses import MessageResponse

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

    Returns 401 for invalid credentials.
    """
    user = db.query(User).filter(User.username == credentials.username).first()

    if not user or not verify_password(credentials.password, user.hashedPassword):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token, refresh_token = create_tokens(user.id)

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

    # Verify user still exists
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return RefreshResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's information. Sets loggedInAt to current time for frontend AuthUser."""
    data = UserResponse.model_validate(current_user).model_dump()
    data["loggedInAt"] = datetime.now(timezone.utc)
    return UserResponse(**data)


@router.post("/logout", response_model=MessageResponse)
def logout() -> MessageResponse:
    """
    Logout endpoint.

    Note: JWT tokens are stateless - the client must discard tokens.
    This endpoint exists for API completeness and future token blacklisting.
    """
    return MessageResponse(message="Logged out successfully")
