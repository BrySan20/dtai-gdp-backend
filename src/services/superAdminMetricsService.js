// File: backend/src/services/superadminMetricsService.js
const superadminMetricsModel = require('../models/superadminMetricsModel');

class SuperadminMetricsService {
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

  // Obtener dashboard global optimizado
  static async getCompleteDashboard() {
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
        superadminMetricsModel.getGeneralSummary(),
        superadminMetricsModel.getProjectsStatusDistribution(),
        superadminMetricsModel.getProjectsRiskDistribution(),
        superadminMetricsModel.getProjectsByPortfolio(),
        superadminMetricsModel.getTasksStatusDistribution(),
        superadminMetricsModel.getTasksPriorityDistribution(),
        superadminMetricsModel.getProjectsWithPendingTasks(),
        superadminMetricsModel.getPendingDocuments(),
        superadminMetricsModel.getScheduledMeetings('today')
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
          pendingProjects: pendingProjects.slice(0, 5),
          pendingDocuments: pendingDocuments.length,
          todayMeetings: todayMeetings.length
        },
        upcomingMeetings: todayMeetings.slice(0, 3)
      };
    } catch (error) {
      throw new Error(`Error al obtener dashboard global: ${error.message}`);
    }
  }
}

module.exports = SuperadminMetricsService;