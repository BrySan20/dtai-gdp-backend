//File: backend/src/controllers/programController.js
const {
  getAllProgramsWithPagination,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  checkPortfolioOwnership
} = require('../models/programModel');
const { AppError } = require('../utils/errorHandler');

const getAllPrograms = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      portafolio = null,
      administrador = null,
      sortBy = 'fecha_creacion',
      sortOrder = 'DESC'
    } = req.query;

    const filters = {
      search: search.trim(),
      portafolio: portafolio ? parseInt(portafolio) : null,
      administrador: administrador ? parseInt(administrador) : null
    };

    const result = await getAllProgramsWithPagination(
      parseInt(page),
      parseInt(limit),
      filters,
      sortBy,
      sortOrder,
      req.user.id,
      req.user.rol
    );

    res.status(200).json({
      success: true,
      message: 'Programas obtenidos exitosamente',
      data: result.programs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(result.total / parseInt(limit)),
        totalItems: result.total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < Math.ceil(result.total / parseInt(limit)),
        hasPreviousPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProgramByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const program = await getProgramById(id, req.user.id, req.user.rol);
    if (!program) {
      return next(new AppError('Programa no encontrado', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Programa obtenido exitosamente',
      data: program
    });
  } catch (error) {
    next(error);
  }
};

const createProgramController = async (req, res, next) => {
  try {
    const { nombre, descripcion, id_portafolio } = req.body;

    // Verificar que el portafolio pertenece al usuario
    const portfolioExists = await checkPortfolioOwnership(id_portafolio, req.user.id, req.user.rol);
    if (!portfolioExists) {
      return next(new AppError('Portafolio no encontrado o no tienes permisos para crear programas en él', 403));
    }

    // Para Administradores, asignar su propio ID
    const id_administrador = req.user.rol === 'Administrador' ? req.user.id : req.body.id_administrador;

    const result = await createProgram({
      nombre,
      descripcion,
      id_portafolio,
      id_administrador
    });

    const newProgram = await getProgramById(result.insertId, req.user.id, req.user.rol);

    res.status(201).json({
      success: true,
      message: 'Programa creado exitosamente',
      data: newProgram
    });
  } catch (error) {
    next(error);
  }
};

const updateProgramController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar si el programa existe
    const existingProgram = await getProgramById(id, req.user.id, req.user.rol);
    if (!existingProgram) {
      return next(new AppError('Programa no encontrado', 404));
    }

    // Los administradores no pueden cambiar el administrador del programa
    if (req.user.rol === 'Administrador') {
      delete updateData.id_administrador;
    }

    // Si se está cambiando el portafolio, verificar permisos
    if (updateData.id_portafolio) {
      const portfolioExists = await checkPortfolioOwnership(updateData.id_portafolio, req.user.id, req.user.rol);
      if (!portfolioExists) {
        return next(new AppError('Portafolio no encontrado o no tienes permisos para mover el programa a él', 403));
      }
    }

    const result = await updateProgram(id, updateData, req.user.id, req.user.rol);

    if (result.affectedRows === 0) {
      return next(new AppError('No se pudo actualizar el programa', 400));
    }

    const updatedProgram = await getProgramById(id, req.user.id, req.user.rol);

    res.status(200).json({
      success: true,
      message: 'Programa actualizado exitosamente',
      data: updatedProgram
    });
  } catch (error) {
    next(error);
  }
};

const deleteProgramController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar si el programa existe
    const existingProgram = await getProgramById(id, req.user.id, req.user.rol);
    if (!existingProgram) {
      return next(new AppError('Programa no encontrado', 404));
    }

    const result = await deleteProgram(id, req.user.id, req.user.rol);

    if (result.affectedRows === 0) {
      return next(new AppError('No se pudo eliminar el programa', 400));
    }

    res.status(200).json({
      success: true,
      message: 'Programa eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPrograms,
  getProgramByIdController,
  createProgramController,
  updateProgramController,
  deleteProgramController
};