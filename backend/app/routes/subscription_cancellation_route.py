from datetime import datetime
from typing import List

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.models.models import Subscriptions, Subscription_history, Cancellations, Owners, Vehicles, \
    Subscription_types
from backend.app.schemas.subscription_cancellation import CancellationResponse, CancellationCreate

router = APIRouter()



@router.post("/subscriptions/cancel", response_model=CancellationResponse)
def cancel_subscription(request: CancellationCreate, db: Session = Depends(get_db)):
    # Validate owner exists
    owner = db.query(Owners).filter(Owners.dni == request.owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    # Validate subscription exists
    subscription = db.query(Subscriptions).filter(
        Subscriptions.owner_id == request.owner_id,
        Subscriptions.subscription_type_id == request.subscription_type_id,
    ).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Validate license plates to cancel
    plates_to_cancel = [plate for plate in [request.lisence_plate1, request.lisence_plate2, request.lisence_plate3] if plate]
    for plate in plates_to_cancel:
        if plate not in [subscription.lisence_plate1, subscription.lisence_plate2, subscription.lisence_plate3]:
            raise HTTPException(status_code=404, detail=f"License plate {plate} not found in subscription")

    # Set modification_time to current local time if not provided
    subscription.modification_time = datetime.now()
    if request.modified_by:
        subscription.modified_by = request.modified_by

    # Update the observation field
    subscription.observations = request.observations

    # Handle documents based on its type
    if isinstance(request.documents, str):
        documents = request.documents.split(',')
    elif isinstance(request.documents, list):
        documents = request.documents
    else:
        documents = []

    # Clean up document paths
    documents = [doc.strip() for doc in documents if doc.strip()]

    # Create cancellation record
    cancelled_subscription = Cancellations(
        owner_id=subscription.owner_id,
        subscription_id=subscription.id,
        subscription_type_id=subscription.subscription_type_id,
        access_card=subscription.access_card,
        lisence_plate1=request.lisence_plate1,
        lisence_plate2=request.lisence_plate2,
        lisence_plate3=request.lisence_plate3,
        tique_x_park=request.tique_x_park,
        documents=','.join(documents) if documents else None,
        remote_control_number=request.remote_control_number,
        observations=request.observations,  # Use the new observation from the request
        registration_date=subscription.registration_date,
        parking_spot=subscription.parking_spot,
        modification_time=subscription.modification_time,
        created_by=subscription.created_by,
        modified_by=subscription.modified_by
    )

    db.add(cancelled_subscription)

    # Create subscription history entry
    subscription_history_entry = Subscription_history(
        id=subscription.id,
        owner_id=subscription.owner_id,
        subscription_type_id=subscription.subscription_type_id,
        access_card=subscription.access_card,
        lisence_plate1=subscription.lisence_plate1,
        lisence_plate2=subscription.lisence_plate2,
        lisence_plate3=subscription.lisence_plate3,
        documents=subscription.documents,
        tique_x_park=subscription.tique_x_park,
        remote_control_number=subscription.remote_control_number,
        observations=subscription.observations,
        registration_date=subscription.registration_date,
        parking_spot=subscription.parking_spot,
        modification_time=subscription.modification_time,
        created_by=subscription.created_by,
        modified_by=subscription.modified_by
    )

    db.add(subscription_history_entry)

    # Clear canceled plates from subscription
    for i, plate in enumerate(['lisence_plate1', 'lisence_plate2', 'lisence_plate3'], 1):
        if getattr(request, plate) in plates_to_cancel:
            setattr(subscription, plate, None)

    # Delete subscription if all plates are canceled
    if not any([subscription.lisence_plate1, subscription.lisence_plate2, subscription.lisence_plate3]):
        db.delete(subscription)

    db.commit()

    return CancellationResponse(
        id=cancelled_subscription.id,
        owner_id=cancelled_subscription.owner_id,
        subscription_type_id=cancelled_subscription.subscription_type_id,
        access_card=cancelled_subscription.access_card,
        lisence_plate1=cancelled_subscription.lisence_plate1,
        lisence_plate2=cancelled_subscription.lisence_plate2,
        lisence_plate3=cancelled_subscription.lisence_plate3,
        documents=cancelled_subscription.documents.split(',') if cancelled_subscription.documents else [],
        tique_x_park=cancelled_subscription.tique_x_park,
        remote_control_number=cancelled_subscription.remote_control_number,
        observations=cancelled_subscription.observations,
        registration_date=cancelled_subscription.registration_date,
        parking_spot=cancelled_subscription.parking_spot,
        modification_time=cancelled_subscription.modification_time,
        created_by=cancelled_subscription.created_by,
        modified_by=cancelled_subscription.modified_by
    )


@router.get("/subscriptions/cancellations/", response_model=List[CancellationResponse])
def get_all_cancellations(db: Session = Depends(get_db)):
    cancellations = db.query(Cancellations).all()  # Fetch all cancellation records

    # Map each cancellation to the CancellationResponse schema
    return [
        CancellationResponse(
            id=cancellation.id,
            owner_id=cancellation.owner_id,
            subscription_type_id=cancellation.subscription_type_id,
            access_card=cancellation.access_card,
            lisence_plate1=cancellation.lisence_plate1,
            lisence_plate2=cancellation.lisence_plate2,
            lisence_plate3=cancellation.lisence_plate3,
            tique_x_park=cancellation.tique_x_park,
            remote_control_number=cancellation.remote_control_number,
            documents=cancellation.documents,
            observations=cancellation.observations,
            registration_date=cancellation.registration_date,
            parking_spot=cancellation.parking_spot,
            created_by=cancellation.created_by,
            modified_by=cancellation.modified_by,
            modification_time=cancellation.modification_time  # Include this field if required
        )
        for cancellation in cancellations
    ]


@router.get("/cancellations/{cancellation_id}", response_model=CancellationResponse)
def get_cancellation(cancellation_id: int, db: Session = Depends(get_db)):
    cancellation = db.query(Cancellations).filter(Cancellations.id == cancellation_id).first()
    if not cancellation:
        raise HTTPException(status_code=404, detail="Cancellation not found")

    # Clean up and process documents
    documents = cancellation.documents.split(',') if cancellation.documents else []
    documents = [doc.strip() for doc in documents if doc.strip()]

    return CancellationResponse(
        id=cancellation.id,
        owner_id=cancellation.owner_id,
        subscription_type_id=cancellation.subscription_type_id,
        access_card=cancellation.access_card,
        lisence_plate1=cancellation.lisence_plate1,
        lisence_plate2=cancellation.lisence_plate2,
        lisence_plate3=cancellation.lisence_plate3,
        tique_x_park=cancellation.tique_x_park,
        remote_control_number=cancellation.remote_control_number,
        documents=documents,  # Use the processed documents list
        observations=cancellation.observations,
        registration_date=cancellation.registration_date,
        parking_spot=cancellation.parking_spot,
        created_by=cancellation.created_by,
        modified_by=cancellation.modified_by,
        modification_time=cancellation.modification_time
    )

@router.delete("/cancellations/{cancellation_id}/", response_model=dict)
def delete_cancellation(cancellation_id: int, db: Session = Depends(get_db)):
    # Query the cancellation by ID
    cancellation = db.query(Cancellations).filter(Cancellations.id == cancellation_id).first()

    # If the cancellation is not found, return a 404 error
    if cancellation is None:
        raise HTTPException(status_code=404, detail="Cancellation not found")

    # Delete the cancellation
    db.delete(cancellation)
    db.commit()

    return {"detail": "Cancellation deleted successfully"}
