// File: backend/src/services/dashboardService.js
const dashboardModel = require('../models/dashboardModel');

class DashboardService {
  // Procesar datos para gráficos con formato específico
  static formatChartData(data, labelKey, valueKey) {
    return data.map(item => ({
      label: item[labelKey],
      value: item[valueKey]
    }));
  }

  // Calcular porcentajes para gráficos de pastel
  static calculatePercentages(data, valueKey = 'cantidad') {
    const total = data.reduce((sum, item) => sum + item[valueKey], 0);
    return data.map(item => ({
      ...item,
      percentage: total > 0 ? ((item[valueKey] / total) * 100).toFixed(1) : 0
    }));
  }

  // Obtener dashboard completo optimizado
  static async getCompleteDashboard(userId) {
    try {
      const [
        summary,
        projectsStatus,
        projectsRisk,
        projectsByPortfolio,
        tasksStatus,
        tasksPriority,
        pendingProjects,
        pendingDocuments,
        todayMeetings
      ] = await Promise.all([
        dashboardModel.getGeneralSummary(userId),
        dashboardModel.getProjectsStatusDistribution(userId),
        dashboardModel.getProjectsRiskDistribution(userId),
        dashboardModel.getProjectsByPortfolio(userId),
        dashboardModel.getTasksStatusDistribution(userId),
        dashboardModel.getTasksPriorityDistribution(userId),
        dashboardModel.getProjectsWithPendingTasks(userId),
        dashboardModel.getPendingDocuments(userId),
        dashboardModel.getScheduledMeetings(userId, 'today')
      ]);

      return {
        summary,
        charts: {
          projectsStatus: this.calculatePercentages(projectsStatus),
          projectsRisk: this.calculatePercentages(projectsRisk),
          projectsByPortfolio: this.formatChartData(projectsByPortfolio, 'portafolio', 'cantidad_proyectos'),
          tasksStatus: this.calculatePercentages(tasksStatus),
          tasksPriority: this.calculatePercentages(tasksPriority)
        },
        alerts: {
          pendingProjects: pendingProjects.slice(0, 5), // Top 5
          pendingDocuments: pendingDocuments.length,
          todayMeetings: todayMeetings.length
        },
        upcomingMeetings: todayMeetings.slice(0, 3) // Próximas 3 reuniones
      };
    } catch (error) {
      throw new Error(`Error al obtener dashboard completo: ${error.message}`);
    }
  }

  // Generar alerta de riesgo basada en métricas
  static generateRiskAlerts(projectsWithPendingTasks) {
    return projectsWithPendingTasks.map(project => {
      let riskLevel = 'low';
      let message = '';

      if (project.tareas_riesgo_alto > 0 && project.tareas_pendientes > 5) {
        riskLevel = 'high';
        message = `Proyecto con ${project.tareas_riesgo_alto} tareas de alto riesgo y ${project.tareas_pendientes} pendientes`;
      } else if (project.tareas_pendientes > 10) {
        riskLevel = 'medium';
        message = `Proyecto con alta carga de trabajo: ${project.tareas_pendientes} tareas pendientes`;
      } else if (project.tareas_riesgo_alto > 0) {
        riskLevel = 'medium';
        message = `Proyecto con ${project.tareas_riesgo_alto} tareas de alto riesgo`;
      }

      return {
        projectId: project.id,
        projectName: project.proyecto,
        riskLevel,
        message,
        pendingTasks: project.tareas_pendientes,
        highRiskTasks: project.tareas_riesgo_alto
      };
    }).filter(alert => alert.riskLevel !== 'low');
  }
}

module.exports = DashboardService;