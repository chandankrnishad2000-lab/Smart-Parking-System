const ParkingSpot = require('../models/ParkingSpot');
const Reservation = require('../models/Reservation');

exports.getAvailableSpots = async (req, res) => {
  try {
    const { floor, location, vehicleType } = req.query;
    
    let query = { isAvailable: true };
    if (floor) query.floor = floor;
    if (location) query.location = location;
    if (vehicleType) query.vehicleType = vehicleType;

    const spots = await ParkingSpot.find(query);
    res.json(spots);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching spots', error: err.message });
  }
};

exports.getAllSpots = async (req, res) => {
  try {
    const spots = await ParkingSpot.find();
    res.json(spots);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching spots', error: err.message });
  }
};

exports.bookSpot = async (req, res) => {
  try {
    const { spotId } = req.body;
    const userId = req.user.id;

    const spot = await ParkingSpot.findById(spotId);
    if (!spot || !spot.isAvailable) {
      return res.status(400).json({ message: 'Spot not available' });
    }

    const reservation = new Reservation({
      user: userId,
      parkingSpot: spotId,
      entryTime: new Date()
    });

    await reservation.save();
    
    spot.isAvailable = false;
    spot.occupiedBy = reservation._id;
    await spot.save();

    res.status(201).json({
      message: 'Spot booked successfully',
      reservation
    });
  } catch (err) {
    res.status(500).json({ message: 'Error booking spot', error: err.message });
  }
};

exports.releaseSpot = async (req, res) => {
  try {
    const { reservationId } = req.body;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const spot = await ParkingSpot.findById(reservation.parkingSpot);
    
    reservation.exitTime = new Date();
    reservation.status = 'completed';
    
    const hours = (reservation.exitTime - reservation.entryTime) / (1000 * 60 * 60);
    reservation.totalCost = Math.ceil(hours) * 50; // $50 per hour
    
    await reservation.save();
    
    spot.isAvailable = true;
    spot.occupiedBy = null;
    await spot.save();

    res.json({
      message: 'Spot released successfully',
      reservation,
      totalCost: reservation.totalCost
    });
  } catch (err) {
    res.status(500).json({ message: 'Error releasing spot', error: err.message });
  }
};

exports.getUserReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const reservations = await Reservation.find({ user: userId })
      .populate('parkingSpot')
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reservations', error: err.message });
  }
};
