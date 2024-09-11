import nodemailer from 'nodemailer';
import config from 'config';

export default class Mailer {
  static readonly transporter = nodemailer.createTransport({
    host: 'thomsen.in',
    port: 587,
    secure: false,
    auth: {
      user: 'outercolonies',
      pass: <string>process.env['MAIL_PASSWORD']
    }
  });

  static sendPasswordReset(email: string, name: string, linkUUID: string) {
    const link = `${config.get('url.base')}/reset-password/${linkUUID}`;
    this.send(
      email,
      'Outer Colonies: Passwort zurücksetzen',
      `Hallo ${name}, es wurde angefordert das Passwort für deinen Account zurückzusetzen.` +
        'Zur Durchführung des Passwort-Reset öffne bitte folgenden Link in deinem Browser: ' +
        `${link}`,
      `<h2>Hallo ${name},</h2>es wurde angefordert das Passwort für deinen Account zurückzusetzen.` +
        `Zur Durchführung des Passwort-Reset klicke <a href="${link}">hier</a> ` +
        `oder öffne folgenden Link in deinem Browser:<br /><a href="${link}">${link}</a>`
    );
  }

  static sendAccountActivation(email: string, name: string, linkUUID: string) {
    const link = `${config.get('url.base')}/activate-account/${linkUUID}`;
    this.send(
      email,
      'Outer Colonies: Passwort zurücksetzen',
      `Hallo ${name} und willkommen bei Outer Colonies! ` +
        'Zur Aktivierung deines Accounts öffne bitte folgenden Link in deinem Browser: ' +
        `${link}`,
      `<h2>Hallo ${name} und willkommen bei Outer Colonies!</h2>` +
        `Zur Aktivierung deines Accounts klicke <a href="${link}">hier</a> ` +
        `oder öffne folgenden Link in deinem Browser:<br /><a href="${link}">${link}</a>`
    );
  }

  private static send(to: string, subject: string, text: string, html: string): Promise<any> {
    return this.transporter.sendMail({
      from: 'noreply@outercolonies.de',
      to: to,
      subject: subject,
      text: text,
      html: html
    });
  }
}
