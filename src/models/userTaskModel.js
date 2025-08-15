// File: backend/src/models/userTaskModel.js
const { executeQuery } = require('../config/database');

// Obtener todas las tareas de un proyecto (con info de asignado y creador)
const getAllTasksByProject = async (projectId) => {
    const query = `
        SELECT
            t.id,
            t.nombre,
            t.descripcion,
            t.nivel_prioridad AS prioridad,
            t.estatus,
            t.nivel_riesgo AS nivelRiesgo,
            t.fase_ciclo_vida AS faseCicloVida,
            t.fecha_creacion,
            t.fecha_inicio AS fechaInicio,
            t.fecha_vencimiento AS fechaVencimiento,
            t.id_proyecto,
            t.id_usuario_asignado,
            t.id_creador,
            CONCAT(uasig.nombre, ' ', uasig.apellido) AS usuarioAsignado,
            CONCAT(ucrea.nombre, ' ', ucrea.apellido) AS creador
        FROM Tareas t
        LEFT JOIN Usuarios uasig ON t.id_usuario_asignado = uasig.id
        LEFT JOIN Usuarios ucrea ON t.id_creador = ucrea.id
        WHERE t.id_proyecto = ?
        ORDER BY t.fecha_vencimiento ASC, t.nivel_prioridad DESC
    `;
    return await executeQuery(query, [projectId]);
};

// Cambia el estatus de la tarea SOLO si pertenece al usuario logueado (Colaborador)
const updateStatusIfOwner = async (taskId, userId, newStatus) => {
    const query = `
        UPDATE Tareas
        SET estatus = ?
        WHERE id = ? AND id_usuario_asignado = ?
    `;
    return await executeQuery(query, [newStatus, taskId, userId]);
};

module.exports = {
    getAllTasksByProject,
    updateStatusIfOwner
};