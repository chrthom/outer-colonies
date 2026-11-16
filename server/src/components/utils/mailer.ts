import nodemailer, { SentMessageInfo } from 'nodemailer';
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

  static sendAccountActivation(email: string, name: string, linkUUID: string): Promise<SentMessageInfo> {
    const link = `${config.get('url.base')}/activate-account/${linkUUID}`;
    const htmlName = this.escapeHtml(name);
    return this.send(
      email,
      'Outer Colonies: Account aktivieren',
      `Hallo ${name} und willkommen bei Outer Colonies! ` +
        'Zur Aktivierung deines Accounts öffne bitte folgenden Link in deinem Browser: ' +
        `${link}`,
      `<h2>Hallo ${htmlName} und willkommen bei Outer Colonies!</h2>` +
        `Zur Aktivierung deines Accounts klicke <a href="${link}">hier</a> ` +
        `oder öffne folgenden Link in deinem Browser:<br /><a href="${link}">${link}</a>`
    );
  }

  static sendEmailConfirmation(email: string, name: string, linkUUID: string): Promise<SentMessageInfo> {
    const link = `${config.get('url.base')}/confirm-email/${linkUUID}`;
    const htmlName = this.escapeHtml(name);
    return this.send(
      email,
      'Outer Colonies: Neue E-Mail-Adresse bestätigen',
      `Hallo ${name}, ` +
        'Du hast deine E-Mail-Adresse geändert. Bitte bestätige dies, indem du folgenden ' +
        `Link in deinem Browser öffnest: ${link}`,
      `<h2>Hallo ${htmlName},</h2>` +
        'Du hast deine E-Mail-Adresse geändert. Bitte bestätige dies, indem du ' +
        `<a href="${link}">hier</a> klickst oder folgenden Link in deinem Browser öffnest:` +
        `<br /><a href="${link}">${link}</a>`
    );
  }

  static sendPasswordReset(email: string, name: string, linkUUID: string): Promise<SentMessageInfo> {
    const link = `${config.get('url.base')}/reset-password/${linkUUID}`;
    const htmlName = this.escapeHtml(name);
    return this.send(
      email,
      'Outer Colonies: Passwort zurücksetzen',
      `Hallo ${name}, es wurde angefordert das Passwort für deinen Account zurückzusetzen.` +
        'Zur Durchführung des Passwort-Reset öffne bitte folgenden Link in deinem Browser: ' +
        `${link}`,
      `<h2>Hallo ${htmlName},</h2>es wurde angefordert das Passwort für deinen Account zurückzusetzen.` +
        `Zur Durchführung des Passwort-Reset klicke <a href="${link}">hier</a> ` +
        `oder öffne folgenden Link in deinem Browser:<br /><a href="${link}">${link}</a>`
    );
  }

  private static send(to: string, subject: string, text: string, html: string): Promise<SentMessageInfo> {
    return this.transporter.sendMail({
      from: 'noreply@outercolonies.de',
      to: to,
      subject: subject,
      text: text,
      html: html
    });
  }

  /**
   * Escapes HTML special characters in a user-controlled value so that it cannot
   * inject markup into the HTML body of an outbound mail.
   */
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
