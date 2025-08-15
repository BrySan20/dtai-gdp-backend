// File: backend/src/utils/multerConfig.js
const multer = require('multer');

// Configuración de almacenamiento en memoria
const storage = multer.memoryStorage();

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  // Permitir PDFs para documentos y imágenes para firmas
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo PDF e imágenes.'), false);
  }
};

// Configuración principal de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB máximo
  },
  fileFilter: fileFilter
});

module.exports = upload;