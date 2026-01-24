"""
Security utilities for authentication and authorization.

Provides JWT token creation/verification and password hashing using bcrypt.
Token types are distinguished by a 'type' claim for security.
"""
from datetime import datetime, timedelta, timezone
from enum import Enum
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings


class TokenType(str, Enum):
    """Token type identifiers to prevent token misuse."""
    ACCESS = "access"
    REFRESH = "refresh"


# Password context with bcrypt
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    return _pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate bcrypt hash for a password."""
    return _pwd_context.hash(password)


def create_access_token(subject: str | int, expires_delta: timedelta | None = None) -> str:
    """
    Create a short-lived JWT access token.

    Args:
        subject: User identifier (typically user ID)
        expires_delta: Custom expiration time (defaults to settings)
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": str(subject),
        "type": TokenType.ACCESS,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str | int) -> str:
    """
    Create a long-lived JWT refresh token.

    Args:
        subject: User identifier (typically user ID)
    """
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(subject),
        "type": TokenType.REFRESH,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str, expected_type: TokenType | None = None) -> dict | None:
    """
    Decode and verify a JWT token.

    Args:
        token: JWT token string
        expected_type: If provided, validates the token type matches

    Returns:
        Token payload dict or None if invalid/expired
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        # Validate token type if specified
        if expected_type and payload.get("type") != expected_type:
            return None

        return payload
    except JWTError:
        return None


def create_tokens(user_id: int) -> tuple[str, str]:
    """
    Create both access and refresh tokens for a user.

    Args:
        user_id: The user's ID

    Returns:
        Tuple of (access_token, refresh_token)
    """
    return create_access_token(user_id), create_refresh_token(user_id)
