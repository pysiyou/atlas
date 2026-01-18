"""
FastAPI dependencies for authentication and authorization
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.schemas.enums import UserRole

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    if not credentials:
        print("DEBUG: No credentials found in request (Authorization header missing or invalid scheme)")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"DEBUG: User {user.username} authenticated successfully. Role: {user.role}")
    return user


def require_role(*allowed_roles: UserRole):
    """Dependency factory to check if user has required role"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # print(f"DEBUG: Checking role for {current_user.username}. Has {current_user.role}. Requires {allowed_roles}")
        if current_user.role not in allowed_roles:
            print(f"DEBUG: ACCESS DENIED. User {current_user.username} (role={current_user.role}) attempted to access resource requiring {allowed_roles}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[role.value for role in allowed_roles]}"
            )
        return current_user
    return role_checker


# Common role dependencies
require_admin = require_role(UserRole.ADMIN)
require_receptionist = require_role(UserRole.ADMIN, UserRole.RECEPTIONIST)
require_lab_tech = require_role(UserRole.ADMIN, UserRole.LAB_TECH)
require_validator = require_role(UserRole.ADMIN, UserRole.VALIDATOR)
require_billing = require_role(UserRole.ADMIN, UserRole.BILLING)
