from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Cancellations, ApprovedCancellations, Subscription_history

router = APIRouter()


@router.post("/api/cancellations/{cancellation_id}/approve")
async def approve_cancellation(
        cancellation_id: int,
        db: Session = Depends(get_db)
):
    # Find the cancellation record
    cancellation = db.query(Cancellations).filter(Cancellations.id == cancellation_id).first()
    if not cancellation:
        raise HTTPException(status_code=404, detail="Cancellation not found")

    # Get current time for modification timestamp
    current_time = datetime.now()

    # Create subscription history entry
    subscription_history_entry = Subscription_history(
        id=cancellation.subscription_id,
        owner_id=cancellation.owner_id,
        subscription_type_id=cancellation.subscription_type_id,
        access_card=cancellation.access_card,
        lisence_plate1=cancellation.lisence_plate1,
        lisence_plate2=cancellation.lisence_plate2,
        lisence_plate3=cancellation.lisence_plate3,
        documents=cancellation.documents,
        tique_x_park=cancellation.tique_x_park,
        remote_control_number=cancellation.remote_control_number,
        observations=cancellation.observations,
        effective_date=cancellation.effective_date,
        effective_cancellation_date=cancellation.effective_cancellation_date,
        registration_date=cancellation.registration_date,
        parking_spot=cancellation.parking_spot,
        modification_time=current_time,
        created_by=cancellation.created_by,
        modified_by=cancellation.modified_by
    )

    # Create approved cancellation record
    approved_cancellation = ApprovedCancellations(
        cancellation_id=cancellation.id,
        owner_id=cancellation.owner_id,
        subscription_id=cancellation.subscription_id,
        subscription_type_id=cancellation.subscription_type_id,
        access_card=cancellation.access_card,
        lisence_plate1=cancellation.lisence_plate1,
        lisence_plate2=cancellation.lisence_plate2,
        lisence_plate3=cancellation.lisence_plate3,
        tique_x_park=cancellation.tique_x_park,
        documents=cancellation.documents,
        remote_control_number=cancellation.remote_control_number,
        observations=cancellation.observations,
        registration_date=cancellation.registration_date,
        effective_date=cancellation.effective_date,
        effective_cancellation_date=cancellation.effective_cancellation_date,
        parking_spot=cancellation.parking_spot,
        modification_time=current_time,
        created_by=cancellation.created_by,
        modified_by=cancellation.modified_by
    )

    try:
        # Add both new records
        db.add(subscription_history_entry)
        db.add(approved_cancellation)

        # Delete the original cancellation record
        db.delete(cancellation)

        # Commit all changes
        db.commit()

        return {
            "message": "Cancellation approved successfully",
            "id": approved_cancellation.id,
            "history_id": subscription_history_entry.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error approving cancellation: {str(e)}")

@router.get("/api/approved-cancellations")
async def get_approved_cancellations(
        db: Session = Depends(get_db)
):
    """
    Get all approved cancellations.
    """
    try:
        approved_cancellations = db.query(ApprovedCancellations).all()
        return {"approved_cancellations": approved_cancellations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching approved cancellations: {str(e)}")


@router.get("/api/approved-cancellations/{approved_cancellation_id}")
async def get_approved_cancellation_by_id(
        approved_cancellation_id: int,
        db: Session = Depends(get_db)
):
    """
    Get a specific approved cancellation by ID.
    """
    approved_cancellation = db.query(ApprovedCancellations).filter(
        ApprovedCancellations.id == approved_cancellation_id).first()

    if not approved_cancellation:
        raise HTTPException(status_code=404, detail="Approved cancellation not found")

    return {"approved_cancellation": approved_cancellation}