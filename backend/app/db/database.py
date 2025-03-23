import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Ensure SQLite database is stored in the mounted volume
BASE_DIR = "/app/db"  # This is inside the container
DB_PATH = os.path.join(BASE_DIR, 'car_parking_app.db')

# SQLite connection string
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Create database engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
