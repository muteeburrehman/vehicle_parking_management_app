from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class VehicleCreate(BaseModel):
    lisence_plate: str = Field(..., title="License Plate")
    brand: str = Field(..., title="Brand of the Vehicle")
    model: str = Field(..., title="Model of the Vehicle")
    vehicle_type: str = Field(..., title="Type of the Vehicle")
    owner_id: str = Field(..., title="Owner's DNI")
    observations: Optional[str] = Field(..., title="Observations about the Vehicle")
    registration_date: Optional[datetime] = Field(default_factory=datetime.now, title="Registration Date")
    created_by: str = Field(..., title="User's Email")
    modified_by: Optional[str] = Field(None, title="User's Email")
    modification_time: Optional[datetime] = Field(None, title="Modification Date")

class VehicleResponse(BaseModel):
    lisence_plate: str
    brand: str
    model: str
    vehicle_type: str = Field(..., title="Type of the Vehicle")
    owner_id: str
    documents: Optional[List[str]] = None  # This will hold paths of uploaded documents
    observations: Optional[str] = None
    registration_date: datetime
    created_by: str
    modified_by: Optional[str] = None
    modification_time: Optional[datetime] = None

    class Config:
        from_attributes = True