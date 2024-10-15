from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.db.database import get_db

from backend.app.models.models import ParkingLotConfig, Subscription_types, Subscriptions
from backend.app.queries.subscription import get_subscriptions_query
from backend.app.schemas.parking_lot_config import ParkingLotConfigCreate, ParkingLotConfigResponse, \
    ParkingLotStatsResponse, ParkingLotStats

router = APIRouter()

@router.post("/parking-lot-config/", response_model=ParkingLotConfigResponse)
def create_parking_lot_config(config: ParkingLotConfigCreate, db: Session = Depends(get_db)):
    db_config = ParkingLotConfig(**config.dict())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

@router.get("/parking-lot-config/", response_model=List[ParkingLotConfigResponse])
def get_parking_lot_configs(db: Session = Depends(get_db)):
    return db.query(ParkingLotConfig).all()


@router.get("/parking-lot-stats", response_model=ParkingLotStatsResponse)
def get_parking_lot_stats(db: Session = Depends(get_db)):
    config = db.query(ParkingLotConfig).first()
    if not config:
        raise HTTPException(status_code=404, detail="No parking lot configuration found")

    subscriptions = db.query(Subscriptions).all()
    subscription_types = db.query(Subscription_types).all()

    # Count subscriptions
    subscription_counts = {
        "24H CAR": 0,
        "24H Motorcycle": 0,
        "12H CAR": 0,
        "12H Motorcycle": 0,
        "Other": 0
    }

    for sub in subscriptions:
        sub_type = next((st for st in subscription_types if st.id == sub.subscription_type_id), None)
        if sub_type:
            if "24H CAR" in sub_type.name:
                subscription_counts["24H CAR"] += 1
            elif "24H Motorcycle" in sub_type.name:
                subscription_counts["24H Motorcycle"] += 1
            elif "12H CAR" in sub_type.name:
                subscription_counts["12H CAR"] += 1
            elif "12H Motorcycle" in sub_type.name:
                subscription_counts["12H Motorcycle"] += 1
            else:
                subscription_counts["Other"] += 1

    # Calculate statistics
    occupied_car_spaces = subscription_counts["24H CAR"] + subscription_counts["12H CAR"]
    occupied_motorcycle_spaces = subscription_counts["24H Motorcycle"] + subscription_counts["12H Motorcycle"]
    free_car_spaces = config.total_car_spaces - occupied_car_spaces
    free_motorcycle_spaces = config.total_motorcycle_spaces - occupied_motorcycle_spaces
    total_spaces = config.total_car_spaces + config.total_motorcycle_spaces

    # Calculate percentages
    total_subscriptions = sum(subscription_counts.values())
    percentages = {k: (v / total_subscriptions * 100 if total_subscriptions else 0) for k, v in subscription_counts.items()}

    stats = ParkingLotStats(
        total_spaces=total_spaces,
        occupied_car_spaces=occupied_car_spaces,
        occupied_motorcycle_spaces=occupied_motorcycle_spaces,
        free_car_spaces=free_car_spaces,
        free_motorcycle_spaces=free_motorcycle_spaces,
        subscription_counts=subscription_counts,
        percentages=percentages
    )

    return ParkingLotStatsResponse(stats=stats)


@router.put("/parking-lot-config/{config_id}", response_model=ParkingLotConfigResponse)
def update_parking_lot_config(config_id: int, config: ParkingLotConfigCreate, db: Session = Depends(get_db)):
    db_config = db.query(ParkingLotConfig).filter(ParkingLotConfig.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Parking lot configuration not found")

    for key, value in config.dict().items():
        setattr(db_config, key, value)

    db.commit()
    db.refresh(db_config)
    return db_config