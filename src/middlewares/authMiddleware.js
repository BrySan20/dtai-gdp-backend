// File: backend/src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { AppError } = require('../utils/errorHandler');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Token no proporcionado', 401));
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwt.secret);

    // Agregar datos del usuario al objeto request
    req.user = {
      id: decoded.id,
      nombre: decoded.nombre,
      apellido: decoded.apellido,
      email: decoded.email,
      rol: decoded.rol
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expirado', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token inválido', 401));
    }
    return next(new AppError('Error de autenticación', 401));
  }
};

module.exports = authMiddleware;