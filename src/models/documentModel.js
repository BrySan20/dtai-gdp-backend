// File: backend/src/models/documentModel.js
const { executeQuery } = require('../config/database');

// Obtener usuarios del proyecto para firmantes
const getProjectUsers = async (projectId) => {
  const query = `
    SELECT DISTINCT 
      u.id,
      CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
      u.email,
      r.nombre_rol
    FROM Usuarios u
    JOIN Proyecto_Usuarios pu ON u.id = pu.id_usuario
    JOIN Roles r ON u.id_rol = r.id
    WHERE pu.id_proyecto = ? AND r.nombre_rol IN ('Administrador', 'Cliente', 'Colaborador')
    ORDER BY u.nombre, u.apellido
  `;
  return await executeQuery(query, [projectId]);
};

// Crear documento
const createDocument = async (data) => {
  const query = `
    INSERT INTO Documentos (nombre_documento, id_proyecto, id_creado_por)
    VALUES (?, ?, ?)
  `;
  const result = await executeQuery(query, [data.nombre_documento, data.id_proyecto, data.id_creado_por]);
  return result.insertId;
};

// Crear versión de documento
const createDocumentVersion = async (data) => {
  const query = `
    INSERT INTO Documento_Versiones 
    (id_documento, numero_version, ruta_archivo, tipo_mime, cambios_realizados, id_subido_por)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const result = await executeQuery(query, [
    data.id_documento, data.numero_version, data.ruta_archivo,
    data.tipo_mime, data.cambios_realizados, data.id_subido_por
  ]);
  return result.insertId;
};

// Asignar firmantes a una versión (fix SQL syntax)
const assignFirmantes = async (versionId, firmantes) => {
  if (!firmantes || !firmantes.length) return;
  // Crea placeholders (?,?) por cada firmante
  const valuesPlaceholders = firmantes.map(() => '(?, ?)').join(', ');
  const values = [];
  firmantes.forEach(userId => {
    values.push(versionId, userId);
  });
  const query = `
    INSERT INTO Firmantes_Documento (id_documento_version, id_usuario)
    VALUES ${valuesPlaceholders}
  `;
  return await executeQuery(query, values);
};

// Obtener siguiente número de versión
const getNextVersionNumber = async (documentId) => {
  const query = `
    SELECT COALESCE(MAX(numero_version), 0) + 1 as next_version
    FROM Documento_Versiones
    WHERE id_documento = ?
  `;
  const result = await executeQuery(query, [documentId]);
  return result[0].next_version;
};

// Obtener documentos del proyecto (agrega total firmantes y firmados)
const getDocumentsByProject = async (projectId, userId, userRole) => {
  let query = `
    SELECT DISTINCT
      d.id,
      d.nombre_documento,
      dv.id as version_id,
      dv.numero_version,
      dv.ruta_archivo,
      dv.estatus,
      dv.fecha_subida,
      dv.cambios_realizados,
      dv.comentario_rechazo,
      CONCAT(u.nombre, ' ', u.apellido) as subido_por,
      CASE 
        WHEN fd.id_usuario = ? THEN true 
        ELSE false 
      END as puede_firmar,
      fd.firmado,
      fd.rechazo,
      (
        SELECT COUNT(*) FROM Firmantes_Documento WHERE id_documento_version = dv.id
      ) as total_firmantes,
      (
        SELECT COUNT(*) FROM Firmantes_Documento WHERE id_documento_version = dv.id AND firmado = true
      ) as firmados
    FROM Documentos d
    JOIN Documento_Versiones dv ON d.id = dv.id_documento
    LEFT JOIN Firmantes_Documento fd ON dv.id = fd.id_documento_version AND fd.id_usuario = ?
    JOIN Usuarios u ON dv.id_subido_por = u.id
    WHERE d.id_proyecto = ?
      AND dv.id = (
        SELECT MAX(dv2.id) 
        FROM Documento_Versiones dv2 
        WHERE dv2.id_documento = d.id
      )
  `;

  if (userRole === 'Colaborador') {
    query += ` AND (dv.id_subido_por = ? OR fd.id_usuario = ?)`;
    return await executeQuery(query, [userId, userId, projectId, userId, userId]);
  }

  return await executeQuery(query, [userId, userId, projectId]);
};

// Obtener firmantes de una versión
const getFirmantesByVersion = async (versionId) => {
  const query = `
    SELECT 
      fd.id_usuario,
      CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
      u.email,
      fd.firmado,
      fd.fecha_firma,
      fd.rechazo,
      fd.comentario_rechazo
    FROM Firmantes_Documento fd
    JOIN Usuarios u ON fd.id_usuario = u.id
    WHERE fd.id_documento_version = ?
    ORDER BY u.nombre, u.apellido
  `;
  return await executeQuery(query, [versionId]);
};

// Verificar si usuario puede firmar
const canUserSign = async (versionId, userId) => {
  const query = `
    SELECT COUNT(*) as count
    FROM Firmantes_Documento
    WHERE id_documento_version = ? AND id_usuario = ? AND firmado = false AND rechazo = false
  `;
  const result = await executeQuery(query, [versionId, userId]);
  return result[0].count > 0;
};

// Obtener información de la versión
const getVersionInfo = async (versionId) => {
  const query = `
    SELECT dv.*, d.nombre_documento
    FROM Documento_Versiones dv
    JOIN Documentos d ON dv.id_documento = d.id
    WHERE dv.id = ?
  `;
  const result = await executeQuery(query, [versionId]);
  return result[0];
};

// Actualizar ruta del archivo
const updateVersionFile = async (versionId, newPath) => {
  const query = `
    UPDATE Documento_Versiones
    SET ruta_archivo = ?
    WHERE id = ?
  `;
  return await executeQuery(query, [newPath, versionId]);
};

// Registrar firma
const registerSignature = async (versionId, userId) => {
  const query = `
    UPDATE Firmantes_Documento
    SET firmado = true, fecha_firma = NOW()
    WHERE id_documento_version = ? AND id_usuario = ?
  `;
  return await executeQuery(query, [versionId, userId]);
};

// Verificar si todos han firmado (solo firmantes válidos de esa versión, no rechazados)
const checkAllSigned = async (versionId) => {
  const query = `
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN COALESCE(firmado, 0) = 1 THEN 1 ELSE 0 END) AS firmados
    FROM Firmantes_Documento
    WHERE id_documento_version = ? AND COALESCE(rechazo, 0) = 0
  `;
  const result = await executeQuery(query, [versionId]);
  const total = Number(result[0].total);
  const firmados = Number(result[0].firmados);
  console.log('DEBUG checkAllSigned:', { versionId, total, firmados, eq: total === firmados });
  return total > 0 && total === firmados;
};

// Mover a lista maestra
const moveToListaMaestra = async (versionId) => {
  await executeQuery(`
    UPDATE Documento_Versiones
    SET estatus = 'Firmado'
    WHERE id = ?
  `, [versionId]);

  const query = `
    INSERT IGNORE INTO Lista_Maestra_Documentos (id_documento_version, id_proyecto)
    SELECT dv.id, d.id_proyecto
    FROM Documento_Versiones dv
    JOIN Documentos d ON dv.id_documento = d.id
    WHERE dv.id = ?
  `;
  return await executeQuery(query, [versionId]);
};

// Rechazar documento
const rejectDocument = async (versionId, userId, comentario) => {
  // Actualizar estatus de la versión
  await executeQuery(`
    UPDATE Documento_Versiones
    SET estatus = 'Rechazado', comentario_rechazo = ?
    WHERE id = ?
  `, [comentario, versionId]);

  // Registrar rechazo del firmante
  const query = `
    UPDATE Firmantes_Documento
    SET rechazo = true, comentario_rechazo = ?
    WHERE id_documento_version = ? AND id_usuario = ?
  `;
  return await executeQuery(query, [comentario, versionId, userId]);
};

// Obtener historial de versiones
const getVersionHistory = async (documentId) => {
  const query = `
    SELECT 
      dv.*,
      CONCAT(u.nombre, ' ', u.apellido) as subido_por,
      COUNT(fd.id_usuario) as total_firmantes,
      SUM(CASE WHEN fd.firmado = true THEN 1 ELSE 0 END) as firmados
    FROM Documento_Versiones dv
    JOIN Usuarios u ON dv.id_subido_por = u.id
    LEFT JOIN Firmantes_Documento fd ON dv.id = fd.id_documento_version
    WHERE dv.id_documento = ?
    GROUP BY dv.id
    ORDER BY dv.numero_version DESC
  `;
  return await executeQuery(query, [documentId]);
};

// Obtener lista maestra
const getListaMaestra = async (projectId) => {
  const query = `
    SELECT 
      d.id,
      d.nombre_documento,
      dv.numero_version,
      dv.ruta_archivo,
      dv.fecha_subida,
      lmd.fecha_inclusion,
      CONCAT(u.nombre, ' ', u.apellido) as subido_por
    FROM Lista_Maestra_Documentos lmd
    JOIN Documento_Versiones dv ON lmd.id_documento_version = dv.id
    JOIN Documentos d ON dv.id_documento = d.id
    JOIN Usuarios u ON dv.id_subido_por = u.id
    WHERE lmd.id_proyecto = ?
    ORDER BY lmd.fecha_inclusion DESC
  `;
  return await executeQuery(query, [projectId]);
};

// Obtener nombre del proyecto por id (para folder)
const getProjectNameById = async (projectId) => {
  const result = await executeQuery(
    'SELECT id, nombre FROM Proyectos WHERE id = ?',
    [projectId]
  );
  return result[0];
};

// Obtener info documento y proyecto (para versiones y firmar)
const getDocumentAndProjectInfo = async (documentId) => {
  const result = await executeQuery(
    `SELECT 
      d.id as id_documento, d.nombre_documento, d.id_proyecto,
      p.nombre as nombre_proyecto
    FROM Documentos d
    JOIN Proyectos p ON d.id_proyecto = p.id
    WHERE d.id = ?`,
    [documentId]
  );
  return result[0];
};

// Obtener la última versión de un documento
const getLatestVersionByDocument = async (documentId) => {
  const query = `
    SELECT * FROM Documento_Versiones
    WHERE id_documento = ?
    ORDER BY numero_version DESC
    LIMIT 1
  `;
  const result = await executeQuery(query, [documentId]);
  return result[0];
};

// Obtener los IDs de firmantes de una versión
const getFirmantesIdsByVersion = async (versionId) => {
  const query = `
    SELECT id_usuario FROM Firmantes_Documento
    WHERE id_documento_version = ?
  `;
  const result = await executeQuery(query, [versionId]);
  return result.map(r => r.id_usuario);
};

// Obtener firmantes completos (no sólo ids) de una versión
const getFirmantesFullByVersion = async (versionId) => {
  const query = `
    SELECT id_usuario
    FROM Firmantes_Documento
    WHERE id_documento_version = ?
  `;
  const result = await executeQuery(query, [versionId]);
  return result.map(r => r.id_usuario);
};

module.exports = {
  getProjectUsers,
  createDocument,
  createDocumentVersion,
  assignFirmantes,
  getNextVersionNumber,
  getDocumentsByProject,
  getFirmantesByVersion,
  canUserSign,
  getVersionInfo,
  updateVersionFile,
  registerSignature,
  checkAllSigned,
  moveToListaMaestra,
  rejectDocument,
  getVersionHistory,
  getListaMaestra,
  getProjectNameById,
  getDocumentAndProjectInfo,
  getLatestVersionByDocument,
  getFirmantesIdsByVersion,
  getFirmantesFullByVersion
};