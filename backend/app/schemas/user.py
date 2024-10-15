from datetime import datetime
from tokenize import String
from typing import Optional, List

from fastapi import UploadFile
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy import Column, DateTime

from backend.app.db.database import Base


# Base schema for User
class UserBase(BaseModel):
    email: EmailStr
    role: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128, description="User's password")
    confirm_password: str = Field(..., min_length=6, max_length=128, description="Confirm password")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "role": "user",
                "password": "password123",
                "confirm_password": "password123"
            }
        }


class UserResponse(UserBase):
    id: int
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Type of token")

    class Config:
        from_attributes = True


class RequestDetails(BaseModel):
    email: str
    password: str


class TokenSchema(BaseModel):
    access_token: str
    refresh_token: str


class TokenCreate(BaseModel):
    user_id: int  # Changed to int for consistency
    access_token: str
    refresh_token: str
    status: bool
    created_date: datetime

# Define your models
class OwnersCreate(BaseModel):
    dni: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    observations: Optional[str] = None
    bank_account_number: str
    sage_client_number: Optional[str]
    phone_number: Optional[str] = None
    registration_date: Optional[datetime] = None  # Automatically set in DB
    created_by: str
    modified_by: Optional[str] = None
    modification_time: Optional[datetime] = None  # Automatically set in DB



class OwnersResponse(BaseModel):
    dni: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    documents: Optional[List[str]] = None  # This will hold paths of uploaded documents
    observations: Optional[str] = None
    bank_account_number: str
    sage_client_number: Optional[str]
    phone_number: Optional[str] = None
    registration_date: datetime
    created_by: str
    modified_by: Optional[str] = None
    modification_time: Optional[datetime] = None  # Automatically set in DB


    class Config:
        from_attributes = True  # Enables compatibility with ORM objects
