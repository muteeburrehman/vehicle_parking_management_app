from sqlalchemy import text
from sqlalchemy.orm import Session
from backend.app.models.models import User
from backend.app.schemas.user import UserCreate, OwnersCreate
from backend.app.utils.auth import get_password_hash, pwd_context


def create_user(db: Session, user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = User(email=user.email, password=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user: User):
    sql = text("""
        UPDATE users
        SET email = :email,
            password = :password,
            role = :role
        WHERE id = :id
        RETURNING id, email, role;
    """)

    with db.begin():  # Automatically handles commit and rollback
        result = db.execute(sql, {
            "id": user_id,
            "email": user.email,
            "password": user.password,
            "role": user.role
        })
    return result.fetchone()



def delete_user(db: Session, user_id: int):
    sql = text("""
        DELETE FROM users
        WHERE id = :id
        RETURNING id, email;
    """)

    with db.begin():  # Automatically handles commit and rollback
        result = db.execute(sql, {"id": user_id})
    return result.fetchone()


def get_user_by_email(db: Session, email: str) -> User | None:
    sql = text("""
        SELECT id, email, password, role
        FROM users
        WHERE email = :email
    """)

    try:
        result = db.execute(sql, {"email": email}).fetchone()  # Fetch the first result

        if result:
            # Map the result to a User object
            return User(id=result.id, email=result.email, password=result.password, role=result.role)

    except Exception as e:
        print(f"Error retrieving user: {e}")

    return None  # Return None if there's an error or no user found

def get_users(db: Session):
    sql = text("""
        SELECT id, email, role
        FROM users;
    """)

    try:
        result = db.execute(sql)
        return result.fetchall()  # Fetch all users
    except Exception as e:
        print(f"Error retrieving users: {e}")

def get_user_by_id(db: Session, user_id: int):
    sql = text("""
        SELECT id, email, role
        FROM users
        WHERE id = :id;
    """)

    try:
        result = db.execute(sql, {"id": user_id})
        return result.fetchone()  # Fetch user by ID
    except Exception as e:
        print(f"Error retrieving user by ID: {e}")

