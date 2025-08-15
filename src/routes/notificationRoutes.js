//File: backend/src/routes/notificationRoutes.js
const express = require('express');
const {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authMiddleware);

// Obtener todas las notificaciones del usuario autenticado
router.get('/', 
  checkRole(['Superadministrador', 'Administrador', 'Colaborador', 'Cliente']), 
  getNotifications
);

// Obtener solo notificaciones no leídas
router.get('/unread', 
  checkRole(['Superadministrador', 'Administrador', 'Colaborador', 'Cliente']), 
  getUnreadNotifications
);

// Obtener conteo de notificaciones no leídas
router.get('/unread/count', 
  checkRole(['Superadministrador', 'Administrador', 'Colaborador', 'Cliente']), 
  getUnreadCount
);

// Marcar una notificación específica como leída
router.put('/:id/read', 
  checkRole(['Superadministrador', 'Administrador', 'Colaborador', 'Cliente']), 
  markAsRead
);

// Marcar todas las notificaciones como leídas
router.put('/read-all', 
  checkRole(['Superadministrador', 'Administrador', 'Colaborador', 'Cliente']), 
  markAllAsRead
);

module.exports = router;