#  For Owners
from datetime import datetime
from typing import List

from dns.resolver import resolve_at
from sqlalchemy import text
from sqlalchemy.orm import Session


from backend.app.models.models import Owners
from backend.app.schemas.user import OwnersCreate, OwnersResponse


def create_owner(db: Session, owner: OwnersCreate, document_filenames: List[str]):
    new_owner = Owners(
        dni=owner.dni,
        first_name=owner.first_name,
        last_name=owner.last_name,
        email=owner.email,
        documents=",".join(document_filenames),
        observations=owner.observations,
        bank_account_number=owner.bank_account_number,
        sage_client_number=owner.sage_client_number,
        phone_number=owner.phone_number,
        registration_date=datetime.now(),
        reduced_mobility_expiration=owner.reduced_mobility_expiration,
        created_by=owner.created_by,
        modified_by=owner.modified_by,
    )

    db.add(new_owner)
    db.commit()
    db.refresh(new_owner)

    return new_owner

# Sample logic to fetch and construct OwnersResponse
def get_all_owners(db):
    owners_data = db.query(Owners).all()
    owner_responses = []

    for owner in owners_data:
        # Wrap single document in a list if it's not already a list
        documents = owner.documents if isinstance(owner.documents, list) else [owner.documents] if owner.documents else []

        owner_response = OwnersResponse(
            dni=owner.dni,
            first_name=owner.first_name,
            last_name=owner.last_name,
            email=owner.email,
            documents=documents,  # This should now be a list of strings
            observations=owner.observations,
            bank_account_number=owner.bank_account_number,
            sage_client_number=owner.sage_client_number,
            phone_number=owner.phone_number,
            registration_date=owner.registration_date,
            reduced_mobility_expiration=owner.reduced_mobility_expiration,
            created_by=owner.created_by,
            modified_by=owner.modified_by,
            modification_time=owner.modification_time,

        )
        owner_responses.append(owner_response)

    return owner_responses

def get_owner_by_dni(db:Session, owner_dni: str):
    sql = text("""
    SELECT dni, first_name, last_name, email, documents, observations, bank_account_number,sage_client_number,phone_number, registration_date, reduced_mobility_expiration, created_by, modified_by, modification_time
    FROM owners
    WHERE dni = :owner_dni
    """)

    try:
        result = db.execute(sql, {"owner_dni": owner_dni})
        return result.fetchone()
    except Exception as e:
        print(f"Error retrieving owner {e}")
