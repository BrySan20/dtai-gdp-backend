// File: backend/src/models/meetingModel.js
const { executeQuery } = require('../config/database');

// Crear nueva reunión
const createMeeting = async (meetingData) => {
    const { titulo, descripcion, fecha_hora_inicio, fecha_hora_fin, enlace_reunion, 
            id_creador, id_proyecto, id_tipo_reunion, modo, ubicacion } = meetingData;
    
    const query = `
        INSERT INTO Reuniones 
        (titulo, descripcion, fecha_hora_inicio, fecha_hora_fin, enlace_reunion, 
         id_creador, id_proyecto, id_tipo_reunion, modo, ubicacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
        titulo, descripcion, fecha_hora_inicio, fecha_hora_fin, enlace_reunion,
        id_creador, id_proyecto, id_tipo_reunion, modo, ubicacion
    ]);
    
    return result.insertId;
};

// Agregar participantes a la reunión
const addMeetingParticipants = async (meetingId, participantIds) => {
    const values = participantIds.map(userId => [meetingId, userId]);
    const placeholders = values.map(() => '(?, ?)').join(', ');
    
    const query = `
        INSERT INTO Reunion_Participantes (id_reunion, id_usuario)
        VALUES ${placeholders}
    `;
    
    const flatValues = values.flat();
    return await executeQuery(query, flatValues);
};

// Obtener reuniones donde el usuario está involucrado
const getUserMeetings = async (userId) => {
    const query = `
        SELECT DISTINCT
            r.id,
            r.titulo,
            r.descripcion,
            r.fecha_hora_inicio,
            r.fecha_hora_fin,
            r.enlace_reunion,
            r.estatus,
            r.modo,
            r.ubicacion,
            p.nombre as proyecto_nombre,
            CONCAT(u.nombre, ' ', u.apellido) as creador,
            tr.nombre_tipo as tipo_reunion,
            rp.asistencia_confirmada
        FROM Reuniones r
        LEFT JOIN Reunion_Participantes rp ON r.id = rp.id_reunion
        LEFT JOIN Proyectos p ON r.id_proyecto = p.id
        LEFT JOIN Usuarios u ON r.id_creador = u.id
        LEFT JOIN Tipos_Reunion tr ON r.id_tipo_reunion = tr.id
        WHERE r.id_creador = ? OR rp.id_usuario = ?
        ORDER BY r.fecha_hora_inicio ASC
    `;
    
    return await executeQuery(query, [userId, userId]);
};

// Obtener reuniones de un proyecto específico
const getProjectMeetings = async (projectId, userId) => {
    const query = `
        SELECT DISTINCT
            r.id,
            r.titulo,
            r.descripcion,
            r.fecha_hora_inicio,
            r.fecha_hora_fin,
            r.enlace_reunion,
            r.estatus,
            r.modo,
            r.ubicacion,
            CONCAT(u.nombre, ' ', u.apellido) as creador,
            tr.nombre_tipo as tipo_reunion,
            rp.asistencia_confirmada,
            CASE WHEN r.id_creador = ? THEN true ELSE false END as es_creador
        FROM Reuniones r
        LEFT JOIN Reunion_Participantes rp ON r.id = rp.id_reunion AND rp.id_usuario = ?
        LEFT JOIN Usuarios u ON r.id_creador = u.id
        LEFT JOIN Tipos_Reunion tr ON r.id_tipo_reunion = tr.id
        WHERE r.id_proyecto = ? AND (r.id_creador = ? OR rp.id_usuario = ?)
        ORDER BY r.fecha_hora_inicio ASC
    `;
    
    return await executeQuery(query, [userId, userId, projectId, userId, userId]);
};

// Obtener reunión por ID
const getMeetingById = async (meetingId, userId) => {
    const query = `
        SELECT DISTINCT
            r.id,
            r.titulo,
            r.descripcion,
            r.fecha_hora_inicio,
            r.fecha_hora_fin,
            r.enlace_reunion,
            r.estatus,
            r.modo,
            r.ubicacion,
            r.id_proyecto,
            p.nombre as proyecto_nombre,
            CONCAT(u.nombre, ' ', u.apellido) as creador,
            tr.nombre_tipo as tipo_reunion,
            tr.id as id_tipo_reunion,
            rp.asistencia_confirmada,
            CASE WHEN r.id_creador = ? THEN true ELSE false END as es_creador
        FROM Reuniones r
        LEFT JOIN Reunion_Participantes rp ON r.id = rp.id_reunion AND rp.id_usuario = ?
        LEFT JOIN Proyectos p ON r.id_proyecto = p.id
        LEFT JOIN Usuarios u ON r.id_creador = u.id
        LEFT JOIN Tipos_Reunion tr ON r.id_tipo_reunion = tr.id
        WHERE r.id = ? AND (r.id_creador = ? OR rp.id_usuario = ?)
    `;
    
    const results = await executeQuery(query, [userId, userId, meetingId, userId, userId]);
    return results[0];
};

// Obtener participantes de una reunión
const getMeetingParticipants = async (meetingId) => {
    const query = `
        SELECT 
            u.id,
            u.nombre,
            u.apellido,
            u.email,
            rp.asistencia_confirmada
        FROM Reunion_Participantes rp
        JOIN Usuarios u ON rp.id_usuario = u.id
        WHERE rp.id_reunion = ?
        ORDER BY u.nombre, u.apellido
    `;
    
    return await executeQuery(query, [meetingId]);
};

// Actualizar reunión
const updateMeeting = async (meetingId, meetingData) => {
    const { titulo, descripcion, fecha_hora_inicio, fecha_hora_fin, enlace_reunion,
            id_tipo_reunion, estatus, modo, ubicacion } = meetingData;
    
    const query = `
        UPDATE Reuniones 
        SET titulo = ?, descripcion = ?, fecha_hora_inicio = ?, fecha_hora_fin = ?,
            enlace_reunion = ?, id_tipo_reunion = ?, estatus = ?, modo = ?, ubicacion = ?
        WHERE id = ?
    `;
    
    return await executeQuery(query, [
        titulo, descripcion, fecha_hora_inicio, fecha_hora_fin, enlace_reunion,
        id_tipo_reunion, estatus, modo, ubicacion, meetingId
    ]);
};

// Eliminar reunión
const deleteMeeting = async (meetingId) => {
    const query = 'DELETE FROM Reuniones WHERE id = ?';
    return await executeQuery(query, [meetingId]);
};

// Obtener usuarios involucrados en un proyecto
const getProjectUsers = async (projectId) => {
    const query = `
        SELECT DISTINCT
            u.id,
            u.nombre,
            u.apellido,
            u.email,
            r.nombre_rol as rol
        FROM Usuarios u
        JOIN Proyecto_Usuarios pu ON u.id = pu.id_usuario
        JOIN Roles r ON pu.id_rol_proyecto = r.id
        WHERE pu.id_proyecto = ?
        UNION
        SELECT DISTINCT
            u.id,
            u.nombre,
            u.apellido,
            u.email,
            'Administrador' as rol
        FROM Usuarios u
        JOIN Proyectos p ON u.id = p.id_administrador
        WHERE p.id = ?
        ORDER BY rol, nombre, apellido
    `;
    
    return await executeQuery(query, [projectId, projectId]);
};

// Obtener tipos de reunión
const getMeetingTypes = async () => {
    const query = 'SELECT id, nombre_tipo, descripcion FROM Tipos_Reunion ORDER BY nombre_tipo';
    return await executeQuery(query);
};

// Confirmar asistencia
const confirmAttendance = async (meetingId, userId) => {
    const query = `
        UPDATE Reunion_Participantes 
        SET asistencia_confirmada = true
        WHERE id_reunion = ? AND id_usuario = ?
    `;
    
    return await executeQuery(query, [meetingId, userId]);
};

// Eliminar participantes actuales de la reunión
const removeMeetingParticipants = async (meetingId) => {
    const query = 'DELETE FROM Reunion_Participantes WHERE id_reunion = ?';
    return await executeQuery(query, [meetingId]);
};

module.exports = {
    createMeeting,
    addMeetingParticipants,
    getUserMeetings,
    getProjectMeetings,
    getMeetingById,
    getMeetingParticipants,
    updateMeeting,
    deleteMeeting,
    getProjectUsers,
    getMeetingTypes,
    confirmAttendance,
    removeMeetingParticipants
};