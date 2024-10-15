from datetime import datetime
from typing import List
from sqlalchemy import text

from sqlalchemy.orm import Session

from backend.app.models.models import Vehicles
from backend.app.schemas.vehicle import VehicleCreate, VehicleResponse


def add_vehicle(db: Session, vehicle: VehicleCreate, document_filenames: List[str]):
    # Creating an instance of Vehicle model using the data from vehicle
    new_vehicle = Vehicles(
        lisence_plate=vehicle.lisence_plate,
        brand=vehicle.brand,
        model=vehicle.model,
        vehicle_type=vehicle.vehicle_type,
        owner_id=vehicle.owner_id,
        documents=",".join(document_filenames),
        observations=vehicle.observations,
        registration_date=datetime.now(),
        created_by=vehicle.created_by,
    )

    # Add the new_vehicle to the session
    db.add(new_vehicle)

    # Commit the transaction
    db.commit()

    # Refresh the instance to get the latest state from the database
    db.refresh(new_vehicle)

    # Return the newly created vehicle instance
    return new_vehicle


def get_all_vehicles(db):
    vehicles_data = db.query(Vehicles).all()
    vehicles_responses = []

    for vehicle in vehicles_data:
        # Wrap single document in a list if it's not already a list
        documents = vehicle.documents if isinstance(vehicle.documents, list) else [
            vehicle.documents] if vehicle.documents else []

        vehicle_response = VehicleResponse(
            lisence_plate=vehicle.lisence_plate,
            brand=vehicle.brand,
            model=vehicle.model,
            vehicle_type=vehicle.vehicle_type,
            owner_id=vehicle.owner_id,
            documents=documents,
            observations=vehicle.observations,
            registration_date=datetime.now(),
            created_by=vehicle.created_by,
            modified_by=vehicle.modified_by,
            modification_time=vehicle.modification_time,

        )
        vehicles_responses.append(vehicle_response)

    return vehicles_responses


def get_vehicle(db: Session, lisence_plate: str):
    sql = text("""
    SELECT lisence_plate, brand, model, vehicle_type, owner_id, documents, observations, registration_date, created_by, modified_by, modification_time
    FROM vehicles
    WHERE lisence_plate = :lisence_plate
    """)

    try:
        result = db.execute(sql, {'lisence_plate': lisence_plate})
        return result.fetchone()
    except Exception as e:
        print(f"Error retrieving vehicle {e}")
