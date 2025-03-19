from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Dict
from backend.app.db.database import get_db
from backend.app.models.models import ParkingLot, Subscription_types, Subscriptions, Cancellations

router = APIRouter()


class ParkingLotStat(BaseModel):
    total_subscriptions: int
    total_expected_billing: float  # New field for total billing
    subscription_breakdown: List[dict]  # [{name: str, count: int, percentage: float, total_billing: float}]

@router.get("/parking-lot-statistics", response_model=Dict[str, ParkingLotStat])
def get_parking_lot_stats(db: Session = Depends(get_db)):
    parking_lots = db.query(ParkingLot).all()
    if not parking_lots:
        raise HTTPException(status_code=404, detail="No parking lot configurations found")

    stats = {}
    for parking_lot in parking_lots:
        # First get all subscription types for this parking lot
        subscription_types = (
            db.query(Subscription_types)
            .filter(Subscription_types.name.startswith(parking_lot.name))
            .all()
        )

        # Initialize counts and billing for all subscription types
        subscription_data = {st.name: {"count": 0, "price": st.price} for st in subscription_types}

        # Count active subscriptions
        subscriptions = (
            db.query(Subscriptions)
            .join(Subscription_types)
            .filter(Subscription_types.name.startswith(parking_lot.name))
            .all()
        )

        # Count cancellations for each subscription type
        cancellations = (
            db.query(Cancellations)
            .join(Subscription_types)
            .filter(Subscription_types.name.startswith(parking_lot.name))
            .all()
        )

        total = len(subscriptions) + len(cancellations)
        total_billing = 0

        # Count subscriptions by type and calculate billing
        for sub in subscriptions:
            sub_name = sub.subscription_type.name
            subscription_data[sub_name]["count"] += 1
            total_billing += subscription_data[sub_name]["price"]



        # Now handle cancellations by adjusting the counts and total billing
        for cancel in cancellations:
            cancel_name = cancel.subscription_type.name
            subscription_data[cancel_name]["count"] += 1
            total_billing += subscription_data[cancel_name]["price"]

        # Calculate percentages and create breakdown
        breakdown = [
            {
                "name": sub_name,
                "count": data["count"],
                "percentage": round((data["count"] / total * 100), 2) if total > 0 else 0,
                "total_billing": data["count"] * data["price"]
            }
            for sub_name, data in subscription_data.items()
        ]

        # Sort breakdown by count (descending)
        breakdown.sort(key=lambda x: x["count"], reverse=True)

        stats[parking_lot.name] = ParkingLotStat(
            total_subscriptions=total,
            total_expected_billing=total_billing,
            subscription_breakdown=breakdown
        )

    return stats
