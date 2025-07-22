// File: backend/src/middlewares/roleMiddleware.js
const { AppError } = require('../utils/errorHandler');

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Usuario no autenticado', 401));
      }

      const userRole = req.user.rol;

      // Convertir a array si es string
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!rolesArray.includes(userRole)) {
        return next(new AppError('Permisos insuficientes', 403));
      }

      next();
    } catch (error) {
      return next(new AppError('Error de autorización', 403));
    }
  };
};

module.exports = { checkRole };