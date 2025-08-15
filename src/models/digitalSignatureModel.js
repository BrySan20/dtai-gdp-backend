// File: backend/src/models/digitalSignatureModel.js
const { executeQuery } = require('../config/database');

// Crear una firma digital
const createDigitalSignature = async (signatureData) => {
  const { id_documento_version, id_usuario } = signatureData;
  
  const query = `
    INSERT INTO Firmas_Digitales (id_documento_version, id_usuario)
    VALUES (?, ?)
  `;
  
  return await executeQuery(query, [id_documento_version, id_usuario]);
};

// Obtener las firmas digitales de un documento
const getDocumentSignatures = async (documentVersionId) => {
  const query = `
    SELECT fd.*, u.nombre, u.apellido, r.nombre_rol
    FROM Firmas_Digitales fd
    JOIN Usuarios u ON fd.id_usuario = u.id
    JOIN Roles r ON u.id_rol = r.id
    WHERE fd.id_documento_version = ?
    ORDER BY fd.fecha_firma DESC
  `;
  
  return await executeQuery(query, [documentVersionId]);
};

// Verificar si un usuario ya ha firmado un documento
const hasUserSignedDocument = async (documentVersionId, userId) => {
  const query = `
    SELECT COUNT(*) as count
    FROM Firmas_Digitales
    WHERE id_documento_version = ? AND id_usuario = ?
  `;
  
  const result = await executeQuery(query, [documentVersionId, userId]);
  return result[0].count > 0;
};

module.exports = {
  createDigitalSignature,
  getDocumentSignatures,
  hasUserSignedDocument
};