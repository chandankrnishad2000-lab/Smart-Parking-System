# Smart Parking System - Frontend

## Overview
React-based frontend for the Smart Parking System application.

## Features
- User authentication (login/register)
- Browse available parking spots with filters
- Book and release parking spots
- View reservation history
- Real-time cost calculation

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Available Scripts

### `npm start`
Runs the app in development mode.

### `npm build`
Builds the app for production to the `build` folder.

### `npm test`
Launches the test runner.

## Features

- **Authentication**: Register and login with email/password
- **Parking Search**: Filter available spots by floor, location, and vehicle type
- **Booking**: Reserve parking spots instantly
- **Dashboard**: View all your active and completed reservations
- **Cost Tracking**: Automatic calculation of parking fees

## Technologies Used
- React 18
- React Router v6
- Axios for API calls
- CSS3 for styling

## Configuration

Update the API base URL in `src/services/api.js` if your backend is running on a different port.
