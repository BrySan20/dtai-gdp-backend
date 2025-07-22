// File: backend/src/models/roleModel.js
const { executeQuery } = require('../config/database');

const getAllRoles = async () => {
  const query = 'SELECT id, nombre_rol, descripcion FROM Roles ORDER BY id';
  return await executeQuery(query);
};

const getRoleById = async (id) => {
  const query = 'SELECT id, nombre_rol, descripcion FROM Roles WHERE id = ?';
  const result = await executeQuery(query, [id]);
  return result[0] || null;
};

const getRoleByName = async (nombre_rol) => {
  const query = 'SELECT id, nombre_rol, descripcion FROM Roles WHERE nombre_rol = ?';
  const result = await executeQuery(query, [nombre_rol]);
  return result[0] || null;
};

module.exports = {
  getAllRoles,
  getRoleById,
  getRoleByName
};