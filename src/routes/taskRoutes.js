// File: backend/src/routes/taskRoutes.js
const express = require('express');
const { body, param } = require('express-validator');
const {
    updateTaskStatusController
} = require('../controllers/taskController');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Rutas protegidas para Administrador y Colaborador del proyecto
router.use(authMiddleware);
router.use(checkRole(['Administrador', 'Colaborador']));

// Actualizar solo el estatus (drag-and-drop)
router.put('/:taskId/status',
    param('taskId').isInt({ min: 1 }).withMessage('ID de tarea inválido'),
    body('estatus').isIn(['Pendiente', 'En Proceso', 'Completada']),
    handleValidationErrors,
    updateTaskStatusController
);

module.exports = router;
