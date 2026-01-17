"""
User Management API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.core.dependencies import require_admin
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.id_generator import generate_id

router = APIRouter()


@router.get("/users", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get all users (admin only)
    """
    users = db.query(User).all()
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get user by ID
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    return user


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new user (admin only)
    """
    # Check if username already exists
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username {user_data.username} already exists"
        )
    
    # Generate ID
    user_id = generate_id("user", db)
    
    # Create user
    user = User(
        id=user_id,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        name=user_data.name,
        role=user_data.role,
        email=user_data.email,
        phone=user_data.phone,
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update user (admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "password":
            user.hashed_password = get_password_hash(value)
        else:
            setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete user (admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    
    db.delete(user)
    db.commit()
    
    return None
