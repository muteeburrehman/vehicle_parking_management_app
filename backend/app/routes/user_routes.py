from datetime import timedelta

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from backend.app.models.models import User
from backend.app.queries.user import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    update_user,
    delete_user
)
from backend.app.schemas.user import UserCreate, UserResponse
from backend.app.db.database import get_db
from backend.app.utils.auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_password_hash

router = APIRouter()


@router.post("/users/",response_model=UserResponse, response_description="Create a new user")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if the user already exists
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the user's password before saving it
    encrypted_password = get_password_hash(user.password)

    # Create a new user object
    new_user = User(email=user.email, password=encrypted_password, role=user.role)

    # Add the new user to the database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create the access token for the new user
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": new_user.email}, expires_delta=access_token_expires)

    # Return the response with all required fields
    return {
        "id": new_user.id,
        "email": new_user.email,
        "role": new_user.role,
        "access_token": access_token,
    }



# @router.put("/users/{user_id}", response_description="Update a user")
# def update_existing_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
#     existing_user = get_user_by_id(db, user_id=user_id)
#     if not existing_user:
#         raise HTTPException(status_code=404, detail="User not found")
#
#     updated_user = update_user(db, user_id=user_id, user=user)
#     return {"message": "User updated successfully", "user": updated_user}
#
#
# @router.delete("/users/{user_id}", response_description="Delete a user")
# def delete_existing_user(user_id: int, db: Session = Depends(get_db)):
#     deleted_user = delete_user(db, user_id=user_id)
#     if not deleted_user:
#         raise HTTPException(status_code=404, detail="User not found")
#     return {"message": "User deleted successfully", "user": deleted_user}
