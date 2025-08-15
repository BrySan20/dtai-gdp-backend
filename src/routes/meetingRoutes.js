// File: backend/src/routes/meetingRoutes.js
const express = require('express');
const {
    createMeeting,
    getMyMeetings,
    getProjectMeetings,
    getMeetingById,
    updateMeeting,
    deleteMeeting,
    getProjectUsers,
    getMeetingTypes,
    confirmAttendance
} = require('../controllers/meetingController');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Obtener tipos de reunión
router.get('/types', authMiddleware, getMeetingTypes);

// Obtener reuniones del usuario autenticado
router.get('/my-meetings', 
    authMiddleware,
    checkRole(['Superadministrador','Administrador', 'Colaborador', 'Cliente']),
    getMyMeetings
);

// Obtener usuarios de un proyecto específico
router.get('/project/:projectId/users',
    authMiddleware,
    checkRole(['Superadministrador','Administrador', 'Colaborador', 'Cliente']),
    getProjectUsers
);

// Obtener reuniones de un proyecto específico
router.get('/project/:projectId',
    authMiddleware,
    checkRole(['Superadministrador','Administrador', 'Colaborador', 'Cliente']),
    getProjectMeetings
);

// Crear nueva reunión (solo administradores)
router.post('/',
    authMiddleware,
    checkRole(['Superadministrador','Administrador']),
    createMeeting
);

// Obtener reunión específica por ID
router.get('/:id',
    authMiddleware,
    checkRole(['Superadministrador','Administrador', 'Colaborador', 'Cliente']),
    getMeetingById
);

// Actualizar reunión (solo administradores)
router.put('/:id',
    authMiddleware,
    checkRole(['Superadministrador','Administrador']),
    updateMeeting
);

// Eliminar reunión (solo administradores)
router.delete('/:id',
    authMiddleware,
    checkRole(['Superadministrador','Administrador']),
    deleteMeeting
);

// Confirmar asistencia a reunión
router.patch('/:id/confirm-attendance',
    authMiddleware,
    checkRole(['Superadministrador','Administrador', 'Colaborador', 'Cliente']),
    confirmAttendance
);

module.exports = router;