// File: backend/src/controllers/userTaskController.js
const {
    getAllTasksByProject,
    updateStatusIfOwner
} = require('../models/userTaskModel');
const { AppError } = require('../utils/errorHandler');
const { getTaskById } = require('../models/taskModel');
const { notify, NotificationTypes } = require('../services/notificationService');

// Obtener todas las tareas de un proyecto (para tablero kanban)
const getProjectTasksForUser = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const user = req.user; // { id, nombre_rol, ... }

        // Obtiene TODAS las tareas del proyecto
        const tasks = await getAllTasksByProject(projectId);

        res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        next(error);
    }
};

// Cambiar estatus de tarea (solo si pertenece al usuario logueado)
// Cambiar estatus de tarea (solo si pertenece al usuario logueado)
const changeUserTaskStatus = async (req, res, next) => {
    try {
        console.log('▶ Iniciando cambio de estatus de tarea');

        const { taskId } = req.params;
        const { estatus } = req.body;
        const userId = req.user.id;
        const userRole = req.user.rol;

        console.log('📦 Datos recibidos:', { taskId, estatus, userId, userRole });

        // Solo Colaborador puede modificar sus propias tareas
        if (userRole !== 'Colaborador') {
            console.warn('⛔ Usuario no autorizado: solo Colaborador puede modificar tareas');
            return next(new AppError('Solo los colaboradores pueden modificar el estatus de sus tareas', 403));
        }

        const result = await updateStatusIfOwner(taskId, userId, estatus);
        console.log('🔄 Resultado de la actualización de estatus:', result);

        if (result.affectedRows === 0) {
            console.warn('⚠ Tarea no modificada: no pertenece al usuario o no existe');
            return next(new AppError('No tienes permisos para modificar esta tarea o la tarea no existe', 403));
        }

        // Si la tarea se completó, notifica a los administradores del proyecto
        if (estatus === 'Completada') {
            console.log('✅ Tarea marcada como Completada. Buscando información del proyecto y notificando a administradores...');

            const task = await getTaskById(taskId);
            console.log('📄 Información de la tarea:', task);

            const projectUsers = await require('../models/projectUserRoleModel').getProjectUsers(task.id_proyecto);
            console.log('👥 Usuarios del proyecto:', projectUsers);

            console.log('👀 Verificando usuarios administradores:', projectUsers);

            const adminIds = projectUsers
                .filter(u => u.nombre_rol === 'Administrador' && u.id_usuario !== undefined)
                .map(u => u.id_usuario);


            console.log('📨 IDs de administradores a notificar:', adminIds);

            await notify({
                tipo: NotificationTypes.TAREA_COMPLETADA,
                destinatarios: adminIds,
                parametros: {
                    nombreTarea: task.nombre,
                    nombreProyecto: task.nombre_proyecto
                },
                enlaceAccion: `/proyectos/${task.id_proyecto}/tareas/${taskId}`
            });

            console.log('📢 Notificación de tarea completada enviada');
        }

        res.status(200).json({
            success: true,
            message: 'Estatus actualizado exitosamente'
        });

        console.log('✅ Respuesta enviada al cliente');
    } catch (error) {
        console.error('❌ Error en changeUserTaskStatus:', error);
        next(error);
    }
};


module.exports = {
    getProjectTasksForUser,
    changeUserTaskStatus
};