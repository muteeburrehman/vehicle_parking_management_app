from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, validator

class VehicleHistoryCreate(BaseModel):
    lisence_plate: str
    brand: str
    model: str
    vehicle_type: str
    owner_id: str
    documents: Optional[List[str]] = None
    observations: Optional[str]
    registration_date: datetime
    created_by: str
    modified_by: Optional[str] = None
    modification_time: Optional[datetime] = None

    class Config:
        from_attributes = True

class VehicleHistoryResponse(BaseModel):
    history_id: int
    lisence_plate: str
    brand: str
    model: str
    vehicle_type: str
    owner_id: str
    documents: Optional[List[str]] = None
    observations: Optional[str]
    registration_date: datetime
    created_by: str
    modified_by: Optional[str] = None
    modification_time: Optional[datetime] = None

    @validator('documents', pre=True)
    def split_documents(cls, v):
        if isinstance(v, str):
            return [doc.strip() for doc in v.split(',') if doc.strip()]
        return v or []

    class Config:
        from_attributes = True
