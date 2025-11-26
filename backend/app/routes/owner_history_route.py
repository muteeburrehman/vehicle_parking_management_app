from typing import List

from fastapi import Depends, HTTPException, APIRouter
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Owners_history
from app.schemas.owner_history import OwnerHistoryResponse


router = APIRouter()

@router.get("/owner_histories/", response_model=List[OwnerHistoryResponse])
async def get_all_owner_histories(db: Session = Depends(get_db)):
    owner_histories = db.query(Owners_history).all()  # Get all records

    # Convert SQLAlchemy objects to dictionaries or Pydantic models
    return [OwnerHistoryResponse(**history.__dict__) for history in owner_histories]

# Get owner history by ID
@router.get("/owner_histories/{history_id}", response_model=OwnerHistoryResponse)
async def get_owner_history_by_id(history_id: int, db: Session = Depends(get_db)):
    # Query the database for the owner history with the given ID
    owner_history = db.query(Owners_history).filter(Owners_history.history_id == history_id).first()

    # If the record is not found, raise an HTTP 404 error
    if owner_history is None:
        raise HTTPException(status_code=404, detail="Owner history not found")

    # Return the found owner history
    return OwnerHistoryResponse(**owner_history.__dict__)

# Delete owner history by ID
@router.delete("/owner_histories/{history_id}/", response_model=dict)
async def delete_owner_history(history_id: int, db: Session = Depends(get_db)):
    # Search for the owner history in the database
    owner_history = db.query(Owners_history).filter(Owners_history.history_id == history_id).first()

    # If the history is not found, raise an error
    if owner_history is None:
        raise HTTPException(status_code=404, detail="Owner history not found")

    # If found, delete the history
    db.delete(owner_history)
    db.commit()

    # Return a message confirming the deletion
    return {"detail": "Owner history deleted successfully"}
