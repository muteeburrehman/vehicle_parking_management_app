from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from app.db.database import get_db

from app.models.models import ParkingLot, Subscription_types, Subscriptions, Cancellations
from app.schemas.subscription import Subscription_Types_Response
from app.queries.subscription import get_subscriptions_query

from app.schemas.parking_lot_config import ParkingLotCreate, ParkingLotResponse, \
    ParkingLotStatsResponse, ParkingLotStats

router = APIRouter()


@router.post("/parking-lot-config/", response_model=ParkingLotResponse)
async def create_parking_lot_config(config: ParkingLotCreate, db: Session = Depends(get_db)):
    """
    Create a new parking lot configuration with validation.
    """
    db_config = ParkingLot(**config.dict())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


def update_parking_lot_spaces(db: Session, subscription_type_id: int, change: int):
    subscription_type = db.query(Subscription_types).filter(Subscription_types.id == subscription_type_id).first()
    if not subscription_type:
        raise HTTPException(status_code=400, detail=f"Subscription type with ID {subscription_type_id} does not exist.")

    parking_lot_name = subscription_type.name.split()[0]  # Assumes the parking lot name is the first word in the subscription type name
    parking_lot = db.query(ParkingLot).filter(ParkingLot.name == parking_lot_name).first()
    if not parking_lot:
        raise HTTPException(status_code=400, detail=f"Parking lot {parking_lot_name} does not exist.")

    if "24H" in subscription_type.name.upper() and "MOTOS" not in subscription_type.name.upper():
        parking_lot.total_car_spaces += change
        print(f"Updated 24H car spaces for {parking_lot.name}: {parking_lot.total_car_spaces}")
    elif "24H MOTOS" in subscription_type.name.upper():
        parking_lot.total_motorcycle_spaces += change
        print(f"Updated 24H motorcycle spaces for {parking_lot.name}: {parking_lot.total_motorcycle_spaces}")
    else:
        print(f"Subscription type '{subscription_type.name}' does not affect car or motorcycle space counts")

    db.commit()
# In the file containing the get_parking_lot_stats function (likely parking_lot_config.py)

@router.get("/parking-lot-stats", response_model=Dict[str, ParkingLotStats])
def get_parking_lot_stats(db: Session = Depends(get_db)):
    parking_lots = db.query(ParkingLot).all()
    if not parking_lots:
        raise HTTPException(status_code=404, detail="No parking lot configurations found")

    stats = {}
    for parking_lot in parking_lots:
        # Filter subscription types based on parking lot name
        subscription_types = db.query(Subscription_types).filter(
            Subscription_types.name.startswith(parking_lot.name)
        ).all()

        # Get subscriptions that belong to the parking lot
        subscriptions = db.query(Subscriptions).join(Subscription_types).filter(
            Subscription_types.name.startswith(parking_lot.name)
        ).all()

        # Get cancellations related to the parking lot
        cancellations = db.query(Cancellations).join(Subscription_types, Cancellations.subscription_type_id == Subscription_types.id).filter(
            Subscription_types.name.startswith(parking_lot.name)
        ).all()

        # Count occupied car spaces based on subscriptions
        occupied_car_spaces = sum(1 for sub in subscriptions if "24H" in sub.subscription_type.name.upper() and "MOTOS" not in sub.subscription_type.name.upper())
        occupied_motorcycle_spaces = sum(1 for sub in subscriptions if "24H MOTOS" in sub.subscription_type.name.upper())

        # Count cancellation-related car spaces based on cancellations
        cancelled_car_spaces = sum(1 for cancel in cancellations if "24H" in cancel.subscription_type.name.upper() and "MOTOS" not in cancel.subscription_type.name.upper())
        cancelled_motorcycle_spaces = sum(1 for cancel in cancellations if "24H MOTOS" in cancel.subscription_type.name.upper())

        # Calculate available spaces
        free_car_spaces = parking_lot.total_car_spaces - occupied_car_spaces - cancelled_car_spaces
        free_motorcycle_spaces = parking_lot.total_motorcycle_spaces - occupied_motorcycle_spaces - cancelled_motorcycle_spaces

        # Determine the status based on available spaces
        if free_car_spaces < parking_lot.min_car_spaces or free_motorcycle_spaces < parking_lot.min_motorcycle_spaces:
            status = 'critical'
        elif free_car_spaces < (parking_lot.total_car_spaces * 0.2) or free_motorcycle_spaces < (parking_lot.total_motorcycle_spaces * 0.2):
            status = 'warning'
        else:
            status = 'good'

        # Collect the stats for this parking lot
        stats[parking_lot.name] = ParkingLotStats(
            total_car_spaces=parking_lot.total_car_spaces,
            total_motorcycle_spaces=parking_lot.total_motorcycle_spaces,
            free_car_spaces=free_car_spaces,
            free_motorcycle_spaces=free_motorcycle_spaces,
            cancellation_count=len(cancellations),
            cancelled_car_spaces=cancelled_car_spaces,
            cancelled_motorcycle_spaces=cancelled_motorcycle_spaces,
            status=status
        )

    return stats




@router.get("/parking-lot-config", response_model=List[ParkingLotResponse])
def get_all_parking_lots(db: Session = Depends(get_db)):
    db_parking_lots = db.query(ParkingLot).all()
    return [ParkingLotResponse.from_orm(lot) for lot in db_parking_lots]


@router.get("/subscription-types", response_model=List[Subscription_Types_Response])
def get_subscription_types(db: Session = Depends(get_db)):
    subscription_types = db.query(Subscription_types).filter(Subscription_types.name.contains("24H")).all()
    return [Subscription_Types_Response.from_orm(st) for st in subscription_types]


@router.put("/parking-lot-config/{config_id}", response_model=ParkingLotResponse)
async def update_parking_lot_config(
        config_id: int,
        config: ParkingLotCreate,
        db: Session = Depends(get_db)
):
    """
    Update an existing parking lot configuration with validation.
    """
    db_config = db.query(ParkingLot).filter(ParkingLot.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Parking lot configuration not found")

    for key, value in config.dict().items():
        setattr(db_config, key, value)

    db.commit()
    db.refresh(db_config)
    return db_config


@router.get("/parking-lot-config/{config_id}", response_model=ParkingLotResponse)
async def get_parking_lot_config(config_id: int, db: Session = Depends(get_db)):
    """
    Get a specific parking lot configuration.
    """
    db_config = db.query(ParkingLot).filter(ParkingLot.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Parking lot configuration not found")
    return db_config


# Add this new endpoint to your existing FastAPI router in the backend

@router.delete("/parking-lot-config/{config_id}")
async def delete_parking_lot_config(config_id: int, db: Session = Depends(get_db)):
    """
    Delete a parking lot configuration.
    """
    db_config = db.query(ParkingLot).filter(ParkingLot.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Parking lot configuration not found")
    
    # Check if there are any active subscriptions for this parking lot
    subscription_types = db.query(Subscription_types).filter(
        Subscription_types.name.startswith(db_config.name)
    ).all()
    
    subscription_type_ids = [st.id for st in subscription_types]
    active_subscriptions = db.query(Subscriptions).filter(
        Subscriptions.subscription_type_id.in_(subscription_type_ids)
    ).count()
    
    if active_subscriptions > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete parking lot '{db_config.name}' because it has {active_subscriptions} active subscriptions"
        )
    
    db.delete(db_config)
    db.commit()
    return {"message": f"Parking lot '{db_config.name}' deleted successfully"}
