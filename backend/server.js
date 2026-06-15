const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api/bookings', bookingRoutes);

// Root health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Anti-Gravity Booking System API is healthy and operational 🪐',
    timestamp: new Date()
  });
});

// Database connection & Server starting logic
const startServer = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookingsystem';
  console.log('Connecting to database...');
  
  try {
    // Attempt Mongoose connection
    await mongoose.connect(mongoUri);
    console.log('Successfully connected to MongoDB Database! 📁');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
      console.log(`API base URL: http://localhost:${PORT}/api/bookings`);
    });
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.log('Server is starting in mock database mode for offline testing...');
    
    // In-memory or fallback mode message
    app.listen(PORT, () => {
      console.log(`Server is running in OFFLINE MOCK MODE on port ${PORT}.`);
      console.log('Note: Database endpoints will return fallback errors unless MongoDB is started.');
    });
  }
};

startServer();
