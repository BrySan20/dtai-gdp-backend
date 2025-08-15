// File: backend/src/services/meetingService.js
const emailService = require('./emailService');
const { getMeetingById, getMeetingParticipants } = require('../models/meetingModel');
const { executeQuery } = require('../config/database');

class MeetingService {
    // Enviar invitaciones a participantes
    async sendMeetingInvitations(meetingId, participantIds) {
        try {
            // Obtener datos de la reunión
            const meetingQuery = `
                SELECT 
                    r.titulo,
                    r.descripcion,
                    r.fecha_hora_inicio,
                    r.fecha_hora_fin,
                    r.enlace_reunion,
                    r.modo,
                    r.ubicacion,
                    p.nombre as proyecto_nombre,
                    CONCAT(u.nombre, ' ', u.apellido) as creador_nombre
                FROM Reuniones r
                LEFT JOIN Proyectos p ON r.id_proyecto = p.id
                LEFT JOIN Usuarios u ON r.id_creador = u.id
                WHERE r.id = ?
            `;
            
            const [meeting] = await executeQuery(meetingQuery, [meetingId]);
            
            if (!meeting) {
                throw new Error('Reunión no encontrada');
            }

            // Obtener datos de los participantes
            const participantsQuery = `
                SELECT id, nombre, apellido, email
                FROM Usuarios
                WHERE id IN (${participantIds.map(() => '?').join(',')})
            `;
            
            const participants = await executeQuery(participantsQuery, participantIds);

            // Enviar invitación a cada participante
            const emailPromises = participants.map(participant => 
                this.sendInvitationEmail(participant, meeting)
            );

            await Promise.all(emailPromises);
            
            return { success: true, message: 'Invitaciones enviadas exitosamente' };

        } catch (error) {
            console.error('Error enviando invitaciones:', error);
            throw new Error('Error al enviar invitaciones');
        }
    }

    // Enviar email de invitación individual
    async sendInvitationEmail(participant, meeting) {
        const fechaInicio = new Date(meeting.fecha_hora_inicio);
        const fechaFin = new Date(meeting.fecha_hora_fin);
        
        const formatDate = (date) => {
            return date.toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Invitación a Reunión</h2>
                <p>Hola ${participant.nombre},</p>
                <p>Has sido invitado a la siguiente reunión:</p>
                
                <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="color: #2c3e50; margin-top: 0;">${meeting.titulo}</h3>
                    ${meeting.descripcion ? `<p><strong>Descripción:</strong> ${meeting.descripcion}</p>` : ''}
                    <p><strong>Proyecto:</strong> ${meeting.proyecto_nombre || 'Sin proyecto asignado'}</p>
                    <p><strong>Organizador:</strong> ${meeting.creador_nombre}</p>
                    <p><strong>Fecha y hora:</strong> ${formatDate(fechaInicio)} - ${fechaFin.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>Modalidad:</strong> ${meeting.modo}</p>
                    ${meeting.ubicacion ? `<p><strong>Ubicación:</strong> ${meeting.ubicacion}</p>` : ''}
                    ${meeting.enlace_reunion ? `<p><strong>Enlace de reunión:</strong> <a href="${meeting.enlace_reunion}" target="_blank">${meeting.enlace_reunion}</a></p>` : ''}
                </div>
                
                <p>Por favor, confirma tu asistencia accediendo al sistema.</p>
                
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">Este es un correo automático, no responder.</p>
            </div>
        `;

        const transporter = emailService.transporter;
        const config = require('../config/config');

        const mailOptions = {
            from: `"Sistema de Gestión de Proyectos" <${config.email.user}>`,
            to: participant.email,
            subject: `Invitación: ${meeting.titulo}`,
            html: htmlContent
        };

        try {
            await transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error(`Error enviando email a ${participant.email}:`, error);
            throw error;
        }
    }

    // Enviar recordatorio de reunión
    async sendMeetingReminder(meetingId) {
        try {
            // Obtener reunión y participantes
            const meetingQuery = `
                SELECT 
                    r.titulo,
                    r.descripcion,
                    r.fecha_hora_inicio,
                    r.enlace_reunion,
                    r.modo,
                    r.ubicacion,
                    p.nombre as proyecto_nombre
                FROM Reuniones r
                LEFT JOIN Proyectos p ON r.id_proyecto = p.id
                WHERE r.id = ?
            `;
            
            const [meeting] = await executeQuery(meetingQuery, [meetingId]);
            const participants = await getMeetingParticipants(meetingId);

            if (!meeting || !participants.length) {
                return { success: false, message: 'Reunión o participantes no encontrados' };
            }

            // Enviar recordatorio a cada participante
            const emailPromises = participants.map(participant => 
                this.sendReminderEmail(participant, meeting)
            );

            await Promise.all(emailPromises);
            
            return { success: true, message: 'Recordatorios enviados exitosamente' };

        } catch (error) {
            console.error('Error enviando recordatorios:', error);
            throw new Error('Error al enviar recordatorios');
        }
    }

    // Enviar email de recordatorio
    async sendReminderEmail(participant, meeting) {
        const fechaInicio = new Date(meeting.fecha_hora_inicio);
        
        const formatDate = (date) => {
            return date.toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e67e22;">Recordatorio de Reunión</h2>
                <p>Hola ${participant.nombre},</p>
                <p>Te recordamos que tienes una reunión programada próximamente:</p>
                
                <div style="background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 5px solid #ffc107;">
                    <h3 style="color: #856404; margin-top: 0;">${meeting.titulo}</h3>
                    <p><strong>Fecha y hora:</strong> ${formatDate(fechaInicio)}</p>
                    <p><strong>Modalidad:</strong> ${meeting.modo}</p>
                    ${meeting.ubicacion ? `<p><strong>Ubicación:</strong> ${meeting.ubicacion}</p>` : ''}
                    ${meeting.enlace_reunion ? `<p><strong>Enlace:</strong> <a href="${meeting.enlace_reunion}" target="_blank">Unirse a la reunión</a></p>` : ''}
                </div>
                
                <p>¡No olvides asistir!</p>
                
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">Este es un correo automático, no responder.</p>
            </div>
        `;

        const transporter = emailService.transporter;
        const config = require('../config/config');

        const mailOptions = {
            from: `"Sistema de Gestión de Proyectos" <${config.email.user}>`,
            to: participant.email,
            subject: `Recordatorio: ${meeting.titulo}`,
            html: htmlContent
        };

        try {
            await transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error(`Error enviando recordatorio a ${participant.email}:`, error);
            throw error;
        }
    }

    // Notificar cambios en reunión
    async notifyMeetingUpdate(meetingId, changes) {
        try {
            const participants = await getMeetingParticipants(meetingId);
            const meetingQuery = `
                SELECT titulo, CONCAT(u.nombre, ' ', u.apellido) as creador_nombre
                FROM Reuniones r
                LEFT JOIN Usuarios u ON r.id_creador = u.id
                WHERE r.id = ?
            `;
            
            const [meeting] = await executeQuery(meetingQuery, [meetingId]);

            const emailPromises = participants.map(participant => 
                this.sendUpdateNotificationEmail(participant, meeting, changes)
            );

            await Promise.all(emailPromises);
            
            return { success: true, message: 'Notificaciones de cambio enviadas' };

        } catch (error) {
            console.error('Error enviando notificaciones de cambio:', error);
            throw new Error('Error al enviar notificaciones');
        }
    }

    // Email de notificación de cambios
    async sendUpdateNotificationEmail(participant, meeting, changes) {
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3498db;">Reunión Actualizada</h2>
                <p>Hola ${participant.nombre},</p>
                <p>La reunión "${meeting.titulo}" ha sido actualizada por ${meeting.creador_nombre}.</p>
                
                <div style="background: #e3f2fd; padding: 20px; margin: 20px 0; border-radius: 5px;">
                    <h4>Cambios realizados:</h4>
                    <p>${changes}</p>
                </div>
                
                <p>Por favor, revisa los nuevos detalles en el sistema.</p>
                
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">Este es un correo automático, no responder.</p>
            </div>
        `;

        const transporter = emailService.transporter;
        const config = require('../config/config');

        const mailOptions = {
            from: `"Sistema de Gestión de Proyectos" <${config.email.user}>`,
            to: participant.email,
            subject: `Actualización: ${meeting.titulo}`,
            html: htmlContent
        };

        try {
            await transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error(`Error enviando notificación a ${participant.email}:`, error);
            throw error;
        }
    }
}

module.exports = new MeetingService();