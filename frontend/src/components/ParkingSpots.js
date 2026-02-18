import React, { useEffect, useState } from 'react';
import { parkingService } from '../services/api';
import './ParkingSpots.css';

export const ParkingSpots = () => {
  const [spots, setSpots] = useState([]);
  const [filters, setFilters] = useState({
    floor: '',
    location: '',
    vehicleType: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpots();
  }, [filters]);

  const fetchSpots = async () => {
    try {
      setLoading(true);
      const response = await parkingService.getAvailableSpots(filters);
      setSpots(response.data);
    } catch (error) {
      console.error('Error fetching spots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleBookSpot = async (spotId) => {
    try {
      await parkingService.bookSpot(spotId);
      alert('Spot booked successfully!');
      fetchSpots();
    } catch (error) {
      alert('Failed to book spot: ' + error.response.data.message);
    }
  };

  return (
    <div className="parking-container">
      <h2>Available Parking Spots</h2>
      
      <div className="filters">
        <select name="floor" value={filters.floor} onChange={handleFilterChange}>
          <option value="">All Floors</option>
          <option value="1">Floor 1</option>
          <option value="2">Floor 2</option>
          <option value="3">Floor 3</option>
        </select>
        
        <select name="location" value={filters.location} onChange={handleFilterChange}>
          <option value="">All Locations</option>
          <option value="A">Location A</option>
          <option value="B">Location B</option>
          <option value="C">Location C</option>
          <option value="D">Location D</option>
        </select>
        
        <select name="vehicleType" value={filters.vehicleType} onChange={handleFilterChange}>
          <option value="">All Vehicle Types</option>
          <option value="compact">Compact</option>
          <option value="standard">Standard</option>
          <option value="large">Large</option>
          <option value="motorcycle">Motorcycle</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : spots.length === 0 ? (
        <p>No parking spots available</p>
      ) : (
        <div className="spots-grid">
          {spots.map((spot) => (
            <div key={spot._id} className="spot-card">
              <h3>Spot {spot.spotNumber}</h3>
              <p>Floor: {spot.floor}</p>
              <p>Location: {spot.location}</p>
              <p>Type: {spot.vehicleType}</p>
              <p className="status available">Available</p>
              <button onClick={() => handleBookSpot(spot._id)}>Book Now</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
