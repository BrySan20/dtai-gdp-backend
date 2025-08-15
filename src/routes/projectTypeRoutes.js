const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const tipos = await executeQuery('SELECT id, nombre_tipo, descripcion FROM Tipos_Proyecto');
    res.json({ success: true, data: tipos });
  } catch (err) {
    next(err);
  }
});

module.exports = router;