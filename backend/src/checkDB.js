require('dotenv').config();
const mongoose = require('mongoose');

const checkDatabaseStatus = async () => {
  try {
    console.log('🔍 Checking MongoDB connection...\n');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB Status: CONNECTED');
    console.log(`📍 URI: ${process.env.MONGODB_URI}`);
    console.log(`📦 Database: ${mongoose.connection.db.databaseName}\n`);

    // Get collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Collections:');
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`   • ${col.name}: ${count} documents`);
    }

    console.log('\n✅ Database is ready to use!');
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB Status: DISCONNECTED');
    console.error(`📍 URI: ${process.env.MONGODB_URI}`);
    console.error(`Error: ${err.message}\n`);
    console.error('Make sure:');
    console.error('  1. MongoDB server is running (mongod)');
    console.error('  2. MONGODB_URI in .env is correct');
    console.error('  3. Network connectivity is available');
    process.exit(1);
  }
};

checkDatabaseStatus();
