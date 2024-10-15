from sqlalchemy.orm import Session

from backend.app.models.models import Subscription_types, Subscriptions
from backend.app.schemas.subscription import Subscription_Types_Create, SubscriptionCreate


# CRUD for Subscription Types

def create_subscription_type_query(db: Session, subscription_type: Subscription_Types_Create):
    db_subscription_type = Subscription_types(**subscription_type.dict())
    db.add(db_subscription_type)
    db.commit()
    db.refresh(db_subscription_type)
    return db_subscription_type


def get_subscription_types_query(db: Session):
    return db.query(Subscription_types).all()


def get_subscription_type_by_id_query(db: Session, id: int):
    return db.query(Subscription_types).filter(Subscription_types.id == id).first()


# CRUD for Subscriptions

def create_subscription_query(db: Session, subscription: SubscriptionCreate):
    db_subscription = Subscriptions(**subscription.dict())
    db.add(db_subscription)
    db.commit()
    db.refresh(db_subscription)
    return db_subscription


# Query for getting subscriptions from the database
def get_subscriptions_query(db: Session):
    return db.query(Subscriptions).all()  # Remove trailing comma

def get_subscription_by_id_query(db: Session, id: int):
    subscription = db.query(Subscriptions).filter(Subscriptions.id == id).first()
    return subscription

def get_subscription_by_id(db: Session, id_list: list[int]):
    subscription = db.query(Subscriptions).filter(Subscriptions.id.in_(id_list)).all()
    return subscription
