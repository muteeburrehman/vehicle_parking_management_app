from typing import List

from fastapi import Depends, HTTPException, APIRouter
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.models.models import Vehicles_history
from backend.app.schemas.vehicle_history import VehicleHistoryResponse


router = APIRouter()

@router.get("/vehicle_histories/", response_model=List[VehicleHistoryResponse])
async def get_all_vehicles_histories(db: Session = Depends(get_db)):
    vehicle_histories = db.query(Vehicles_history).all()  # Get all records

    # Convert SQLAlchemy objects to dictionaries or Pydantic models
    return [VehicleHistoryResponse(**history.__dict__) for history in vehicle_histories]

# Get vehicle history by ID
@router.get("/vehicle_histories/{history_id}", response_model=VehicleHistoryResponse)
async def get_vehicle_history_by_id(history_id: int, db: Session = Depends(get_db)):
    # Query the database for the vehicle history with the given ID
    vehicle_history = db.query(Vehicles_history).filter(Vehicles_history.history_id == history_id).first()

    # If the record is not found, raise an HTTP 404 error
    if vehicle_history is None:
        raise HTTPException(status_code=404, detail="Vehicle history not found")

    # Return the found vehicle history
    return VehicleHistoryResponse(**vehicle_history.__dict__)

# Delete vehicle history by ID
@router.delete("/vehicle_histories/{history_id}/", response_model=dict)
async def delete_vehicle_history(history_id: int, db: Session = Depends(get_db)):
    # Search for the vehicle history in the database
    vehicle_history = db.query(Vehicles_history).filter(Vehicles_history.history_id == history_id).first()

    # If the history is not found, raise an error
    if vehicle_history is None:
        raise HTTPException(status_code=404, detail="Vehicle history not found")

    # If found, delete the history
    db.delete(vehicle_history)
    db.commit()

    # Return a message confirming the deletion
    return {"detail": "Vehicle history deleted successfully"}
