// File: backend/src/models/superadminMetricsModel.js
const { executeQuery } = require('../config/database');

// Resumen general global
const getGeneralSummary = async () => {
  const queries = {
    portfolios: `SELECT COUNT(*) as total FROM Portafolios`,
    programs: `SELECT COUNT(*) as total FROM Programas`,
    projects: `SELECT COUNT(*) as total FROM Proyectos`,
    tasks: `SELECT COUNT(*) as total FROM Tareas`,
    collaborators: `SELECT COUNT(DISTINCT id_usuario) as total FROM Proyecto_Usuarios`
  };

  const [portfolios, programs, projects, tasks, collaborators] = await Promise.all([
    executeQuery(queries.portfolios),
    executeQuery(queries.programs),
    executeQuery(queries.projects),
    executeQuery(queries.tasks),
    executeQuery(queries.collaborators)
  ]);

  return {
    portfolios: portfolios[0].total,
    programs: programs[0].total,
    projects: projects[0].total,
    tasks: tasks[0].total,
    collaborators: collaborators[0].total
  };
};

// Distribución de estados de proyectos (global)
const getProjectsStatusDistribution = async () => {
  const query = `
    SELECT estatus, COUNT(*) as cantidad
    FROM Proyectos
    GROUP BY estatus
  `;
  return await executeQuery(query);
};

// Distribución de riesgo de proyectos (global)
const getProjectsRiskDistribution = async () => {
  const query = `
    SELECT nivel_riesgo, COUNT(*) as cantidad
    FROM Proyectos
    GROUP BY nivel_riesgo
  `;
  return await executeQuery(query);
};

// Proyectos por portafolio (global)
const getProjectsByPortfolio = async () => {
  const query = `
    SELECT 
      port.nombre as portafolio,
      COUNT(p.id) as cantidad_proyectos
    FROM Portafolios port
    LEFT JOIN Programas prog ON port.id = prog.id_portafolio
    LEFT JOIN Proyectos p ON prog.id = p.id_programa
    GROUP BY port.id, port.nombre
    ORDER BY cantidad_proyectos DESC
  `;
  return await executeQuery(query);
};

// Distribución de estados de tareas (global)
const getTasksStatusDistribution = async () => {
  const query = `
    SELECT estatus, COUNT(*) as cantidad
    FROM Tareas
    GROUP BY estatus
  `;
  return await executeQuery(query);
};

// Distribución de prioridad de tareas (global)
const getTasksPriorityDistribution = async () => {
  const query = `
    SELECT nivel_prioridad, COUNT(*) as cantidad
    FROM Tareas
    GROUP BY nivel_prioridad
  `;
  return await executeQuery(query);
};

// Proyectos con tareas pendientes (global)
const getProjectsWithPendingTasks = async () => {
  const query = `
    SELECT 
      p.id,
      p.nombre as proyecto,
      COUNT(CASE WHEN t.estatus = 'Pendiente' THEN 1 END) as tareas_pendientes,
      COUNT(CASE WHEN t.nivel_riesgo = 'Alto' THEN 1 END) as tareas_riesgo_alto,
      p.nivel_riesgo as riesgo_proyecto
    FROM Proyectos p
    LEFT JOIN Tareas t ON p.id = t.id_proyecto
    GROUP BY p.id, p.nombre, p.nivel_riesgo
    HAVING tareas_pendientes > 0 OR tareas_riesgo_alto > 0
    ORDER BY tareas_pendientes DESC, tareas_riesgo_alto DESC
    LIMIT 10
  `;
  return await executeQuery(query);
};

// Documentos pendientes de firma (global)
const getPendingDocuments = async () => {
  const query = `
    SELECT 
      d.id,
      d.nombre_documento,
      p.nombre as proyecto,
      dv.numero_version,
      dv.fecha_subida,
      COUNT(fd.id) as total_firmantes,
      COUNT(CASE WHEN fd.firmado = true THEN 1 END) as firmados
    FROM Documentos d
    JOIN Proyectos p ON d.id_proyecto = p.id
    JOIN Documento_Versiones dv ON d.id = dv.id_documento
    JOIN Firmantes_Documento fd ON dv.id = fd.id_documento_version
    WHERE dv.estatus = 'Pendiente'
    GROUP BY d.id, dv.id
    ORDER BY dv.fecha_subida DESC
  `;
  return await executeQuery(query);
};

// Reuniones agendadas (global)
const getScheduledMeetings = async (period) => {
  let dateCondition = '';
  if (period === 'today') {
    dateCondition = 'AND DATE(r.fecha_hora_inicio) = CURDATE()';
  } else if (period === 'week') {
    dateCondition = 'AND r.fecha_hora_inicio BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)';
  }

  const query = `
    SELECT 
      r.id,
      r.titulo,
      r.fecha_hora_inicio,
      r.fecha_hora_fin,
      r.modo,
      r.ubicacion,
      p.nombre as proyecto,
      tr.nombre_tipo as tipo_reunion,
      COUNT(rp.id_usuario) as total_participantes
    FROM Reuniones r
    LEFT JOIN Proyectos p ON r.id_proyecto = p.id
    LEFT JOIN Tipos_Reunion tr ON r.id_tipo_reunion = tr.id
    LEFT JOIN Reunion_Participantes rp ON r.id = rp.id_reunion
    WHERE r.estatus = 'Agendada'
      ${dateCondition}
    GROUP BY r.id
    ORDER BY r.fecha_hora_inicio ASC
  `;
  return await executeQuery(query);
};

// KPIs por período (global)
const getKPIsByPeriod = async (days) => {
  const queries = {
    newProjects: `
      SELECT COUNT(*) as total
      FROM Proyectos
      WHERE fecha_creacion >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `,
    completedTasks: `
      SELECT COUNT(*) as total
      FROM Tareas
      WHERE estatus = 'Completada'
        AND DATE(fecha_creacion) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `,
    signedDocuments: `
      SELECT COUNT(*) as total
      FROM Documento_Versiones dv
      WHERE dv.estatus = 'Firmado'
        AND dv.fecha_subida >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `
  };

  const [newProjects, completedTasks, signedDocuments] = await Promise.all([
    executeQuery(queries.newProjects, [days]),
    executeQuery(queries.completedTasks, [days]),
    executeQuery(queries.signedDocuments, [days])
  ]);

  return {
    period: `${days} días`,
    newProjects: newProjects[0].total,
    completedTasks: completedTasks[0].total,
    signedDocuments: signedDocuments[0].total
  };
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