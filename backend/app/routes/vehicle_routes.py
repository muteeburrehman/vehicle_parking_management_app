import os
from datetime import datetime

from typing import List, Optional

from fastapi import APIRouter, Form, File, Depends
from fastapi import UploadFile
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.db.database import get_db
from backend.app.models.models import Owners, Vehicles, Subscriptions, Vehicles_history
from backend.app.queries.vehicle import add_vehicle, get_all_vehicles, get_vehicle
from backend.app.schemas.vehicle import VehicleResponse, VehicleCreate

router = APIRouter()

# Creating the upload directory if it doesn't exist
UPLOAD_DIR_VEHICLE = "vehicle_uploads"
os.makedirs(UPLOAD_DIR_VEHICLE, exist_ok=True)


@router.get("/vehicle/{lisence_plate}", response_model=VehicleResponse)
def get_vehicle_endpoint(lisence_plate: str, db: Session = Depends(get_db)):
    vehicle = get_vehicle(db=db, lisence_plate=lisence_plate)

    if vehicle is None:
        raise HTTPException(status_code=404, detail='Vehicle not found')

    # Get just the filenames, not the full paths for the frontend
    document_filenames = []
    if vehicle.documents:
        document_paths = vehicle.documents.split(',')
        document_filenames = [os.path.basename(path) for path in document_paths]

    # Build vehicle_data from the result of the raw SQL query
    vehicle_data = {
        'lisence_plate': vehicle.lisence_plate,
        'brand': vehicle.brand,
        'model': vehicle.model,
        'vehicle_type': vehicle.vehicle_type,
        'owner_id': vehicle.owner_id,
        'documents': document_filenames,  # Just the filenames now
        'observations': vehicle.observations,
        'registration_date': vehicle.registration_date,
        'created_by': vehicle.created_by,
        'modified_by': vehicle.modified_by,
        'modification_time': vehicle.modification_time
    }
    return VehicleResponse(**vehicle_data)


@router.post("/owner/{dni}/vehicle/", response_model=VehicleResponse)
async def add_vehicle_endpoint(
        dni: str,
        lisence_plate: str = Form(...),
        brand: str = Form(...),
        model: str = Form(...),
        vehicle_type: str = Form(...),
        documents: Optional[List[UploadFile]] = File([]),
        observations: Optional[str] = Form(None),
        created_by: str = Form(...),
        modified_by: Optional[str] = Form(None),
        modification_time: Optional[str] = Form(None),
        db: Session = Depends(get_db)
):
    # Check if the owner exists using the provided DNI
    owner = db.query(Owners).filter(Owners.dni == dni).first()
    if owner is None:
        raise HTTPException(status_code=404, detail="Owner not found")

    # Store the uploaded documents
    document_filenames = []
    document_paths = []
    for document in documents:
        file_location = f"{UPLOAD_DIR_VEHICLE}/{document.filename}"
        with open(file_location, "wb") as file:
            file.write(document.file.read())
        document_paths.append(file_location)  # Store full path for database
        document_filenames.append(document.filename)  # Store just filename for frontend

    # Create an instance of VehicleCreate schema
    vehicle_data = VehicleCreate(
        lisence_plate=lisence_plate,
        brand=brand,
        model=model,
        vehicle_type=vehicle_type,
        owner_id=owner.dni,
        observations=observations,
        registration_date=datetime.now(),
        created_by=created_by,
        modified_by=modified_by,
        modification_time=modification_time,
    )

    # Call the add_vehicle function to save vehicle data in the DB, passing document paths
    new_vehicle = add_vehicle(db, vehicle_data, document_paths)

    # Track the vehicle history
    history_entery = Vehicles_history(
        lisence_plate=new_vehicle.lisence_plate,
        brand=new_vehicle.brand,
        model=new_vehicle.model,
        vehicle_type=new_vehicle.vehicle_type,
        owner_id=new_vehicle.owner_id,
        documents=','.join(document_paths),  # Save full paths in history
        observations=new_vehicle.observations,
        registration_date=new_vehicle.registration_date,
        created_by=new_vehicle.created_by,
    )
    db.add(history_entery)
    db.commit()
    db.refresh(history_entery)

    return VehicleResponse(
        lisence_plate=new_vehicle.lisence_plate,
        brand=new_vehicle.brand,
        model=new_vehicle.model,
        vehicle_type=new_vehicle.vehicle_type,
        owner_id=new_vehicle.owner_id,
        documents=document_filenames,  # Return just filenames for frontend
        observations=new_vehicle.observations,
        registration_date=new_vehicle.registration_date,
        created_by=new_vehicle.created_by,
        modified_by=new_vehicle.modified_by
    )


@router.put("/vehicle/{lisence_plate}", response_model=VehicleResponse)
async def update_vehicle_endpoint(
        lisence_plate: str,
        owner_id: str = Form(None),
        brand: str = Form(None),
        model: str = Form(None),
        vehicle_type: str = Form(None),
        observations: Optional[str] = Form(None),
        new_documents: List[UploadFile] = File([]),
        remove_documents: List[str] = Form([]),
        created_by: str = Form(None),
        modified_by: Optional[str] = Form(None),
        modification_time: Optional[str] = Form(None),
        db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicles).filter(Vehicles.lisence_plate == lisence_plate).first()

    if not vehicle:
        raise HTTPException(status_code=404, detail='Vehicle not found')

    print(f"Updating vehicle: {lisence_plate}")
    print(f"New documents: {[doc.filename for doc in new_documents]}")
    print(f"Documents to remove: {remove_documents}")

    # Track changes
    changes = []

    # Function to update a field and track changes
    def update_field(field_name, new_value):
        old_value = getattr(vehicle, field_name)
        if new_value is not None and old_value != new_value:
            setattr(vehicle, field_name, new_value)
            changes.append((field_name, old_value, new_value))
            print(f"Updated {field_name}: {new_value}")

    # Update the vehicle fields if they are provided
    update_field('model', model)
    update_field('brand', brand)
    update_field('vehicle_type', vehicle_type)
    update_field('observations', observations)
    update_field('owner_id', owner_id)
    update_field('created_by', created_by)
    update_field('modified_by', modified_by)

    if modification_time:
        try:
            new_modification_time = datetime.strptime(modification_time, "%m/%d/%Y, %H:%M:%S")
            update_field('modification_time', new_modification_time)
        except ValueError:
            print(f"Error parsing modification_time: {modification_time}")
            update_field('modification_time', datetime.now())
    else:
        update_field('modification_time', datetime.now())

    # Handle document updates
    old_documents = vehicle.documents
    vehicle = await handle_document_updates(vehicle, new_documents, remove_documents)
    if old_documents != vehicle.documents:
        changes.append(('documents', old_documents, vehicle.documents))

    # If there are valid changes, log them in Vehicles_history
    if changes:
        history_entry = Vehicles_history(
            lisence_plate=vehicle.lisence_plate,
            brand=vehicle.brand,
            model=vehicle.model,
            vehicle_type=vehicle.vehicle_type,
            owner_id=vehicle.owner_id,
            documents=vehicle.documents,
            observations=vehicle.observations,
            registration_date=vehicle.registration_date,
            created_by=vehicle.created_by,
            modified_by=vehicle.modified_by,
            modification_time=vehicle.modification_time
        )
        db.add(history_entry)
        print(f"Created history entry for vehicle: {lisence_plate}")

    # Save the changes
    db.commit()
    db.refresh(vehicle)

    # Get just the filenames for the response
    document_filenames = []
    if vehicle.documents:
        document_paths = vehicle.documents.split(',')
        document_filenames = [os.path.basename(path) for path in document_paths]

    return VehicleResponse(
        lisence_plate=vehicle.lisence_plate,
        brand=vehicle.brand,
        model=vehicle.model,
        vehicle_type=vehicle.vehicle_type,
        owner_id=vehicle.owner_id,
        documents=document_filenames,  # Return just filenames for frontend
        observations=vehicle.observations,
        registration_date=vehicle.registration_date,
        created_by=vehicle.created_by,
        modified_by=vehicle.modified_by,
        modification_time=vehicle.modification_time
    )


async def handle_document_updates(vehicle, new_documents: List[UploadFile], remove_documents: List[str]):
    # Get current documents
    current_documents = vehicle.documents.split(',') if vehicle.documents else []

    print(f"Current documents: {current_documents}")
    print(f"Documents to remove: {remove_documents}")

    # Handle document removal
    updated_documents = []
    for doc in current_documents:
        doc_name = os.path.basename(doc)  # Get just the filename
        if doc_name not in remove_documents:
            updated_documents.append(doc)
        else:
            # Delete the file from the server
            file_path = os.path.join(UPLOAD_DIR_VEHICLE, doc_name)
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Removed file: {file_path}")
            else:
                print(f"File not found for removal: {file_path}")

    print(f"Documents after removal: {updated_documents}")

    # Handle new document uploads
    for document in new_documents:
        filename = f"{vehicle.lisence_plate}_{document.filename}"  # Prefix with license plate to avoid conflicts
        file_location = os.path.join(UPLOAD_DIR_VEHICLE, filename)
        try:
            with open(file_location, "wb") as file:
                content = await document.read()
                file.write(content)
            updated_documents.append(file_location)  # Store the full path
            print(f"Added new file: {file_location}")
        except IOError:
            raise HTTPException(status_code=500, detail=f"Could not write file: {filename}")

    # Update the vehicle's documents
    vehicle.documents = ','.join(updated_documents) if updated_documents else None

    print(f"Final updated documents: {vehicle.documents}")

    return vehicle


@router.get("/vehicles/", response_model=List[VehicleResponse])
async def get_vehicles_endpoint(db: Session = Depends(get_db)):
    vehicles = get_all_vehicles(db)

    # Process each vehicle to extract just filenames from document paths
    processed_vehicles = []
    for vehicle in vehicles:
        # Convert vehicle to dict if it's not already
        if not isinstance(vehicle, dict):
            vehicle_dict = vehicle.__dict__
        else:
            vehicle_dict = vehicle.copy()

        # Extract filenames from document paths
        if 'documents' in vehicle_dict and vehicle_dict['documents']:
            if isinstance(vehicle_dict['documents'], str):
                paths = vehicle_dict['documents'].split(',')
                vehicle_dict['documents'] = [os.path.basename(path) for path in paths]
            elif isinstance(vehicle_dict['documents'], list):
                vehicle_dict['documents'] = [os.path.basename(path) for path in vehicle_dict['documents']]

        processed_vehicles.append(vehicle_dict)

    return processed_vehicles

@router.delete("/vehicle/{license_plate}", response_model=dict)
async def delete_vehicle_endpoint(
        license_plate: str,
        db: Session = Depends(get_db)
):
    # Query the vehicle using the provided license plate
    vehicle = db.query(Vehicles).filter(Vehicles.lisence_plate == license_plate).first()

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Create a history entry before deleting the vehicle
    history_entry = Vehicles_history(
        lisence_plate=vehicle.lisence_plate,
        brand=vehicle.brand,
        model=vehicle.model,
        vehicle_type=vehicle.vehicle_type,
        owner_id=vehicle.owner_id,
        documents=vehicle.documents,
        observations=vehicle.observations,
        registration_date=vehicle.registration_date,
        created_by=vehicle.created_by,
        modified_by=vehicle.modified_by,
        modification_time=vehicle.modification_time
    )
    db.add(history_entry)
    db.commit()  # Commit to save the history record before deletion
    print(f"Created history entry for deleted vehicle: {license_plate}")

    # Delete associated documents from the server
    if vehicle.documents:
        current_documents = vehicle.documents.split(',')
        for doc in current_documents:
            file_path = os.path.join(UPLOAD_DIR_VEHICLE, doc.split('/')[-1])  # Get just the filename
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Removed file: {file_path}")
            else:
                print(f"File not found for removal: {file_path}")

    # Delete associated subscriptions based on multiple license plate options
    subscriptions = db.query(Subscriptions).filter(
        (Subscriptions.lisence_plate1 == vehicle.lisence_plate) |
        (Subscriptions.lisence_plate2 == vehicle.lisence_plate) |
        (Subscriptions.lisence_plate3 == vehicle.lisence_plate)
    ).all()

    for subscription in subscriptions:
        db.delete(subscription)
        print(f"Deleted subscription: {subscription}")

    # Delete the vehicle from the database
    db.delete(vehicle)
    db.commit()

    return {"detail": "Vehicle and associated subscriptions deleted successfully"}


