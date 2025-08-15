// File: backend/src/controllers/userProjectController.js
const { getUserProjects } = require('../models/userProjectModel');
const { AppError } = require('../utils/errorHandler');

// Obtener proyectos del usuario autenticado
const getMyProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.rol;

    const projects = await getUserProjects(userId, userRole);

    res.status(200).json({
      success: true,
      message: 'Proyectos obtenidos exitosamente',
      data: projects
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProjects,
};