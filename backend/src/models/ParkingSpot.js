const mongoose = require('mongoose');

const parkingSpotSchema = new mongoose.Schema({
  spotNumber: {
    type: String,
    required: true,
    unique: true
  },
  floor: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  vehicleType: {
    type: String,
    enum: ['compact', 'standard', 'large', 'motorcycle'],
    required: true
  },
  occupiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    default: null
  },
  hourlyRate: {
    type: Number,
    default: 50
  },
  maxHeight: {
    type: Number,
    default: 2.1    
  },
  isCovered: {
    type: Boolean,
    default: false
  },
  hasEVCharging: {
    type: Boolean,
    default: false
  },
  hasCamera: {
    type: Boolean,
    default: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  maintenanceStatus: {
    type: String,
    enum: ['available', 'maintenance', 'damaged'],
    default: 'available'
  },
  sensorId: {
    type: String,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

parkingSpotSchema.methods.getSpotInfo = function() {
  return {
    spotNumber: this.spotNumber,
    floor: this.floor,
    location: this.location,
    available: this.isAvailable,
    amenities: {
      covered: this.isCovered,
      evCharging: this.hasEVCharging,
      camera: this.hasCamera
    },
    rate: this.hourlyRate
  };
};

parkingSpotSchema.methods.markUnavailable = async function(reservationId) {
  this.isAvailable = false;
  this.occupiedBy = reservationId;
  return this.save();
};

parkingSpotSchema.methods.markAvailable = async function() {
  this.isAvailable = true;
  this.occupiedBy = null;
  this.lastUpdated = new Date();
  return this.save();
};

module.exports = mongoose.model('ParkingSpot', parkingSpotSchema);
