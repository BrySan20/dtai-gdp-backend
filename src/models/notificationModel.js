// File: backend/src/models/notificationModel.js
const { executeQuery } = require('../config/database');

async function createNotification({ id_usuario, tipo_notificacion, mensaje, enlace_accion = null }) {
  const sql = `
    INSERT INTO Notificaciones (id_usuario, tipo_notificacion, mensaje, enlace_accion)
    VALUES (?, ?, ?, ?)
  `;
  return await executeQuery(sql, [id_usuario, tipo_notificacion, mensaje, enlace_accion]);
}

// Obtener todas las notificaciones de un usuario
const getUserNotifications = async (userId) => {
  const query = `
    SELECT 
      id,
      tipo_notificacion,
      mensaje,
      fecha_creacion,
      leida,
      enlace_accion
    FROM Notificaciones 
    WHERE id_usuario = ? 
    ORDER BY fecha_creacion DESC
  `;
  return await executeQuery(query, [userId]);
};

// Obtener solo notificaciones no leídas de un usuario
const getUserUnreadNotifications = async (userId) => {
  const query = `
    SELECT 
      id,
      tipo_notificacion,
      mensaje,
      fecha_creacion,
      leida,
      enlace_accion
    FROM Notificaciones 
    WHERE id_usuario = ? AND leida = FALSE 
    ORDER BY fecha_creacion DESC
  `;
  return await executeQuery(query, [userId]);
};

// Obtener conteo de notificaciones no leídas
const getUnreadNotificationsCount = async (userId) => {
  const query = `
    SELECT COUNT(*) as count 
    FROM Notificaciones 
    WHERE id_usuario = ? AND leida = FALSE
  `;
  const result = await executeQuery(query, [userId]);
  return result[0]?.count || 0;
};

// Marcar una notificación como leída
const markNotificationAsRead = async (notificationId, userId) => {
  const query = `
    UPDATE Notificaciones 
    SET leida = TRUE 
    WHERE id = ? AND id_usuario = ?
  `;
  const result = await executeQuery(query, [notificationId, userId]);
  return result.affectedRows > 0;
};

// Marcar todas las notificaciones de un usuario como leídas
const markAllNotificationsAsRead = async (userId) => {
  const query = `
    UPDATE Notificaciones 
    SET leida = TRUE 
    WHERE id_usuario = ? AND leida = FALSE
  `;
  const result = await executeQuery(query, [userId]);
  return result.affectedRows;
};

// // Crear una nueva notificación
// const createNotification = async (notificationData) => {
//   const { id_usuario, tipo_notificacion, mensaje, enlace_accion } = notificationData;

//   const query = `
//     INSERT INTO Notificaciones (id_usuario, tipo_notificacion, mensaje, enlace_accion) 
//     VALUES (?, ?, ?, ?)
//   `;

//   const result = await executeQuery(query, [id_usuario, tipo_notificacion, mensaje, enlace_accion]);
//   return result.insertId;
// };

// Obtener una notificación específica
const getNotificationById = async (notificationId, userId) => {
  const query = `
    SELECT 
      id,
      tipo_notificacion,
      mensaje,
      fecha_creacion,
      leida,
      enlace_accion
    FROM Notificaciones 
    WHERE id = ? AND id_usuario = ?
  `;
  const result = await executeQuery(query, [notificationId, userId]);
  return result[0] || null;
};


module.exports = {
  createNotification,
  getUserNotifications,
  getUserUnreadNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationById,
};
