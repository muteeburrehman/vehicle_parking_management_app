from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="user")
    is_active = Column(Boolean, default=True)

    tokens = relationship("TokenTable", back_populates="user")


class TokenTable(Base):
    __tablename__ = "tokens"

    access_token = Column(String(450), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    refresh_token = Column(String(450), nullable=False)
    status = Column(Boolean, default=True)
    created_date = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="tokens")


class Owners(Base):
    __tablename__ = "owners"

    dni = Column(String, primary_key=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    documents = Column(String, nullable=True)  # Consider using a better structure for multiple documents
    observations = Column(String, nullable=True)
    bank_account_number = Column(String, nullable=False)
    sage_client_number = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    registration_date = Column(DateTime, default=datetime.now, nullable=False)
    reduced_mobility_expiration = Column(DateTime, nullable=True)

    created_by = Column(String, ForeignKey("users.email"), nullable=False)
    modified_by = Column(String, ForeignKey("users.email"), nullable=True)
    modification_time = Column(DateTime, nullable=True)


# Completed History Tables
class Owners_history(Base):
    __tablename__ = "owners_history"

    history_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dni = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    documents = Column(String, nullable=True)
    observations = Column(String, nullable=True)
    bank_account_number = Column(String, nullable=False)
    sage_client_number = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    registration_date = Column(DateTime, nullable=False)
    reduced_mobility_expiration = Column(DateTime, nullable=True)

    created_by = Column(String, nullable=False)
    modified_by = Column(String, nullable=True)
    modification_time = Column(DateTime, nullable=True)


class Vehicles(Base):
    __tablename__ = "vehicles"
    lisence_plate = Column(String, primary_key=True)
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    vehicle_type = Column(String, nullable=False)
    owner_id = Column(String, ForeignKey("owners.dni"), nullable=False)
    documents = Column(String, nullable=True)
    observations = Column(String, nullable=True)
    registration_date = Column(DateTime, default=datetime.now, nullable=False)
    created_by = Column(String, ForeignKey("users.email"), nullable=False)
    modified_by = Column(String, ForeignKey("users.email"), nullable=True)
    modification_time = Column(DateTime, nullable=True)


class Vehicles_history(Base):
    __tablename__ = "vehicles_history"

    history_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    lisence_plate = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    vehicle_type = Column(String, nullable=False)
    owner_id = Column(String, ForeignKey("owners.dni"), nullable=False)
    documents = Column(String, nullable=True)
    observations = Column(String, nullable=True)
    registration_date = Column(DateTime, nullable=False)

    created_by = Column(String, nullable=False)
    modified_by = Column(String, nullable=True)
    modification_time = Column(DateTime, nullable=True)


class Subscription_types(Base):
    __tablename__ = "subscription_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    parking_code = Column(String, nullable=False)

    # Add this line to create a relationship with Subscriptions
    subscriptions = relationship("Subscriptions", back_populates="subscription_type")

    # Add relationship with Cancellations
    cancellations = relationship("Cancellations", back_populates="subscription_type")

class Subscriptions(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(String, ForeignKey("owners.dni"), nullable=False)
    subscription_type_id = Column(Integer, ForeignKey("subscription_types.id"), nullable=False)
    access_card = Column(String, nullable=True)
    tique_x_park = Column(String, nullable=True)
    remote_control_number = Column(String, nullable=True)
    lisence_plate1 = Column(String, ForeignKey("vehicles.lisence_plate"), nullable=False)
    lisence_plate2 = Column(String, ForeignKey("vehicles.lisence_plate"), nullable=True)
    lisence_plate3 = Column(String, ForeignKey("vehicles.lisence_plate"), nullable=True)
    documents = Column(String, nullable=True)
    observations = Column(String, nullable=True)
    effective_date = Column(DateTime, default=datetime.now(), nullable=True)
    large_family_expiration = Column(DateTime, nullable=True)
    effective_cancellation_date=Column(DateTime, nullable=True)
    registration_date = Column(DateTime, default=datetime.now(), nullable=False)
    parking_spot = Column(String, nullable=True)
    created_by = Column(String, ForeignKey("users.email"), nullable=False)
    modified_by = Column(String, ForeignKey("users.email"), nullable=True)
    modification_time = Column(DateTime, nullable=True)

    # Add this line to create a relationship with Subscription_types
    subscription_type = relationship("Subscription_types", back_populates="subscriptions")


class Subscription_history(Base):
    __tablename__ = "subscription_history"
    history_id = Column(Integer, primary_key=True, index=True)
    id = Column(Integer, ForeignKey("cancellations.id"), nullable=True)
    owner_id = Column(String, ForeignKey("owners.dni"), nullable=False)
    subscription_type_id = Column(Integer, ForeignKey("subscription_types.id"), nullable=False)
    access_card = Column(String, nullable=True)
    lisence_plate1 = Column(String, ForeignKey("vehicles.lisence_plate"), nullable=False)
    lisence_plate2 = Column(String, ForeignKey("vehicles.lisence_plate"), nullable=True)
    lisence_plate3 = Column(String, ForeignKey("vehicles.lisence_plate"), nullable=True)
    documents = Column(String, nullable=True)
    tique_x_park = Column(String, ForeignKey("subscriptions.tique_x_park"), nullable=True)
    remote_control_number = Column(String, ForeignKey("subscriptions.remote_control_number"), nullable=True)
    observations = Column(String, nullable=True)
    effective_date = Column(DateTime, nullable=True)
    large_family_expiration = Column(DateTime, nullable=True)
    effective_cancellation_date = Column(DateTime, nullable=True)
    registration_date = Column(DateTime, default=datetime.now, nullable=False)
    parking_spot = Column(String, nullable=True)
    modification_time = Column(DateTime, default=datetime.now, nullable=False)
    created_by = Column(String, ForeignKey("users.email"), nullable=False)
    modified_by = Column(String, ForeignKey("users.email"), nullable=True)


class Cancellations(Base):
    __tablename__ = "cancellations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(String, ForeignKey("owners.dni"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"),
                             nullable=False)  # Reference to the canceled subscription
    subscription_type_id = Column(Integer, ForeignKey("subscription_types.id"), nullable=False)
    access_card = Column(String, nullable=True)
    lisence_plate1 = Column(String, ForeignKey("vehicles.lisence_plate"), nullable=True)
    lisence_plate2 = Column(String, ForeignKey("vehicles.lisence_plate"), nullable=True)
    lisence_plate3 = Column(String, ForeignKey("vehicles.lisence_plate"), nullable=True)
    tique_x_park = Column(String, ForeignKey("subscriptions.tique_x_park"), nullable=True)
    documents = Column(String, nullable=True)
    remote_control_number = Column(String, ForeignKey("subscriptions.remote_control_number"), nullable=True)
    observations = Column(String, nullable=True)
    registration_date = Column(DateTime, nullable=False)
    effective_date = Column(DateTime, nullable=True)
    large_family_expiration = Column(DateTime, nullable=True)
    effective_cancellation_date = Column(DateTime, nullable=False)  # Added this field
    parking_spot = Column(String, nullable=True)
    modification_time = Column(DateTime, default=datetime.now(), nullable=True)
    created_by = Column(String, ForeignKey("users.email"), nullable=False)
    modified_by = Column(String, ForeignKey("users.email"), nullable=True)

    subscription_type = relationship("Subscription_types", back_populates="cancellations")

class ApprovedCancellations(Base):
    __tablename__ = "approved_cancellations"
    id = Column(Integer, primary_key=True, index=True)
    cancellation_id = Column(Integer, ForeignKey("cancellations.id"), nullable=False)
    owner_id = Column(String, ForeignKey("owners.dni"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    subscription_type_id = Column(Integer, ForeignKey("subscription_types.id"), nullable=False)
    access_card = Column(String, nullable=True)
    lisence_plate1 = Column(String, ForeignKey("vehicles.lisence_plate"), nullable=True)
    lisence_plate2 = Column(String, ForeignKey("vehicles.lisence_plate"), nullable=True)
    lisence_plate3 = Column(String, ForeignKey("vehicles.lisence_plate"), nullable=True)
    tique_x_park = Column(String, ForeignKey("subscriptions.tique_x_park"), nullable=True)
    documents = Column(String, nullable=True)
    remote_control_number = Column(String, ForeignKey("subscriptions.remote_control_number"), nullable=True)
    observations = Column(String, nullable=True)
    registration_date = Column(DateTime, nullable=False)
    effective_date = Column(DateTime, nullable=True)
    large_family_expiration = Column(DateTime, nullable=True)
    effective_cancellation_date = Column(DateTime, nullable=False)
    parking_spot = Column(String, nullable=True)
    modification_time = Column(DateTime, default=datetime.now(), nullable=True)
    created_by = Column(String, ForeignKey("users.email"), nullable=False)
    modified_by = Column(String, ForeignKey("users.email"), nullable=True)



class ParkingLot(Base):
    __tablename__ = "parking_lot_config"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    total_car_spaces = Column(Integer, nullable=False)
    total_motorcycle_spaces = Column(Integer, nullable=False)
    min_car_spaces = Column(Integer, nullable=False)
    min_motorcycle_spaces = Column(Integer, nullable=False)
