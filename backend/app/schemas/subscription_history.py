# Schemas for SubscriptionHistory
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, validator


class SubscriptionHistoryCreate(BaseModel):
    id: int
    owner_id: str
    subscription_type_id: int
    access_card: Optional[str]
    lisence_plate1: str
    lisence_plate2: Optional[str]
    lisence_plate3: Optional[str]
    tique_x_park: Optional[str]
    remote_control_number: Optional[str]
    observations: Optional[str]
    effective_date: Optional[datetime]
    parking_spot: Optional[str]
    registration_date: Optional[datetime]
    modification_time: Optional[datetime] = None
    created_by: str
    modified_by: Optional[str] = None

    class Config:
        from_attributes = True

class SubscriptionHistoryResponse(BaseModel):
    history_id: int
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
    registration_date: datetime
    parking_spot: Optional[str]
    modification_time: Optional[datetime] = None
    created_by: str
    modified_by: Optional[str] = None

    @validator('documents', pre=True)
    def split_documents(cls, v):
        if isinstance(v, str):
            return [doc.strip() for doc in v.split(',') if doc.strip()]
        return v or []

    class Config:
        from_attributes = True