from sqlalchemy.orm import Session
from app.models.models import User
from app.schemas.user import UserCreate, UserUpdate
from app.utils.auth import pwd_context


def create_user(db: Session, user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    new_user = User(
        email=user.email,
        password=hashed_password,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def update_user(db: Session, user_id: int, user: UserUpdate):
    existing_user = db.query(User).filter(User.id == user_id).first()
    if not existing_user:
        return None

    existing_user.email = user.email
    existing_user.role = user.role

    # Only update password if provided
    if user.password:
        existing_user.password = pwd_context.hash(user.password)

    db.commit()
    db.refresh(existing_user)
    return existing_user


def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    db.delete(user)
    db.commit()
    return user


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session):
    return db.query(User).all()


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()
