//File: backend/src/models/programModel.js
const { executeQuery } = require('../config/database');

// Obtener programas con paginación y filtros
const getAllProgramsWithPagination = async (page = 1, limit = 10, filters = {}, sortBy = 'fecha_creacion', sortOrder = 'DESC', userId = null, userRole = null) => {
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE 1=1';
  let queryParams = [];

  // Si es Administrador, solo ve sus propios programas
  if (userRole === 'Administrador') {
    whereClause += ' AND pr.id_administrador = ?';
    queryParams.push(userId);
  }

  // Aplicar filtros
  if (filters.search) {
    whereClause += ' AND (pr.nombre LIKE ? OR pr.descripcion LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    queryParams.push(searchTerm, searchTerm);
  }

  if (filters.portafolio) {
    whereClause += ' AND pr.id_portafolio = ?';
    queryParams.push(filters.portafolio);
  }

  if (filters.administrador) {
    whereClause += ' AND pr.id_administrador = ?';
    queryParams.push(filters.administrador);
  }

  // Validar campos de ordenamiento
  const validSortFields = ['fecha_creacion', 'nombre'];
  const validSortOrders = ['ASC', 'DESC'];
  
  if (!validSortFields.includes(sortBy)) sortBy = 'fecha_creacion';
  if (!validSortOrders.includes(sortOrder.toUpperCase())) sortOrder = 'DESC';

  // Consulta principal
  const query = `
    SELECT pr.id, pr.nombre, pr.descripcion, pr.fecha_creacion, pr.id_portafolio, pr.id_administrador,
           p.nombre as portafolio_nombre,
           CONCAT(u.nombre, ' ', u.apellido) as administrador_nombre,
           u.email as administrador_email
    FROM Programas pr
    JOIN Portafolios p ON pr.id_portafolio = p.id
    JOIN Usuarios u ON pr.id_administrador = u.id
    ${whereClause}
    ORDER BY pr.${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;

  // Consulta para contar total
  const countQuery = `
    SELECT COUNT(*) as total
    FROM Programas pr
    JOIN Portafolios p ON pr.id_portafolio = p.id
    JOIN Usuarios u ON pr.id_administrador = u.id
    ${whereClause}
  `;

  const [programs, countResult] = await Promise.all([
    executeQuery(query, [...queryParams, limit, offset]),
    executeQuery(countQuery, queryParams)
  ]);

  return {
    programs,
    total: countResult[0].total
  };
};

// Obtener programa por ID
const getProgramById = async (id, userId = null, userRole = null) => {
  let whereClause = 'WHERE pr.id = ?';
  let queryParams = [id];

  // Si es Administrador, solo puede ver sus propios programas
  if (userRole === 'Administrador') {
    whereClause += ' AND pr.id_administrador = ?';
    queryParams.push(userId);
  }

  const query = `
    SELECT pr.id, pr.nombre, pr.descripcion, pr.fecha_creacion, pr.id_portafolio, pr.id_administrador,
           p.nombre as portafolio_nombre,
           CONCAT(u.nombre, ' ', u.apellido) as administrador_nombre,
           u.email as administrador_email
    FROM Programas pr
    JOIN Portafolios p ON pr.id_portafolio = p.id
    JOIN Usuarios u ON pr.id_administrador = u.id
    ${whereClause}
  `;

  const result = await executeQuery(query, queryParams);
  return result[0] || null;
};

// Crear programa
const createProgram = async (programData) => {
  const { nombre, descripcion, id_portafolio, id_administrador } = programData;
  const query = `
    INSERT INTO Programas (nombre, descripcion, id_portafolio, id_administrador)
    VALUES (?, ?, ?, ?)
  `;

  return await executeQuery(query, [nombre, descripcion, id_portafolio, id_administrador]);
};

// Actualizar programa
const updateProgram = async (id, updateData, userId = null, userRole = null) => {
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

  let whereClause = 'WHERE id = ?';

  // Si es Administrador, solo puede actualizar sus propios programas
  if (userRole === 'Administrador') {
    whereClause += ' AND id_administrador = ?';
    values.push(userId);
  }

  const query = `
    UPDATE Programas 
    SET ${fields.join(', ')}
    ${whereClause}
  `;

  return await executeQuery(query, values);
};

// Eliminar programa
const deleteProgram = async (id, userId = null, userRole = null) => {
  let whereClause = 'WHERE id = ?';
  let queryParams = [id];

  // Si es Administrador, solo puede eliminar sus propios programas
  if (userRole === 'Administrador') {
    whereClause += ' AND id_administrador = ?';
    queryParams.push(userId);
  }

  const query = `
    DELETE FROM Programas 
    ${whereClause}
  `;

  return await executeQuery(query, queryParams);
};

// Verificar si el programa existe y pertenece al usuario
const checkProgramOwnership = async (id, userId) => {
  const query = `
    SELECT id FROM Programas 
    WHERE id = ? AND id_administrador = ?
  `;

  const result = await executeQuery(query, [id, userId]);
  return result.length > 0;
};

// Verificar si el portafolio pertenece al usuario (para validar al crear programa)
const checkPortfolioOwnership = async (portfolioId, userId, userRole) => {
  if (userRole === 'Superadministrador') return true;

  const query = `
    SELECT id FROM Portafolios 
    WHERE id = ? AND id_administrador = ?
  `;

  const result = await executeQuery(query, [portfolioId, userId]);
  return result.length > 0;
};

module.exports = {
  getAllProgramsWithPagination,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  checkProgramOwnership,
  checkPortfolioOwnership
};