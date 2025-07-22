// File: backend/src/models/taskModel.js
const { executeQuery } = require('../config/database');

// Obtener tareas de un proyecto
const getTasksByProject = async (projectId) => {
    const query = `
        SELECT t.*, 
            u_asignado.nombre AS usuario_asignado_nombre, u_asignado.apellido AS usuario_asignado_apellido,
            u_creador.nombre AS creador_nombre, u_creador.apellido AS creador_apellido
        FROM Tareas t
        LEFT JOIN Usuarios u_asignado ON t.id_usuario_asignado = u_asignado.id
        LEFT JOIN Usuarios u_creador ON t.id_creador = u_creador.id
        WHERE t.id_proyecto = ?
        ORDER BY t.fecha_vencimiento ASC, t.fecha_creacion ASC
    `;
    return await executeQuery(query, [projectId]);
};

// Obtener tarea por ID
const getTaskById = async (taskId) => {
    const query = `
        SELECT t.*, 
            u_asignado.nombre AS usuario_asignado_nombre, u_asignado.apellido AS usuario_asignado_apellido,
            u_creador.nombre AS creador_nombre, u_creador.apellido AS creador_apellido
        FROM Tareas t
        LEFT JOIN Usuarios u_asignado ON t.id_usuario_asignado = u_asignado.id
        LEFT JOIN Usuarios u_creador ON t.id_creador = u_creador.id
        WHERE t.id = ?
    `;
    const result = await executeQuery(query, [taskId]);
    return result[0] || null;
};

// Crear tarea
const createTask = async (taskData) => {
    const {
        nombre,
        descripcion,
        prioridad,
        estatus,
        nivelRiesgo,
        faseCicloVida,
        fechaInicio,
        fechaVencimiento,
        id_proyecto,
        id_usuario_asignado,
        id_creador
    } = taskData;
    const query = `
        INSERT INTO Tareas
            (nombre, descripcion, nivel_prioridad, estatus, nivel_riesgo, fase_ciclo_vida,
             fecha_inicio, fecha_vencimiento, id_proyecto, id_usuario_asignado, id_creador)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return await executeQuery(query, [
        nombre,
        descripcion,
        prioridad,
        estatus,
        nivelRiesgo,
        faseCicloVida,
        fechaInicio,
        fechaVencimiento,
        id_proyecto,
        id_usuario_asignado,
        id_creador
    ]);
};

// Actualizar tarea
const updateTask = async (taskId, updateData) => {
    const fields = [];
    const values = [];
    const mapping = {
        nombre: 'nombre',
        descripcion: 'descripcion',
        prioridad: 'nivel_prioridad',
        estatus: 'estatus',
        nivelRiesgo: 'nivel_riesgo',
        faseCicloVida: 'fase_ciclo_vida',
        fechaInicio: 'fecha_inicio',
        fechaVencimiento: 'fecha_vencimiento',
        id_usuario_asignado: 'id_usuario_asignado'
    };
    Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && mapping[key]) {
            fields.push(`${mapping[key]} = ?`);
            values.push(updateData[key]);
        }
    });
    if (fields.length === 0)
        throw new Error('No hay campos para actualizar');
    values.push(taskId);
    const query = `
        UPDATE Tareas
        SET ${fields.join(', ')}
        WHERE id = ?
    `;
    return await executeQuery(query, values);
};

// Eliminar tarea
const deleteTask = async (taskId) => {
    const query = `DELETE FROM Tareas WHERE id = ?`;
    return await executeQuery(query, [taskId]);
};

// Actualizar solo el estatus
const updateTaskStatus = async (taskId, estatus) => {
    const query = `
        UPDATE Tareas
        SET estatus = ?
        WHERE id = ?
    `;
    return await executeQuery(query, [estatus, taskId]);
};

module.exports = {
    getTasksByProject,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus
};