// File: backend/src/routes/documentRoutes.js
const express = require('express');
const multer = require('multer');
const {
  getProjectUsers,
  uploadDocument,
  uploadNewVersion,
  getDocumentsByProject,
  getFirmantesByVersion,
  signDocument,
  rejectDocument,
  getVersionHistory,
  getListaMaestra
} = require('../controllers/documentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Configuración de multer para archivos temporales
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF e imágenes'), false);
    }
  }
});

// Obtener usuarios del proyecto para asignar como firmantes
router.get('/project-users/:projectId',
  authMiddleware,
  checkRole(['Superadministrador','Administrador', 'Colaborador', 'Cliente']),
  getProjectUsers
);

// Subir nuevo documento
router.post('/upload',
  authMiddleware,
  checkRole(['Superadministrador','Administrador', 'Colaborador']),
  upload.single('documento'),
  uploadDocument
);

// Subir nueva versión
router.post('/upload-version',
  authMiddleware,
  checkRole(['Superadministrador','Administrador', 'Colaborador']),
  upload.single('documento'),
  uploadNewVersion
);

// Obtener documentos de un proyecto
router.get('/project/:id',
  authMiddleware,
  checkRole(['Superadministrador','Administrador', 'Colaborador', 'Cliente']),
  getDocumentsByProject
);

// Obtener firmantes de una versión
router.get('/version/:id/firmantes',
  authMiddleware,
  checkRole(['Superadministrador','Administrador', 'Colaborador', 'Cliente']),
  getFirmantesByVersion
);

// Firmar documento
router.post('/sign/:id',
  authMiddleware,
  checkRole(['Superadministrador','Administrador', 'Cliente', 'Colaborador']),
  upload.single('firma'),
  signDocument
);

// Rechazar documento
router.post('/reject/:id',
  authMiddleware,
  checkRole(['Superadministrador','Administrador', 'Cliente', 'Colaborador']),
  rejectDocument
);

// Obtener historial de versiones
router.get('/versiones/:documentId',
  authMiddleware,
  checkRole(['Superadministrador','Administrador', 'Colaborador', 'Cliente']),
  getVersionHistory
);

// Obtener lista maestra
router.get('/lista-maestra/:projectId',
  authMiddleware,
  checkRole(['Superadministrador','Administrador', 'Colaborador', 'Cliente']),
  getListaMaestra
);

module.exports = router;