// File: backend/src/controllers/dashboardController.js
const dashboardModel = require('../models/dashboardModel');
const { AppError } = require('../utils/errorHandler');

const getGeneralSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const summary = await dashboardModel.getGeneralSummary(userId);
    
    res.status(200).json({
      success: true,
      message: 'Resumen general obtenido exitosamente',
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

const getProjectsStatusDistribution = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const distribution = await dashboardModel.getProjectsStatusDistribution(userId);
    
    res.status(200).json({
      success: true,
      message: 'Distribución de estados obtenida exitosamente',
      data: distribution
    });
  } catch (error) {
    next(error);
  }
};

const getProjectsRiskDistribution = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const distribution = await dashboardModel.getProjectsRiskDistribution(userId);
    
    res.status(200).json({
      success: true,
      message: 'Distribución de riesgos obtenida exitosamente',
      data: distribution
    });
  } catch (error) {
    next(error);
  }
};

const getProjectsByPortfolio = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const projects = await dashboardModel.getProjectsByPortfolio(userId);
    
    res.status(200).json({
      success: true,
      message: 'Proyectos por portafolio obtenidos exitosamente',
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

const getTasksStatusDistribution = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.query;
    const distribution = await dashboardModel.getTasksStatusDistribution(userId, projectId);
    
    res.status(200).json({
      success: true,
      message: 'Distribución de estados de tareas obtenida exitosamente',
      data: distribution
    });
  } catch (error) {
    next(error);
  }
};

const getTasksPriorityDistribution = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const distribution = await dashboardModel.getTasksPriorityDistribution(userId);
    
    res.status(200).json({
      success: true,
      message: 'Distribución de prioridades obtenida exitosamente',
      data: distribution
    });
  } catch (error) {
    next(error);
  }
};

const getProjectsWithPendingTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const projects = await dashboardModel.getProjectsWithPendingTasks(userId);
    
    res.status(200).json({
      success: true,
      message: 'Proyectos con tareas pendientes obtenidos exitosamente',
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

const getPendingDocuments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documents = await dashboardModel.getPendingDocuments(userId);
    
    res.status(200).json({
      success: true,
      message: 'Documentos pendientes obtenidos exitosamente',
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

const getScheduledMeetings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = 'today' } = req.query;
    const meetings = await dashboardModel.getScheduledMeetings(userId, period);
    
    res.status(200).json({
      success: true,
      message: 'Reuniones agendadas obtenidas exitosamente',
      data: meetings
    });
  } catch (error) {
    next(error);
  }
};

const getKPIsByPeriod = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;
    const kpis = await dashboardModel.getKPIsByPeriod(userId, parseInt(days));
    
    res.status(200).json({
      success: true,
      message: 'KPIs obtenidos exitosamente',
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