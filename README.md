# Vehicle Parking Management System
## Overview
The Vehicle Parking Management System is a comprehensive solution designed to manage vehicle parking records, owner information, and subscription services. This application streamlines the process of tracking parking privileges, special accommodations, and maintaining historical records of all entities in the system.
Features
## User Management

### Three-tiered access system:

- Superuser: Full access to all features and administrative capabilities
- Admin: Management access with some restrictions compared to superuser
- User: Basic access with limited privileges



### Owner Management

- Registration of vehicle owners
- Profile management and updates
- Historical tracking of owner information changes

### Vehicle Management

- Vehicle registration and details tracking
- Assignment of vehicles to owners
- Historical tracking of vehicle information changes

### Subscription Services

- Standard parking subscriptions
- Special subscription types:

### Reduced Mobility Subscriptions:
- Special accommodations for individuals with mobility challenges
### Large Family Subscriptions: 
- Special rates for qualifying families


### Subscription cancellation processing
### Subscription modification tracking

### Parking Management

- Parking lot configuration
- Parking space allocation
- Parking usage statistics

### Document Management

- Work order generation
- Document storage for subscriptions
- Cancellation documentation

## Technical Architecture
### Backend

- FastAPI Python framework
- SQLite database
- RESTful API endpoints
- JWT authentication

### Frontend

- React.js framework
- Context API for state management
- Responsive design
- Interactive charts for statistical data

- Deployment

- Docker containerization
- Docker Compose orchestration
- Volume mapping for persistent data

## Installation
### Prerequisites

- Docker and Docker Compose
- Git

## Setup Instructions

### Clone the repository:
```bash
git clone git@github.com:muteeburrehman/vehicle_parking_management_app.git
cd car_parking_app_windows_version
```
### Build and start the containers:
```bash
docker-compose build
docker-compose up -d
```

### Access the application:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000


## Common Tasks
### Managing Owners

- Register new owners through the owner registration form
- View and edit owner information
- Track historical changes to owner data

### Managing Vehicles

- Register vehicles and associate them with owners
- Update vehicle information
- Review vehicle history

### Managing Subscriptions

- Create new subscriptions
- Process subscription modifications
- Handle cancellation requests
- Generate subscription documentation

### Special Accommodations

- Process reduced mobility applications
- Manage large family subscription requests

## Maintenance
### Database Backups
The SQLite database is mounted as a volume to ensure data persistence. Regular backups are recommended.
### File Storage
All uploaded files are stored in mapped volumes for persistence between container restarts.
