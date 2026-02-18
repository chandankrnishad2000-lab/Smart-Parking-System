import React, { useEffect, useState } from 'react';
import { parkingService } from '../services/api';
import './Reservations.css';

export const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await parkingService.getUserReservations();
      setReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseSpot = async (reservationId) => {
    try {
      const response = await parkingService.releaseSpot(reservationId);
      alert(`Spot released! Total cost: $${response.data.totalCost}`);
      fetchReservations();
    } catch (error) {
      alert('Failed to release spot: ' + error.response.data.message);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="reservations-container">
      <h2>My Reservations</h2>
      
      {loading ? (
        <p>Loading...</p>
      ) : reservations.length === 0 ? (
        <p>No reservations found</p>
      ) : (
        <div className="reservations-list">
          {reservations.map((reservation) => (
            <div key={reservation._id} className="reservation-card">
              <h3>Spot {reservation.parkingSpot.spotNumber}</h3>
              <p><strong>Location:</strong> {reservation.parkingSpot.location}-{reservation.parkingSpot.floor}</p>
              <p><strong>Entry Time:</strong> {formatDate(reservation.entryTime)}</p>
              {reservation.exitTime && (
                <p><strong>Exit Time:</strong> {formatDate(reservation.exitTime)}</p>
              )}
              <p><strong>Status:</strong> <span className={`status ${reservation.status}`}>{reservation.status.toUpperCase()}</span></p>
              {reservation.status === 'active' && (
                <button onClick={() => handleReleaseSpot(reservation._id)}>Release Spot</button>
              )}
              {reservation.status === 'completed' && (
                <p className="cost"><strong>Total Cost:</strong> ${reservation.totalCost}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
