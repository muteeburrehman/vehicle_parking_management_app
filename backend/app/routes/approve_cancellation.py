from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.models.models import Cancellations, ApprovedCancellations

router = APIRouter()

@router.post("/api/cancellations/{cancellation_id}/approve")
async def approve_cancellation(
    cancellation_id: int,
    db: Session = Depends(get_db)
):
    cancellation = db.query(Cancellations).filter(Cancellations.id == cancellation_id).first()
    if not cancellation:
        raise HTTPException(status_code=404, detail="Cancellation not found")

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
        modification_time=cancellation.modification_time,
        created_by=cancellation.created_by,
        modified_by=cancellation.modified_by
    )

    try:
        db.add(approved_cancellation)
        db.delete(cancellation)
        db.commit()
        return {"message": "Cancellation approved successfully", "id": approved_cancellation.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error approving cancellation: {str(e)}")
