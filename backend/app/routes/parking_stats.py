from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Dict
from backend.app.db.database import get_db
from backend.app.models.models import ParkingLot, Subscription_types, Subscriptions

router = APIRouter()

class ParkingLotStat(BaseModel):
    total_subscriptions: int
    subscription_breakdown: List[dict]  # [{name: str, count: int, percentage: float}]

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

        # Initialize counts for all subscription types
        subscription_counts = {st.name: 0 for st in subscription_types}

        # Count active subscriptions
        subscriptions = (
            db.query(Subscriptions)
            .join(Subscription_types)
            .filter(Subscription_types.name.startswith(parking_lot.name))
            .all()
        )

        total = len(subscriptions)

        # Count subscriptions by type
        for sub in subscriptions:
            sub_name = sub.subscription_type.name
            subscription_counts[sub_name] += 1

        # Calculate percentages
        breakdown = [
            {
                "name": sub_name,
                "count": count,
                "percentage": round((count / total * 100), 2) if total > 0 else 0
            }
            for sub_name, count in subscription_counts.items()
        ]

        # Sort breakdown by count (descending)
        breakdown.sort(key=lambda x: x["count"], reverse=True)

        stats[parking_lot.name] = ParkingLotStat(
            total_subscriptions=total,
            subscription_breakdown=breakdown
        )

    return stats