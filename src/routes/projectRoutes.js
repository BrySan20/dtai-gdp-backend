// File: backend/src/routes/projectRoutes.js
const express = require('express');
const { body, param, query } = require('express-validator');
const {
    getAllProjects,
    getProjectByIdController,
    createProjectController,
    updateProjectController,
    deleteProjectController,
    assignUserToProjectController,
    removeUserFromProjectController,
    getProjectUsersController
} = require('../controllers/projectController');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Middleware para proteger todas las rutas
router.use(authMiddleware);
router.use(checkRole(['Superadministrador', 'Administrador']));

// Validaciones reutilizables
const validateProject = [
    body('nombre')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Nombre debe tener entre 1 y 255 caracteres'),
    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Descripción no puede exceder 1000 caracteres'),
    body('estatus')
        .optional()
        .isIn(['Activo', 'Finalizado', 'Cancelado'])
        .withMessage('Estatus debe ser Activo, Finalizado o Cancelado'),
    body('nivel_riesgo')
        .optional()
        .isIn(['Nulo', 'Bajo', 'Medio', 'Alto'])
        .withMessage('Nivel de riesgo debe ser Nulo, Bajo, Medio o Alto'),
    body('id_programa')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de programa debe ser un número válido'),
    body('id_administrador')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de administrador debe ser un número válido'),
    handleValidationErrors
];

const validateProjectUpdate = [
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
    body('estatus')
        .optional()
        .isIn(['Activo', 'Finalizado', 'Cancelado'])
        .withMessage('Estatus debe ser Activo, Finalizado o Cancelado'),
    body('nivel_riesgo')
        .optional()
        .isIn(['Nulo', 'Bajo', 'Medio', 'Alto'])
        .withMessage('Nivel de riesgo debe ser Nulo, Bajo, Medio o Alto'),
    body('id_programa')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de programa debe ser un número válido'),
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
    query('programa').optional().isInt({ min: 1 }).withMessage('Programa debe ser un número válido'),
    query('administrador').optional().isInt({ min: 1 }).withMessage('Administrador debe ser un número válido'),
    query('estatus').optional().isIn(['Activo', 'Finalizado', 'Cancelado']).withMessage('Estatus inválido'),
    query('nivel_riesgo').optional().isIn(['Nulo', 'Bajo', 'Medio', 'Alto']).withMessage('Nivel de riesgo inválido'),
    query('sortBy').optional().isIn(['fecha_creacion', 'nombre', 'estatus', 'nivel_riesgo']).withMessage('Campo de ordenamiento inválido'),
    query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC'),
    handleValidationErrors,
    getAllProjects
);

router.get('/:id',
    param('id').isInt({ min: 1 }).withMessage('ID debe ser un número válido'),
    handleValidationErrors,
    getProjectByIdController
);

router.post('/',
    validateProject,
    createProjectController
);

router.put('/:id',
    param('id').isInt({ min: 1 }).withMessage('ID debe ser un número válido'),
    validateProjectUpdate,
    updateProjectController
);

router.delete('/:id',
    param('id').isInt({ min: 1 }).withMessage('ID debe ser un número válido'),
    handleValidationErrors,
    deleteProjectController
);

// Rutas para asignación de usuarios a proyectos ===============================================================

// Validaciones para asignación de usuarios
const validateUserAssignment = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('ID de usuario debe ser un número válido'),
  body('roleId')
    .isInt({ min: 1 })
    .withMessage('ID de rol debe ser un número válido')
    .custom((value) => {
      // Solo permitir roles de Colaborador (3) y Cliente (4)
      if (value !== 3 && value !== 4) {
        throw new Error('Solo se pueden asignar roles de Colaborador o Cliente');
      }
      return true;
    }),
  handleValidationErrors
];

// Rutas para gestión de usuarios en proyectos
router.get('/:projectId/members',
  param('projectId').isInt({ min: 1 }).withMessage('ID de proyecto debe ser un número válido'),
  handleValidationErrors,
  getProjectUsersController
);

router.post('/:projectId/members',
  param('projectId').isInt({ min: 1 }).withMessage('ID de proyecto debe ser un número válido'),
  validateUserAssignment,
  assignUserToProjectController
);

router.delete('/:projectId/members/:userId',
  param('projectId').isInt({ min: 1 }).withMessage('ID de proyecto debe ser un número válido'),
  param('userId').isInt({ min: 1 }).withMessage('ID de usuario debe ser un número válido'),
  handleValidationErrors,
  removeUserFromProjectController
);

// Rutas de tareas =======================================================================================

const {
  getProjectTasksController,
  createTaskController,
  updateTaskController,
  deleteTaskController
} = require('../controllers/taskController');

// Obtener tareas de un proyecto
router.get('/:projectId/tasks',
  param('projectId').isInt({ min: 1 }).withMessage('ID de proyecto inválido'),
  handleValidationErrors,
  getProjectTasksController
);

// Crear tarea en un proyecto
router.post('/:projectId/tasks',
  param('projectId').isInt({ min: 1 }).withMessage('ID de proyecto inválido'),
  body('nombre').isLength({ min: 1, max: 255 }).withMessage('Nombre requerido y máximo 255 caracteres'),
  body('descripcion').optional().isLength({ max: 1000 }),
  body('prioridad').isIn(['Baja', 'Media', 'Alta']).withMessage('Prioridad inválida'),
  body('estatus').isIn(['Pendiente', 'En Proceso', 'Completada']),
  body('nivelRiesgo').isIn(['Nulo', 'Bajo', 'Medio', 'Alto']),
  body('faseCicloVida').isIn(['Inicio', 'Planeacion', 'Ejecucion', 'Monitoreo y Control', 'Cierre']),
  body('fechaInicio').isISO8601().toDate(),
  body('fechaVencimiento').isISO8601().toDate(),
  body('usuarioAsignado').isInt({ min: 1 }).withMessage('ID de usuario asignado inválido'),
  handleValidationErrors,
  createTaskController
);

// Actualizar tarea
router.put('/:projectId/tasks/:taskId',
  param('projectId').isInt({ min: 1 }).withMessage('ID de proyecto inválido'),
  param('taskId').isInt({ min: 1 }).withMessage('ID de tarea inválido'),
  body('nombre').optional().isLength({ min: 1, max: 255 }),
  body('descripcion').optional().isLength({ max: 1000 }),
  body('prioridad').optional().isIn(['Baja', 'Media', 'Alta']),
  body('estatus').optional().isIn(['Pendiente', 'En Proceso', 'Completada']),
  body('nivelRiesgo').optional().isIn(['Nulo', 'Bajo', 'Medio', 'Alto']),
  body('faseCicloVida').optional().isIn(['Inicio', 'Planeacion', 'Ejecucion', 'Monitoreo y Control', 'Cierre']),
  body('fechaInicio').optional().isISO8601(),
  body('fechaVencimiento').optional().isISO8601(),
  body('usuarioAsignado').optional().isInt({ min: 1 }),
  handleValidationErrors,
  updateTaskController
);

// Eliminar tarea
router.delete('/:projectId/tasks/:taskId',
  param('projectId').isInt({ min: 1 }).withMessage('ID de proyecto inválido'),
  param('taskId').isInt({ min: 1 }).withMessage('ID de tarea inválido'),
  handleValidationErrors,
  deleteTaskController
);



module.exports = router;