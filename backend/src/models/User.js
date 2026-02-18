const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: false
  },
  vehicleNumber: {
    type: String,
    required: true,
    unique: true
  },
  vehicleColor: {
    type: String,
    default: null
  },
  vehicleModel: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  totalReservations: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5
  },
  profilePicture: {
    type: String,
    default: null
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.addReservation = function() {
  this.totalReservations += 1;
  return this.save();
};

userSchema.methods.updateSpent = function(amount) {
  this.totalSpent += amount;
  return this.save();
};

userSchema.methods.updateWallet = function(amount) {
  this.walletBalance += amount;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
