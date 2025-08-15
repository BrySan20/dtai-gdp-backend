const emailService = require('./emailService');
const notificationModel = require('../models/notificationModel'); // Debes crear este modelo
const userModel = require('../models/userModel'); // Para obtener datos de usuarios si necesitas email/nombre

const NotificationTypes = {
  DOCUMENTO_NUEVO_SUBIDO: 'documento_nuevo_subido',
  DOCUMENTO_NUEVA_VERSION: 'documento_nueva_version',
  DOCUMENTO_FIRMA_PENDIENTE: 'documento_firma_pendiente',
  DOCUMENTO_FIRMADO_COMPLETO: 'documento_firmado_completo',
  TAREA_COMPLETADA: 'tarea_completada',
  TAREA_ASIGNADA: 'tarea_asignada',
  REUNION_AGENDADA: 'reunion_agendada',
  DOCUMENTO_RECHAZADO: 'documento_rechazado',
  DOCUMENTO_FIRMADO: 'documento_firmado',
  PROYECTO_ASIGNADO: 'proyecto_asignado'
};

// Plantillas por tipo
const templates = {
  [NotificationTypes.DOCUMENTO_NUEVO_SUBIDO]: ({ nombreDocumento, nombreProyecto }) =>
    `Se ha subido un nuevo documento "${nombreDocumento}" en el proyecto "${nombreProyecto}".`,
  [NotificationTypes.DOCUMENTO_NUEVA_VERSION]: ({ nombreDocumento, nombreProyecto }) =>
    `Nueva versión del documento "${nombreDocumento}" en el proyecto "${nombreProyecto}".`,
  [NotificationTypes.DOCUMENTO_FIRMA_PENDIENTE]: ({ nombreDocumento, nombreProyecto }) =>
    `Tienes una firma pendiente en el documento "${nombreDocumento}" del proyecto "${nombreProyecto}".`,
  [NotificationTypes.DOCUMENTO_FIRMADO_COMPLETO]: ({ nombreDocumento, nombreProyecto }) =>
    `El documento "${nombreDocumento}" fue firmado por todos los participantes en el proyecto "${nombreProyecto}".`,
  [NotificationTypes.TAREA_COMPLETADA]: ({ nombreTarea, nombreProyecto }) =>
    `La tarea "${nombreTarea}" ha sido completada en el proyecto "${nombreProyecto}".`,
  [NotificationTypes.TAREA_ASIGNADA]: ({ nombreTarea, nombreProyecto }) =>
    `Te han asignado la tarea "${nombreTarea}" en el proyecto "${nombreProyecto}".`,
  [NotificationTypes.REUNION_AGENDADA]: ({ tituloReunion, fecha, nombreProyecto }) =>
    `Te han agendado a la reunión "${tituloReunion}" (${fecha}) en el proyecto "${nombreProyecto}".`,
  [NotificationTypes.DOCUMENTO_RECHAZADO]: ({ nombreDocumento, nombreProyecto }) =>
    `El documento "${nombreDocumento}" fue rechazado en el proyecto "${nombreProyecto}".`,
  [NotificationTypes.DOCUMENTO_FIRMADO]: ({ nombreDocumento, nombreProyecto }) =>
    `El documento "${nombreDocumento}" ha sido firmado en el proyecto "${nombreProyecto}".`,
  [NotificationTypes.PROYECTO_ASIGNADO]: ({ nombreProyecto }) =>
    `Te han asignado al proyecto "${nombreProyecto}".`,
};

/**
 * @param {Object} options
 * @param {string} options.tipo - Tipo de notificación (NotificationTypes)
 * @param {Array<number>} options.destinatarios - IDs de usuarios destinatarios
 * @param {Object} options.parametros - Datos dinámicos para la plantilla
 * @param {string|null} [options.enlaceAccion] - URL para acción rápida en el frontend
 * @param {boolean} [options.enviarCorreo=true] - Si enviar correo o no
 */
async function notify({ tipo, destinatarios, parametros, enlaceAccion = null, enviarCorreo = true }) {
  if (!templates[tipo]) throw new Error('Tipo de notificación no soportado');
  const mensaje = templates[tipo](parametros);

  // Obtener datos de usuarios (nombre/email) si vas a enviar correo
  let usersData = [];
  if (enviarCorreo) {
    usersData = await Promise.all(
      destinatarios.map(async (idUsuario) => {
        const user = await userModel.findUserById(idUsuario);
        return user;
      })
    );
  }

  // Insertar notificación en base de datos para cada usuario
  await Promise.all(destinatarios.map(async (idUsuario, idx) => {
    await notificationModel.createNotification({
      id_usuario: idUsuario,
      tipo_notificacion: tipo,
      mensaje,
      enlace_accion: enlaceAccion
    });

    // Enviar correo
    if (enviarCorreo && usersData[idx]?.email) {
      // El cuerpo puede ser el mismo que la notificación
      await emailService.sendGenericNotificationEmail(
        usersData[idx].email,
        usersData[idx].nombre,
        mensaje,
        enlaceAccion
      );
    }
  }));
}

module.exports = {
  notify,
  NotificationTypes
};