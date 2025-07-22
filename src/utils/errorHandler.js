// File: backend/src/utils/errorHandler.js

// Clase personalizada para errores de la aplicación
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Manejo de errores de MySQL
const handleMySQLError = (error) => {
  let message = 'Error en la base de datos';
  let statusCode = 500;

  switch (error.code) {
    case 'ER_DUP_ENTRY':
      message = 'El registro ya existe';
      statusCode = 409;
      break;
    case 'ER_NO_REFERENCED_ROW_2':
      message = 'Referencia no válida';
      statusCode = 400;
      break;
    case 'ER_ROW_IS_REFERENCED_2':
      message = 'No se puede eliminar porque está siendo referenciado';
      statusCode = 409;
      break;
    case 'ER_BAD_NULL_ERROR':
      message = 'Campo requerido faltante';
      statusCode = 400;
      break;
    case 'ER_DATA_TOO_LONG':
      message = 'Datos demasiado largos para el campo';
      statusCode = 400;
      break;
    case 'ER_PARSE_ERROR':
      message = 'Error en la consulta SQL';
      statusCode = 500;
      break;
    default:
      message = 'Error interno del servidor';
      statusCode = 500;
  }

  return new AppError(message, statusCode);
};

// Manejo de errores de JWT
const handleJWTError = () => new AppError('Token inválido. Por favor, inicia sesión nuevamente.', 401);

const handleJWTExpiredError = () => new AppError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 401);

// Enviar error en desarrollo
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Enviar error en producción
const sendErrorProd = (err, res) => {
  // Error operacional: enviar mensaje al cliente
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } else {
    // Error de programación: no filtrar detalles al cliente
    console.error('❌ ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Algo salió mal!'
    });
  }
};

// Middleware principal de manejo de errores
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Manejo de errores específicos de MySQL
    if (err.code && err.code.startsWith('ER_')) {
      error = handleMySQLError(error);
    }

    // Manejo de errores de JWT
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    // Manejo de errores de validación
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message).join('. ');
      error = new AppError(message, 400);
    }

    // Manejo de errores de casting
    if (err.name === 'CastError') {
      const message = `Recurso no encontrado. ID inválido: ${err.value}`;
      error = new AppError(message, 400);
    }

    sendErrorProd(error, res);
  }
};

// Manejo de promesas rechazadas no capturadas
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  // Cerrar el servidor gracefully
  process.exit(1);
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = {
  AppError,
  errorHandler
};