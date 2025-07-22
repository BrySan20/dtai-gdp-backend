// File: backend/src/models/projectUserRoleModel.js
const { executeQuery } = require('../config/database');

// Asignar usuario a proyecto
const assignUserToProject = async (projectId, userId, roleId) => {
  const query = `
    INSERT INTO Proyecto_Usuarios (id_proyecto, id_usuario, id_rol_proyecto)
    VALUES (?, ?, ?)
  `;
  
  return await executeQuery(query, [projectId, userId, roleId]);
};

// Remover usuario de proyecto
const removeUserFromProject = async (projectId, userId) => {
  const query = `
    DELETE FROM Proyecto_Usuarios
    WHERE id_proyecto = ? AND id_usuario = ?
  `;
  
  return await executeQuery(query, [projectId, userId]);
};

// Obtener usuarios asignados a un proyecto
const getProjectUsers = async (projectId) => {
  const query = `
    SELECT 
      pu.id_usuario,
      pu.id_rol_proyecto,
      u.nombre,
      u.apellido,
      u.email,
      r.nombre_rol
    FROM Proyecto_Usuarios pu
    JOIN Usuarios u ON pu.id_usuario = u.id
    JOIN Roles r ON pu.id_rol_proyecto = r.id
    WHERE pu.id_proyecto = ?
    ORDER BY r.nombre_rol, u.apellido, u.nombre
  `;
  
  return await executeQuery(query, [projectId]);
};

// Verificar si usuario ya está asignado al proyecto
const isUserAssignedToProject = async (projectId, userId) => {
  const query = `
    SELECT COUNT(*) as count
    FROM Proyecto_Usuarios
    WHERE id_proyecto = ? AND id_usuario = ?
  `;
  
  const result = await executeQuery(query, [projectId, userId]);
  return result[0].count > 0;
};

// Obtener proyectos donde el usuario está asignado
const getUserProjects = async (userId) => {
  const query = `
    SELECT 
      p.id,
      p.nombre,
      p.descripcion,
      p.estatus,
      p.nivel_riesgo,
      r.nombre_rol as rol_en_proyecto
    FROM Proyecto_Usuarios pu
    JOIN Proyectos p ON pu.id_proyecto = p.id
    JOIN Roles r ON pu.id_rol_proyecto = r.id
    WHERE pu.id_usuario = ?
    ORDER BY p.nombre
  `;
  
  return await executeQuery(query, [userId]);
};

module.exports = {
  assignUserToProject,
  removeUserFromProject,
  getProjectUsers,
  isUserAssignedToProject,
  getUserProjects
};