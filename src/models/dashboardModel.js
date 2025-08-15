// File: backend/src/models/dashboardModel.js
const { executeQuery } = require('../config/database');

// Resumen general del administrador
const getGeneralSummary = async (userId) => {
  const queries = {
    portfolios: `
      SELECT COUNT(*) as total 
      FROM Portafolios 
      WHERE id_administrador = ?
    `,
    programs: `
      SELECT COUNT(*) as total 
      FROM Programas prog
      JOIN Portafolios p ON prog.id_portafolio = p.id
      WHERE p.id_administrador = ?
    `,
    projects: `
      SELECT COUNT(*) as total 
      FROM Proyectos 
      WHERE id_administrador = ?
    `,
    tasks: `
      SELECT COUNT(*) as total 
      FROM Tareas t
      JOIN Proyectos p ON t.id_proyecto = p.id
      WHERE p.id_administrador = ?
    `,
    collaborators: `
      SELECT COUNT(DISTINCT pu.id_usuario) as total
      FROM Proyecto_Usuarios pu
      JOIN Proyectos p ON pu.id_proyecto = p.id
      WHERE p.id_administrador = ?
    `
  };

  const [portfolios, programs, projects, tasks, collaborators] = await Promise.all([
    executeQuery(queries.portfolios, [userId]),
    executeQuery(queries.programs, [userId]),
    executeQuery(queries.projects, [userId]),
    executeQuery(queries.tasks, [userId]),
    executeQuery(queries.collaborators, [userId])
  ]);

  return {
    portfolios: portfolios[0].total,
    programs: programs[0].total,
    projects: projects[0].total,
    tasks: tasks[0].total,
    collaborators: collaborators[0].total
  };
};

// Distribución de estados de proyectos
const getProjectsStatusDistribution = async (userId) => {
  const query = `
    SELECT estatus, COUNT(*) as cantidad
    FROM Proyectos
    WHERE id_administrador = ?
    GROUP BY estatus
  `;
  return await executeQuery(query, [userId]);
};

// Distribución de riesgo de proyectos
const getProjectsRiskDistribution = async (userId) => {
  const query = `
    SELECT nivel_riesgo, COUNT(*) as cantidad
    FROM Proyectos
    WHERE id_administrador = ?
    GROUP BY nivel_riesgo
  `;
  return await executeQuery(query, [userId]);
};

// Proyectos por portafolio
const getProjectsByPortfolio = async (userId) => {
  const query = `
    SELECT 
      port.nombre as portafolio,
      COUNT(p.id) as cantidad_proyectos
    FROM Portafolios port
    LEFT JOIN Programas prog ON port.id = prog.id_portafolio
    LEFT JOIN Proyectos p ON prog.id = p.id_programa
    WHERE port.id_administrador = ?
    GROUP BY port.id, port.nombre
    ORDER BY cantidad_proyectos DESC
  `;
  return await executeQuery(query, [userId]);
};

// Distribución de estados de tareas
const getTasksStatusDistribution = async (userId, projectId = null) => {
  let query = `
    SELECT t.estatus, COUNT(*) as cantidad
    FROM Tareas t
    JOIN Proyectos p ON t.id_proyecto = p.id
    WHERE p.id_administrador = ?
  `;
  
  const params = [userId];
  
  if (projectId) {
    query += ' AND p.id = ?';
    params.push(projectId);
  }
  
  query += ' GROUP BY t.estatus';
  
  return await executeQuery(query, params);
};

// Distribución de prioridad de tareas
const getTasksPriorityDistribution = async (userId) => {
  const query = `
    SELECT t.nivel_prioridad, COUNT(*) as cantidad
    FROM Tareas t
    JOIN Proyectos p ON t.id_proyecto = p.id
    WHERE p.id_administrador = ?
    GROUP BY t.nivel_prioridad
  `;
  return await executeQuery(query, [userId]);
};

// Proyectos con más tareas pendientes
const getProjectsWithPendingTasks = async (userId) => {
  const query = `
    SELECT 
      p.id,
      p.nombre as proyecto,
      COUNT(CASE WHEN t.estatus = 'Pendiente' THEN 1 END) as tareas_pendientes,
      COUNT(CASE WHEN t.nivel_riesgo = 'Alto' THEN 1 END) as tareas_riesgo_alto,
      p.nivel_riesgo as riesgo_proyecto
    FROM Proyectos p
    LEFT JOIN Tareas t ON p.id = t.id_proyecto
    WHERE p.id_administrador = ?
    GROUP BY p.id, p.nombre, p.nivel_riesgo
    HAVING tareas_pendientes > 0 OR tareas_riesgo_alto > 0
    ORDER BY tareas_pendientes DESC, tareas_riesgo_alto DESC
    LIMIT 10
  `;
  return await executeQuery(query, [userId]);
};

// Documentos pendientes de firma
const getPendingDocuments = async (userId) => {
  const query = `
    SELECT 
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
    WHERE p.id_administrador = ? 
      AND dv.estatus = 'Pendiente'
    GROUP BY d.id, dv.id
    ORDER BY dv.fecha_subida DESC
  `;
  return await executeQuery(query, [userId]);
};

// Reuniones agendadas
const getScheduledMeetings = async (userId, period) => {
  let dateCondition = '';
  const params = [userId];
  
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
    WHERE (r.id_creador = ? OR p.id_administrador = ?)
      AND r.estatus = 'Agendada'
      ${dateCondition}
    GROUP BY r.id
    ORDER BY r.fecha_hora_inicio ASC
  `;
  
  params.push(userId);
  return await executeQuery(query, params);
};

// KPIs por período
const getKPIsByPeriod = async (userId, days) => {
  const queries = {
    newProjects: `
      SELECT COUNT(*) as total
      FROM Proyectos
      WHERE id_administrador = ?
        AND fecha_creacion >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `,
    completedTasks: `
      SELECT COUNT(*) as total
      FROM Tareas t
      JOIN Proyectos p ON t.id_proyecto = p.id
      WHERE p.id_administrador = ?
        AND t.estatus = 'Completada'
        AND DATE(t.fecha_creacion) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `,
    signedDocuments: `
      SELECT COUNT(*) as total
      FROM Documento_Versiones dv
      JOIN Documentos d ON dv.id_documento = d.id
      JOIN Proyectos p ON d.id_proyecto = p.id
      WHERE p.id_administrador = ?
        AND dv.estatus = 'Firmado'
        AND dv.fecha_subida >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `
  };

  const [newProjects, completedTasks, signedDocuments] = await Promise.all([
    executeQuery(queries.newProjects, [userId, days]),
    executeQuery(queries.completedTasks, [userId, days]),
    executeQuery(queries.signedDocuments, [userId, days])
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