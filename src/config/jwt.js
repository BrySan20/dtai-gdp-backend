// File: backend/src/config/jwt.js
const config = require('./config');

const jwtConfig = {
  secret: config.jwt.secret,
  expiresIn: config.jwt.expiresIn,
  refreshSecret: config.jwt.refreshSecret,
  refreshExpiresIn: config.jwt.refreshExpiresIn,
  
  // Opciones adicionales para JWT
  options: {
    issuer: config.app.name,
    audience: 'sgp-users',
    algorithm: 'HS256'
  }
};

module.exports = jwtConfig;