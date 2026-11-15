import nodemailer from 'nodemailer';
import config from 'config';

export default class Mailer {
  static readonly transporter = nodemailer.createTransport({
    host: config.get('mail.host'),
    port: config.get<number>('mail.port'),
    secure: config.get<boolean>('mail.secure'),
    auth: {
      user: config.get('mail.user'),
      pass: <string>process.env['MAIL_PASSWORD']
    }
  });

  static sendAccountActivation(email: string, name: string, linkUUID: string): Promise<any> {
    const link = `${config.get('url.base')}/activate-account/${linkUUID}`;
    return this.send(
      email,
      'Outer Colonies: Account aktivieren',
      `Hallo ${name} und willkommen bei Outer Colonies! ` +
        'Zur Aktivierung deines Accounts öffne bitte folgenden Link in deinem Browser: ' +
        `${link}`,
      `<h2>Hallo ${name} und willkommen bei Outer Colonies!</h2>` +
        `Zur Aktivierung deines Accounts klicke <a href="${link}">hier</a> ` +
        `oder öffne folgenden Link in deinem Browser:<br /><a href="${link}">${link}</a>`
    );
  }

  static sendEmailConfirmation(email: string, name: string, linkUUID: string): Promise<any> {
    const link = `${config.get('url.base')}/confirm-email/${linkUUID}`;
    return this.send(
      email,
      'Outer Colonies: Neue E-Mail-Adresse bestätigen',
      `Hallo ${name}, ` +
        'Du hast deine E-Mail-Adresse geändert. Bitte bestätige dies, indem du folgenden ' +
        `Link in deinem Browser öffnest: ${link}`,
      `<h2>Hallo ${name},</h2>` +
        'Du hast deine E-Mail-Adresse geändert. Bitte bestätige dies, indem du ' +
        `<a href="${link}">hier</a> klickst oder folgenden Link in deinem Browser öffnest:` +
        `<br /><a href="${link}">${link}</a>`
    );
  }

  static sendPasswordReset(email: string, name: string, linkUUID: string): Promise<any> {
    const link = `${config.get('url.base')}/reset-password/${linkUUID}`;
    return this.send(
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
