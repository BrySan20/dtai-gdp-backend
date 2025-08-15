// File: backend/src/controllers/documentController.js
const documentModel = require('../models/documentModel');
const signatureService = require('../services/signatureService');
const fileUploadService = require('../services/fileUploadService');
const path = require('path');
const { AppError } = require('../utils/errorHandler');
const { notify, NotificationTypes } = require('../services/notificationService');

// Obtener usuarios del proyecto para firmantes
const getProjectUsers = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const users = await documentModel.getProjectUsers(projectId);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// Helper para obtener datos del proyecto y nombre (puedes mover a model si prefieres)
const getProjectInfo = async (projectId) => {
  // Puedes implementar esto en tu modelo, ejemplo:
  // SELECT id, nombre FROM Proyectos WHERE id = ?
  const result = await documentModel.getProjectNameById(projectId);
  if (!result || !result.nombre) throw new AppError('Proyecto no encontrado', 404);
  return result;
};

// Subir nuevo documento
const uploadDocument = async (req, res, next) => {
  try {
    console.log('📥 Iniciando proceso de subida de documento...');

    const { nombre_documento, id_proyecto, firmantes, cambios_realizados } = req.body;
    const userId = req.user.id;

    console.log('📝 Datos recibidos:', {
      nombre_documento,
      id_proyecto,
      cambios_realizados,
      firmantes,
      userId,
      fileOriginalName: req.file?.originalname,
      fileSize: req.file?.size,
      fileMimeType: req.file?.mimetype
    });

    if (!req.file) {
      console.error('❌ No se proporcionó archivo');
      throw new AppError('No se proporcionó archivo', 400);
    }

    // Obtener nombre del proyecto
    console.log('🔍 Obteniendo nombre del proyecto...');
    const { nombre: projectName } = await getProjectInfo(id_proyecto);
    console.log('📄 Nombre del proyecto obtenido:', projectName);

    // Guardar PDF localmente
    console.log('💾 Guardando PDF en el sistema de archivos...');
    const urlPath = await fileUploadService.savePDF(req.file, id_proyecto, projectName, nombre_documento);
    console.log('✅ PDF guardado en:', urlPath);

    // Crear documento en la base de datos
    console.log('🗃️ Creando entrada del documento en la base de datos...');
    const documentId = await documentModel.createDocument({
      nombre_documento,
      id_proyecto,
      id_creado_por: userId
    });
    console.log('📑 Documento creado con ID:', documentId);

    // Crear versión del documento
    console.log('📚 Creando primera versión del documento...');
    const versionId = await documentModel.createDocumentVersion({
      id_documento: documentId,
      numero_version: 1,
      ruta_archivo: urlPath,
      tipo_mime: req.file.mimetype,
      cambios_realizados: cambios_realizados || 'Versión inicial',
      id_subido_por: userId
    });
    console.log('🆕 Versión creada con ID:', versionId);

    // Asignar firmantes si hay
    const firmantesArray = JSON.parse(firmantes || '[]');
    if (firmantesArray.length > 0) {
      console.log('✍️ Asignando firmantes a la versión:', firmantesArray);
      await documentModel.assignFirmantes(versionId, firmantesArray);
      console.log('✅ Firmantes asignados correctamente');
    } else {
      console.log('ℹ️ No se especificaron firmantes para esta versión');
    }

    // Notificación a todos los usuarios del proyecto
    console.log('📣 Obteniendo usuarios del proyecto para enviar notificación...');
    const proyectoUsuarios = await documentModel.getProjectUsers(id_proyecto);
    const todosIds = proyectoUsuarios.map(u => u.id);
    console.log('👥 Usuarios del proyecto:', todosIds);

    console.log('📨 Enviando notificación de nueva versión del documento...');
    await notify({
      tipo: NotificationTypes.DOCUMENTO_NUEVO_SUBIDO,
      destinatarios: todosIds,
      parametros: {
        nombreDocumento: nombre_documento,
        nombreProyecto: projectName
      },
      enlaceAccion: `/proyectos/${id_proyecto}/documentos/${documentId}`
    });
    console.log('✅ Notificación enviada correctamente');

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Documento subido exitosamente',
      data: { documentId, versionId }
    });

    console.log('🎉 Proceso completado exitosamente');

  } catch (error) {
    console.error('❌ Error en uploadDocument:', error);
    next(error);
  }
};


// Subir nueva versión
const uploadNewVersion = async (req, res, next) => {
  try {
    const { id_documento, cambios_realizados, firmantes } = req.body;
    const userId = req.user.id;

    if (!req.file) throw new AppError('No se proporcionó archivo', 400);

    if (!firmantes) throw new AppError('Debe indicar los firmantes', 400);
    const firmantesArray = JSON.parse(firmantes);
    if (!Array.isArray(firmantesArray) || firmantesArray.length === 0) {
      throw new AppError('Debe indicar al menos un firmante', 400);
    }

    const docInfo = await documentModel.getDocumentAndProjectInfo(id_documento);
    if (!docInfo) throw new AppError('Documento no encontrado', 404);

    const urlPath = await fileUploadService.savePDF(req.file, docInfo.id_proyecto, docInfo.nombre_proyecto, docInfo.nombre_documento);
    const nextVersion = await documentModel.getNextVersionNumber(id_documento);

    const versionId = await documentModel.createDocumentVersion({
      id_documento,
      numero_version: nextVersion,
      ruta_archivo: urlPath,
      tipo_mime: req.file.mimetype,
      cambios_realizados,
      id_subido_por: userId
    });

    await documentModel.assignFirmantes(versionId, firmantesArray);

    // NOTIFICACIÓN
    // Buscar usuarios administrador y cliente asignados al proyecto
    const proyectoUsuarios = await documentModel.getProjectUsers(docInfo.id_proyecto);
    const adminIds = proyectoUsuarios.filter(u => u.nombre_rol === 'Administrador').map(u => u.id);
    const clienteIds = proyectoUsuarios.filter(u => u.nombre_rol === 'Cliente').map(u => u.id);

    await notify({
      tipo: NotificationTypes.DOCUMENTO_NUEVA_VERSION,
      destinatarios: [...adminIds, ...clienteIds],
      parametros: { nombreDocumento: docInfo.nombre_documento, nombreProyecto: docInfo.nombre_proyecto },
      enlaceAccion: `/proyectos/${docInfo.id_proyecto}/documentos/${id_documento}`
    });

    res.status(201).json({
      success: true,
      message: 'Nueva versión subida exitosamente',
      data: { versionId }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener documentos del proyecto
const getDocumentsByProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.rol;

    const documents = await documentModel.getDocumentsByProject(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

// Obtener firmantes de una versión
const getFirmantesByVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const firmantes = await documentModel.getFirmantesByVersion(id);

    res.status(200).json({
      success: true,
      data: firmantes
    });
  } catch (error) {
    next(error);
  }
};

// Firmar documento
// Firmar documento
const signDocument = async (req, res, next) => {
  try {
    console.log('▶ Iniciando proceso de firma de documento');

    const { id } = req.params; // version ID
    const userId = req.user.id;
    const { x, y } = req.body;
    const { xRatio, yRatio } = req.body;

    console.log('📦 Parámetros recibidos:', { versionId: id, userId, x, y });

    if (!req.file) {
      console.warn('⚠ No se proporcionó archivo de firma');
      throw new AppError('No se proporcionó firma', 400);
    }
    console.log('🖋 Firma recibida:', req.file.originalname);

    const canSign = await documentModel.canUserSign(id, userId);
    console.log('🔐 ¿Usuario puede firmar?:', canSign);

    if (!canSign) throw new AppError('No tiene permisos para firmar este documento', 403);

    const versionInfo = await documentModel.getVersionInfo(id);
    console.log('📄 Información de la versión:', versionInfo);

    const docInfo = await documentModel.getDocumentAndProjectInfo(versionInfo.id_documento);
    console.log('📁 Información del documento y proyecto:', docInfo);

    const projectFolder = `${docInfo.id_proyecto}_${docInfo.nombre_proyecto}`.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const pdfAbsolutePath = path.join(__dirname, '..', 'uploads', 'documents', projectFolder, path.basename(versionInfo.ruta_archivo));

    console.log('📂 Ruta absoluta del PDF original:', pdfAbsolutePath);

    const signatureX = parseInt(x) || 100;
    const signatureY = parseInt(y) || 100;
    console.log('🖊 Coordenadas de firma:', { signatureX, signatureY });

    const signedPDF = await signatureService.applySignatureToPDF(
      pdfAbsolutePath,
      req.file.buffer,
      parseFloat(xRatio),
      parseFloat(yRatio)
    );

    console.log('✅ Firma aplicada al PDF');

    const signedUrlPath = await fileUploadService.saveSignedPDF(
      signedPDF,
      docInfo.id_proyecto,
      docInfo.nombre_proyecto,
      docInfo.nombre_documento
    );
    console.log('📤 PDF firmado guardado en:', signedUrlPath);

    await documentModel.updateVersionFile(id, signedUrlPath);
    console.log('✅ Ruta del archivo actualizada en la versión');

    await documentModel.registerSignature(id, userId);
    console.log('📝 Firma registrada en base de datos');

    // Notificar a próximos firmantes pendientes
    const firmantesPendientes = await documentModel.getFirmantesByVersion(id);
    console.log('📋 Firmantes de la versión:', firmantesPendientes);

    const pendientesIds = firmantesPendientes
      .filter(f => !f.firmado && !f.rechazo)
      .map(f => f.id_usuario);
    console.log('📨 Próximos firmantes pendientes:', pendientesIds);

    await notify({
      tipo: NotificationTypes.DOCUMENTO_FIRMA_PENDIENTE,
      destinatarios: pendientesIds,
      parametros: {
        nombreDocumento: docInfo.nombre_documento,
        nombreProyecto: docInfo.nombre_proyecto
      },
      enlaceAccion: `/proyectos/${docInfo.id_proyecto}/documentos/${docInfo.id_documento}`
    });
    console.log('📢 Notificación enviada a firmantes pendientes');

    // Si todos firmaron
    const allSigned = await documentModel.checkAllSigned(id);
    console.log('🔍 ¿Todos firmaron?:', allSigned);

    if (allSigned) {
      const proyectoUsuarios = await documentModel.getProjectUsers(docInfo.id_proyecto);
      console.log('👥 Usuarios del proyecto:', proyectoUsuarios);

      const adminIds = proyectoUsuarios
        .filter(u => u.nombre_rol === 'Administrador')
        .map(u => u.id); // corregido si antes era u.id_usuario

      const clienteIds = proyectoUsuarios
        .filter(u => u.nombre_rol === 'Cliente')
        .map(u => u.id); // corregido si antes era u.id_usuario

      console.log('📨 Notificación final - Admins:', adminIds, 'Clientes:', clienteIds);

      await notify({
        tipo: NotificationTypes.DOCUMENTO_FIRMADO_COMPLETO,
        destinatarios: [...adminIds, ...clienteIds],
        parametros: {
          nombreDocumento: docInfo.nombre_documento,
          nombreProyecto: docInfo.nombre_proyecto
        },
        enlaceAccion: `/proyectos/${docInfo.id_proyecto}/documentos/${docInfo.id_documento}`
      });
      console.log('📢 Notificación de firma completa enviada');

      await documentModel.moveToListaMaestra(id);
      console.log('📁 Documento movido a lista maestra');
    }

    res.status(200).json({
      success: true,
      message: 'Documento firmado exitosamente'
    });
    console.log('✅ Respuesta enviada al cliente');
  } catch (error) {
    console.error('❌ Error en signDocument:', error);
    next(error);
  }
};


// Rechazar documento
const rejectDocument = async (req, res, next) => {
  try {
    const { id } = req.params; // version ID
    const { comentario } = req.body;
    const userId = req.user.id;

    const canSign = await documentModel.canUserSign(id, userId);
    if (!canSign) throw new AppError('No tiene permisos para rechazar este documento', 403);

    await documentModel.rejectDocument(id, userId, comentario);

    // Notificar al colaborador que subió el documento
    const versionInfo = await documentModel.getVersionInfo(id);
    const colaboradorId = versionInfo.id_subido_por;
    const docInfo = await documentModel.getDocumentAndProjectInfo(versionInfo.id_documento);

    await notify({
      tipo: NotificationTypes.DOCUMENTO_RECHAZADO,
      destinatarios: [colaboradorId],
      parametros: { nombreDocumento: docInfo.nombre_documento, nombreProyecto: docInfo.nombre_proyecto },
      enlaceAccion: `/proyectos/${docInfo.id_proyecto}/documentos/${docInfo.id_documento}`
    });

    res.status(200).json({
      success: true,
      message: 'Documento rechazado'
    });
  } catch (error) {
    next(error);
  }
};

// Obtener historial de versiones
const getVersionHistory = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const versions = await documentModel.getVersionHistory(documentId);

    res.status(200).json({
      success: true,
      data: versions
    });
  } catch (error) {
    next(error);
  }
};

// Obtener lista maestra
const getListaMaestra = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const documents = await documentModel.getListaMaestra(projectId);

    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectUsers,
  uploadDocument,
  uploadNewVersion,
  getDocumentsByProject,
  getFirmantesByVersion,
  signDocument,
  rejectDocument,
  getVersionHistory,
  getListaMaestra
};