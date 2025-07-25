const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const groupRoutes = require('./routes/groupRoutes');
const eventRoutes = require('./routes/eventRoutes');
const scoreRoutes = require('./routes/scoreRoutes'); // ADD THIS

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Debug: Log all requests
app.use('*', (req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - Body:`, req.body);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/scores', scoreRoutes); // ADD THIS

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Friend Group Platform API is running!',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API routes working!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});