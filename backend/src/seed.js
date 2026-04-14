require('dotenv').config();
const mongoose = require('mongoose');
const ParkingSpot = require('./models/ParkingSpot');
const User = require('./models/User');
const Reservation = require('./models/Reservation');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for seeding');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    // Clear existing data
    await ParkingSpot.deleteMany({});
    await User.deleteMany({});
    await Reservation.deleteMany({});
    console.log('Cleared existing data');

    // Create sample users
    const users = await User.insertMany([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '9876543210',
        vehicleNumber: 'ABC123',
        vehicleColor: 'Red',
        vehicleModel: 'Honda City',
        role: 'user',
        walletBalance: 500,
        notificationsEnabled: true
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        phone: '9876543211',
        vehicleNumber: 'XYZ789',
        vehicleColor: 'Blue',
        vehicleModel: 'Toyota Fortuner',
        role: 'user',
        walletBalance: 1000,
        notificationsEnabled: true
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        phone: '9876543212',
        vehicleNumber: 'ADM001',
        vehicleColor: 'Black',
        vehicleModel: 'Tesla Model 3',
        role: 'admin',
        walletBalance: 5000,
        notificationsEnabled: true
      }
    ]);
    console.log(`✓ Created ${users.length} sample users`);

    // Create sample parking spots
    const spots = await ParkingSpot.insertMany([
      // Floor 1 - Location A
      { spotNumber: 'A-101', floor: 1, location: 'A', vehicleType: 'compact', hourlyRate: 40, isCovered: true, hasEVCharging: false, hasCamera: true, maintenanceStatus: 'available', coordinates: { latitude: 28.6139, longitude: 77.2090 }, sensorId: 'SENSOR-A101' },
      { spotNumber: 'A-102', floor: 1, location: 'A', vehicleType: 'standard', hourlyRate: 50, isCovered: true, hasEVCharging: false, hasCamera: true, maintenanceStatus: 'available', coordinates: { latitude: 28.6140, longitude: 77.2091 }, sensorId: 'SENSOR-A102' },
      { spotNumber: 'A-103', floor: 1, location: 'A', vehicleType: 'standard', hourlyRate: 50, isCovered: true, hasEVCharging: true, hasCamera: true, maintenanceStatus: 'available', coordinates: { latitude: 28.6141, longitude: 77.2092 }, sensorId: 'SENSOR-A103' },
      { spotNumber: 'A-104', floor: 1, location: 'A', vehicleType: 'large', hourlyRate: 70, isCovered: false, hasEVCharging: false, hasCamera: true, maintenanceStatus: 'available', coordinates: { latitude: 28.6142, longitude: 77.2093 }, sensorId: 'SENSOR-A104' },

      // Floor 1 - Location B
      { spotNumber: 'B-101', floor: 1, location: 'B', vehicleType: 'motorcycle', hourlyRate: 20, isCovered: true, hasEVCharging: false, hasCamera: true, maintenanceStatus: 'available', coordinates: { latitude: 28.6143, longitude: 77.2094 }, sensorId: 'SENSOR-B101' },
      { spotNumber: 'B-102', floor: 1, location: 'B', vehicleType: 'standard', hourlyRate: 50, isCovered: false, hasEVCharging: false, hasCamera: true, maintenanceStatus: 'available', coordinates: { latitude: 28.6144, longitude: 77.2095 }, sensorId: 'SENSOR-B102' },
      { spotNumber: 'B-103', floor: 1, location: 'B', vehicleType: 'compact', hourlyRate: 40, isCovered: false, hasEVCharging: false, hasCamera: false, maintenanceStatus: 'maintenance', coordinates: { latitude: 28.6145, longitude: 77.2096 }, sensorId: 'SENSOR-B103' },

      // Floor 2 - Location C
      { spotNumber: 'C-201', floor: 2, location: 'C', vehicleType: 'standard', hourlyRate: 50, isCovered: true, hasEVCharging: true, hasCamera: true, maintenanceStatus: 'available', coordinates: { latitude: 28.6146, longitude: 77.2097 }, sensorId: 'SENSOR-C201' },
      { spotNumber: 'C-202', floor: 2, location: 'C', vehicleType: 'large', hourlyRate: 70, isCovered: true, hasEVCharging: false, hasCamera: true, maintenanceStatus: 'available', coordinates: { latitude: 28.6147, longitude: 77.2098 }, sensorId: 'SENSOR-C202' },
      { spotNumber: 'C-203', floor: 2, location: 'C', vehicleType: 'compact', hourlyRate: 40, isCovered: true, hasEVCharging: false, hasCamera: true, maintenanceStatus: 'available', coordinates: { latitude: 28.6148, longitude: 77.2099 }, sensorId: 'SENSOR-C203' },

      // Floor 2 - Location D
      { spotNumber: 'D-201', floor: 2, location: 'D', vehicleType: 'standard', hourlyRate: 50, isCovered: false, hasEVCharging: true, hasCamera: true, maintenanceStatus: 'available', coordinates: { latitude: 28.6149, longitude: 77.2100 }, sensorId: 'SENSOR-D201' },
      { spotNumber: 'D-202', floor: 2, location: 'D', vehicleType: 'motorcycle', hourlyRate: 20, isCovered: false, hasEVCharging: false, hasCamera: true, maintenanceStatus: 'available', coordinates: { latitude: 28.6150, longitude: 77.2101 }, sensorId: 'SENSOR-D202' },

      // Floor 3
      { spotNumber: 'C-301', floor: 3, location: 'C', vehicleType: 'large', hourlyRate: 70, isCovered: true, hasEVCharging: false, hasCamera: true, maintenanceStatus: 'available', coordinates: { latitude: 28.6151, longitude: 77.2102 }, sensorId: 'SENSOR-C301' },
      { spotNumber: 'D-301', floor: 3, location: 'D', vehicleType: 'standard', hourlyRate: 50, isCovered: true, hasEVCharging: true, hasCamera: true, maintenanceStatus: 'available', coordinates: { latitude: 28.6152, longitude: 77.2103 }, sensorId: 'SENSOR-D301' }
    ]);
    console.log(`✓ Created ${spots.length} sample parking spots`);

    // Create sample reservations
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const reservations = await Reservation.insertMany([
      {
        user: users[0]._id,
        parkingSpot: spots[0]._id,
        entryTime: yesterday,
        exitTime: new Date(yesterday.getTime() + 3 * 60 * 60 * 1000),
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'credit_card',
        durationHours: 3,
        totalCost: 120,
        rating: 5,
        review: 'Great spot, very convenient!',
        transactionId: 'TXN-001'
      },
      {
        user: users[1]._id,
        parkingSpot: spots[4]._id,
        entryTime: twoHoursAgo,
        exitTime: null,
        status: 'active',
        paymentStatus: 'pending',
        paymentMethod: 'wallet',
        durationHours: 0,
        totalCost: 0
      }
    ]);
    console.log(`✓ Created ${reservations.length} sample reservations`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Parking Spots: ${spots.length}`);
    console.log(`   Reservations: ${reservations.length}`);
    console.log('\n🔑 Test Credentials:');
    console.log('   User Email: john@example.com');
    console.log('   User Password: password123');
    console.log('   Admin Email: admin@example.com');
    console.log('   Admin Password: admin123');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

connectDB().then(() => seedDatabase());
