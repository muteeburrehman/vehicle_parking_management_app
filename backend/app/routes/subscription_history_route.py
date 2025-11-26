from typing import List

from fastapi import Depends, HTTPException, APIRouter
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Subscription_history
from app.schemas.subscription_history import SubscriptionHistoryResponse

router = APIRouter()

@router.get("/subscription_histories/", response_model=List[SubscriptionHistoryResponse])
async def get_all_subscription_histories(db: Session = Depends(get_db)):
    subscription_histories = db.query(Subscription_history).all()  # Get all records

    # Convert SQLAlchemy objects to dictionaries or Pydantic models
    return [SubscriptionHistoryResponse(**history.__dict__) for history in subscription_histories]

# Get subscription history by ID
@router.get("/subscription_histories/{history_id}", response_model=SubscriptionHistoryResponse)
async def get_subscription_history_by_id(history_id: int, db: Session = Depends(get_db)):
    # Query the database for the subscription history with the given ID
    subscription_history = db.query(Subscription_history).filter(Subscription_history.history_id == history_id).first()

    # If the record is not found, raise an HTTP 404 error
    if subscription_history is None:
        raise HTTPException(status_code=404, detail="Subscription history not found")

    # Return the found subscription history
    return SubscriptionHistoryResponse(**subscription_history.__dict__)

# Delete a subscription history by ID
@router.delete("/subscription_histories/{history_id}/", response_model=dict)
async def delete_subscription_history(history_id: int, db: Session = Depends(get_db)):
    # Search for the subscription history in the database
    subscription_history = db.query(Subscription_history).filter(Subscription_history.history_id == history_id).first()

    # If the history is not found, raise an error
    if subscription_history is None:
        raise HTTPException(status_code=404, detail="Subscription history not found")

    # If found, delete the history
    db.delete(subscription_history)
    db.commit()

    # Return a message confirming the deletion
    return {"detail": "Subscription history deleted successfully"}
