import nodemailer from 'nodemailer';
import config from 'config';

export default class Mailer {
  static readonly transporter = nodemailer.createTransport({
    host: 'thomsen.in',
    port: 587,
    secure: false,
    auth: {
      user: 'outercolonies',
      pass: <string>process.env['MAIL_PASSWORD'],
    }
  });

  static sendTest(): Promise<any> {
    return this.send(
      'christopher@thomsen.in',
      'Another Test',
      'Bla Blub',
      '<h1>Hey, what\'s up</h1>Foobar<br /><i>Blub</i>'
    );
  }

  static sendPasswordReset(email: string, name: string, linkUUID: string) {
    const link = `${config.get('url.base')}/password_reset/${linkUUID}`;
    this.send(
      email,
      'Outer Colonies: Passwort zurücksetzen',
      `Hallo ${name}, es wurde angefordert das Passwort für deinen Account zurückzusetzen.`
      + 'Zur Durchführung des Passwort-Reset öffne bitte folgenden Link in deinem Browser: '
      + `${link}`,
      `<h2>Hallo ${name},</h2>es wurde angefordert das Passwort für deinen Account zurückzusetzen.`
      + `Zur Durchführung des Passwort-Reset klicke <a href="${link}">hier</a> `
      + `oder öffne folgenden Link in deinem Browser:<br /><a href="${link}">${link}</a>`
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