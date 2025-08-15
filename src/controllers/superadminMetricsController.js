// File: backend/src/controllers/superadminMetricsController.js
const superadminMetricsModel = require('../models/superadminMetricsModel');

const getGeneralSummary = async (req, res, next) => {
  try {
    const summary = await superadminMetricsModel.getGeneralSummary();
    res.status(200).json({
      success: true,
      message: 'Resumen general global obtenido exitosamente',
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

const getProjectsStatusDistribution = async (req, res, next) => {
  try {
    const distribution = await superadminMetricsModel.getProjectsStatusDistribution();
    res.status(200).json({
      success: true,
      message: 'Distribución global de estados de proyectos obtenida exitosamente',
      data: distribution
    });
  } catch (error) {
    next(error);
  }
};

const getProjectsRiskDistribution = async (req, res, next) => {
  try {
    const distribution = await superadminMetricsModel.getProjectsRiskDistribution();
    res.status(200).json({
      success: true,
      message: 'Distribución global de riesgos de proyectos obtenida exitosamente',
      data: distribution
    });
  } catch (error) {
    next(error);
  }
};

const getProjectsByPortfolio = async (req, res, next) => {
  try {
    const projects = await superadminMetricsModel.getProjectsByPortfolio();
    res.status(200).json({
      success: true,
      message: 'Proyectos por portafolio globales obtenidos exitosamente',
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

const getTasksStatusDistribution = async (req, res, next) => {
  try {
    const distribution = await superadminMetricsModel.getTasksStatusDistribution();
    res.status(200).json({
      success: true,
      message: 'Distribución global de estados de tareas obtenida exitosamente',
      data: distribution
    });
  } catch (error) {
    next(error);
  }
};

const getTasksPriorityDistribution = async (req, res, next) => {
  try {
    const distribution = await superadminMetricsModel.getTasksPriorityDistribution();
    res.status(200).json({
      success: true,
      message: 'Distribución global de prioridades de tareas obtenida exitosamente',
      data: distribution
    });
  } catch (error) {
    next(error);
  }
};

const getProjectsWithPendingTasks = async (req, res, next) => {
  try {
    const projects = await superadminMetricsModel.getProjectsWithPendingTasks();
    res.status(200).json({
      success: true,
      message: 'Proyectos globales con tareas pendientes obtenidos exitosamente',
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

const getPendingDocuments = async (req, res, next) => {
  try {
    const documents = await superadminMetricsModel.getPendingDocuments();
    res.status(200).json({
      success: true,
      message: 'Documentos pendientes globales obtenidos exitosamente',
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

const getScheduledMeetings = async (req, res, next) => {
  try {
    const { period = 'today' } = req.query;
    const meetings = await superadminMetricsModel.getScheduledMeetings(period);
    res.status(200).json({
      success: true,
      message: 'Reuniones agendadas globales obtenidas exitosamente',
      data: meetings
    });
  } catch (error) {
    next(error);
  }
};

const getKPIsByPeriod = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const kpis = await superadminMetricsModel.getKPIsByPeriod(parseInt(days));
    res.status(200).json({
      success: true,
      message: 'KPIs globales obtenidos exitosamente',
      data: kpis
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};