# login router
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models import models
from app.schemas.user import TokenSchema, RequestDetails  # Ensure correct casing
from app.utils.auth import create_access_token, create_refresh_token, verify_password
from app.queries.user import get_user_by_email

router = APIRouter()


@router.post('/login', response_model=TokenSchema)
def login(request: RequestDetails, db: Session = Depends(get_db)):
    user = get_user_by_email(db, request.email)

    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email")

    if not verify_password(request.password, user.password):  # Pass the actual password
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )

    # Check for existing active token
    existing_token = db.query(models.TokenTable).filter_by(user_id=user.id, status=True).first()
    if existing_token:
        return {
            "access_token": existing_token.access_token,
            "refresh_token": existing_token.refresh_token,
            "token_type": "bearer",
            "email": user.email,
            "role": user.role
        }

    # Create new tokens if no active token exists
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    token_db = models.TokenTable(user_id=user.id, access_token=access_token, refresh_token=refresh_token, status=True)
    db.add(token_db)
    db.commit()
    db.refresh(token_db)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "email": user.email,
        "role": user.role
    }
