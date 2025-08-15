// File: backend/src/controllers/taskController.js
const {
    getTasksByProject,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    getTaskById
} = require('../models/taskModel');
const { getProjectUsers } = require('../models/projectUserRoleModel');
const { getProjectById } = require('../models/projectModel');
const { notify, NotificationTypes } = require('../services/notificationService');
const { AppError } = require('../utils/errorHandler');

// Obtener tareas de un proyecto
const getProjectTasksController = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        // Verifica si el proyecto existe y si el usuario tiene acceso
        const project = await getProjectById(projectId, req.user.id, req.user.rol);
        if (!project) return next(new AppError('Proyecto no encontrado o sin permisos', 404));
        const tasks = await getTasksByProject(projectId);

        // Mapear usuario asignado y creador
        const projectUsers = await getProjectUsers(projectId);

        const tasksMapped = tasks.map(task => {
            const asignado = projectUsers.find(u => u.id_usuario === task.id_usuario_asignado);
            const creador = projectUsers.find(u => u.id_usuario === task.id_creador);
            return {
                ...task,
                usuarioAsignado: asignado ? `${asignado.nombre} ${asignado.apellido}` : null,
                creador: creador ? `${creador.nombre} ${creador.apellido}` : null,
            };
        });

        res.status(200).json({
            success: true,
            message: 'Tareas obtenidas exitosamente',
            data: tasksMapped
        });
    } catch (error) {
        next(error);
    }
};

// Crear tarea en un proyecto
const createTaskController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      nombre, descripcion, prioridad, estatus,
      nivelRiesgo, faseCicloVida, fechaInicio, fechaVencimiento, usuarioAsignado
    } = req.body;

    const project = await getProjectById(projectId, req.user.id, req.user.rol);
    if (!project) return next(new AppError('Proyecto no encontrado o sin permisos', 404));

    const projectUsers = await getProjectUsers(projectId);
    const validUser = projectUsers.some(u => u.id_usuario === usuarioAsignado);
    if (!validUser) return next(new AppError('Usuario asignado no pertenece al proyecto', 400));

    const newTaskData = {
      nombre,
      descripcion,
      prioridad,
      estatus,
      nivelRiesgo,
      faseCicloVida,
      fechaInicio,
      fechaVencimiento,
      id_proyecto: projectId,
      id_usuario_asignado: usuarioAsignado,
      id_creador: req.user.id
    };

    const result = await createTask(newTaskData);
    const newTask = await getTaskById(result.insertId);

    // Notificar al colaborador asignado
    await notify({
      tipo: NotificationTypes.TAREA_ASIGNADA,
      destinatarios: [usuarioAsignado],
      parametros: { nombreTarea: nombre, nombreProyecto: project.nombre },
      enlaceAccion: `/proyectos/${projectId}/tareas/${result.insertId}`
    });

    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente',
      data: newTask
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar tarea
const updateTaskController = async (req, res, next) => {
    try {
        const { projectId, taskId } = req.params;
        const updates = req.body;

        const task = await getTaskById(taskId);
        if (!task || task.id_proyecto != projectId) {
            return next(new AppError('Tarea no encontrada en este proyecto', 404));
        }

        // Si se cambia usuarioAsignado, validar que pertenece al proyecto
        if (updates.usuarioAsignado) {
            const projectUsers = await getProjectUsers(projectId);
            const validUser = projectUsers.some(u => u.id_usuario === updates.usuarioAsignado);
            if (!validUser) return next(new AppError('Usuario asignado no pertenece al proyecto', 400));
        }

        const updateData = {
            ...updates,
            id_usuario_asignado: updates.usuarioAsignado,
            usuarioAsignado: undefined // no guardar en BD
        };

        const result = await updateTask(taskId, updateData);
        if (result.affectedRows === 0)
            return next(new AppError('No se pudo actualizar la tarea', 400));

        const updatedTask = await getTaskById(taskId);

        res.status(200).json({
            success: true,
            message: 'Tarea actualizada exitosamente',
            data: updatedTask
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar tarea
const deleteTaskController = async (req, res, next) => {
    try {
        const { projectId, taskId } = req.params;
        const task = await getTaskById(taskId);
        if (!task || task.id_proyecto != projectId) {
            return next(new AppError('Tarea no encontrada en este proyecto', 404));
        }
        const result = await deleteTask(taskId);
        if (result.affectedRows === 0)
            return next(new AppError('No se pudo eliminar la tarea', 400));
        res.status(200).json({
            success: true,
            message: 'Tarea eliminada exitosamente'
        });
    } catch (error) {
        next(error);
    }
};

// Actualizar solo estatus (drag-and-drop)
const updateTaskStatusController = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { estatus } = req.body;

        const task = await getTaskById(taskId);
        if (!task) return next(new AppError('Tarea no encontrada', 404));

        const result = await updateTaskStatus(taskId, estatus);
        if (result.affectedRows === 0)
            return next(new AppError('No se pudo actualizar el estatus de la tarea', 400));

        const updatedTask = await getTaskById(taskId);

        res.status(200).json({
            success: true,
            message: 'Estatus de tarea actualizado',
            data: updatedTask
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProjectTasksController,
    createTaskController,
    updateTaskController,
    deleteTaskController,
    updateTaskStatusController
};