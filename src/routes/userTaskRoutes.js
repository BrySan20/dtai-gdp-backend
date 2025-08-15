// File: backend/src/routes/userTaskRoutes.js
const express = require('express');
const { param, body } = require('express-validator');
const {
    getProjectTasksForUser,
    changeUserTaskStatus
} = require('../controllers/userTaskController');
const authMiddleware = require('../middlewares/authMiddleware');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');

const router = express.Router();

// Todas requieren autenticación
router.use(authMiddleware);

// Obtener todas las tareas de un proyecto
router.get('/project/:projectId',
    param('projectId').isInt({ min: 1 }).withMessage('ID de proyecto inválido'),
    handleValidationErrors,
    getProjectTasksForUser
);

// Cambiar estatus de una tarea (solo si es del usuario logueado)
router.patch('/:taskId/status',
    param('taskId').isInt({ min: 1 }).withMessage('ID de tarea inválido'),
    body('estatus').isIn(['Pendiente', 'En Proceso', 'Completada']).withMessage('Estatus inválido'),
    handleValidationErrors,
    changeUserTaskStatus
);

module.exports = router;