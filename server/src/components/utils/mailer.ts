import nodemailer from 'nodemailer';

type MailCallback = (err: Error | null, info: any) => void;

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
    )
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