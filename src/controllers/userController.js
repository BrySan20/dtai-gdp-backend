// File: backend/src/controllers/userController.js
const {
  getAllUsersWithPagination,
  getUserByIdAdmin,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  toggleUserStatusAdmin,
  changePasswordAdmin,
  checkEmailExistsExcluding, getAvailableUsers
} = require('../models/userModel');
const { getAllRoles } = require('../models/roleModel');
const { hashPassword } = require('../utils/passwordHash');
const { AppError } = require('../utils/errorHandler');

const isSuperadmin = (user) => user.nombre_rol === 'Superadministrador';

const getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      rol = null,
      activo = null,
      sortBy = 'fecha_registro',
      sortOrder = 'DESC'
    } = req.query;

    const filters = {
      search: search.trim(),
      rol: rol ? parseInt(rol) : null,
      activo: activo !== null ? activo === 'true' : null
    };

    const result = await getAllUsersWithPagination(
      parseInt(page),
      parseInt(limit),
      filters,
      sortBy,
      sortOrder
    );

    res.status(200).json({
      success: true,
      message: 'Usuarios obtenidos exitosamente',
      data: result.users,
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

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await getUserByIdAdmin(id);
    if (!user) {
      return next(new AppError('Usuario no encontrado', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Usuario obtenido exitosamente',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password, telefono, id_rol, activo = true } = req.body;

    // Verificar si el email ya existe
    const emailExists = await checkEmailExistsExcluding(email);
    if (emailExists) {
      return next(new AppError('El email ya está registrado', 409));
    }

    // Hash de la contraseña
    const password_hash = await hashPassword(password);

    const result = await createUserAdmin({
      nombre,
      apellido,
      email,
      password_hash,
      telefono,
      id_rol,
      activo
    });

    const newUser = await getUserByIdAdmin(result.insertId);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: newUser
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar si el usuario existe
    const existingUser = await getUserByIdAdmin(id);
    if (!existingUser) {
      return next(new AppError('Usuario no encontrado', 404));
    }

    if (isSuperadmin(existingUser)) {
      return next(new AppError('No puedes modificar a un superadministrador', 403));
    }

    // Si se está actualizando el email, verificar que no exista
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await checkEmailExistsExcluding(updateData.email, id);
      if (emailExists) {
        return next(new AppError('El email ya está registrado', 409));
      }
    }

    await updateUserAdmin(id, updateData);
    const updatedUser = await getUserByIdAdmin(id);

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar si el usuario existe
    const existingUser = await getUserByIdAdmin(id);
    if (!existingUser) {
      return next(new AppError('Usuario no encontrado', 404));
    }

    // Verificar que no sea el propio usuario
    if (parseInt(id) === req.user.id) {
      return next(new AppError('No puedes eliminar tu propio usuario', 400));
    }

    // Validar que no se elimine a un superadministrador
    if (isSuperadmin(existingUser)) {
      return next(new AppError('No puedes eliminar a un superadministrador', 403));
    }

    await deleteUserAdmin(id);

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    // Verificar si el usuario existe
    const existingUser = await getUserByIdAdmin(id);
    if (!existingUser) {
      return next(new AppError('Usuario no encontrado', 404));
    }

    // Verificar que no sea el propio usuario
    if (parseInt(id) === req.user.id) {
      return next(new AppError('No puedes cambiar tu propio estado', 400));
    }

    if (isSuperadmin(existingUser)) {
      return next(new AppError('No puedes cambiar el estado de un superadministrador', 403));
    }

    await toggleUserStatusAdmin(id, activo);
    const updatedUser = await getUserByIdAdmin(id);

    res.status(200).json({
      success: true,
      message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

const changeUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Verificar si el usuario existe
    const existingUser = await getUserByIdAdmin(id);
    if (!existingUser) {
      return next(new AppError('Usuario no encontrado', 404));
    }

    // Hash de la nueva contraseña
    const password_hash = await hashPassword(newPassword);

    await changePasswordAdmin(id, password_hash);

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

const getRoles = async (req, res, next) => {
  try {
    const roles = await getAllRoles();

    res.status(200).json({
      success: true,
      message: 'Roles obtenidos exitosamente',
      data: roles
    });
  } catch (error) {
    next(error);
  }
};

// Obtener usuarios disponibles para asignar a proyectos
const getAvailableUsersController = async (req, res, next) => {
  try {
    const users = await getAvailableUsers();

    res.status(200).json({
      success: true,
      message: 'Usuarios disponibles obtenidos exitosamente',
      data: users
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  changeUserPassword,
  getRoles,
  getAvailableUsersController
};