// File: backend/src/controllers/portfolioController.js
const {
    getAllPortfoliosWithPagination,
    getPortfolioById,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    checkPortfolioOwnership
} = require('../models/portfolioModel');
const { AppError } = require('../utils/errorHandler');

const getAllPortfolios = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            administrador = null,
            sortBy = 'fecha_creacion',
            sortOrder = 'DESC'
        } = req.query;

        const filters = {
            search: search.trim(),
            administrador: administrador ? parseInt(administrador) : null
        };

        const result = await getAllPortfoliosWithPagination(
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
            message: 'Portafolios obtenidos exitosamente',
            data: result.portfolios,
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

const getPortfolioByIdController = async (req, res, next) => {
    try {
        const { id } = req.params;

        const portfolio = await getPortfolioById(id, req.user.id, req.user.rol);
        if (!portfolio) {
            return next(new AppError('Portafolio no encontrado', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Portafolio obtenido exitosamente',
            data: portfolio
        });
    } catch (error) {
        next(error);
    }
};

const createPortfolioController = async (req, res, next) => {
    try {
        const { nombre, descripcion } = req.body;
        
        // Para Administradores, asignar su propio ID
        const id_administrador = req.user.rol === 'Administrador' ? req.user.id : req.body.id_administrador;

        const result = await createPortfolio({
            nombre,
            descripcion,
            id_administrador
        });

        const newPortfolio = await getPortfolioById(result.insertId, req.user.id, req.user.rol);

        res.status(201).json({
            success: true,
            message: 'Portafolio creado exitosamente',
            data: newPortfolio
        });
    } catch (error) {
        next(error);
    }
};

const updatePortfolioController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Verificar si el portafolio existe
        const existingPortfolio = await getPortfolioById(id, req.user.id, req.user.rol);
        if (!existingPortfolio) {
            return next(new AppError('Portafolio no encontrado', 404));
        }

        // Los administradores no pueden cambiar el administrador del portafolio
        if (req.user.rol === 'Administrador') {
            delete updateData.id_administrador;
        }

        const result = await updatePortfolio(id, updateData, req.user.id, req.user.rol);
        
        if (result.affectedRows === 0) {
            return next(new AppError('No se pudo actualizar el portafolio', 400));
        }

        const updatedPortfolio = await getPortfolioById(id, req.user.id, req.user.rol);

        res.status(200).json({
            success: true,
            message: 'Portafolio actualizado exitosamente',
            data: updatedPortfolio
        });
    } catch (error) {
        next(error);
    }
};

const deletePortfolioController = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verificar si el portafolio existe
        const existingPortfolio = await getPortfolioById(id, req.user.id, req.user.rol);
        if (!existingPortfolio) {
            return next(new AppError('Portafolio no encontrado', 404));
        }

        const result = await deletePortfolio(id, req.user.id, req.user.rol);
        
        if (result.affectedRows === 0) {
            return next(new AppError('No se pudo eliminar el portafolio', 400));
        }

        res.status(200).json({
            success: true,
            message: 'Portafolio eliminado exitosamente'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllPortfolios,
    getPortfolioByIdController,
    createPortfolioController,
    updatePortfolioController,
    deletePortfolioController
};