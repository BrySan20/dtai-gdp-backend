// File: backend/src/models/portfolioModel.js
const { executeQuery } = require('../config/database');

// Obtener portafolios con paginación y filtros
const getAllPortfoliosWithPagination = async (page = 1, limit = 10, filters = {}, sortBy = 'fecha_creacion', sortOrder = 'DESC', userId = null, userRole = null) => {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    
    // Si es Administrador, solo ve sus propios portafolios
    if (userRole === 'Administrador') {
        whereClause += ' AND p.id_administrador = ?';
        queryParams.push(userId);
    }
    
    // Aplicar filtros
    if (filters.search) {
        whereClause += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm);
    }
    
    if (filters.administrador) {
        whereClause += ' AND p.id_administrador = ?';
        queryParams.push(filters.administrador);
    }
    
    // Validar campos de ordenamiento
    const validSortFields = ['fecha_creacion', 'nombre'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (!validSortFields.includes(sortBy)) sortBy = 'fecha_creacion';
    if (!validSortOrders.includes(sortOrder.toUpperCase())) sortOrder = 'DESC';
    
    // Consulta principal
    const query = `
        SELECT p.id, p.nombre, p.descripcion, p.fecha_creacion, p.id_administrador,
               CONCAT(u.nombre, ' ', u.apellido) as administrador_nombre,
               u.email as administrador_email
        FROM Portafolios p
        JOIN Usuarios u ON p.id_administrador = u.id
        ${whereClause}
        ORDER BY p.${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
    `;
    
    // Consulta para contar total
    const countQuery = `
        SELECT COUNT(*) as total
        FROM Portafolios p
        JOIN Usuarios u ON p.id_administrador = u.id
        ${whereClause}
    `;
    
    const [portfolios, countResult] = await Promise.all([
        executeQuery(query, [...queryParams, limit, offset]),
        executeQuery(countQuery, queryParams)
    ]);
    
    return {
        portfolios,
        total: countResult[0].total
    };
};

// Obtener portafolio por ID
const getPortfolioById = async (id, userId = null, userRole = null) => {
    let whereClause = 'WHERE p.id = ?';
    let queryParams = [id];
    
    // Si es Administrador, solo puede ver sus propios portafolios
    if (userRole === 'Administrador') {
        whereClause += ' AND p.id_administrador = ?';
        queryParams.push(userId);
    }
    
    const query = `
        SELECT p.id, p.nombre, p.descripcion, p.fecha_creacion, p.id_administrador,
               CONCAT(u.nombre, ' ', u.apellido) as administrador_nombre,
               u.email as administrador_email
        FROM Portafolios p
        JOIN Usuarios u ON p.id_administrador = u.id
        ${whereClause}
    `;
    
    const result = await executeQuery(query, queryParams);
    return result[0] || null;
};

// Crear portafolio
const createPortfolio = async (portfolioData) => {
    const { nombre, descripcion, id_administrador } = portfolioData;
    const query = `
        INSERT INTO Portafolios (nombre, descripcion, id_administrador)
        VALUES (?, ?, ?)
    `;
    
    return await executeQuery(query, [nombre, descripcion, id_administrador]);
};

// Actualizar portafolio
const updatePortfolio = async (id, updateData, userId = null, userRole = null) => {
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
    
    // Si es Administrador, solo puede actualizar sus propios portafolios
    if (userRole === 'Administrador') {
        whereClause += ' AND id_administrador = ?';
        values.push(userId);
    }
    
    const query = `
        UPDATE Portafolios
        SET ${fields.join(', ')}
        ${whereClause}
    `;
    
    return await executeQuery(query, values);
};

// Eliminar portafolio
const deletePortfolio = async (id, userId = null, userRole = null) => {
    let whereClause = 'WHERE id = ?';
    let queryParams = [id];
    
    // Si es Administrador, solo puede eliminar sus propios portafolios
    if (userRole === 'Administrador') {
        whereClause += ' AND id_administrador = ?';
        queryParams.push(userId);
    }
    
    const query = `
        DELETE FROM Portafolios
        ${whereClause}
    `;
    
    return await executeQuery(query, queryParams);
};

// Verificar si el portafolio existe y pertenece al usuario
const checkPortfolioOwnership = async (id, userId) => {
    const query = `
        SELECT id FROM Portafolios
        WHERE id = ? AND id_administrador = ?
    `;
    
    const result = await executeQuery(query, [id, userId]);
    return result.length > 0;
};

module.exports = {
    getAllPortfoliosWithPagination,
    getPortfolioById,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    checkPortfolioOwnership
};