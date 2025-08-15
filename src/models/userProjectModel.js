// File: backend/src/models/userProjectModel.js
const { executeQuery } = require('../config/database');

// Obtener proyectos donde el usuario está involucrado (Colaborador o Cliente)
const getUserProjects = async (userId, userRole) => {
  let query;
  
  if (userRole === 'Colaborador' || userRole === 'Cliente') {
    // Para Colaboradores y Clientes: proyectos donde están asignados
    query = `
      SELECT DISTINCT 
        p.id,
        p.nombre,
        p.descripcion,
        p.estatus,
        p.nivel_riesgo,
        p.fecha_creacion,
        prog.nombre as programa,
        CONCAT(admin.nombre, ' ', admin.apellido) as creador,
        tp.nombre_tipo as tipo_proyecto,
        p.id_programa,
        p.id_administrador as id_creador,
        p.id_tipo_proyecto
      FROM Proyectos p
      JOIN Proyecto_Usuarios pu ON p.id = pu.id_proyecto
      LEFT JOIN Programas prog ON p.id_programa = prog.id
      LEFT JOIN Usuarios admin ON p.id_administrador = admin.id
      LEFT JOIN Tipos_Proyecto tp ON p.id_tipo_proyecto = tp.id
      WHERE pu.id_usuario = ?
      ORDER BY p.fecha_creacion DESC
    `;
    return await executeQuery(query, [userId]);
  }
  
  if (userRole === 'Administrador') {
    // Para Administradores: proyectos que administran
    query = `
      SELECT DISTINCT 
        p.id,
        p.nombre,
        p.descripcion,
        p.estatus,
        p.nivel_riesgo,
        p.fecha_creacion,
        prog.nombre as programa,
        CONCAT(admin.nombre, ' ', admin.apellido) as creador,
        tp.nombre_tipo as tipo_proyecto,
        p.id_programa,
        p.id_administrador as id_creador,
        p.id_tipo_proyecto
      FROM Proyectos p
      LEFT JOIN Programas prog ON p.id_programa = prog.id
      LEFT JOIN Usuarios admin ON p.id_administrador = admin.id
      LEFT JOIN Tipos_Proyecto tp ON p.id_tipo_proyecto = tp.id
      WHERE p.id_administrador = ?
      ORDER BY p.fecha_creacion DESC
    `;
    return await executeQuery(query, [userId]);
  }
  
  return [];
};

module.exports = {
  getUserProjects,
};