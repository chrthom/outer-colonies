import { DailyType } from '../../shared/config/enums';
import { AuthRegisterRequest } from '../../shared/interfaces/rest_api';
import DBDailiesDAO from '../persistence/db_dailies';
import DBCredentialsDAO from '../persistence/db_credentials';
import DBDecksDAO from '../persistence/db_decks';
import DBMagicLinksDAO from '../persistence/db_magic_links';
import DBProfilesDAO from '../persistence/db_profiles';
import Mailer from './mailer';
import AuthUtils from './auth';

describe('AuthUtils', () => {
  const mockCredential = {
    userId: 123,
    sessionToken: 'test-token',
    username: 'testuser',
    email: 'test@example.com'
  };

  describe('login', () => {
    it('should call DBDailiesDAO.achieve with correct parameters for login', async () => {
      // Mock the achieve method
      const achieveSpy = jest.spyOn(DBDailiesDAO, 'achieve');
      achieveSpy.mockImplementation(jest.fn());

      // Mock other dependencies
      const mockLoginCredential = {
        userId: 123,
        sessionToken: 'test-token',
        username: 'testuser',
        email: 'test@example.com'
      };

      // Mock the getByUsername method to return our mock credential
      jest.spyOn(DBCredentialsDAO, 'getByUsername').mockResolvedValue(mockLoginCredential);
      jest.spyOn(DBCredentialsDAO, 'login').mockResolvedValue('test-token');

      // Call the login method
      const loginData = { username: 'testuser', password: 'password' };
      await AuthUtils.login(loginData);

      // Verify that achieve was called with the correct parameters
      expect(achieveSpy).toHaveBeenCalledWith(123, DailyType.Login);

      // Clean up
      achieveSpy.mockRestore();
    });
  });

  describe('register', () => {
    const registrationData: AuthRegisterRequest = {
      username: 'testuser',
      password: 'password',
      email: 'test@example.com',
      starterDeck: 0,
      newsletter: false
    };

    beforeEach(() => {
      jest.spyOn(DBCredentialsDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBCredentialsDAO, 'getByUsername').mockResolvedValue(mockCredential);
      jest.spyOn(DBProfilesDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBDailiesDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBDecksDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBMagicLinksDAO, 'createAccountActivation').mockResolvedValue('uuid-123');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should send the activation mail and return the credential on success', async () => {
      const sendMailSpy = jest.spyOn(Mailer, 'sendAccountActivation').mockResolvedValue({});
      const credential = await AuthUtils.register(registrationData);
      expect(sendMailSpy).toHaveBeenCalledWith('test@example.com', 'testuser', 'uuid-123');
      expect(credential).toEqual(mockCredential);
    });

    it('should reject if the activation mail cannot be sent', async () => {
      jest.spyOn(Mailer, 'sendAccountActivation').mockRejectedValue(new Error('SMTP error'));
      await expect(AuthUtils.register(registrationData)).rejects.toThrow('SMTP error');
    });
  });

  describe('sendPasswordReset', () => {
    beforeEach(() => {
      jest.spyOn(DBCredentialsDAO, 'getByUsername').mockResolvedValue(mockCredential);
      jest.spyOn(DBMagicLinksDAO, 'createPasswordReset').mockResolvedValue('uuid-123');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should send the password reset mail on success', async () => {
      const sendMailSpy = jest.spyOn(Mailer, 'sendPasswordReset').mockResolvedValue({});
      await AuthUtils.sendPasswordReset('testuser');
      expect(sendMailSpy).toHaveBeenCalledWith('test@example.com', 'testuser', 'uuid-123');
    });

    it('should reject if the password reset mail cannot be sent', async () => {
      jest.spyOn(Mailer, 'sendPasswordReset').mockRejectedValue(new Error('SMTP error'));
      await expect(AuthUtils.sendPasswordReset('testuser')).rejects.toThrow('SMTP error');
    });
  });

  describe('sendEmailConfirmation', () => {
    beforeEach(() => {
      jest.spyOn(DBMagicLinksDAO, 'createEmailConfirmation').mockResolvedValue('uuid-123');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should send the email confirmation mail on success', async () => {
      const sendMailSpy = jest.spyOn(Mailer, 'sendEmailConfirmation').mockResolvedValue({});
      await AuthUtils.sendEmailConfirmation(123, 'testuser', 'new@example.com');
      expect(sendMailSpy).toHaveBeenCalledWith('new@example.com', 'testuser', 'uuid-123');
    });

    it('should reject if the email confirmation mail cannot be sent', async () => {
      jest.spyOn(Mailer, 'sendEmailConfirmation').mockRejectedValue(new Error('SMTP error'));
      await expect(AuthUtils.sendEmailConfirmation(123, 'testuser', 'new@example.com')).rejects.toThrow(
        'SMTP error'
      );
    });
  });
});
