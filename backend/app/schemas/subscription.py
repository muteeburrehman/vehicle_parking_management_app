from pathlib import Path

from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime

# Schemas for Subscription_types table
class Subscription_Types_Create(BaseModel):
    name: str
    price: float
    parking_code: str

    class Config:
        from_attributes = True


class Subscription_Types_Response(BaseModel):
    id: int
    name: str
    price: float
    parking_code: str

    class Config:
        # from_attributes = True  # Enable the use of from_orm
       from_attributes = True


# Schemas for Subscriptions table
class SubscriptionCreate(BaseModel):
    owner_id: str
    subscription_type_id: int
    access_card: Optional[str]
    lisence_plate1: str
    lisence_plate2: Optional[str]
    lisence_plate3: Optional[str]
    tique_x_park :  Optional[str]
    remote_control_number: Optional[str]
    observations: Optional[str]
    effective_date: Optional[datetime]
    large_family_expiration: Optional[datetime]
    parking_spot: Optional[str]
    created_by: str
    modified_by: Optional[str] = None
    modification_time: Optional[datetime] = None  # Automatically set in DB


    class Config:
        from_attributes = True



class SubscriptionResponse(BaseModel):
    id: int
    owner_id: str
    subscription_type_id: int
    access_card: Optional[str]
    lisence_plate1: str
    lisence_plate2: Optional[str]
    lisence_plate3: Optional[str]
    documents: Optional[List[str]] = None
    tique_x_park: Optional[str]
    remote_control_number: Optional[str]
    observations: Optional[str]
    effective_date: Optional[datetime]
    large_family_expiration: Optional[datetime]
    registration_date: datetime
    parking_spot: Optional[str]
    created_by: str
    modified_by: Optional[str] = None
    modification_time: Optional[datetime] = None

    @validator('documents', pre=True)
    def format_documents(cls, v):
        if isinstance(v, str):
            return [f"/subscription_files/{Path(doc.strip()).name}" for doc in v.split(',') if doc.strip()]
        return v


    class Config:
        # from_attributes = True
        from_attributes = True