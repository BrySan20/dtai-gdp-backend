// File: backend/src/routes/userRoutes.js
const express = require('express');
const { body, param, query } = require('express-validator');
const { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser, 
  toggleUserStatus,
  changeUserPassword,
  getRoles,
  getAvailableUsersController
} = require('../controllers/userController');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Middleware para proteger todas las rutas (solo Superadministrador)
router.use(authMiddleware);
router.use(checkRole(['Superadministrador', 'Administrador']));

// Validaciones reutilizables
const validateUser = [
  body('nombre')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nombre debe tener entre 1 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombre solo puede contener letras y espacios'),
  body('apellido')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Apellido debe tener entre 1 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Apellido solo puede contener letras y espacios'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido'),
  body('telefono')
    .optional()
    .isMobilePhone('es-MX')
    .withMessage('Teléfono debe ser un número válido'),
  body('id_rol')
    .isInt({ min: 1 })
    .withMessage('Rol debe ser un número válido'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nombre debe tener entre 1 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombre solo puede contener letras y espacios'),
  body('apellido')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Apellido debe tener entre 1 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Apellido solo puede contener letras y espacios'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido'),
  body('telefono')
    .optional()
    .isMobilePhone('es-MX')
    .withMessage('Teléfono debe ser un número válido'),
  body('id_rol')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Rol debe ser un número válido'),
  handleValidationErrors
];

// Rutas
router.get('/', 
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número mayor a 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe ser entre 1 y 100'),
  query('search').optional().trim().isLength({ max: 255 }).withMessage('Búsqueda muy larga'),
  query('rol').optional().isInt({ min: 1 }).withMessage('Rol debe ser un número válido'),
  query('activo').optional().isBoolean().withMessage('Activo debe ser true o false'),
  handleValidationErrors,
  getAllUsers
);

router.get('/roles', getRoles);

// Ruta para obtener usuarios disponibles para asignar a proyectos
router.get('/available',
  getAvailableUsersController
);

router.get('/:id', 
  param('id').isInt({ min: 1 }).withMessage('ID de usuario para consulta debe ser un número válido'),
  handleValidationErrors,
  getUserById
);

router.post('/', 
  validateUser,
  createUser
);

router.put('/:id', 
  param('id').isInt({ min: 1 }).withMessage('ID de usuario para actualizar debe ser un número válido'),
  validateUserUpdate,
  updateUser
);

router.delete('/:id', 
  param('id').isInt({ min: 1 }).withMessage('ID de usuario para eliminar debe ser un número válido'),
  handleValidationErrors,
  deleteUser
);

router.patch('/:id/status', 
  param('id').isInt({ min: 1 }).withMessage('ID de usuario para cambiar estado debe ser un número válido'),
  body('activo').isBoolean().withMessage('Activo debe ser true o false'),
  handleValidationErrors,
  toggleUserStatus
);

router.patch('/:id/password', 
  param('id').isInt({ min: 1 }).withMessage('ID de usuario para cambiar contraseña debe ser un número válido'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password debe contener al menos una mayúscula, una minúscula y un número'),
  handleValidationErrors,
  changeUserPassword
);

module.exports = router;