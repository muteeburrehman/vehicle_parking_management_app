import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get the directory of the current script (backend/app/db)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Construct a relative path for the SQLite database file
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'car_parking_app.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()