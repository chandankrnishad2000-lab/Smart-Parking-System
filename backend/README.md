# Smart Parking System - Backend

## Overview
Backend API for the Smart Parking System built with Express.js and MongoDB.

## Features
- User registration and authentication
- Parking spot availability tracking
- Reservation management
- Cost calculation
- Admin dashboard support

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB URI and JWT secret

## Database Setup

### Option 1: Local MongoDB

1. Install MongoDB locally:
   - **macOS**: `brew install mongodb-community && brew services start mongodb-community`
   - **Linux**: Follow [MongoDB installation guide](https://docs.mongodb.com/manual/installation/)
   - **Windows**: Download from [mongodb.com](https://www.mongodb.com/try/download/community)

2. Check connection:
```bash
npm run check-db
```

3. Seed sample data:
```bash
npm run seed
```

### Option 2: MongoDB Atlas (Cloud)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and get connection string
3. Update `MONGODB_URI` in `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-parking
```

4. Verify connection:
```bash
npm run check-db
```

5. Seed sample data:
```bash
npm run seed
```

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The backend will be available at `http://localhost:5001`

## Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server with nodemon |
| `npm start` | Start production server |
| `npm run seed` | Populate database with sample data |
| `npm run check-db` | Check MongoDB connection status |

## Sample Data After Seeding

### Test Users
| Email | Password | Role |
|-------|----------|------|
| john@example.com | password123 | User |
| jane@example.com | password123 | User |
| admin@example.com | admin123 | Admin |

### Sample Data Includes
- 3 users with vehicle information
- 15 parking spots across 3 floors with different amenities
- 2 sample reservations (1 completed, 1 active)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Parking
- `GET /api/parking/available` - Get available spots (with filters)
- `GET /api/parking/all` - Get all spots (admin only)
- `POST /api/parking/book` - Book a parking spot
- `POST /api/parking/release` - Release a parking spot
- `GET /api/parking/reservations` - Get user reservations

## Database Models
- User
- ParkingSpot
- Reservation

## Environment Variables

```env
PORT=5001                                              # Server port
MONGODB_URI=mongodb://localhost:27017/smart-parking   # MongoDB connection string
JWT_SECRET=your_jwt_secret_key_here                   # JWT signing key
NODE_ENV=development                                   # Environment mode
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection error | Ensure MongoDB is running and `MONGODB_URI` is correct |
| Port 5001 in use | Change `PORT` in `.env` to another port |
| Seeding fails | Check MongoDB connection first with `npm run check-db` |
| JWT errors | Generate new `JWT_SECRET` in `.env` |

## Dependencies
- express
- mongoose
- cors
- bcryptjs
- jsonwebtoken
- dotenv
- nodemon
