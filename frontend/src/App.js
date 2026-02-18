import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login, Register } from './components/Auth';
import { ParkingSpots } from './components/ParkingSpots';
import { Reservations } from './components/Reservations';
import { Navigation } from './components/Navigation';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleAuthSuccess = () => {
    const storedUser = localStorage.getItem('user');
    setUser(JSON.parse(storedUser));
    setIsRegistering(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsRegistering(false);
  };

  return (
    <Router>
      {user && <Navigation user={user} onLogout={handleLogout} />}
      
      <Routes>
        {!user ? (
          <>
            <Route path="/" element={
              <div className="home-container">
                <div className="home-content">
                  <h1>Welcome to Smart Parking System</h1>
                  <p>Find, reserve, and manage parking spots easily</p>
                  <div className="auth-toggle">
                    <button 
                      className={isRegistering ? '' : 'active'}
                      onClick={() => setIsRegistering(false)}
                    >
                      Login
                    </button>
                    <button 
                      className={isRegistering ? 'active' : ''}
                      onClick={() => setIsRegistering(true)}
                    >
                      Register
                    </button>
                  </div>
                  {isRegistering ? (
                    <Register onSuccess={handleAuthSuccess} />
                  ) : (
                    <Login onSuccess={handleAuthSuccess} />
                  )}
                </div>
              </div>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            <Route path="/" element={
              <div className="home-container">
                <div className="home-content">
                  <h1>Welcome, {user.name}!</h1>
                  <p>Ready to find a parking spot?</p>
                  <a href="/parking" className="cta-button">Find Parking</a>
                </div>
              </div>
            } />
            <Route path="/parking" element={<ParkingSpots />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
