import os
import shutil
from bdb import effective
from datetime import datetime
from pathlib import PosixPath
from typing import List
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.logger import logger
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse
from weasyprint import CSS, HTML

from backend.app.db.database import get_db
from backend.app.models.models import Subscriptions, Subscription_history, Cancellations, Owners, Vehicles, \
    Subscription_types
from backend.app.queries.owner import get_owner_by_dni
from backend.app.queries.vehicle import get_vehicle
from backend.app.routes.subscription_routes import env
from backend.app.schemas.subscription_cancellation import CancellationResponse, CancellationCreate

router = APIRouter()

base_path = os.getcwd()
UPLOAD_DIR = Path(base_path) / "cancelled_subscription_files"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

async def generate_cancellation_work_order_pdf(cancelled_subscription: Cancellations, db: Session):
    # Fetch owner information
    owner = get_owner_by_dni(db=db, owner_dni=cancelled_subscription.owner_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    # Fetch vehicle information
    vehicle = get_vehicle(db=db, lisence_plate=cancelled_subscription.lisence_plate1)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Fetch subscription type information
    subscription_type = db.query(Subscription_types).filter(
        Subscription_types.id == cancelled_subscription.subscription_type_id).first()
    if not subscription_type:
        raise HTTPException(status_code=404, detail="Subscription type not found")

    # Helper function to safely get attribute or return empty string
    def safe_get(obj, attr, default=''):
        value = getattr(obj, attr, None)
        return value if value is not None else default

    # Prepare data for the template
    template_data = {
        'order_no': f"{safe_get(cancelled_subscription, 'id')}/24",
        'date': safe_get(cancelled_subscription, 'modification_time', datetime.now()).strftime('%m/%d/%Y'),
        'vehicle_type': safe_get(vehicle, 'vehicle_type', '').upper(),
        'effective_date': safe_get(cancelled_subscription, 'effective_date', datetime.now()).strftime('%m/%d/%Y'),
        'effective_cancellation_date': safe_get(cancelled_subscription, 'effective_cancellation_date', datetime.now()).strftime('%m/%d/%Y'),
        'name_surname': f"{safe_get(owner, 'first_name')} {safe_get(owner, 'last_name')}",
        'phone': safe_get(owner, 'phone_number', ''),
        'email': safe_get(owner, 'email', ''),
        'license_plate': safe_get(cancelled_subscription, 'lisence_plate1', ''),
        'parking_spot': safe_get(cancelled_subscription, 'parking_spot', ''),
        'card': safe_get(cancelled_subscription, 'access_card', ''),
        'remote': safe_get(cancelled_subscription, 'remote_control_number', ''),
        'license_plate1': safe_get(cancelled_subscription, 'lisence_plate1', ''),
        'license_plate2': safe_get(cancelled_subscription, 'lisence_plate2', ''),
        'license_plate3': safe_get(cancelled_subscription, 'lisence_plate3', ''),
        'observations': safe_get(cancelled_subscription, 'observations', ''),
        'subscription_type_name': safe_get(subscription_type, 'name', ''),
    }

    # Print statement for debugging
    print(f"Cancelled Subscription ID: {safe_get(cancelled_subscription, 'id', 'N/A')}")

    # Render HTML template
    template = env.get_template('cancellation_work_order_template.html')
    html_content = template.render(template_data)

    # Generate PDF
    css = CSS(string='''
        @page {
            size: letter;
            margin: 1cm;
        }
        body {
            font-family: Helvetica, Arial, sans-serif;
        }
        h1 {
            text-align: center;
        }
        .checkbox {
            display: inline-block;
            width: 10px;
            height: 10px;
            border: 1px solid black;
            margin-right: 5px;
        }
        .checked {
            background-color: black;
        }
    ''')
    pdf = HTML(string=html_content).write_pdf(stylesheets=[css])

    # Save the PDF
    filename = f"cancellation_Orden De Trabajo_{safe_get(cancelled_subscription, 'id', 'unknown')}.pdf"
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        f.write(pdf)

    return filename  # Return only the filename

@router.post("/subscriptions/cancel", response_model=CancellationResponse)
async def cancel_subscription(request: CancellationCreate, db: Session = Depends(get_db)):
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

    # Set modification_time to current local time
    current_time = datetime.now()
    subscription.modification_time = current_time

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
        effective_date=request.effective_date,
        effective_cancellation_date=request.effective_cancellation_date,
        large_family_expiration=subscription.large_family_expiration,
        lisence_plate1=request.lisence_plate1,
        lisence_plate2=request.lisence_plate2,
        lisence_plate3=request.lisence_plate3,
        tique_x_park=request.tique_x_park,
        documents=','.join(documents) if documents else None,
        remote_control_number=request.remote_control_number,
        observations=request.observations,
        registration_date=subscription.registration_date,
        parking_spot=subscription.parking_spot,
        modification_time=current_time,
        created_by=subscription.created_by,
        modified_by=request.modified_by or subscription.modified_by
    )

    db.add(cancelled_subscription)
    db.flush()  # This should populate the ID

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
        effective_date=subscription.effective_date,
        large_family_expiration=subscription.large_family_expiration,
        effective_cancellation_date=subscription.effective_cancellation_date,
        registration_date=subscription.registration_date,
        parking_spot=subscription.parking_spot,
        modification_time=current_time,
        created_by=subscription.created_by,
        modified_by=request.modified_by or subscription.modified_by
    )

    db.add(subscription_history_entry)

    # Clear canceled plates from subscription
    for i, plate in enumerate(['lisence_plate1', 'lisence_plate2', 'lisence_plate3'], 1):
        if getattr(request, plate) in plates_to_cancel:
            setattr(subscription, plate, None)

    # Delete subscription if all plates are canceled
    if not any([subscription.lisence_plate1, subscription.lisence_plate2, subscription.lisence_plate3]):
        db.delete(subscription)

    try:
        # Generate cancellation work order
        cancellation_work_order_filename = await generate_cancellation_work_order_pdf(cancelled_subscription, db)
        if cancelled_subscription.documents:
            document_filenames = cancelled_subscription.documents.split(",")
            if cancellation_work_order_filename not in document_filenames:
                document_filenames.append(cancellation_work_order_filename)
                cancelled_subscription.documents = ','.join(document_filenames)
        else:
            cancelled_subscription.documents = cancellation_work_order_filename

        # Commit changes
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

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
        effective_date=cancelled_subscription.effective_date,
        effective_cancellation_date=cancelled_subscription.effective_cancellation_date,
        large_family_expiration=cancelled_subscription.large_family_expiration,
        registration_date=cancelled_subscription.registration_date,
        parking_spot=cancelled_subscription.parking_spot,
        modification_time=cancelled_subscription.modification_time,
        created_by=cancelled_subscription.created_by,
        modified_by=cancelled_subscription.modified_by
    )


@router.put("/subscriptions/cancel/{cancellation_id}", response_model=CancellationResponse)
async def update_cancellation(
    cancellation_id: int,
    request: CancellationCreate,
    db: Session = Depends(get_db)
):
    # Retrieve the existing cancellation
    cancelled_subscription = db.query(Cancellations).filter(
        Cancellations.id == cancellation_id
    ).first()

    if not cancelled_subscription:
        raise HTTPException(status_code=404, detail="Cancellation not found")

    # Validate owner exists
    owner = db.query(Owners).filter(Owners.dni == request.owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    # Get current time
    current_time = datetime.now()

    # Handle documents
    if isinstance(request.documents, str):
        documents = request.documents.split(',')
    elif isinstance(request.documents, list):
        documents = request.documents
    else:
        documents = []
    documents = [doc.strip() for doc in documents if doc.strip()]

    try:
        # Create a history entry before making changes
        subscription_history_entry = Subscription_history(
            id=cancelled_subscription.id,
            owner_id=cancelled_subscription.owner_id,
            subscription_type_id=cancelled_subscription.subscription_type_id,
            access_card=cancelled_subscription.access_card,
            lisence_plate1=cancelled_subscription.lisence_plate1,
            lisence_plate2=cancelled_subscription.lisence_plate2,
            lisence_plate3=cancelled_subscription.lisence_plate3,
            documents=cancelled_subscription.documents,
            tique_x_park=cancelled_subscription.tique_x_park,
            remote_control_number=cancelled_subscription.remote_control_number,
            observations=cancelled_subscription.observations,
            effective_date=cancelled_subscription.effective_date,
            effective_cancellation_date=cancelled_subscription.effective_cancellation_date,
            large_family_expiration=cancelled_subscription.large_family_expiration,
            registration_date=cancelled_subscription.registration_date,
            parking_spot=cancelled_subscription.parking_spot,
            modification_time=cancelled_subscription.modification_time,
            created_by=cancelled_subscription.created_by,
            modified_by=cancelled_subscription.modified_by
        )
        db.add(subscription_history_entry)

        # Update the cancellation record
        for field, value in request.dict(exclude_unset=True).items():
            if field == 'documents':
                setattr(cancelled_subscription, 'documents', ','.join(documents) if documents else None)
            else:
                setattr(cancelled_subscription, field, value)

        # Always update modification time
        cancelled_subscription.modification_time = current_time

        # Generate new cancellation work order if needed
        try:
            cancellation_work_order_filename = await generate_cancellation_work_order_pdf(cancelled_subscription, db)
            if cancelled_subscription.documents:
                document_filenames = cancelled_subscription.documents.split(",")
                if cancellation_work_order_filename not in document_filenames:
                    document_filenames.append(cancellation_work_order_filename)
                    cancelled_subscription.documents = ','.join(document_filenames)
            else:
                cancelled_subscription.documents = cancellation_work_order_filename
        except Exception as e:
            logger.error(f"Error generating work order: {str(e)}")
            # Continue with the update even if work order generation fails
            pass

        # Commit changes
        db.commit()
        db.refresh(cancelled_subscription)

        # Return updated cancellation response
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
            effective_date=cancelled_subscription.effective_date,
            large_family_expiration=cancelled_subscription.large_family_expiration,
            effective_cancellation_date=cancelled_subscription.effective_cancellation_date,
            registration_date=cancelled_subscription.registration_date,
            parking_spot=cancelled_subscription.parking_spot,
            modification_time=cancelled_subscription.modification_time,
            created_by=cancelled_subscription.created_by,
            modified_by=cancelled_subscription.modified_by
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")



@router.post("/api/upload-document")
async def upload_document(file: UploadFile = File(...)):
    try:
        # Create a more readable unique filename
        timestamp = datetime.now().strftime("%Y-%m-%d")
        filename = f"{timestamp}_{file.filename}"

        # Rest of the code remains the same
        save_path = "cancelled_subscription_files"
        if not os.path.exists(save_path):
            os.makedirs(save_path)

        file_path = os.path.join(save_path, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return JSONResponse(content={"filename": filename}, status_code=200)
    except Exception as e:
        return JSONResponse(
            content={"error": f"Failed to upload file: {str(e)}"},
            status_code=500
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
            effective_date=cancellation.effective_date,
            effective_cancellation_date=cancellation.effective_cancellation_date,
            large_family_expiration=cancellation.large_family_expiration,
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
        effective_date=cancellation.effective_date,
        effective_cancellation_date=cancellation.effective_cancellation_date,
        large_family_expiration=cancellation.large_family_expiration,
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