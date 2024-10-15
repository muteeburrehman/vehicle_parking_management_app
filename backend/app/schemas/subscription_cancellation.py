from datetime import datetime
from pathlib import Path
from typing import Optional, List

from pydantic import BaseModel, validator


# Schemas for Cancellations
class CancellationCreate(BaseModel):
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
    parking_spot: Optional[str]
    registration_date: Optional[datetime]
    modification_time: Optional[datetime]
    created_by: str
    modified_by: Optional[str] = None


    class Config:
        from_attributes = True

class CancellationResponse(BaseModel):
    id: int
    owner_id: str
    subscription_type_id: int
    access_card: Optional[str]
    lisence_plate1: Optional[str]
    lisence_plate2: Optional[str]
    lisence_plate3: Optional[str]
    documents: Optional[List[str]] = None
    tique_x_park: Optional[str]
    remote_control_number: Optional[str]
    observations: Optional[str]
    registration_date: datetime
    parking_spot: Optional[str]
    modification_time: Optional[datetime]
    created_by: str
    modified_by: Optional[str] = None

    @validator('documents', pre=True)
    def format_documents(cls, v):
        if isinstance(v, str):
            return [f"/subscription_files/{Path(doc.strip()).name}" for doc in v.split(',') if doc.strip()]
        return v
