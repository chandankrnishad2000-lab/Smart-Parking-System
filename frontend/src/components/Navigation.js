import React from 'react';
import './Navigation.css';

export const Navigation = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>🅿️ Smart Parking System</h1>
        </div>
        <ul className="nav-menu">
          <li><a href="/">Home</a></li>
          <li><a href="/parking">Find Parking</a></li>
          <li><a href="/reservations">My Reservations</a></li>
          {user && (
            <>
              <li className="user-info">{user.name}</li>
              <li><button onClick={onLogout} className="logout-btn">Logout</button></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};
