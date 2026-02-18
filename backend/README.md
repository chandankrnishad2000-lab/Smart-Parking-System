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

4. Run the server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Parking
- `GET /api/parking/available` - Get available spots
- `GET /api/parking/all` - Get all spots (admin only)
- `POST /api/parking/book` - Book a parking spot
- `POST /api/parking/release` - Release a parking spot
- `GET /api/parking/reservations` - Get user reservations

## Database Models
- User
- ParkingSpot
- Reservation

## Dependencies
- express
- mongoose
- cors
- bcryptjs
- jsonwebtoken
- dotenv
