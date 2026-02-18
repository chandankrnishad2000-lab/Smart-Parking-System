# Smart Parking System

A complete full-stack solution for managing parking spaces with real-time availability tracking, user authentication, and reservation management.

## 🎯 Features

### User Features
- User registration and authentication with JWT
- Browse available parking spots
- Advanced filtering (floor, location, vehicle type)
- Real-time spot booking
- Reservation management
- Automatic cost calculation
- View booking history

### Admin Features
- View all parking spots
- Spot availability management
- User management
- Revenue tracking

### Technical Features
- RESTful API backend
- MongoDB database
- JWT authentication
- Responsive React frontend
- Real-time availability updates

## 📁 Project Structure

```
Smart Parking System/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── models/         # MongoDB schemas
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Authentication & validation
│   │   ├── config/         # Database configuration
│   │   └── index.js        # Main server file
│   ├── package.json
│   └── README.md
│
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   ├── package.json
│   └── README.md
│
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB URI and JWT secret:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-parking
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

5. Start MongoDB (if running locally):
```bash
mongod
```

6. Run the server:
```bash
npm run dev
```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. In a new terminal, navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will automatically open at `http://localhost:3000`

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Parking
- `GET /api/parking/available` - Get available spots (with filters)
- `GET /api/parking/all` - Get all spots (admin only)
- `POST /api/parking/book` - Book a parking spot
- `POST /api/parking/release` - Release a parking spot
- `GET /api/parking/reservations` - Get user reservations

## 📊 Database Models

### User
- name
- email (unique)
- password (hashed)
- phone
- vehicleNumber (unique)
- role (user/admin)
- isActive
- timestamps

### ParkingSpot
- spotNumber (unique)
- floor
- location (A/B/C/D)
- isAvailable
- vehicleType (compact/standard/large/motorcycle)
- occupiedBy (reference to Reservation)
- timestamps

### Reservation
- user (reference to User)
- parkingSpot (reference to ParkingSpot)
- entryTime
- exitTime
- status (active/completed/cancelled)
- totalCost
- paymentStatus (pending/paid/failed)
- timestamps

## 🔐 Authentication

The system uses JWT (JSON Web Tokens) for authentication:

1. Users register/login to receive a JWT token
2. Token is stored in localStorage
3. Token is included in all authenticated requests
4. Backend validates token on protected routes

## 💻 Development

### Backend Stack
- Express.js - Web framework
- MongoDB - Database
- Mongoose - ODM
- bcryptjs - Password hashing
- jsonwebtoken - JWT handling

### Frontend Stack
- React 18 - UI library
- React Router v6 - Navigation
- Axios - HTTP client
- CSS3 - Styling

## 📝 Sample Test Data

### Default User
```json
{
  "email": "user@test.com",
  "password": "password123",
  "name": "Test User",
  "vehicleNumber": "ABC123"
}
```

### Create Sample Spots (MongoDB)
```javascript
db.parkingspots.insertMany([
  { spotNumber: "A-101", floor: 1, location: "A", isAvailable: true, vehicleType: "standard" },
  { spotNumber: "A-102", floor: 1, location: "A", isAvailable: true, vehicleType: "compact" },
  { spotNumber: "B-201", floor: 2, location: "B", isAvailable: true, vehicleType: "large" },
])
```

## 🛠 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check the MONGODB_URI in .env

### Port Already in Use
- Backend: Change PORT in .env
- Frontend: The app will prompt to use a different port

### CORS Issues
- Ensure backend is running on port 5000
- Check proxy setting in frontend/package.json

### Token Expiry
- Tokens expire in 24 hours
- User will need to login again

## 🚦 Future Enhancements

- Payment gateway integration
- Email notifications
- SMS alerts
- Mobile app (React Native)
- Real-time WebSocket updates
- Advanced analytics dashboard
- QR code for spot entry
- IoT sensor integration
- Multi-location support
- Subscription plans

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Support

For issues or questions, please check the README files in the backend and frontend directories for more specific information.

---

**Happy Parking! 🚗**
