Car Parking Management System
Overview
The Car Parking Management System is a comprehensive solution designed to manage vehicle parking records, owner information, and subscription services. This application streamlines the process of tracking parking privileges, special accommodations, and maintaining historical records of all entities in the system.
Features
User Management

Three-tiered access system:

Superuser: Full access to all features and administrative capabilities
Admin: Management access with some restrictions compared to superuser
User: Basic access with limited administrative privileges



Owner Management

Registration of vehicle owners
Profile management and updates
Historical tracking of owner information changes

Vehicle Management

Vehicle registration and details tracking
Assignment of vehicles to owners
Historical tracking of vehicle information changes

Subscription Services

Standard parking subscriptions
Special subscription types:

Reduced Mobility Subscriptions: Special accommodations for individuals with mobility challenges
Large Family Subscriptions: Special rates for qualifying families


Subscription cancellation processing
Subscription modification tracking

Parking Management

Parking lot configuration
Parking space allocation
Parking usage statistics

Document Management

Work order generation
Document storage for subscriptions
Cancellation documentation

Technical Architecture
Backend

FastAPI Python framework
SQLite database
RESTful API endpoints
JWT authentication

Frontend

React.js framework
Context API for state management
Responsive design
Interactive charts for statistical data

Deployment

Docker containerization
Docker Compose orchestration
Volume mapping for persistent data

Installation
Prerequisites

Docker and Docker Compose
Git

Setup Instructions

Clone the repository:
git clone [repository-url]
cd car_parking_app_windows_version

Build and start the containers:
docker-compose build
docker-compose up -d

Access the application:

Frontend: http://localhost:3000
Backend API: http://localhost:8000



Usage
Initial Login
The system comes pre-configured with two default users:

Superuser: smarin@amgevicesa.es (Password provided separately)
Admin: edelgado@amgevicesa.es (Password provided separately)

Common Tasks
Managing Owners

Register new owners through the owner registration form
View and edit owner information
Track historical changes to owner data

Managing Vehicles

Register vehicles and associate them with owners
Update vehicle information
Review vehicle history

Managing Subscriptions

Create new subscriptions
Process subscription modifications
Handle cancellation requests
Generate subscription documentation

Special Accommodations

Process reduced mobility applications
Manage large family subscription requests

File Structure
car_parking_app_windows_version/
├── backend/                      # Backend FastAPI application
│   ├── app/                      # Application modules
│   │   ├── db/                   # Database connection and models
│   │   ├── models/               # Data models
│   │   ├── queries/              # Database query operations
│   │   ├── routes/               # API endpoints
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── templates/            # HTML templates for reports
│   │   └── utils/                # Utility functions
│   ├── Dockerfile                # Backend container configuration
│   ├── main.py                   # Application entry point
│   └── requirements.txt          # Python dependencies
├── frontend/                     # React frontend application
│   ├── public/                   # Static assets
│   ├── src/                      # Source code
│   │   ├── assets/               # Images and icons
│   │   ├── components/           # React components
│   │   ├── context/              # Context providers
│   │   ├── hooks/                # Custom hooks
│   │   └── services/             # API services
│   ├── Dockerfile                # Frontend container configuration
│   └── package.json              # NPM dependencies
├── subscription_files/           # Storage for subscription documents
├── vehicle_uploads/              # Storage for vehicle-related uploads
├── cancelled_subscription_files/ # Storage for cancellation documents
└── docker-compose.yml           # Container orchestration configuration
Maintenance
Database Backups
The SQLite database is mounted as a volume to ensure data persistence. Regular backups are recommended.
File Storage
All uploaded files are stored in mapped volumes for persistence between container restarts.
Support
For technical support or feature requests, please contact the development team.
