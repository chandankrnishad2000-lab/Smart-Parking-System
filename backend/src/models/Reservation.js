const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parkingSpot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSpot',
    required: true
  },
  entryTime: {
    type: Date,
    required: true
  },
  exitTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  totalCost: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'wallet', 'cash'],
    default: 'wallet'
  },
  durationHours: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  cancellationReason: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  review: {
    type: String,
    default: null
  },
  transactionId: {
    type: String,
    default: null
  }
}, { timestamps: true });

reservationSchema.methods.calculateDuration = function() {
  if (this.exitTime) {
    const hours = (this.exitTime - this.entryTime) / (1000 * 60 * 60);
    this.durationHours = Math.ceil(hours);
    return this.durationHours;
  }
  return 0;
};

reservationSchema.methods.calculateCost = function(hourlyRate = 50) {
  const duration = this.calculateDuration();
  this.totalCost = (duration * hourlyRate) - this.discount;
  return this.totalCost;
};

module.exports = mongoose.model('Reservation', reservationSchema);
