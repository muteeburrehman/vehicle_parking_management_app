import os
from datetime import datetime
from typing import List, Optional

from pydantic import EmailStr
from sqlalchemy import column
from sqlalchemy.orm import Session
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.params import Depends
from starlette.staticfiles import StaticFiles

from backend.app.db.database import get_db
from backend.app.models.models import Owners, Subscriptions, Vehicles, Owners_history
from backend.app.schemas.user import OwnersCreate, OwnersResponse
from backend.app.queries.owner import create_owner, get_all_owners, get_owner_by_dni

router = APIRouter()

# Create the uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/owner/", response_model=OwnersResponse)
async def create_owner_endpoint(
        dni: str = Form(...),
        first_name: str = Form(...),
        last_name: str = Form(...),
        email: Optional[str] = Form(None),
        observations: Optional[str] = Form(None),
        bank_account_number: str = Form(...),
        sage_client_number: Optional[str] = Form(None),
        phone_number: Optional[str] = Form(None),
        documents: List[UploadFile] = File([]),
        created_by: str = Form(...),
        db: Session = Depends(get_db)
):
    document_filenames = []
    for document in documents:
        file_location = f"uploads/{document.filename}"
        with open(file_location, "wb+") as file_object:
            file_object.write(await document.read())
        document_filenames.append(file_location)

    owner_data = OwnersCreate(
        dni=dni,
        first_name=first_name,
        last_name=last_name,
        email=email,
        observations=observations,
        bank_account_number=bank_account_number,
        sage_client_number=sage_client_number,
        phone_number=phone_number,
        registration_date=datetime.now(),
        created_by=created_by,
    )

    new_owner = create_owner(db, owner_data, document_filenames)

    # Track the history upon creation
    history_entry = Owners_history(
        dni=new_owner.dni,
        first_name=new_owner.first_name,
        last_name=new_owner.last_name,
        email=new_owner.email,
        documents=','.join(document_filenames),
        observations=new_owner.observations,
        bank_account_number=new_owner.bank_account_number,
        sage_client_number=new_owner.sage_client_number,
        phone_number=new_owner.phone_number,
        registration_date=new_owner.registration_date,
        created_by=new_owner.created_by,
    )
    db.add(history_entry)
    db.commit()
    db.refresh(new_owner)

    return OwnersResponse(
        dni=new_owner.dni,
        first_name=new_owner.first_name,
        last_name=new_owner.last_name,
        email=new_owner.email,
        documents=document_filenames,
        observations=new_owner.observations,
        bank_account_number=new_owner.bank_account_number,
        sage_client_number=new_owner.sage_client_number,
        phone_number=new_owner.phone_number,
        registration_date=new_owner.registration_date,
        created_by=new_owner.created_by,
        modified_by=new_owner.modified_by
    )


async def handle_document_updates(owner, new_documents: List[UploadFile], remove_documents: List[str]):
    # Get current documents
    current_documents = owner.documents.split(',') if owner.documents else []

    print(f"Current documents: {current_documents}")
    print(f"Documents to remove: {remove_documents}")

    # Handle document removal
    updated_documents = []
    for doc in current_documents:
        doc_name = doc.split('/')[-1]  # Get just the filename
        if doc_name not in remove_documents:
            updated_documents.append(doc)
        else:
            # Delete the file from the server
            file_path = os.path.join(UPLOAD_DIR, doc_name)
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Removed file: {file_path}")
            else:
                print(f"File not found for removal: {file_path}")

    print(f"Documents after removal: {updated_documents}")

    # Handle new document uploads
    for document in new_documents:
        filename = f"{owner.dni}_{document.filename}"  # Prefix with DNI to avoid conflicts
        file_location = os.path.join(UPLOAD_DIR, filename)
        try:
            with open(file_location, "wb") as file:
                content = await document.read()
                file.write(content)
            updated_documents.append(os.path.join(UPLOAD_DIR, filename))
            print(f"Added new file: {file_location}")
        except IOError:
            raise HTTPException(status_code=500, detail=f"Could not write file: {filename}")

    # Update the owner's documents
    owner.documents = ','.join(updated_documents) if updated_documents else None

    print(f"Final updated documents: {owner.documents}")

    return owner


@router.put("/owner/{dni}/", response_model=OwnersResponse)
async def edit_owner_endpoint(
    dni: str,
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    observations: Optional[str] = Form(None),
    bank_account_number: Optional[str] = Form(None),
    sage_client_number: Optional[str] = Form(None),
    phone_number: Optional[str] = Form(None),
    new_documents: List[UploadFile] = File([]),
    remove_documents: List[str] = Form([]),
    created_by: Optional[str] = Form(None),
    modified_by: Optional[str] = Form(None),
    modification_time: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Fetch the owner by DNI
    owner = db.query(Owners).filter(Owners.dni == dni).first()

    # If the owner doesn't exist, raise a 404 error
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    print(f"Updating owner: {dni}")
    print(f"New documents: {[doc.filename for doc in new_documents]}")
    print(f"Documents to remove: {remove_documents}")

    # Track changes
    changes = []

    # Function to update a field and track changes
    def update_field(field_name, new_value):
        old_value = getattr(owner, field_name)
        if new_value is not None and old_value != new_value:
            setattr(owner, field_name, new_value)
            changes.append((field_name, old_value, new_value))
            print(f"Updated {field_name}: {new_value}")

    # Update the owner fields if they are provided
    update_field('first_name', first_name)
    update_field('last_name', last_name)
    update_field('email', email)
    update_field('observations', observations)
    update_field('bank_account_number', bank_account_number)
    update_field('sage_client_number', sage_client_number)
    update_field('phone_number', phone_number)
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
    old_documents = owner.documents
    owner = await handle_document_updates(owner, new_documents, remove_documents)
    if old_documents != owner.documents:
        changes.append(('documents', old_documents, owner.documents))

    # If there are valid changes, log them in Owners_history
    if changes:
        history_entry = Owners_history(
            dni=owner.dni,
            first_name=owner.first_name,
            last_name=owner.last_name,
            email=owner.email,
            documents=owner.documents,
            observations=owner.observations,
            bank_account_number=owner.bank_account_number,
            sage_client_number=owner.sage_client_number,
            phone_number=owner.phone_number,
            registration_date=owner.registration_date,
            created_by=owner.created_by,
            modified_by=owner.modified_by,
            modification_time=owner.modification_time
        )
        db.add(history_entry)
        print(f"Created history entry for owner: {dni}")

    # Save the changes to the database
    db.commit()
    db.refresh(owner)
    print("Updated modification time:", owner.modification_time)

    # Return the updated owner data
    return OwnersResponse(
        dni=owner.dni,
        first_name=owner.first_name,
        last_name=owner.last_name,
        email=owner.email,
        documents=owner.documents.split(',') if owner.documents else [],
        observations=owner.observations,
        bank_account_number=owner.bank_account_number,
        sage_client_number=owner.sage_client_number,
        phone_number=owner.phone_number,
        registration_date=owner.registration_date,
        created_by=owner.created_by,
        modified_by=owner.modified_by,
        modification_time=owner.modification_time,
    )

@router.get("/owner/{dni}", response_model=OwnersResponse)
def get_owner_endpoint(owner_dni: str, db: Session = Depends(get_db)):
    owner = get_owner_by_dni(db=db, owner_dni=owner_dni)

    if owner is None:
        raise HTTPException(status_code=404, detail="Owner not found")

    # Build owner_data from the result of the raw SQL query
    owner_data = {
        'dni': owner.dni,
        'first_name': owner.first_name,
        'last_name': owner.last_name,
        'email': owner.email,
        'documents': owner.documents.split(',') if owner.documents else [],
        'observations': owner.observations,
        'bank_account_number': owner.bank_account_number,
        'sage_client_number': owner.sage_client_number,
        'phone_number': owner.phone_number,
        'registration_date': owner.registration_date,
        'created_by': owner.created_by,
        'modified_by': owner.modified_by,
        'modification_time':owner.modification_time,
    }

    return OwnersResponse(**owner_data)


@router.get("/owners/", response_model=list[OwnersResponse])
def get_owners_endpoint(db: Session = Depends(get_db)):
    owners = get_all_owners(db)
    return owners

@router.delete("/owner/{dni}/", response_model=dict)
async def delete_owner_endpoint(dni: str, db: Session = Depends(get_db)):
    # Fetch the owner by DNI
    owner = db.query(Owners).filter(Owners.dni == dni).first()

    # If the owner doesn't exist, raise a 404 error
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    # Remove associated documents
    if owner.documents:
        for doc in owner.documents.split(','):
            file_path = os.path.join(UPLOAD_DIR, doc.split('/')[-1])  # Get the filename
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Removed file: {file_path}")

    # Delete associated vehicles
    vehicles = db.query(Vehicles).filter(Vehicles.owner_id == owner.dni).all()  # Assuming owner has a foreign key in Vehicles
    for vehicle in vehicles:
        db.delete(vehicle)
        print(f"Deleted vehicle: {vehicle}")

    # Delete associated subscriptions
    subscriptions = db.query(Subscriptions).filter(Subscriptions.owner_id == owner.dni).all()  # Assuming owner has a foreign key in Subscriptions
    for subscription in subscriptions:
        db.delete(subscription)
        print(f"Deleted subscription: {subscription}")

    # Delete the owner from the database
    db.delete(owner)
    db.commit()

    return {"detail": "Owner and associated vehicles and subscriptions deleted successfully"}