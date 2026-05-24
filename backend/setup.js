const mongoose = require('mongoose');
require('dotenv').config();

console.log('🚀 Setting up EduSec Labs Backend...');

// Check if required environment variables are set
if (!process.env.JWT_SECRET) {
  console.log('⚠️  JWT_SECRET not set, using default (not recommended for production)');
}

// Initialize database with sample data
const initDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edusec-labs');
    console.log('✅ Connected to MongoDB');
    
    // Run lab initialization
    require('./scripts/initLabs');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

initDatabase();
