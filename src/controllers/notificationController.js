//File: backend/src/controllers/notificationController.js
const {
  getUserNotifications,
  getUserUnreadNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  getNotificationById,
  deleteNotification
} = require('../models/notificationModel');
const { AppError } = require('../utils/errorHandler');

// Obtener todas las notificaciones del usuario autenticado
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const notifications = await getUserNotifications(userId);
    
    res.status(200).json({
      success: true,
      message: 'Notificaciones obtenidas exitosamente',
      data: notifications
    });

  } catch (error) {
    next(error);
  }
};

// Obtener solo notificaciones no leídas
const getUnreadNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const notifications = await getUserUnreadNotifications(userId);
    
    res.status(200).json({
      success: true,
      message: 'Notificaciones no leídas obtenidas exitosamente',
      data: notifications
    });

  } catch (error) {
    next(error);
  }
};

// Obtener conteo de notificaciones no leídas
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const count = await getUnreadNotificationsCount(userId);
    
    res.status(200).json({
      success: true,
      message: 'Conteo de notificaciones no leídas obtenido exitosamente',
      data: { count }
    });

  } catch (error) {
    next(error);
  }
};

// Marcar una notificación específica como leída
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verificar que la notificación existe y pertenece al usuario
    const notification = await getNotificationById(id, userId);
    if (!notification) {
      throw new AppError('Notificación no encontrada', 404);
    }
    
    // Si ya está leída, no hacer nada
    if (notification.leida) {
      return res.status(200).json({
        success: true,
        message: 'La notificación ya estaba marcada como leída'
      });
    }
    
    const updated = await markNotificationAsRead(id, userId);
    
    if (!updated) {
      throw new AppError('No se pudo marcar la notificación como leída', 500);
    }
    
    res.status(200).json({
      success: true,
      message: 'Notificación marcada como leída exitosamente'
    });

  } catch (error) {
    next(error);
  }
};

// Marcar todas las notificaciones como leídas
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const updatedCount = await markAllNotificationsAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: `${updatedCount} notificaciones marcadas como leídas`,
      data: { updatedCount }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};