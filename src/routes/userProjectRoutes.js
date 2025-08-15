// File: backend/src/routes/userProjectRoutes.js
const express = require('express');
const { getMyProjects } = require('../controllers/userProjectController');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Ruta para obtener proyectos del usuario autenticado
router.get('/', 
  authMiddleware,
  checkRole(['Administrador', 'Colaborador', 'Cliente']),
  getMyProjects
);

module.exports = router;