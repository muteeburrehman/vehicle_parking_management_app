from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, validator

class OwnerHistoryCreate(BaseModel):
    dni: str
    first_name: str
    last_name: str
    email: str
    documents: Optional[List[str]] = None
    observations: Optional[str]
    bank_account_number: str
    sage_client_number: Optional[str]
    phone_number: Optional[str]
    registration_date: datetime
    reduced_mobility_expiration: Optional[datetime]
    created_by: str
    modified_by: Optional[str] = None
    modification_time: Optional[datetime] = None

    class Config:
        from_attributes = True

class OwnerHistoryResponse(BaseModel):
    history_id: int
    dni: str
    first_name: str
    last_name: str
    email: str
    documents: Optional[List[str]] = None
    observations: Optional[str]
    bank_account_number: str
    sage_client_number: Optional[str]
    phone_number: Optional[str]
    registration_date: datetime
    reduced_mobility_expiration: Optional[datetime]
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