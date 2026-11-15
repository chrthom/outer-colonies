import config from 'config';
import nodemailer from 'nodemailer';
import Mailer from './mailer';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn() }))
}));

describe('Mailer', () => {
  const sendMail = () => <jest.Mock>(<unknown>Mailer.transporter.sendMail);

  beforeEach(() => {
    sendMail().mockClear();
  });

  describe('transporter', () => {
    it('should be created from the mail configuration', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: config.get('mail.host'),
        port: config.get<number>('mail.port'),
        secure: config.get<boolean>('mail.secure'),
        auth: {
          user: config.get('mail.user'),
          pass: process.env['MAIL_PASSWORD']
        }
      });
    });
  });

  describe('sendAccountActivation', () => {
    it('should send a mail with the account activation subject and link', () => {
      Mailer.sendAccountActivation('test@example.com', 'Testuser', 'uuid-123');
      expect(sendMail()).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@outercolonies.de',
          to: 'test@example.com',
          subject: 'Outer Colonies: Account aktivieren'
        })
      );
      const mail = sendMail().mock.calls[0][0];
      expect(mail.text).toContain(`${config.get('url.base')}/activate-account/uuid-123`);
      expect(mail.html).toContain(`${config.get('url.base')}/activate-account/uuid-123`);
    });
  });

  describe('sendEmailConfirmation', () => {
    it('should send a mail with the email confirmation subject, link and correct wording', () => {
      Mailer.sendEmailConfirmation('test@example.com', 'Testuser', 'uuid-123');
      expect(sendMail()).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Outer Colonies: Neue E-Mail-Adresse bestätigen'
        })
      );
      const mail = sendMail().mock.calls[0][0];
      expect(mail.text).toContain(`${config.get('url.base')}/confirm-email/uuid-123`);
      expect(mail.html).toContain(`${config.get('url.base')}/confirm-email/uuid-123`);
      expect(mail.text).toContain('bestätige dies, indem du');
      expect(mail.html).toContain('bestätige dies, indem du');
      expect(mail.text).not.toContain('bestätigte dies');
      expect(mail.html).not.toContain('bestätigte dies');
    });
  });

  describe('sendPasswordReset', () => {
    it('should send a mail with the password reset subject and link', () => {
      Mailer.sendPasswordReset('test@example.com', 'Testuser', 'uuid-123');
      expect(sendMail()).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Outer Colonies: Passwort zurücksetzen'
        })
      );
      const mail = sendMail().mock.calls[0][0];
      expect(mail.text).toContain(`${config.get('url.base')}/reset-password/uuid-123`);
      expect(mail.html).toContain(`${config.get('url.base')}/reset-password/uuid-123`);
    });
  });
});
