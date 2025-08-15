// File: backend/src/routes/superadminMetricsRoutes.js
const express = require('express');
const {
  getGeneralSummary,
  getProjectsStatusDistribution,
  getProjectsRiskDistribution,
  getProjectsByPortfolio,
  getTasksStatusDistribution,
  getTasksPriorityDistribution,
  getProjectsWithPendingTasks,
  getPendingDocuments,
  getScheduledMeetings,
  getKPIsByPeriod
} = require('../controllers/superadminMetricsController');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Todas las rutas requieren autenticación y rol de Superadministrador
router.use(authMiddleware);
router.use(checkRole(['Superadministrador']));

// Resumen general global
router.get('/summary', getGeneralSummary);

// Distribución de estados de proyectos (global)
router.get('/projects-status', getProjectsStatusDistribution);

// Distribución de riesgo de proyectos (global)
router.get('/projects-risk', getProjectsRiskDistribution);

// Proyectos por portafolio (global)
router.get('/projects-by-portfolio', getProjectsByPortfolio);

// Distribución de estados de tareas (global)
router.get('/tasks-status', getTasksStatusDistribution);

// Distribución de prioridad de tareas (global)
router.get('/tasks-priority', getTasksPriorityDistribution);

// Proyectos con tareas pendientes (global)
router.get('/projects-pending-tasks', getProjectsWithPendingTasks);

// Documentos pendientes de firma (global)
router.get('/pending-documents', getPendingDocuments);

// Reuniones agendadas (global)
router.get('/scheduled-meetings', getScheduledMeetings);

// KPIs por período (global)
router.get('/kpis', getKPIsByPeriod);

module.exports = router;