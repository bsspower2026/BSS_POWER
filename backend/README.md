# Vehicle Management System - Backend API

## Overview

This is the backend API for the Vehicle Management System built with Node.js, Express.js, and MongoDB.

## Project Structure

```
backend/
├── models/               # MongoDB schemas
│   ├── User.js          # User model (Employee, Supervisor, Driver)
│   ├── Vehicle.js       # Vehicle model
│   ├── Driver.js        # Driver model
│   └── Part.js          # Part/Inventory model
├── routes/              # API routes
│   ├── auth.js          # Authentication routes
│   ├── vehicles.js      # Vehicle management routes
│   ├── drivers.js       # Driver management routes
│   └── parts.js         # Parts management routes
├── services/            # Business logic layer
│   ├── AuthService.js   # Authentication logic
│   ├── VehicleService.js# Vehicle operations
│   ├── DriverService.js # Driver operations
│   └── PartService.js   # Parts operations
├── middleware/          # Express middleware
│   └── auth.js          # Authentication & authorization
├── scripts/             # Utility scripts
│   └── seed.js          # Database seeding
├── server.js            # Main server file
├── package.json         # Dependencies
├── .env                 # Environment variables
└── README.md           # This file
```

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file with the following:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vehicle-management
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_change_this_in_production
API_URL=http://localhost:5000
```

### 3. Setup MongoDB

Make sure MongoDB is installed and running on your machine:

```bash
# For macOS with Homebrew
brew services start mongodb-community

# For Windows
# Start MongoDB from Services or run mongod.exe
```

### 4. Seed the Database

```bash
npm run seed
```

This creates default users:
- Employee: employee@bsspower.com / emp123
- Supervisor: supervisor@bsspower.com / sup123
- Driver: driver@bsspower.com / drv123

## Running the Server

### Development Mode (with hot reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server will start on http://localhost:5000

## API Documentation

### Authentication Routes

#### POST `/api/auth/register`
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "employee"
}
```

#### POST `/api/auth/login`
Login user and get JWT token
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "user": { ... },
  "token": "jwt_token_here"
}
```

#### GET `/api/auth/me`
Get current user profile (requires auth)

#### PUT `/api/auth/me`
Update user profile (requires auth)

### Vehicle Routes

#### POST `/api/vehicles`
Create a new vehicle (requires auth, employee/supervisor role)
```json
{
  "registrationNumber": "DL-01-AA-1234",
  "vehicleType": "Car",
  "make": "Maruti",
  "model": "Swift",
  "year": 2022,
  "color": "Silver",
  "fuelType": "Petrol",
  "status": "Active",
  "assignedParts": [...]
}
```

#### GET `/api/vehicles`
Get all vehicles (with pagination and search)
Query params:
- `search`: Search by registration number, make, or model
- `status`: Filter by status (Active, Inactive, Under Maintenance, Decommissioned)
- `vehicleType`: Filter by vehicle type
- `limit`: Items per page (default: 100)
- `skip`: Pagination offset (default: 0)

#### GET `/api/vehicles/:id`
Get vehicle by ID

#### PUT `/api/vehicles/:id`
Update vehicle (requires auth, employee/supervisor role)

#### DELETE `/api/vehicles/:id`
Delete vehicle (requires auth, supervisor role)

#### POST `/api/vehicles/:id/assign-parts`
Assign parts to a vehicle
```json
{
  "assignedParts": [
    {
      "partId": "part_id",
      "quantity": 2,
      "unit": "Piece"
    }
  ]
}
```

#### GET `/api/vehicles/stats/overview`
Get vehicle statistics

### Driver Routes

#### POST `/api/drivers`
Create a new driver (requires auth, employee/supervisor role)
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "licenseNumber": "DL0120220012345",
  "licenseCategory": ["HMV"],
  "status": "Active"
}
```

#### GET `/api/drivers`
Get all drivers (with pagination and search)

#### GET `/api/drivers/:id`
Get driver by ID

#### PUT `/api/drivers/:id`
Update driver (requires auth, employee/supervisor role)

#### DELETE `/api/drivers/:id`
Delete driver (requires auth, supervisor role)

#### GET `/api/drivers/stats/overview`
Get driver statistics

#### GET `/api/drivers/expiry/licenses`
Check drivers with expiring licenses (requires supervisor role)

### Parts Routes

#### POST `/api/parts`
Create a new part (requires auth, employee/supervisor role)
```json
{
  "partName": "Oil Filter",
  "partCode": "OF-001",
  "category": "Engine",
  "unitOfMeasurement": "Piece",
  "quantityInStock": 50,
  "costPrice": 100,
  "sellingPrice": 150
}
```

#### GET `/api/parts`
Get all parts (with pagination and search)

#### GET `/api/parts/:id`
Get part by ID

#### PUT `/api/parts/:id`
Update part (requires auth, employee/supervisor role)

#### DELETE `/api/parts/:id`
Delete part (requires auth, supervisor role)

#### GET `/api/parts/stats/overview`
Get parts statistics

#### POST `/api/parts/:id/update-stock`
Update part stock
```json
{
  "quantity": 10,
  "operation": "add" // or "subtract"
}
```

#### GET `/api/parts/inventory/low-stock`
Get parts with low stock

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer your_jwt_token_here
```

## Models

### User
- name, email, password, role, phone, address, city, state, zipCode, profilePicture
- Roles: employee, supervisor, driver

### Vehicle
- Registration details, insurance info, maintenance schedule, assigned parts
- Status: Active, Inactive, Under Maintenance, Decommissioned

### Driver
- Personal information, contact details, license information, employment data
- Status: Active, Inactive, On Leave, Suspended

### Part
- Part information, unit of measurement, stock tracking, pricing
- Categories: Engine, Transmission, Brakes, Suspension, Electrical, Cooling, Fuel, Tires, Body, Interior, Other

## Error Handling

All errors return a standard format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

## Development Tips

1. Use Postman or Insomnia to test API endpoints
2. Always include JWT token in Authorization header for protected routes
3. Check MongoDB connection before starting server
4. Use environment variables for sensitive data

## Technologies Used

- Node.js: JavaScript runtime
- Express.js: Web framework
- MongoDB: NoSQL database
- Mongoose: ODM for MongoDB
- JWT: Token-based authentication
- bcryptjs: Password hashing
- cors: Cross-origin resource sharing
- dotenv: Environment variables
