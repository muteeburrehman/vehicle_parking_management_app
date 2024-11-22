import os
import uuid
from bdb import effective
from datetime import datetime
from os import remove
from typing import List, Optional
from urllib.parse import urljoin

from starlette.responses import FileResponse
from sympy.printing.dot import template
from weasyprint import HTML, CSS
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, Query
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy.testing import db
from jinja2 import Environment, FileSystemLoader

from io import BytesIO
import pandas as pd
from fastapi.responses import StreamingResponse

from backend.app.db.database import get_db
from backend.app.models.models import Subscription_types, Subscriptions, Subscription_history, Owners, Vehicles, \
    ParkingLot
from backend.app.queries.owner import get_owner_by_dni
from backend.app.queries.vehicle import get_vehicle
from backend.app.routes.owner_routes import UPLOAD_DIR

from backend.app.schemas.subscription import Subscription_Types_Response, Subscription_Types_Create, SubscriptionCreate, \
    SubscriptionResponse
from backend.app.queries.subscription import create_subscription_type_query, get_subscription_types_query, \
    get_subscription_type_by_id_query, create_subscription_query, get_subscription_by_id_query, get_subscriptions_query, \
    get_subscription_by_id

from pathlib import Path, PosixPath

router = APIRouter()

# UPLOAD_DIR = Path("C:/Users/Doom/Desktop/APP APARCAMIENTOS/car_parking_system/backend/app/subscription_files")
base_path = os.getcwd()
UPLOAD_DIR = PosixPath(base_path) / "subscription_files"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# Create a new subscription type
@router.post("/subscription_types/", response_model=Subscription_Types_Response)
def create_subscription_type(
        name: str = Form(...),
        price: float = Form(...),
        parking_code: str = Form(...),
        db: Session = Depends(get_db),
):
    subscription_type_data = Subscription_Types_Create(
        name=name,
        price=price,
        parking_code=parking_code
    )

    new_subscription_type = create_subscription_type_query(db, subscription_type_data)

    # Include the id field in the response
    return Subscription_Types_Response(
        id=new_subscription_type.id,  # Add the id here
        name=new_subscription_type.name,
        price=new_subscription_type.price,
        parking_code=new_subscription_type.parking_code
    )


@router.put("/subscription_types/{id}/", response_model=Subscription_Types_Response)
async def edit_subscription_endpoint(
        id: int,
        name: Optional[str] = Form(None),
        price: Optional[float] = Form(None),
        parking_code: Optional[str] = Form(None),
        db: Session = Depends(get_db),
):
    subscription_type = db.query(Subscription_types).filter(Subscription_types.id == id).first()

    if not subscription_type:
        raise HTTPException(status_code=404, detail="Subscription type not found")

    if name:
        subscription_type.name = name
    if price:
        subscription_type.price = price
    if parking_code:
        subscription_type.parking_code = parking_code

    db.commit()
    db.refresh(subscription_type)

    return Subscription_Types_Response(
        id=subscription_type.id,  # Add the id here
        name=subscription_type.name,
        price=subscription_type.price,
        parking_code=subscription_type.parking_code
    )


@router.get("/subscription_types/", response_model=List[Subscription_Types_Response])
def get_subscription_types(db: Session = Depends(get_db)):
    # Get the subscription types from the query
    subscription_types = get_subscription_types_query(db=db)

    # Convert SQLAlchemy models to Pydantic models
    return [Subscription_Types_Response.from_orm(subscription) for subscription in subscription_types]


@router.get("/subscription_types/{id}", response_model=Subscription_Types_Response)
def get_subscription_type(id: int, db: Session = Depends(get_db)):
    subscription_type = get_subscription_type_by_id_query(db=db, id=id)
    if not subscription_type:
        raise HTTPException(status_code=404, detail="Subscription type not found")
    return subscription_type


async def handle_document_updates(
        subscription: Subscriptions,
        new_documents: List[UploadFile],
        remove_documents: List[str],
        is_work_order_added: bool = False,
        work_order_filename: Optional[str] = None
) -> (Subscriptions, List[str]):
    current_documents = subscription.documents.split(',') if subscription.documents else []
    updated_documents = []
    history_documents = []

    # Remove specified documents
    for doc_path in current_documents:
        doc_name = Path(doc_path).name
        if doc_name not in remove_documents:
            updated_documents.append(doc_name)
        else:
            file_path = UPLOAD_DIR / doc_name
            if file_path.exists():
                file_path.unlink()
                print(f"Removed file: {file_path}")
            else:
                print(f"File not found for removal: {file_path}")

    # Add new documents
    for document in new_documents:
        unique_filename = f"{subscription.id}_{uuid.uuid4().hex}_{document.filename}"
        file_path = UPLOAD_DIR / unique_filename
        try:
            with open(file_path, "wb") as file:
                content = await document.read()
                file.write(content)
            updated_documents.append(unique_filename)
            print(f"Added new file: {file_path}")
        except IOError:
            raise HTTPException(status_code=500, detail=f"Could not write file: {unique_filename}")

    # If a work order is generated, move existing documents to history
    if is_work_order_added and work_order_filename:
        history_documents = current_documents.copy()
        updated_documents.append(work_order_filename)
        print(f"Work order added. Existing documents moved to history.")

    # Update the subscription's documents field with only filenames
    subscription.documents = ','.join(updated_documents) if updated_documents else None
    print(f"Final updated documents: {subscription.documents}")
    print(f"Documents moved to history: {history_documents}")

    return subscription, history_documents


@router.get("/subscription_files/{filename}")
async def get_subscription_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


def convert_str_to_datetime(date_str: Optional[str]) -> Optional[datetime]:
    """Convert string date to datetime object."""
    if not date_str:
        return None
    try:
        # Assuming date string comes in format 'YYYY-MM-DD'
        return datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format for effective_date. Expected YYYY-MM-DD, got: {date_str}"
        )


@router.post("/subscription/", response_model=SubscriptionResponse)
async def create_subscription_endpoint(
        owner_id: str = Form(...),
        subscription_type_id: int = Form(...),
        access_card: Optional[str] = Form(None),
        lisence_plate1: str = Form(...),
        lisence_plate2: Optional[str] = Form(None),
        lisence_plate3: Optional[str] = Form(None),
        documents: List[UploadFile] = File([]),
        tique_x_park: Optional[str] = Form(None),
        remote_control_number: Optional[str] = Form(None),
        observations: Optional[str] = Form(None),
        effective_date: Optional[str] = Form(None),
        large_family_expiration: Optional[str] = Form(None),
        parking_spot: Optional[str] = Form(None),
        created_by: str = Form(...),
        modified_by: str = Form(None),
        modification_time: Optional[str] = Form(None),
        db: Session = Depends(get_db),
):
    try:
        print(f"Received request to create subscription for owner_id: {owner_id}")
        print(f"Received {len(documents)} documents")

        print("LargeFamilyExpiration", large_family_expiration)

        # Convert effective_date string to datetime
        effective_datetime = convert_str_to_datetime(effective_date)

        # Convert large_family_expiration string to datetime
        large_family_expiration_date = convert_str_to_datetime(large_family_expiration)

        # 1. Check if owner_id exists
        owner = db.query(Owners).filter(Owners.dni == owner_id).first()
        if not owner:
            raise HTTPException(status_code=400, detail=f"Owner with ID {owner_id} does not exist.")

        # 2. Check if subscription_type_id exists
        subscription_type = db.query(Subscription_types).filter(Subscription_types.id == subscription_type_id).first()
        if not subscription_type:
            raise HTTPException(status_code=400,
                                detail=f"Subscription type with ID {subscription_type_id} does not exist.")

        # 3. Validate license plates
        def validate_license_plate(plate, plate_name):
            if plate:
                vehicle = db.query(Vehicles).filter(
                    Vehicles.lisence_plate == plate,
                    Vehicles.owner_id == owner_id
                ).first()
                if not vehicle:
                    raise HTTPException(status_code=400,
                                        detail=f"Vehicle with license plate {plate} does not belong to owner {owner_id}.")

        validate_license_plate(lisence_plate1, 'lisence_plate1')
        validate_license_plate(lisence_plate2, 'lisence_plate2')
        validate_license_plate(lisence_plate3, 'lisence_plate3')

        # 4. Check for duplicate license plates
        def check_duplicate_license_plate(plate):
            if plate:
                existing_subscription = db.query(Subscriptions).filter(
                    Subscriptions.subscription_type_id == subscription_type_id,
                    (Subscriptions.lisence_plate1 == plate) |
                    (Subscriptions.lisence_plate2 == plate) |
                    (Subscriptions.lisence_plate3 == plate)
                ).first()
                if existing_subscription:
                    raise HTTPException(
                        status_code=400,
                        detail=f"License plate {plate} is already registered under subscription type {subscription_type_id}."
                    )

        check_duplicate_license_plate(lisence_plate1)
        check_duplicate_license_plate(lisence_plate2)
        check_duplicate_license_plate(lisence_plate3)

        # 5. Create subscription record
        subscription_data = SubscriptionCreate(
            owner_id=owner_id,
            subscription_type_id=subscription_type_id,
            access_card=access_card,
            lisence_plate1=lisence_plate1,
            lisence_plate2=lisence_plate2,
            lisence_plate3=lisence_plate3,
            tique_x_park=tique_x_park,
            remote_control_number=remote_control_number,
            observations=observations,
            effective_date=effective_datetime,  # Use converted datetime
            large_family_expiration=large_family_expiration_date,
            parking_spot=parking_spot,
            registration_date=datetime.now(),
            created_by=created_by,
            modified_by=modified_by,
            modification_time=modification_time,
        )
        new_subscription = create_subscription_query(db, subscription_data)

        # 6. Update parking lot spaces
        print(f"Updating parking lot spaces for subscription type ID: {subscription_type_id}")
        print(f"Subscription type name: {subscription_type.name}")  # Add this line to log the subscription type name
        update_parking_lot_spaces(db, subscription_type_id, -1)  # Decrease available spaces by 1
        print("Parking lot spaces updated successfully")

        # For a new subscription, there are no old license plates
        old_license_plates = {
            'lisence_plate1': None,
            'lisence_plate2': None,
            'lisence_plate3': None
        }

        # Generate work order PDF
        work_order_filename = await generate_work_order_pdf(new_subscription, db, old_license_plates)

        # Handle document uploads
        document_filenames = [work_order_filename]  # Start with work order filename only
        for document in documents:
            filename = f"{new_subscription.id}_{document.filename}"
            file_location = UPLOAD_DIR / filename
            try:
                with open(file_location, "wb") as file:
                    content = await document.read()
                    file.write(content)
                document_filenames.append(filename)  # Append only the filename
            except IOError as e:
                # Rollback transaction and raise exception
                db.rollback()
                raise HTTPException(status_code=500, detail=f"Could not write file: {filename}. Error: {str(e)}")

        # Update subscription with document information
        new_subscription.documents = ','.join(document_filenames) if document_filenames else None
        db.commit()

        # Construct the response model with URLs
        base_url = "http://localhost:8000/subscription_files/"  # Update as needed
        document_urls = [urljoin(base_url, filename) for filename in document_filenames]

        # history entry
        history_entry = Subscription_history(
            id=new_subscription.id,
            owner_id=new_subscription.owner_id,
            subscription_type_id=new_subscription.subscription_type_id,
            access_card=new_subscription.access_card,
            lisence_plate1=new_subscription.lisence_plate1,
            lisence_plate2=new_subscription.lisence_plate2,
            lisence_plate3=new_subscription.lisence_plate3,
            documents=','.join(document_urls),
            tique_x_park=new_subscription.tique_x_park,
            remote_control_number=new_subscription.remote_control_number,
            observations=new_subscription.observations,
            effective_date=new_subscription.effective_date,
            large_family_expiration=large_family_expiration_date,
            parking_spot=new_subscription.parking_spot,
            registration_date=new_subscription.registration_date,
            created_by=new_subscription.created_by,
        )
        db.add(history_entry)
        db.commit()
        db.refresh(history_entry)

        return SubscriptionResponse(
            id=new_subscription.id,
            owner_id=new_subscription.owner_id,
            subscription_type_id=new_subscription.subscription_type_id,
            access_card=new_subscription.access_card,
            lisence_plate1=new_subscription.lisence_plate1,
            lisence_plate2=new_subscription.lisence_plate2,
            lisence_plate3=new_subscription.lisence_plate3,
            documents=document_urls,
            tique_x_park=new_subscription.tique_x_park,
            remote_control_number=new_subscription.remote_control_number,
            observations=new_subscription.observations,
            effective_date=new_subscription.effective_date,
            large_family_expiration=new_subscription.large_family_expiration,
            parking_spot=new_subscription.parking_spot,
            registration_date=new_subscription.registration_date,
            created_by=created_by,
            modified_by=modified_by,
            modification_time=modification_time
        )
    except HTTPException as http_exc:
        # Re-raise HTTP exceptions as they are already properly formatted
        raise http_exc
    except Exception as e:
        # Log the exception for debugging
        print(f"Error in create_subscription_endpoint: {str(e)}")
        # Raise a generic HTTP exception
        raise HTTPException(status_code=500, detail="An unexpected error occurred while processing the subscription.")


def update_parking_lot_spaces(db: Session, subscription_type_id: int, change: int):
    try:
        subscription_type = db.query(Subscription_types).filter(Subscription_types.id == subscription_type_id).first()
        if not subscription_type:
            raise HTTPException(status_code=400,
                                detail=f"Subscription type with ID {subscription_type_id} does not exist.")

        # Extract parking lot name (assuming it's before " - ")
        parking_lot_name = subscription_type.name.split(" - ")[0].strip()
        print(f"Extracted parking lot name: {parking_lot_name}")  # Debugging line

        parking_lot = db.query(ParkingLot).filter(ParkingLot.name == parking_lot_name).first()
        if not parking_lot:
            raise HTTPException(status_code=400, detail=f"Parking lot '{parking_lot_name}' does not exist.")

        # Check for 24H for cars or 24H MOTOS for motorcycles in the subscription type name
        if "24H" in subscription_type.name.upper() and "MOTOS" not in subscription_type.name.upper():
            parking_lot.total_car_spaces += change
            print(f"Updated 24H car spaces for {parking_lot.name}: {parking_lot.total_car_spaces}")
        elif "24H MOTOS" in subscription_type.name.upper():
            parking_lot.total_motorcycle_spaces += change
            print(f"Updated 24H motorcycle spaces for {parking_lot.name}: {parking_lot.total_motorcycle_spaces}")
        else:
            print(f"Subscription type '{subscription_type.name}' does not affect car or motorcycle space counts")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error in update_parking_lot_spaces: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred while updating parking lot spaces: {str(e)}")


# Set up Jinja2 environment
# template_dir = r'C:\Users\Doom\Desktop\APP APARCAMIENTOS\car_parking_system\backend\app\templates'
template_dir = PosixPath(base_path) / "templates"
env = Environment(loader=FileSystemLoader(template_dir))


@router.put("/subscription/{id}", response_model=SubscriptionResponse)
async def edit_subscription_endpoint(
        id: int,
        owner_id: Optional[str] = Form(default=None),
        subscription_type_id: Optional[int] = Form(default=None),
        access_card: Optional[str] = Form(default=None),
        lisence_plate1: Optional[str] = Form(default=None),
        lisence_plate2: Optional[str] = Form(default=None),
        lisence_plate3: Optional[str] = Form(default=None),
        new_documents: List[UploadFile] = File(default=[]),
        remove_documents: List[str] = Form(default=[]),
        tique_x_park: Optional[str] = Form(default=None),
        remote_control_number: Optional[str] = Form(default=None),
        observations: Optional[str] = Form(default=None),
        effective_date: Optional[str] = Form(default=None),
        large_family_expiration: Optional[str] = Form(default=None),
        parking_spot: Optional[str] = Form(default=None),
        created_by: Optional[str] = Form(default=None),
        modified_by: Optional[str] = Form(default=None),
        modification_time: Optional[str] = Form(default=None),
        existing_documents: Optional[List[str]] = Form(default=None),
        db: Session = Depends(get_db)
):
    try:
        # Fetch the subscription record
        subscription = db.query(Subscriptions).filter(Subscriptions.id == id).first()
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")

        # Track changes
        changes = []
        old_license_plates = {
            'lisence_plate1': subscription.lisence_plate1,
            'lisence_plate2': subscription.lisence_plate2,
            'lisence_plate3': subscription.lisence_plate3
        }

        # Function to update a field and track changes
        def update_field(field_name, new_value):
            try:
                old_value = getattr(subscription, field_name)
                if new_value is not None and old_value != new_value:
                    setattr(subscription, field_name, new_value)
                    changes.append((field_name, old_value, new_value))
                    subscription.modification_time = datetime.now()
                    print(f"Updated {field_name}: {new_value}")
            except Exception as e:
                print(f"Error updating {field_name}: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Error updating {field_name}: {str(e)}")

        # Update fields with proper error handling
        if tique_x_park is not None:
            update_field('tique_x_park', tique_x_park.strip() if tique_x_park else None)

        if remote_control_number is not None:
            update_field('remote_control_number', remote_control_number.strip() if remote_control_number else None)

        if observations is not None:
            update_field('observations', observations.strip() if observations else None)

        if parking_spot is not None:
            update_field('parking_spot', parking_spot.strip() if parking_spot else None)

        # Handle effective_date
        if effective_date is not None:
            try:
                converted_date = convert_str_to_datetime(effective_date)
                update_field('effective_date', converted_date)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid effective_date format: {str(e)}")

        if large_family_expiration is not None:
            try:
                converted_date = convert_str_to_datetime(large_family_expiration)
                update_field('large_family_expiration', converted_date)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid large_family_expiration format: {str(e)}")

        # Update modified_by
        if modified_by is not None:
            update_field('modified_by', modified_by)

        # Handle existing documents with proper error handling
        if existing_documents:
            existing_documents_set = set(existing_documents)
            if subscription.documents:
                subscription_docs = set(subscription.documents.split(","))
                remove_documents = list(subscription_docs - existing_documents_set)
        else:
            remove_documents = []

        # Validate and update owner_id
        if owner_id is not None:
            owner = db.query(Owners).filter(Owners.dni == owner_id).first()
            if not owner:
                raise HTTPException(status_code=400, detail=f"Owner with ID {owner_id} does not exist.")
            update_field('owner_id', owner_id)

        # Validate and update subscription_type_id
        if subscription_type_id is not None:
            subscription_type = db.query(Subscription_types).filter(
                Subscription_types.id == subscription_type_id).first()
            if not subscription_type:
                raise HTTPException(status_code=400,
                                    detail=f"Subscription type with ID {subscription_type_id} does not exist.")
            update_field('subscription_type_id', subscription_type_id)

        # Handle modification_time
        if modification_time:
            try:
                new_modification_time = datetime.strptime(modification_time, "%m/%d/%Y, %H:%M:%S")
                update_field('modification_time', new_modification_time)
            except ValueError:
                update_field('modification_time', datetime.now())
        else:
            update_field('modification_time', datetime.now())

        # Validate and update license plates with better error handling
        def validate_license_plate(plate, plate_field):
            if plate is not None:
                if plate == "":
                    update_field(plate_field, None)
                else:
                    plate = plate.strip().upper()
                    if plate != getattr(subscription, plate_field):
                        vehicle = db.query(Vehicles).filter(
                            func.upper(Vehicles.lisence_plate) == plate,
                            Vehicles.owner_id == subscription.owner_id
                        ).first()
                        if not vehicle:
                            raise HTTPException(
                                status_code=400,
                                detail=f"Vehicle with license plate {plate} does not exist for owner {subscription.owner_id}."
                            )
                        update_field(plate_field, plate)

        validate_license_plate(lisence_plate1, 'lisence_plate1')
        validate_license_plate(lisence_plate2, 'lisence_plate2')
        validate_license_plate(lisence_plate3, 'lisence_plate3')

        # Update access_card
        if access_card is not None:
            update_field('access_card', access_card.strip() if access_card else None)

        # Handle document updates with proper error handling
        if remove_documents:
            for filename in remove_documents:
                file_path = UPLOAD_DIR / filename
                if file_path.is_file():
                    try:
                        file_path.unlink()
                    except Exception as e:
                        print(f"Error removing file {filename}: {str(e)}")
                        continue

                if subscription.documents:
                    document_filenames = subscription.documents.split(",")
                    if filename in document_filenames:
                        document_filenames.remove(filename)
                        subscription.documents = ','.join(document_filenames) if document_filenames else None

        # Handle new document uploads
        document_filenames = subscription.documents.split(",") if subscription.documents else []
        for document in new_documents:
            filename = f"{subscription.id}_{document.filename}"
            file_location = UPLOAD_DIR / filename
            try:
                content = await document.read()
                with open(file_location, "wb") as file:
                    file.write(content)
                document_filenames.append(filename)
            except Exception as e:
                print(f"Error uploading file {filename}: {str(e)}")
                continue

        if document_filenames:
            subscription.documents = ','.join(document_filenames)

        # Generate work order if needed
        if changes or new_documents or remove_documents:
            try:
                work_order_filename = await generate_work_order_modification_pdf(subscription, db, old_license_plates)
                if subscription.documents:
                    document_filenames = subscription.documents.split(",")
                    if work_order_filename not in document_filenames:
                        document_filenames.append(work_order_filename)
                        subscription.documents = ','.join(document_filenames)
                else:
                    subscription.documents = work_order_filename
            except Exception as e:
                print(f"Error generating work order: {str(e)}")

        # Commit changes
        try:
            db.commit()
            db.refresh(subscription)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Error saving changes: {str(e)}")

        # Construct the response
        base_url = "http://localhost:8000/subscription_files/"
        document_urls = []
        if subscription.documents:
            document_filenames = subscription.documents.split(",")
            document_urls = [urljoin(base_url, filename) for filename in document_filenames]

            # If there are valid changes, log them in Subscription_history
            if changes or new_documents or remove_documents:
                history_entry = Subscription_history(
                    id=subscription.id,
                    owner_id=subscription.owner_id,
                    subscription_type_id=subscription.subscription_type_id,
                    access_card=subscription.access_card,
                    lisence_plate1=subscription.lisence_plate1 or "",
                    lisence_plate2=subscription.lisence_plate2 or "",
                    lisence_plate3=subscription.lisence_plate3 or "",
                    documents=','.join(document_urls),
                    tique_x_park=subscription.tique_x_park,
                    remote_control_number=subscription.remote_control_number,
                    observations=subscription.observations,
                    effective_date=subscription.effective_date,
                    large_family_expiration=subscription.large_family_expiration,
                    registration_date=subscription.registration_date,
                    parking_spot=subscription.parking_spot,
                    modification_time=subscription.modification_time,
                    created_by=subscription.created_by,
                    modified_by=subscription.modified_by
                )
                db.add(history_entry)

            # Commit changes
            db.commit()
            db.refresh(subscription)

        return SubscriptionResponse(
            id=subscription.id,
            owner_id=subscription.owner_id,
            subscription_type_id=subscription.subscription_type_id,
            access_card=subscription.access_card,
            lisence_plate1=subscription.lisence_plate1,
            lisence_plate2=subscription.lisence_plate2,
            lisence_plate3=subscription.lisence_plate3,
            documents=document_urls,
            tique_x_park=subscription.tique_x_park,
            remote_control_number=subscription.remote_control_number,
            observations=subscription.observations,
            registration_date=subscription.registration_date,
            effective_date=subscription.effective_date,
            large_family_expiration=subscription.large_family_expiration,
            parking_spot=subscription.parking_spot,
            created_by=subscription.created_by,
            modified_by=subscription.modified_by,
            modification_time=subscription.modification_time
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


async def generate_work_order_pdf(subscription: Subscriptions, db: Session, old_license_plates: dict):
    # Fetch owner information
    owner = get_owner_by_dni(db=db, owner_dni=subscription.owner_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    # Fetch vehicle information
    vehicle = get_vehicle(db=db, lisence_plate=subscription.lisence_plate1)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

        # Fetch subscription type information
    subscription_type = db.query(Subscription_types).filter(
        Subscription_types.id == subscription.subscription_type_id).first()
    if not subscription_type:
        raise HTTPException(status_code=404, detail="Subscription type not found")

    # Initialize license plate change information
    old_license_plate = []
    new_license_plate = []

    # Check for license plate changes
    for plate_num in range(1, 4):
        plate_field = f'lisence_plate{plate_num}'
        old_value = old_license_plates.get(plate_field)
        new_value = getattr(subscription, plate_field)
        if old_value is not None and old_value != new_value:
            if old_value:
                old_license_plate.append(old_value)
            if new_value:
                new_license_plate.append(new_value)

    # Prepare data for the template
    template_data = {
        'order_no': f"{subscription.id}/24",
        'date': datetime.now().strftime('%m/%d/%Y') or '',
        'vehicle_type': vehicle.vehicle_type.upper(),
        'effective_date': subscription.effective_date.strftime('%m/%d/%Y') or '',
        'name_surname': f"{owner.first_name} {owner.last_name}",
        'phone': owner.phone_number,
        'email': owner.email,
        'license_plate': subscription.lisence_plate1,
        'parking_spot': subscription.parking_spot,
        'card': subscription.access_card,
        'remote': subscription.remote_control_number,
        'license_plate1': subscription.lisence_plate1 or '',
        'license_plate2': subscription.lisence_plate2 or '',
        'license_plate3': subscription.lisence_plate3 or '',
        'observations': subscription.observations or '',
        'old_license_plate': ', '.join(old_license_plate) if old_license_plate else '',
        'new_license_plate': ', '.join(new_license_plate) if new_license_plate else '',
        'has_license_plate_changes': bool(new_license_plate),
        'subscription_type_name': subscription_type.name or '',
    }
    # Render HTML template
    template = env.get_template('work_order_template.html')
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
    filename = f"work_order_{subscription.id}.pdf"
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        f.write(pdf)

    return filename  # Return only the filename


async def generate_work_order_modification_pdf(subscription: Subscriptions, db: Session, old_license_plates: dict):
    # Fetch owner information
    owner = get_owner_by_dni(db=db, owner_dni=subscription.owner_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    # Fetch vehicle information
    vehicle = get_vehicle(db=db, lisence_plate=subscription.lisence_plate1)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

        # Fetch subscription type information
    subscription_type = db.query(Subscription_types).filter(
        Subscription_types.id == subscription.subscription_type_id).first()
    if not subscription_type:
        raise HTTPException(status_code=404, detail="Subscription type not found")

    # Initialize license plate change information
    old_license_plate = []
    new_license_plate = []

    # Check for license plate changes
    for plate_num in range(1, 4):
        plate_field = f'lisence_plate{plate_num}'
        old_value = old_license_plates.get(plate_field)
        new_value = getattr(subscription, plate_field)
        if old_value is not None and old_value != new_value:
            if old_value:
                old_license_plate.append(old_value)
            if new_value:
                new_license_plate.append(new_value)

    # Prepare data for the template
    template_data = {
        'order_no': f"{subscription.id}/24",
        'date': datetime.now().strftime('%m/%d/%Y') or '',
        'vehicle_type': vehicle.vehicle_type.upper(),
        'effective_date': subscription.effective_date.strftime('%m/%d/%Y') or '',
        'name_surname': f"{owner.first_name} {owner.last_name}",
        'phone': owner.phone_number,
        'email': owner.email,
        'license_plate': subscription.lisence_plate1,
        'parking_spot': subscription.parking_spot,
        'card': subscription.access_card,
        'remote': subscription.remote_control_number,
        'license_plate1': subscription.lisence_plate1 or '',
        'license_plate2': subscription.lisence_plate2 or '',
        'license_plate3': subscription.lisence_plate3 or '',
        'observations': subscription.observations or '',
        'old_license_plate1': old_license_plates.get('lisence_plate1') or '',
        'old_license_plate2': old_license_plates.get('lisence_plate2') or '',
        'new_license_plate1': subscription.lisence_plate1 or '',
        'new_license_plate2': subscription.lisence_plate2 or '',
        'has_license_plate_changes': bool(new_license_plate),
        'subscription_type_name': subscription_type.name or '',
    }
    # Render HTML template
    template = env.get_template('modification_work_order_template.html')
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
    filename = f"work_order_modification_{subscription.id}.pdf"
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        f.write(pdf)

    return filename  # Return only the filename


@router.get("/subscription/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription_endpoint(
        subscription_id: int,
        db: Session = Depends(get_db),
):
    subscription = get_subscription_by_id_query(db=db, id=subscription_id)

    if subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    subscription_data = {
        'id': subscription.id,
        'owner_id': subscription.owner_id,
        'subscription_type_id': subscription.subscription_type_id,
        'access_card': subscription.access_card,
        'lisence_plate1': subscription.lisence_plate1,
        'lisence_plate2': subscription.lisence_plate2,
        'lisence_plate3': subscription.lisence_plate3,
        'documents': subscription.documents.split(',') if subscription.documents else [],
        'tique_x_park': subscription.tique_x_park,
        'remote_control_number': subscription.remote_control_number,
        'observations': subscription.observations,
        'effective_date': subscription.effective_date,
        'large_family_expiration': subscription.large_family_expiration,
        'parking_spot': subscription.parking_spot,
        'registration_date': subscription.registration_date,
        'created_by': subscription.created_by,
        'modified_by': subscription.modified_by,
        'modification_time': subscription.modification_time
    }

    return SubscriptionResponse(**subscription_data)


@router.get("/subscriptions/export")
async def export_subscriptions(
        ids: str = Query(..., description="Comma-separated list of subscription IDs"),
        fields: str = Query(..., description="Comma-separated list of fields to export"),
        export_format: str = Query(..., description="Export format (only 'xlsx' is supported)"),
        db: Session = Depends(get_db)
):
    if export_format != 'xlsx':
        raise HTTPException(status_code=400, detail="Only 'xlsx' export format is supported")

    id_list = [int(id) for id in ids.split(',')]
    field_list = fields.split(',')

    subscriptions = get_subscription_by_id(db, id_list)

    data = []
    heading_translation = {
        'id': 'ID',
        'owner_id': 'ID del Propietario',
        'access_card': 'Tarjeta de Acceso',
        'lisence_plate1': 'Placa de Licencia 1',
        'lisence_plate2': 'Placa de Licencia 2',
        'lisence_plate3': 'Placa de Licencia 3',
        'documents': 'Documentos',
        'tique_x_park': 'Tique X Parque',
        'remote_control_number': 'Número de Control Remoto',
        'observations': 'Observaciones',
        'parking_spot': 'Puesto de Estacionamiento',
        'registration_date': 'Fecha de Registro',
        'effective_date': 'Fecha de Efecto',
        'created_by': 'Creado Por',
        'modified_by': 'Modificado Por',
        'modification_time': 'Hora de Modificación',
        'owner_email': 'Correo Electrónico del Propietario',
        'owner_phone_number': 'Número de Teléfono del Propietario',
        'subscription_type_name': 'Nombre del Tipo de Suscripción',
        'subscription_type_parking_code': 'Código de Estacionamiento',
        'Large Family Expiration': 'vencimiento familia numerosa'
    }

    for subscription in subscriptions:
        # Fetch subscription type information
        subscription_type = db.query(Subscription_types).filter(
            Subscription_types.id == subscription.subscription_type_id).first()

        # Get the owner's info using the owner_id from the subscription
        owner = get_owner_by_dni(db, subscription.owner_id)
        owner_email = owner.email if owner else None
        owner_phone_number = owner.phone_number if owner else None

        subscription_data = {
            'id': subscription.id,
            'owner_id': subscription.owner_id,
            'access_card': subscription.access_card,
            'lisence_plate1': subscription.lisence_plate1,
            'lisence_plate2': subscription.lisence_plate2,
            'lisence_plate3': subscription.lisence_plate3,
            'documents': subscription.documents.split(',') if subscription.documents else [],
            'tique_x_park': subscription.tique_x_park,
            'remote_control_number': subscription.remote_control_number,
            'observations': subscription.observations,
            'parking_spot': subscription.parking_spot,
            'registration_date': subscription.registration_date,
            'effective_date': subscription.effective_date,
            'created_by': subscription.created_by,
            'modified_by': subscription.modified_by,
            'modification_time': subscription.modification_time,
            'owner_email': owner_email,
            'owner_phone_number': owner_phone_number,
            'subscription_type_name': subscription_type.name if subscription_type else None,
            'subscription_type_parking_code': subscription_type.parking_code if subscription_type else None,
        }

        filtered_data = {k: v for k, v in subscription_data.items() if k in field_list}
        data.append(filtered_data)

    df = pd.DataFrame(data)

    # Rename columns to Spanish
    df.rename(columns=heading_translation, inplace=True)

    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Suscripciones')

    output.seek(0)

    headers = {
        'Content-Disposition': f'attachment; filename="subscriptions_export.xlsx"'
    }
    return StreamingResponse(output, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                             headers=headers)


# FastAPI route to get subscriptions
@router.get("/subscriptions/", response_model=List[SubscriptionResponse])
def get_subscriptions(db: Session = Depends(get_db)):
    subscriptions = get_subscriptions_query(db)
    return [SubscriptionResponse.from_orm(subscription) for subscription in
            subscriptions]  # Properly convert to Pydantic models


# Delete a subscription type
@router.delete("/subscription_types/{id}/", response_model=dict)
def delete_subscription_type(id: int, db: Session = Depends(get_db)):
    subscription_type = db.query(Subscription_types).filter(Subscription_types.id == id).first()

    if not subscription_type:
        raise HTTPException(status_code=404, detail="Subscription type not found")

    db.delete(subscription_type)
    db.commit()

    return {"detail": "Subscription type deleted successfully"}


# Delete a subscription
@router.delete("/subscription/{id}/", response_model=dict)
def delete_subscription(id: int, db: Session = Depends(get_db)):
    subscription = db.query(Subscriptions).filter(Subscriptions.id == id).first()

    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    db.delete(subscription)
    db.commit()

    return {"detail": "Subscription deleted successfully"}


@router.get("/vehicle/{license_plate}/check-subscription")
def check_subscription(license_plate: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicles).filter(Vehicles.lisence_plate == license_plate).first()

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    active_subscription = db.query(Subscriptions).filter(
        (Subscriptions.lisence_plate1 == vehicle.lisence_plate) |
        (Subscriptions.lisence_plate2 == vehicle.lisence_plate) |
        (Subscriptions.lisence_plate3 == vehicle.lisence_plate)
    ).first()

    # Return true if there's an active subscription, false otherwise
    return {"active": bool(active_subscription)}


@router.get("/subscriptions/large-family", response_model=List[SubscriptionResponse])
def get_large_family_subscriptions(db: Session = Depends(get_db)):
    query = db.query(Subscriptions).filter(Subscriptions.large_family_expiration.isnot(None))
    subscriptions = query.all()

    subscription_list = []
    for subscription in subscriptions:
        subscription_data = {
            'id': subscription.id,
            'owner_id': subscription.owner_id,
            'subscription_type_id': subscription.subscription_type_id,
            'access_card': subscription.access_card,
            'lisence_plate1': subscription.lisence_plate1,
            'lisence_plate2': subscription.lisence_plate2,
            'lisence_plate3': subscription.lisence_plate3,
            'documents': subscription.documents.split(',') if subscription.documents else [],
            'tique_x_park': subscription.tique_x_park,
            'remote_control_number': subscription.remote_control_number,
            'observations': subscription.observations,
            'effective_date': subscription.effective_date,
            'large_family_expiration': subscription.large_family_expiration,
            'parking_spot': subscription.parking_spot,
            'registration_date': subscription.registration_date,
            'created_by': subscription.created_by,
            'modified_by': subscription.modified_by,
            'modification_time': subscription.modification_time
        }
        subscription_list.append(subscription_data)

    return subscription_list
