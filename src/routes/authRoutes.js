// File: backend/src/routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const { loginUser, registerUser, verifyEmail, sendVerificationCode, resendVerificationCode, forgotPassword, verifyResetCode, resetPassword,  } = require('../controllers/authController');
const { validateLogin, validateRegister, validateVerifyEmail, handleValidationErrors, validateResetPassword } = require('../middlewares/validationMiddleware');

const router = express.Router();

// Ruta para login de usuario
router.post('/login', validateLogin, loginUser);
// Ruta para registro de usuario
router.post('/register', validateRegister, registerUser);
router.post('/verify-email', validateVerifyEmail, verifyEmail);
router.post('/resend-verification',
  body('email').isEmail().normalizeEmail().withMessage('Email debe ser válido'),
  handleValidationErrors,
  resendVerificationCode
);
// Rutas para recuperación de contraseña
router.post('/forgot-password',
  body('email').isEmail().normalizeEmail().withMessage('Email debe ser válido'),
  handleValidationErrors,
  forgotPassword
);
router.post('/verify-reset-code',
  body('email').isEmail().normalizeEmail().withMessage('Email debe ser válido'),
  body('codigo').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Código debe ser de 6 dígitos'),
  handleValidationErrors,
  verifyResetCode
);
router.post('/reset-password', validateResetPassword, resetPassword);
// Ruta para enviar código de verificación
router.post('/send-verification-code',
    body('email').isEmail().normalizeEmail().withMessage('Email debe ser válido'),
    body('nombre').trim().isLength({min: 2}).withMessage('Nombre requerido'),
    handleValidationErrors,
    sendVerificationCode
);


module.exports = router;