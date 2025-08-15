// File: backend/src/models/userModel.js
const { executeQuery } = require('../config/database');

const findUserByEmail = async (email) => {
  const query = `
    SELECT u.id, u.nombre, u.apellido, u.email, u.password_hash, u.telefono, 
           u.activo, u.ultima_sesion, r.id as id_rol, r.nombre_rol, r.descripcion as rol_descripcion
    FROM Usuarios u
    JOIN Roles r ON u.id_rol = r.id
    WHERE u.email = ?
  `;
  
  const result = await executeQuery(query, [email]);
  return result[0] || null;
};

const updateLastLogin = async (userId) => {
  const query = 'UPDATE Usuarios SET ultima_sesion = NOW() WHERE id = ?';
  return await executeQuery(query, [userId]);
};

const findUserById = async (id) => {
  const query = `
    SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, 
           u.activo, u.ultima_sesion, r.id as id_rol, r.nombre_rol, r.descripcion as rol_descripcion
    FROM Usuarios u
    JOIN Roles r ON u.id_rol = r.id
    WHERE u.id = ?
  `;
  
  const result = await executeQuery(query, [id]);
  return result[0] || null;
};

const createUser = async (userData) => {
  const { nombre, apellido, email, password_hash, telefono, id_rol } = userData;
  const query = `
    INSERT INTO Usuarios (nombre, apellido, email, password_hash, telefono, id_rol, activo)
    VALUES (?, ?, ?, ?, ?, ?, FALSE)
  `;
  
  return await executeQuery(query, [nombre, apellido, email, password_hash, telefono, id_rol]);
};

const updateUserVerificationCode = async (userId, codigo, fechaExpiracion) => {
  const query = `
    UPDATE Usuarios 
    SET codigo_verificacion = ?, fecha_expiracion_codigo = ? 
    WHERE id = ?
  `;
  
  return await executeQuery(query, [codigo, fechaExpiracion, userId]);
};

const updateUserStatus = async (userId, activo) => {
  const query = `
    UPDATE Usuarios 
    SET activo = ?, codigo_verificacion = NULL, fecha_expiracion_codigo = NULL
    WHERE id = ?
  `;
  
  return await executeQuery(query, [activo, userId]);
};

const findUserByVerificationCode = async (email, codigo) => {
  const query = `
    SELECT id, nombre, apellido, email, codigo_verificacion, fecha_expiracion_codigo, activo
    FROM Usuarios 
    WHERE email = ? AND codigo_verificacion = ? AND fecha_expiracion_codigo > NOW()
  `;
  
  const result = await executeQuery(query, [email, codigo]);
  return result[0] || null;
};

const checkEmailExists = async (email) => {
  const query = 'SELECT id FROM Usuarios WHERE email = ?';
  const result = await executeQuery(query, [email]);
  return result.length > 0;
};

// Función para actualizar la contraseña del usuario

const updateUserPassword = async (userId, password_hash) => {
  const query = `
    UPDATE Usuarios 
    SET password_hash = ?, codigo_verificacion = NULL, fecha_expiracion_codigo = NULL
    WHERE id = ?
  `;
  
  return await executeQuery(query, [password_hash, userId]);
};

// Funciones para manejar códigos temporales de verificación

const saveTemporaryVerificationCode = async (email, codigo, fechaExpiracion) => {
    const query = `
        INSERT INTO codigos_temporales (email, codigo, fecha_expiracion)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
        codigo = VALUES(codigo),
        fecha_expiracion = VALUES(fecha_expiracion)
    `;
    
    return await executeQuery(query, [email, codigo, fechaExpiracion]);
};

const verifyTemporaryCode = async (email, codigo) => {
    const query = `
        SELECT * FROM codigos_temporales
        WHERE email = ? AND codigo = ? AND fecha_expiracion > NOW()
    `;
    
    const result = await executeQuery(query, [email, codigo]);
    return result.length > 0;
};

const clearTemporaryVerificationCode = async (email) => {
    const query = 'DELETE FROM codigos_temporales WHERE email = ?';
    return await executeQuery(query, [email]);
};


//******* FUNCIONES PARA CRUD DE USAURIOS: SUPERADMIN *******

// Función para obtener usuarios con paginación y filtros
const getAllUsersWithPagination = async (page = 1, limit = 10, filters = {}, sortBy = 'fecha_registro', sortOrder = 'DESC') => {
  const offset = (page - 1) * limit;
  
  let whereClause = `WHERE r.nombre_rol != 'Superadministrador'`;
  let queryParams = [];
  
  // Aplicar filtros
  if (filters.search) {
    whereClause += ' AND (u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (filters.rol) {
    whereClause += ' AND u.id_rol = ?';
    queryParams.push(filters.rol);
  }
  
  if (filters.activo !== null) {
    whereClause += ' AND u.activo = ?';
    queryParams.push(filters.activo);
  }
  
  // Validar campos de ordenamiento
  const validSortFields = ['fecha_registro', 'nombre', 'apellido', 'email', 'ultima_sesion'];
  const validSortOrders = ['ASC', 'DESC'];
  
  if (!validSortFields.includes(sortBy)) sortBy = 'fecha_registro';
  if (!validSortOrders.includes(sortOrder.toUpperCase())) sortOrder = 'DESC';
  
  // Consulta principal con paginación
  const query = `
    SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, 
           u.fecha_registro, u.ultima_sesion, u.activo, u.id_rol,
           r.nombre_rol, r.descripcion as rol_descripcion
    FROM Usuarios u
    JOIN Roles r ON u.id_rol = r.id
    ${whereClause}
    ORDER BY u.${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;
  
  // Consulta para contar total
  const countQuery = `
    SELECT COUNT(*) as total
    FROM Usuarios u
    JOIN Roles r ON u.id_rol = r.id
    ${whereClause}
  `;
  
  const [users, countResult] = await Promise.all([
    executeQuery(query, [...queryParams, limit, offset]),
    executeQuery(countQuery, queryParams)
  ]);
  
  return {
    users,
    total: countResult[0].total
  };
};

// Función para obtener usuario por ID
const getUserByIdAdmin = async (id) => {
  const query = `
    SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, 
           u.fecha_registro, u.ultima_sesion, u.activo, u.id_rol,
           r.nombre_rol, r.descripcion as rol_descripcion
    FROM Usuarios u
    JOIN Roles r ON u.id_rol = r.id
    WHERE u.id = ?
  `;
  
  const result = await executeQuery(query, [id]);
  return result[0] || null;
};

// Función para crear usuario
const createUserAdmin = async (userData) => {
  const { nombre, apellido, email, password_hash, telefono, id_rol, activo } = userData;
  const query = `
    INSERT INTO Usuarios (nombre, apellido, email, password_hash, telefono, id_rol, activo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  return await executeQuery(query, [nombre, apellido, email, password_hash, telefono, id_rol, activo]);
};

// Función para actualizar usuario
const updateUserAdmin = async (id, updateData) => {
  const fields = [];
  const values = [];
  
  // Construir dinámicamente la consulta UPDATE
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined && key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    }
  });
  
  if (fields.length === 0) {
    throw new Error('No hay campos para actualizar');
  }
  
  values.push(id);
  
  const query = `
    UPDATE Usuarios 
    SET ${fields.join(', ')} 
    WHERE id = ?
  `;
  
  return await executeQuery(query, values);
};

// Función para eliminar usuario (soft delete)
const deleteUserAdmin = async (id) => {
  const query = `
    UPDATE Usuarios 
    SET activo = FALSE, 
        email = CONCAT(email, '_deleted_', UNIX_TIMESTAMP())
    WHERE id = ?
  `;
  
  return await executeQuery(query, [id]);
};

// Función para cambiar estado de usuario
const toggleUserStatusAdmin = async (id, activo) => {
  const query = `
    UPDATE Usuarios 
    SET activo = ? 
    WHERE id = ?
  `;
  
  return await executeQuery(query, [activo, id]);
};

// Función para cambiar contraseña de usuario
const changePasswordAdmin = async (id, password_hash) => {
  const query = `
    UPDATE Usuarios 
    SET password_hash = ? 
    WHERE id = ?
  `;
  
  return await executeQuery(query, [password_hash, id]);
};

// Función para verificar si email existe excluyendo un ID
const checkEmailExistsExcluding = async (email, excludeId = null) => {
  let query = 'SELECT id FROM Usuarios WHERE email = ?';
  let params = [email];
  
  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }
  
  const result = await executeQuery(query, params);
  return result.length > 0;
};


// Obtener usuarios disponibles para asignar a proyectos
const getAvailableUsers = async (roleNames = ['Administrador','Colaborador', 'Cliente']) => {
  const placeholders = roleNames.map(() => '?').join(',');
  const query = `
    SELECT 
      u.id,
      u.nombre,
      u.apellido,
      u.email,
      u.id_rol,         -- <--- AGREGAR ESTO
      r.nombre_rol
    FROM Usuarios u
    JOIN Roles r ON u.id_rol = r.id
    WHERE r.nombre_rol IN (${placeholders})
    AND u.activo = 1
    ORDER BY r.nombre_rol, u.apellido, u.nombre
  `;
  
  return await executeQuery(query, roleNames);
};


module.exports = {
  // Funciones de autenticación
  findUserByEmail,
  updateLastLogin,
  findUserById,
  createUser,
  updateUserVerificationCode,
  updateUserStatus,
  findUserByVerificationCode,
  checkEmailExists,
  updateUserPassword,
  saveTemporaryVerificationCode,
  verifyTemporaryCode,
  clearTemporaryVerificationCode,
  // Funciones para CRUD de usuarios: Superadmin
  getAllUsersWithPagination,
  getUserByIdAdmin,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  toggleUserStatusAdmin,
  changePasswordAdmin,
  checkEmailExistsExcluding,
  // Funciones para asignación de usuarios a proyectos
  getAvailableUsers,
};