from sqlalchemy.orm import Session

from app.models.models import Subscription_history
from app.schemas.subscription_history import SubscriptionHistoryCreate


# Create SubscriptionHistory
def create_subscription_history(db: Session, subscription_data: SubscriptionHistoryCreate):
    db_subscription_history = Subscription_history(**subscription_data.dict())
    db.add(db_subscription_history)
    db.commit()
    db.refresh(db_subscription_history)
    return db_subscription_history

# Fetch SubscriptionHistory by ID
def get_subscription_history(db: Session, history_id: int):
    return db.query(Subscription_history).filter(Subscription_history.history_id == history_id).first()