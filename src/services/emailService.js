// File: backend/src/services/emailService.js
const nodemailer = require('nodemailer');
const config = require('../config/config');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });
  }

  async sendVerificationEmail(email, nombre, codigo) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Bienvenido a ${config.app.name}</h2>
        <p>Hola ${nombre},</p>
        <p>Gracias por registrarte. Para completar tu registro, por favor verifica tu correo electrónico usando el siguiente código:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2c3e50; font-size: 32px; margin: 0;">${codigo}</h1>
        </div>
        <p>Este código expirará en 15 minutos.</p>
        <p>Si no solicitaste este registro, puedes ignorar este correo.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Este es un correo automático, no responder.</p>
      </div>
    `;

    const mailOptions = {
      from: `"${config.app.name}" <${config.email.user}>`,
      to: email,
      subject: 'Verificación de cuenta',
      html: htmlContent
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error enviando email:', error);
      throw new Error('Error al enviar correo de verificación');
    }
  }

  async sendPasswordResetEmail(email, nombre, codigo) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recuperación de contraseña</h2>
        <p>Hola ${nombre},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #e74c3c; font-size: 32px; margin: 0;">${codigo}</h1>
        </div>
        <p>Este código expirará en 15 minutos.</p>
        <p>Si no solicitaste este restablecimiento, puedes ignorar este correo.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Este es un correo automático, no responder.</p>
      </div>
    `;

    const mailOptions = {
      from: `"${config.app.name}" <${config.email.user}>`,
      to: email,
      subject: 'Recuperación de contraseña',
      html: htmlContent
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error enviando email:', error);
      throw new Error('Error al enviar correo de recuperación');
    }
  }
}

module.exports = new EmailService();