//File: backend/src/routes/programRoutes.js
const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getAllPrograms,
  getProgramByIdController,
  createProgramController,
  updateProgramController,
  deleteProgramController
} = require('../controllers/programController');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Middleware para proteger todas las rutas
router.use(authMiddleware);
router.use(checkRole(['Superadministrador', 'Administrador']));

// Validaciones reutilizables
const validateProgram = [
  body('nombre')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nombre debe tener entre 1 y 255 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descripción no puede exceder 1000 caracteres'),
  body('id_portafolio')
    .isInt({ min: 1 })
    .withMessage('ID de portafolio debe ser un número válido'),
  body('id_administrador')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de administrador debe ser un número válido'),
  handleValidationErrors
];

const validateProgramUpdate = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nombre debe tener entre 1 y 255 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descripción no puede exceder 1000 caracteres'),
  body('id_portafolio')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de portafolio debe ser un número válido'),
  body('id_administrador')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de administrador debe ser un número válido'),
  handleValidationErrors
];

// Rutas
router.get('/',
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número mayor a 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe ser entre 1 y 100'),
  query('search').optional().trim().isLength({ max: 255 }).withMessage('Búsqueda muy larga'),
  query('portafolio').optional().isInt({ min: 1 }).withMessage('Portafolio debe ser un número válido'),
  query('administrador').optional().isInt({ min: 1 }).withMessage('Administrador debe ser un número válido'),
  query('sortBy').optional().isIn(['fecha_creacion', 'nombre']).withMessage('Campo de ordenamiento inválido'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC'),
  handleValidationErrors,
  getAllPrograms
);

router.get('/:id',
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número válido'),
  handleValidationErrors,
  getProgramByIdController
);

router.post('/',
  validateProgram,
  createProgramController
);

router.put('/:id',
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número válido'),
  validateProgramUpdate,
  updateProgramController
);

router.delete('/:id',
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número válido'),
  handleValidationErrors,
  deleteProgramController
);

module.exports = router;