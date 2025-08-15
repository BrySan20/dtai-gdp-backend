// File: backend/src/models/projectModel.js
const { executeQuery } = require('../config/database');
const { getProjectUsers } = require('./projectUserRoleModel');

// Obtener proyectos con paginación y filtros
const getAllProjectsWithPagination = async (page = 1, limit = 10, filters = {}, sortBy = 'fecha_creacion', sortOrder = 'DESC', userId = null, userRole = null) => {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let queryParams = [];

    if (userRole === 'Administrador') {
        whereClause += ' AND p.id_administrador = ?';
        queryParams.push(userId);
    }
    if (filters.search) {
        whereClause += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm);
    }
    if (filters.programa) {
        whereClause += ' AND p.id_programa = ?';
        queryParams.push(filters.programa);
    }
    if (filters.administrador) {
        whereClause += ' AND p.id_administrador = ?';
        queryParams.push(filters.administrador);
    }
    if (filters.estatus) {
        whereClause += ' AND p.estatus = ?';
        queryParams.push(filters.estatus);
    }
    if (filters.nivel_riesgo) {
        whereClause += ' AND p.nivel_riesgo = ?';
        queryParams.push(filters.nivel_riesgo);
    }

    const validSortFields = ['fecha_creacion', 'nombre', 'estatus', 'nivel_riesgo'];
    const validSortOrders = ['ASC', 'DESC'];

    if (!validSortFields.includes(sortBy)) sortBy = 'fecha_creacion';
    if (!validSortOrders.includes(sortOrder.toUpperCase())) sortOrder = 'DESC';

    const query = `
        SELECT p.id, p.nombre, p.descripcion, p.estatus, p.nivel_riesgo, p.fecha_creacion, 
               p.id_programa, p.id_administrador, p.id_tipo_proyecto, tp.nombre_tipo as tipo_proyecto,
               pr.nombre as programa_nombre,
               port.nombre as portafolio_nombre,
               CONCAT(u.nombre, ' ', u.apellido) as administrador_nombre,
               u.email as administrador_email
        FROM Proyectos p
        LEFT JOIN Programas pr ON p.id_programa = pr.id
        LEFT JOIN Portafolios port ON pr.id_portafolio = port.id
        JOIN Usuarios u ON p.id_administrador = u.id
        LEFT JOIN Tipos_Proyecto tp ON p.id_tipo_proyecto = tp.id
        ${whereClause}
        ORDER BY p.${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
    `;

    const countQuery = `
        SELECT COUNT(*) as total
        FROM Proyectos p
        LEFT JOIN Programas pr ON p.id_programa = pr.id
        LEFT JOIN Portafolios port ON pr.id_portafolio = port.id
        JOIN Usuarios u ON p.id_administrador = u.id
        ${whereClause}
    `;

    const [projects, countResult] = await Promise.all([
        executeQuery(query, [...queryParams, limit, offset]),
        executeQuery(countQuery, queryParams)
    ]);

    const projectsWithMembers = await Promise.all(
        projects.map(async (project) => {
            const miembros = await getProjectUsers(project.id);
            return {
                ...project,
                miembros
            };
        })
    );

    return {
        projects: projectsWithMembers,
        total: countResult[0].total
    };
};

// Obtener proyecto por ID
const getProjectById = async (id, userId = null, userRole = null) => {
    let whereClause = 'WHERE p.id = ?';
    let queryParams = [id];

    if (userRole === 'Administrador') {
        whereClause += ' AND p.id_administrador = ?';
        queryParams.push(userId);
    }

    const query = `
        SELECT p.id, p.nombre, p.descripcion, p.estatus, p.nivel_riesgo, p.fecha_creacion, 
               p.id_programa, p.id_administrador, p.id_tipo_proyecto, tp.nombre_tipo as tipo_proyecto,
               pr.nombre as programa_nombre,
               port.nombre as portafolio_nombre,
               CONCAT(u.nombre, ' ', u.apellido) as administrador_nombre,
               u.email as administrador_email
        FROM Proyectos p
        LEFT JOIN Programas pr ON p.id_programa = pr.id
        LEFT JOIN Portafolios port ON pr.id_portafolio = port.id
        JOIN Usuarios u ON p.id_administrador = u.id
        LEFT JOIN Tipos_Proyecto tp ON p.id_tipo_proyecto = tp.id
        ${whereClause}
    `;

    const result = await executeQuery(query, queryParams);
    return result[0] || null;
};

// Crear proyecto
const createProject = async (projectData) => {
    const { nombre, descripcion, estatus = 'Activo', nivel_riesgo = 'Nulo', id_programa, id_administrador } = projectData;

    // Obtener el tipo de proyecto del programa
    const tipoQuery = `SELECT id_tipo_proyecto_programa FROM Programas WHERE id = ?`;
    const tipoResult = await executeQuery(tipoQuery, [id_programa]);
    if (!tipoResult.length || !tipoResult[0].id_tipo_proyecto_programa) {
        throw new Error('El programa no tiene tipo de proyecto definido');
    }
    const id_tipo_proyecto = tipoResult[0].id_tipo_proyecto_programa;

    const query = `
        INSERT INTO Proyectos (nombre, descripcion, estatus, nivel_riesgo, id_programa, id_administrador, id_tipo_proyecto)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    return await executeQuery(query, [nombre, descripcion, estatus, nivel_riesgo, id_programa, id_administrador, id_tipo_proyecto]);
};

// Actualizar proyecto
const updateProject = async (id, updateData, userId = null, userRole = null) => {
    const fields = [];
    const values = [];

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

    if (userRole === 'Administrador') {
        whereClause += ' AND id_administrador = ?';
        values.push(userId);
    }

    const query = `
        UPDATE Proyectos
        SET ${fields.join(', ')}
        ${whereClause}
    `;

    return await executeQuery(query, values);
};


// Eliminar proyecto
const deleteProject = async (id, userId = null, userRole = null) => {
    let whereClause = 'WHERE id = ?';
    let queryParams = [id];

    // Si es Administrador, solo puede eliminar sus propios proyectos
    if (userRole === 'Administrador') {
        whereClause += ' AND id_administrador = ?';
        queryParams.push(userId);
    }

    const query = `
        DELETE FROM Proyectos
        ${whereClause}
    `;

    return await executeQuery(query, queryParams);
};

// Verificar si el programa pertenece al usuario (para validar al crear proyecto)
const checkProgramOwnership = async (programId, userId, userRole) => {
    if (userRole === 'Superadministrador') return true;

    const query = `
        SELECT pr.id FROM Programas pr
        JOIN Portafolios p ON pr.id_portafolio = p.id
        WHERE pr.id = ? AND p.id_administrador = ?
    `;

    const result = await executeQuery(query, [programId, userId]);
    return result.length > 0;
};

module.exports = {
    getAllProjectsWithPagination,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    checkProgramOwnership
};