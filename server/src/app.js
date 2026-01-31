const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/environment');
const errorHandler = require('./middleware/errorHandler');
const { limiter } = require('./middleware/rateLimiter');
const routes = require('./routes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));

// Rate limiting
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
