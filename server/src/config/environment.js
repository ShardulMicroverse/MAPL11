const path = require('path');
const envPath = path.join(__dirname, '../../.env');
const result = require('dotenv').config({ path: envPath });

// Debug: Check if .env was loaded
console.log('ENV file path:', envPath);
console.log('ENV load result:', result.error ? result.error.message : 'Loaded successfully');
console.log('MONGODB_URI from env:', process.env.MONGODB_URI ? 'SET (starts with ' + process.env.MONGODB_URI.substring(0, 20) + '...)' : 'NOT SET');

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cricket-fantasy',
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cricketApi: {
    key: process.env.CRICKET_API_KEY,
    baseUrl: process.env.CRICKET_API_BASE_URL || 'https://api.cricketdata.org/v1'
  }
};
