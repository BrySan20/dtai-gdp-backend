// backend/src/services/fileUploadService.js
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads', 'documents');

function sanitizeFileName(name) {
  // Quita caracteres peligrosos y limita longitud
  return name.replace(/[^a-zA-Z0-9_\-\.]/g, '_').substring(0, 100);
}

/**
 * Guarda un PDF en la carpeta de proyecto correspondiente.
 * @param {Object} file - archivo subido por multer (en .buffer)
 * @param {Number} projectId
 * @param {String} projectName
 * @param {String} documentName
 * @returns {String} relative url path
 */
const savePDF = async (file, projectId, projectName, documentName) => {
  return new Promise((resolve, reject) => {
    try {
      const projectFolder = sanitizeFileName(`${projectId}_${projectName}`);
      const folderPath = path.join(UPLOADS_ROOT, projectFolder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Nombre archivo: docUUID_nombre.pdf
      const filename = `${uuidv4()}_${sanitizeFileName(documentName)}.pdf`;
      const filePath = path.join(folderPath, filename);
      fs.writeFileSync(filePath, file.buffer);

      // Construir ruta pública relativa para el frontend
      // Ejemplo: /api/v1/documents/files/3_ProyectoDemo/uuid_nombre.pdf
      const urlPath = `/api/v1/documents/files/${projectFolder}/${filename}`;
      resolve(urlPath);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Guarda un PDF firmado en la carpeta del proyecto.
 * @param {Buffer} pdfBuffer
 * @param {Number} projectId
 * @param {String} projectName
 * @param {String} documentName
 * @returns {String} relative url path
 */
const saveSignedPDF = async (pdfBuffer, projectId, projectName, documentName) => {
  return new Promise((resolve, reject) => {
    try {
      const projectFolder = sanitizeFileName(`${projectId}_${projectName}`);
      const folderPath = path.join(UPLOADS_ROOT, projectFolder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      const filename = `signed_${uuidv4()}_${sanitizeFileName(documentName)}.pdf`;
      const filePath = path.join(folderPath, filename);
      fs.writeFileSync(filePath, pdfBuffer);

      const urlPath = `/api/v1/documents/files/${projectFolder}/${filename}`;
      resolve(urlPath);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  savePDF,
  saveSignedPDF,
};