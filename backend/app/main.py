import uvicorn
from fastapi import FastAPI
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from backend.app.db.database import engine
from backend.app.models.models import Base
from backend.app.queries.user import get_user_by_email, create_user
from backend.app.routes import user_routes, auth_routes, owner_routes, vehicle_routes, subscription_routes, \
    subscription_cancellation_route, subscription_history_route, vehicle_history_route, owner_history_route, \
    parking_lot_routes, parking_stats
from backend.app.routes import approve_cancellation
from backend.app.routes.owner_routes import UPLOAD_DIR
from backend.app.schemas.user import UserCreate

# Initialize the FastAPI app
app = FastAPI()

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.mount("/vehicle_uploads", StaticFiles(directory="vehicle_uploads"), name="vehicle_uploads")

app.mount("/subscription_files", StaticFiles(directory="subscription_files"), name="subscription_files")

app.mount("/cancelled_subscription_files", StaticFiles(directory="cancelled_subscription_files"), name="cancelled_subscription_files")

# Add CORS middleware to allow all origins, methods, and headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)
# routes
app.include_router(user_routes.router)
app.include_router(auth_routes.router)
app.include_router(owner_routes.router)
app.include_router(vehicle_routes.router)
app.include_router(subscription_routes.router)

app.include_router(subscription_cancellation_route.router)
app.include_router(subscription_history_route.router)
app.include_router(owner_history_route.router)
app.include_router(vehicle_history_route.router)
app.include_router(parking_lot_routes.router)
app.include_router(parking_stats.router)

app.include_router(approve_cancellation.router)
@app.get("/")
def read_root(): 
    return {"message": "Bienvenidos a la API!"}

def create_default_users(db: Session):
    # Create admin user if not exists
    admin_email = "edelgado@amgevicesa.es"
    if not get_user_by_email(db, email=admin_email):
        admin_user = UserCreate(
            email=admin_email,
            password="Ceuta1234",
            confirm_password="Ceuta1234",  # Add confirm_password here
            role="admin"
        )
        create_user(db=db, user=admin_user)  # Use the CRUD function to create the user

    # Create superuser if not exists
    superuser_email = "smarin@amgevicesa.es"
    if not get_user_by_email(db, email=superuser_email):
        superuser_user = UserCreate(
            email=superuser_email,
            password="B8z33s27.",
            confirm_password="B8z33s27.",  # Add confirm_password here
            role="superuser"
        )
        create_user(db=db, user=superuser_user)  # Use the CRUD function to create the user
# Main entry point
if __name__ == '__main__':
    # Create all the database tables
    Base.metadata.create_all(bind=engine)


    # Create default users
    with Session(engine) as db:
        create_default_users(db)

    # Run the FastAPI app with Uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
