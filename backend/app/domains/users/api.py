"""User Management API Routes"""

from app.domains.users.models import User
from app.domains.users.schemas import UserCreate, UserLookupResponse, UserResponse, UserUpdate
from app.domains.users.service import UserService
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user, require_admin
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/users/lookup", response_model=list[UserLookupResponse])
def get_users_lookup(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    return UserService(db).list_lookup()


@router.get("/users", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    return UserService(db).list_all()


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    return UserService(db).get_by_id(user_id)


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return UserService(db).create(user_data, current_user.id)


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return UserService(db).update(user_id, user_data, current_user.id)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    UserService(db).delete(user_id, current_user.id)
    return None
