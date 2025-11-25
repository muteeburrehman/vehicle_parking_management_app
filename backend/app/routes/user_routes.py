from datetime import timedelta
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.models.models import User
from backend.app.schemas.user import UserCreate, UserResponse, UserUpdate
from backend.app.db.database import get_db
from backend.app.queries.user import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    get_users,
    update_user,
    delete_user
)
from backend.app.utils.auth import (
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_password_hash,
)

router = APIRouter()
# -----------------------------------------------------------


@router.post("/users/", response_model=UserResponse)
def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = create_user(db, user)

    access_token = create_access_token(
        data={"sub": new_user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "id": new_user.id,
        "email": new_user.email,
        "role": new_user.role,
        "access_token": access_token,
    }


@router.get("/users/", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = get_users(db)
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_endpoint(user_id: int, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user_endpoint(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):

    existing = get_user_by_id(db, user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")

    # Check for duplicate email
    if user_update.email != existing.email:
        email_owner = get_user_by_email(db, user_update.email)
        if email_owner and email_owner.id != user_id:
            raise HTTPException(status_code=400, detail="Email already registered")

    updated_user = update_user(db, user_id, user_update)

    return updated_user


@router.delete("/users/{user_id}")
def delete_user_endpoint(user_id: int, db: Session = Depends(get_db)):

    existing = get_user_by_id(db, user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")

    deleted_user = delete_user(db, user_id)

    return {
        "message": "User deleted successfully",
        "deleted_user": {
            "id": deleted_user.id,
            "email": deleted_user.email
        }
    }
